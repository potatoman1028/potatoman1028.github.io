---
title: "Astro를 이용한 블로그 구축 및 AI 협업 환경 설정 리포트"
description: "Astro 프로젝트의 개발 환경 구축부터 AI Report 기능 추가까지의 전체 과정을 통합한 상세 리포트입니다."
date: "2026-03-17"
---

# Astro를 이용한 블로그 구축 및 AI 협업 환경 설정 리포트

이 리포트는 Astro 기반 기술 블로그의 개발 환경을 최신화하고, AI와의 협업 기록을 관리하기 위한 전용 기능을 추가한 전체 과정을 상세히 기록합니다.

---

## 1. 프로젝트 분석 및 진단 (작업 목표)
기존 프로젝트의 상태를 점검하고, 로컬 개발 및 AI 기반 협업을 위한 필수 환경을 구축하는 것을 목표로 작업에 착수했습니다.
- **현상 파악**: Node.js 및 npm 미설치로 인한 로컬 빌드 불가능 상태 감지.
- **목표**: 
  - Windows 환경에서의 표준 개발 스택(`Node.js LTS`) 구축.
  - 블로그 내 AI 작업 기록을 위한 별도 섹션(`AI Reports`) 신설 및 자동화.

---

## 2. 작업 이력 및 명령어 기록

### 개발 환경 구축 (Node.js 설치)
Windows 패키지 관리자(`winget`)를 사용하여 표준 개발 환경을 구축했습니다.

- **명령어**:
  ```powershell
  # winget 버전 확인
  winget --version

  # Node.js LTS (v24.14.0) 설치
  winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

  # PATH 갱신 및 설치 확인
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  node --version
  npm --version
  ```

### 프로젝트 의존성 설치 및 서버 검증
```powershell
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```
- **결과**: `http://localhost:4321/`에서 서버 정상 작동 확인.

---

## 3. 기능 구현 계획: 'AI Report' 탭 추가
블로그에 AI와 함께 작업한 기록을 게시할 수 있는 데이터 구조와 페이지를 설계하고 구현했습니다.

### 제안된 변경 사항
- **컬렉션 정의**: `src/content.config.ts`에 `ai-reports` 콘텐츠 컬렉션 추가.
- **메타데이터 설정**: `src/consts.ts`에 섹션 제목 및 설명 정의.
- **페이지 템플릿**:
  - 목록 페이지: `src/pages/ai-reports/index.astro`
  - 상세 페이지: `src/pages/ai-reports/[...id].astro`
- **네비게이션**: `src/components/Header.astro`에 메뉴 링크 추가.

---

## 4. 최종 결과 및 검증 (워크스루)

### 주요 성과
- **자동화된 ToC 시스템**: 마크다운 문서 구조에 따라 목차를 생성하도록 `TableOfContents.astro` 로직 고도화.
- **범용 네비게이션**: 여러 섹션에서 재사용 가능하도록 `PostNavigation.astro` 경로 생성 로직 개선.
- **콘텐츠 배포**: 현재의 모든 작업 과정이 담긴 리포트를 자동으로 게시.

---

## 5. 문서화 현황
- `task.md`: 전체 작업 진행 상태 관리.
- `01-ai-modernization-report.md`: 본 통합 리포트 문서.
