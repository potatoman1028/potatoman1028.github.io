---
title: "GzzNet 리팩토링 사전 분석 및 단계별 계획 리포트"
description: "오래된 C++ IOCP 네트워크 라이브러리 `GzzNet`을 바로 수정하지 않고, 구조 분석과 리스크 식별을 먼저 수행한 뒤 단계별 리팩토링 계획을 정리한 작업 기록입니다."
date: "2026-04-15"
tags: ["cpp", "iocp", "network", "refactoring", "legacy-code"]
---

# GzzNet 리팩토링 사전 분석 및 단계별 계획 리포트

## 문서 목적

이 문서는 학부 시절 작성했던 C++ IOCP 기반 네트워크 라이브러리 `GzzNet` 저장소를 대상으로, 실제 리팩토링에 들어가기 전에 먼저 수행한 구조 분석과 단계별 계획 수립 과정을 정리한 기록입니다.

이번 작업의 목적은 코드를 즉시 수정하는 것이 아니라, 오래된 네트워크 코드에서 가장 위험한 영역을 먼저 식별하고 변경 순서를 안전하게 고정하는 것이었습니다.

핵심 전제는 다음과 같습니다.

- 새로 만들지 않는다.
- 기존 동작을 최대한 유지한다.
- 작은 단위로만 정리한다.
- ownership, shutdown, thread safety를 먼저 본다.

즉, 이번 작업은 "더 현대적인 코드로 다시 작성"하는 접근보다, 현재 구조를 최대한 보존하면서 **behavior-preserving stabilization**에 가까운 방향으로 진행되었습니다.

## 1. 저장소 1차 분석

초기 확인 결과, 저장소는 Visual Studio 기반 정적 라이브러리 프로젝트이며 주요 소스가 루트 기준으로 비교적 평면적으로 배치되어 있었습니다.

구조를 큰 단위로 나누면 다음과 같았습니다.

- `GzzIOCP_EX`: IOCP 런타임과 주요 객체 조립
- `TcpListen`, `TcpHost`, `TcpClientEX`, `TcpSocketEX`: 소켓 및 세션 계층
- `SessionItem`, `RecvItemEX`, `SendItemEX`: completion 처리
- `AsyncTcpRecv`, `AsyncTcpSend`, `RingBuffer`, `JobQueue`: 버퍼링 및 패킷 전달
- `GzzNet`: 상위 사용 레이어

초기 인상은 "완전히 구조가 없는 코드"라기보다는, **핵심 책임이 중심 클래스에 과도하게 집중되어 있고 수명 관리 규칙이 타입으로 드러나지 않는 코드**에 가까웠습니다.

이 판단에 따라, 전면 재작성이 아니라 위험 구간 안정화 후 점진적 정리 전략이 더 적절하다고 보았습니다.

## 2. 우선 식별한 핵심 리스크

### 2-1. ownership이 타입으로 명확히 드러나지 않음

실질 owner는 `GzzIOCP_EX`에 가깝지만, 내부 참조 관계는 raw pointer 중심으로 연결되어 있었습니다. 그 결과 다음과 같은 질문에 즉시 답하기 어려웠습니다.

- 누가 진짜 owner인가
- 어떤 객체가 어떤 객체보다 오래 살아야 하는가
- 어떤 시점에 어떤 객체를 해제하는가
- shutdown 중 completion이 도착하면 무엇이 아직 유효한가

이 문제는 단순한 코드 스타일 이슈가 아니라, 네트워크 라이브러리에서 가장 위험한 종류의 수명 관리 문제로 판단했습니다.

### 2-2. shutdown 순서와 종료 규약이 불안정함

현재 흐름에서는 `Stop()`에서 worker 종료가 먼저 수행된 뒤 세션 정리가 이어지는 구조가 보였습니다. 이 경우 종료 도중 도착하는 completion 처리 책임과 재등록 차단 여부가 명확하지 않습니다.

주요 확인 포인트는 아래와 같았습니다.

- close 이후 completion은 누가 마무리하는가
- shutdown 중 새 `Accept()` 또는 새 `Receive()`가 다시 등록될 수 있는가
- `Close()`와 `ForceClose()`는 어떤 기준으로 호출되어야 안전한가

따라서 shutdown 로직은 개별 함수 수정 이전에, **종료 프로토콜 자체를 먼저 문서화해야 하는 영역**으로 분류했습니다.

### 2-3. recv path의 correctness 버그 후보 존재

수신 경로의 큰 구조는 의도가 분명했습니다. `AsyncTcpRecv`가 원본 버퍼를 보유하고, `RecvItemEX`가 `RingBuffer`에 데이터를 쌓아 패킷을 분리하는 설계 자체는 유지할 가치가 있다고 판단했습니다.

다만 구현 세부에서 다음 문제가 확인되었습니다.

- 버퍼 전체가 아니라 일부만 초기화하는 흐름
- `completionBytes`와 남은 `size`를 혼용하는 로직
- offset 계산이 일관되지 않은 push 처리
- 충분한 검증 없이 패킷 길이를 신뢰하는 부분

이 영역은 리팩토링 취향의 문제가 아니라, 실제 동작 신뢰성과 직접 연결되는 correctness 이슈로 우선순위를 높게 두었습니다.

### 2-4. 전역 공유 상태의 thread safety 부족

`Note`는 사실상 전역 logger 역할을 수행하지만, 여러 worker 스레드에서 호출될 수 있는 구조에 비해 내부 보호가 약했습니다.

특히 다음 요소가 문제 후보로 보였습니다.

- `LogNumber` 증가
- `Exercisebook` 접근
- singleton 초기화

이 문제는 출력 포맷의 미관보다 먼저, 디버깅 신뢰성과 상태 일관성 측면에서 보강이 필요한 영역으로 판단했습니다.

### 2-5. 상태 전이가 명시적 상태 모델보다 함수 포인터 흐름에 의존함

`SessionItem`은 connect, accept, disconnect 흐름의 중심인데, 실제 상태 전이는 명시적인 enum보다 함수 포인터 흐름에 더 많이 숨겨져 있었습니다.

이 구조는 정상 경로만 보면 동작할 수 있으나, 실패 경로나 shutdown 경로를 추적할 때 가독성과 검증 가능성이 급격히 떨어집니다.

따라서 이 부분은 기능 변경 없이도, 먼저 lifecycle/state transition을 문서로 드러내는 작업이 필요하다고 보았습니다.

## 3. 반대로 유지 가치가 있다고 본 요소

위와 같은 문제점이 있었지만, 저장소 전체를 전면 폐기해야 한다는 판단으로 이어지지는 않았습니다.

유지 가치가 있다고 본 이유는 다음과 같습니다.

- IOCP 기반 구조를 직접 구현한 경험이 코드에 남아 있음
- socket, completion, buffer, event queue 개념이 완전히 뒤섞여 있지는 않음
- `SYSTEM_PROTOCOL`, `PACKAGE`를 통해 상위 로직과 lifecycle event를 구분하려는 의도가 보임
- `GzzNet`이 상위 사용 레이어를 제공하고 있어 소비 방식이 완전히 무질서하지 않음

즉, 이 코드는 새로 쓰는 쪽이 무조건 더 나은 상태라기보다, **위험 구간을 먼저 안정화한 뒤 구조를 단계적으로 정리할 수 있는 코드베이스**로 판단했습니다.

## 4. 코드 수정 전에 문서화를 먼저 진행한 이유

이번 작업에서 가장 중요하게 본 원칙은 다음과 같습니다.

> 큰 수정을 하기 전에, 먼저 위험 구간과 변경 경계를 문서로 고정한다.

이에 따라 `AI Report` 폴더 아래에 단계별 분석 문서를 작성했습니다.

- `repository-analysis.md`
- `phase-1-ownership-and-shutdown.md`
- `phase-2-recv-path-bug-candidates.md`
- `phase-3-logger-and-shared-state-thread-policy.md`
- `phase-4-gzziocp-responsibility-split-draft.md`
- `phase-5-session-lifecycle-and-state-transition.md`
- `phase-6-shutdown-protocol-draft.md`
- `phase-7-error-handling-and-failure-semantics.md`
- `phase-8-public-api-stability-and-refactor-boundary.md`
- `phase-9-refactor-execution-order.md`
- `phase-10-naming-audit.md`

이런 순서로 문서를 쌓은 이유는 오래된 네트워크 코드에서 "어디가 왜 위험한지"를 먼저 고정하지 않으면, 리팩토링 자체가 새로운 불안정성을 만들 수 있기 때문입니다.

## 5. 최종 정리한 리팩토링 실행 우선순위

단계별 문서화를 마친 뒤 실제 실행 순서는 아래처럼 압축했습니다.

1. recv correctness 복구
2. session success/failure 경계 정리
3. shutdown 시작 플래그와 재등록 차단
4. `Stop()` 및 cleanup 순서 정리
5. logger / shared-state 최소 안전성 보강
6. `GzzIOCP_EX` 내부 책임 분해
7. 저위험 네이밍 정리

이 순서를 택한 이유는 명확합니다. 보기 좋은 구조보다 먼저 해결해야 하는 것은 다음 세 가지입니다.

- 데이터 손상 가능성
- 종료 안전성
- 상태 전이 신뢰성

즉, 이번 계획은 "리팩토링의 미관"보다 "동작 안정성 확보"를 우선순위에 두고 있습니다.

## 6. public API는 안정 경계로 간주

분석 과정에서 내부 구현보다 외부 계약이 더 중요할 수 있는 지점도 함께 정리했습니다.

특히 아래 요소는 상위 사용자 코드가 이미 의존하고 있을 가능성이 높다고 판단했습니다.

- `GzzIOCP_EX` public methods
- `GzzNet` callback surface
- `PACKAGE`
- `SYSTEM_PROTOCOL`
- session id 기반 모델

따라서 이번 계획에서는 이들을 "안정 API 경계"로 간주하고, 내부 구조 정리를 우선하되 외부 계약 변경은 최대한 보수적으로 접근하기로 했습니다.

이 방향은 API redesign보다 **내부 안정화 중심의 리팩토링 경계 설정**에 가깝습니다.

## 7. 네이밍 문제는 분리해서 다루기로 함

문서화 과정에서는 네이밍 이슈도 별도로 정리했습니다.

대표적인 예시는 다음과 같습니다.

- `GzzIOCP_EX`
- `Note`
- `PACKAGE`
- `TcpHost`
- `FourceEnquePackage`
- `SUCESS`
- `Woker`

다만 이 문제는 모두 같은 성격으로 다루지 않았습니다. 오타 수준의 저위험 변경과 public boundary에 걸쳐 있는 이름 변경은 리스크가 다르기 때문입니다.

따라서 네이밍 정리는 correctness와 shutdown 안정화 이후의 후순위 작업으로 분류했습니다.

## 8. 최종 결론

이번 사전 분석 결과, `GzzNet`은 전면 재작성이 필요한 프로젝트라기보다는 다음과 같이 정리할 수 있었습니다.

- 전면 재작성할 프로젝트는 아니다.
- 그렇다고 바로 기능 추가부터 시작할 프로젝트도 아니다.
- 먼저 ownership, shutdown, recv correctness, shared state를 안정화해야 한다.
- 그 이후에야 중심 클래스를 읽기 좋게 분해할 수 있다.

결국 오래된 네트워크 코드를 다룰 때 우선해야 하는 것은 "예쁘게 정리하기"보다 **안전하게 바꿀 수 있는 조건을 먼저 만드는 것**이었습니다.

## 9. 문서화 결과물

이번 작업의 최종 산출물은 다음과 같습니다.

- 저장소 구조 및 리스크 분석 문서
- ownership / shutdown / session lifecycle 초안
- recv path / logger / failure semantics 정리
- public API 경계 및 naming audit 문서
- 실제 리팩토링 실행 순서 초안

즉, 이번 단계의 목적은 코드를 고치는 것이 아니라, **실제 수정을 시작해도 실패 가능성을 낮출 수 있는 기준점을 만드는 것**이었습니다.
