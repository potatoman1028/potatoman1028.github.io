---
title: "Node.js 환경 변수 인식 오류 해결 리포트"
description: "로컬 환경에서 npm 명령어가 인식되지 않는 문제를 분석하고 영구적으로 해결한 과정"
date: "2026-03-18"
tags: ["troubleshooting", "nodejs", "env", "powershell"]
---

## 1. 문제 현상

로컬 개발 환경에서 `npm run dev` 실행 시 다음과 같은 오류 메시지가 발생하며 명령어가 실행되지 않음:
> `npm : 'npm' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행 가능한 프로그램 이름으로 인식되지 않습니다.`

## 2. 원인 분석

- **환경 변수 누락**: Node.js가 시스템에 설치(`C:\Program Files\nodejs\`)되어 있으나, 해당 경로가 현재 터미널 세션의 `PATH` 환경 변수에 등록되어 있지 않음.
- **설정 휘발성**: 이전 세션에서 수동으로 설정한 `PATH`는 터미널 종료 시 초기화되는 임시 설정이었음.

## 3. 해결 방안 및 조치 내역

### 3.1. 시스템 환경 변수 영구 등록 (관리자 권한)
새 터미널에서도 항상 `npm`을 인식할 수 있도록 사용자 환경 변수에 경로를 영구적으로 추가함.

```powershell
# 사용자 PATH 환경 변수에 Node.js 경로 추가
setx PATH "$([System.Environment]::GetEnvironmentVariable('Path','User'));C:\Program Files\nodejs\"
```

### 3.2. 환경 초기화 스크립트 (`init.ps1`) 생성
환경이 강제로 초기화되는 특수한 상황을 대비하여, 한 번의 실행으로 즉시 환경을 복구할 수 있는 보조 스크립트를 프로젝트 루트에 생성함.

**[init.ps1]**
```powershell
# POTATO'S LAB 개발 환경 초기화 스크립트
$nodePath = "C:\Program Files\nodejs\"
if ($env:Path -notlike "*$nodePath*") {
    $env:Path += ";$nodePath"
    Write-Host "✅ Node.js 경로가 현재 세션 PATH에 추가되었습니다." -ForegroundColor Green
}
Write-Host "🚀 준비 완료! 'npm run dev'를 실행해 보세요." -ForegroundColor Cyan
```

## 4. 보안 조치

- **경로 마스킹**: 리포트 및 스크립트 내에서 사용자 개인 식별이 가능한 경로나 정보는 노출되지 않도록 처리함. (예: `C:\Users\[사용자-계정]\...` 등은 표준 설치 경로인 `C:\Program Files\nodejs\`로 대체하거나 추상화함)

## 5. 최종 결과

- 영구적 환경 변수 설정으로 새 터미널 창에서도 `npm` 명령어가 정상 작동함을 확인함.
- 프로젝트 전용 초기화 도구(`init.ps1`)를 확보하여 환경 안정성을 높임.
