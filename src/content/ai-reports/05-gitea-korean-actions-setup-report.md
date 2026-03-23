---
title: "Gitea 한글화와 Actions Runner 구축 작업 기록"
description: "로컬 Gitea를 한국어 UI로 정리하고, Windows 환경에서 Actions runner를 설치·등록·자동 시작까지 연결한 전체 작업 과정입니다."
date: "2026-03-23"
tags: ["gitea", "actions", "windows", "runner"]
---

# Gitea 한글화와 Actions Runner 구축 작업 기록

## 문서 목적

이 문서는 `D:\Gitea`에 설치된 로컬 Gitea 인스턴스를 기준으로, 한국어 UI 적용부터 Actions runner 연결까지의 작업 과정을 다시 재현할 수 있도록 정리한 기록입니다.

이번 작업의 목표는 단순히 기능을 켜는 데서 끝나는 것이 아니라, 실제로 Windows 환경에서 runner가 동작하고 저장소 단위 workflow까지 실행되는 상태를 만드는 것이었습니다.

1. Gitea 웹 UI를 한국어로 보이게 설정
2. Gitea가 어떤 포트로 열려 있는지 확인
3. Gitea Actions 기능 사용 가능 여부 확인
4. Windows용 `act_runner` 설치 및 등록
5. 특정 저장소에서 Actions 활성화
6. 테스트 workflow 업로드 및 실행 확인
7. runner 자동 시작 설정

기준 환경:

- Gitea 경로: `D:\Gitea`
- Gitea 버전: `1.21.10`
- OS: Windows
- Gitea 웹 주소: `http://127.0.0.1:3000`

## 1. Gitea 설치 경로와 설정 파일 확인

Gitea는 소스 저장소가 아니라 설치형 디렉터리로 구성되어 있었고, 실제 설정은 아래 파일에서 관리되었습니다.

- 설정 파일: `D:\Gitea\custom\conf\app.ini`

확인 방법:

```powershell
Get-Content D:\Gitea\custom\conf\app.ini
```

## 2. Gitea 웹 UI를 한국어로 설정

### 작업 내용

`app.ini`에 `[i18n]` 섹션을 추가해 `ko-KR`를 첫 번째 언어로 등록했습니다.

적용된 내용:

```ini
[i18n]
LANGS = ko-KR,en-US,zh-CN,zh-HK,zh-TW,de-DE,fr-FR,nl-NL,lv-LV,ru-RU,uk-UA,ja-JP,es-ES,pt-BR,pt-PT,pl-PL,bg-BG,it-IT,fi-FI,tr-TR,cs-CZ,sv-SE,el-GR,fa-IR,hu-HU,id-ID,ml-IN
NAMES = 한국어,English,简体中文,繁體中文（香港）,繁體中文（台灣）,Deutsch,Français,Nederlands,Latviešu,Русский,Українська,日本語,Español,Português do Brasil,Português de Portugal,Polski,Български,Italiano,Suomi,Türkçe,Čeština,Svenska,Ελληνικά,فارسی,Magyar nyelv,Bahasa Indonesia,മലയാളം
```

확인 방법:

```powershell
Select-String -Path D:\Gitea\custom\conf\app.ini -Pattern '^\[i18n\]|^LANGS|^NAMES'
```

### 주의사항

- 이 설정은 기본 언어 우선순위를 바꾸는 작업입니다.
- 이미 로그인한 사용자 계정이 영어로 고정되어 있으면 웹 UI에서 개별 사용자 언어 설정을 바꿔야 할 수 있습니다.
- 반영을 위해 Gitea 재시작이 필요할 수 있습니다.

### 재시작 명령

관리자 권한 PowerShell에서:

```powershell
Restart-Service gitea
```

## 3. Gitea 포트 확인

설정 파일 기준:

- 웹 포트: `3000`
- SSH 포트: `22`

확인 명령:

```powershell
Select-String -Path D:\Gitea\custom\conf\app.ini -Pattern '^HTTP_PORT|^SSH_PORT|^ROOT_URL|^DOMAIN|^SSH_DOMAIN'
```

실제 리스닝 확인:

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 22,3000 }
```

실제 확인 결과:

- Gitea 웹은 `3000` 포트에서 리슨 중이었음
- 접속 주소는 `http://127.0.0.1:3000/`

## 4. Gitea Actions 기능 상태 확인

### 확인 포인트

처음 확인할 때는 다음 상태였습니다.

- 전역 설정 파일 `app.ini`에는 `[actions]` 섹션이 없음
- Gitea 1.21 계열에서는 Actions 기능이 내장되어 있음
- 하지만 저장소별 Actions 활성화 여부와 runner 등록 여부가 별도로 중요함
- runner는 없었음

확인 명령:

```powershell
Get-Process | Where-Object { $_.ProcessName -match 'runner|act' }
Get-ChildItem D:\Gitea\act_runner -Force
```

## 5. runner 등록 토큰 생성

Gitea CLI에서 runner 등록용 토큰을 생성할 수 있었습니다.

명령:

```powershell
cd D:\Gitea
.\gitea-1.21.10-gogit-windows-4.0-amd64.exe actions generate-runner-token
```

이 토큰은 `act_runner register`에 사용합니다.

## 6. Windows용 act_runner 설치

### 설치 경로

- runner 폴더: `D:\Gitea\act_runner`
- 실행 파일: `D:\Gitea\act_runner\act_runner.exe`

### 다운로드 명령

```powershell
New-Item -ItemType Directory -Force -Path D:\Gitea\act_runner | Out-Null
Invoke-WebRequest `
  -Uri "https://dl.gitea.com/act_runner/0.2.11/act_runner-0.2.11-windows-amd64.exe" `
  -OutFile "D:\Gitea\act_runner\act_runner.exe"
```

버전 확인:

```powershell
D:\Gitea\act_runner\act_runner.exe --help
```

## 7. runner 기본 설정 파일 생성

생성 명령:

```powershell
cd D:\Gitea\act_runner
.\act_runner.exe generate-config > config.yaml
```

생성 파일:

- `D:\Gitea\act_runner\config.yaml`

## 8. runner를 Windows 호스트 방식으로 설정

기본 `config.yaml`은 Docker 기반 Ubuntu 라벨을 사용합니다. 이 환경에서는 Docker를 쓰지 않고 Windows 호스트에서 직접 실행하도록 아래처럼 수정했습니다.

수정 핵심:

```yaml
runner:
  envs: {}
  labels:
    - "windows:host"
```

최종 파일 위치:

- `D:\Gitea\act_runner\config.yaml`

## 9. runner 등록

### 등록 명령 형식

```powershell
cd D:\Gitea\act_runner
.\act_runner.exe register `
  --no-interactive `
  --instance http://127.0.0.1:3000 `
  --token <러너등록토큰> `
  --name <러너이름> `
  --labels windows:host
```

실제 사용 예:

```powershell
cd D:\Gitea\act_runner
.\act_runner.exe register `
  --no-interactive `
  --instance http://127.0.0.1:3000 `
  --token <생성한토큰> `
  --name DESKTOP-KIG1Q8F-windows-runner `
  --labels windows:host
```

등록 성공 시 생성되는 파일:

- `D:\Gitea\act_runner\.runner`

## 10. runner 데몬 실행

실행 명령:

```powershell
cd D:\Gitea\act_runner
.\act_runner.exe -c config.yaml daemon
```

백그라운드 실행 시 참고:

- 표준 출력 로그: `D:\Gitea\act_runner\runner.out.log`
- 표준 에러 로그: `D:\Gitea\act_runner\runner.err.log`

정상 확인 방법:

```powershell
Get-Process | Where-Object { $_.ProcessName -like 'act_runner*' }
Get-Content D:\Gitea\act_runner\runner.err.log -Tail 100
```

정상 로그 예:

```text
Starting runner daemon
runner: DESKTOP-KIG1Q8F-windows-runner, with version: v0.2.11, with labels: [windows], declare successfully
```

## 11. 저장소별 Actions 활성화 확인

runner가 있어도 저장소에서 Actions가 꺼져 있으면 workflow가 실행되지 않습니다.

이 환경에서는 API로 저장소 목록을 확인했을 때 `Project01`이 아래 상태였습니다.

- 저장소 이름: `gzz12345/Project01`
- 초기 상태: `has_actions = false`

### API 토큰 생성

관리자 CLI로 액세스 토큰을 생성할 수 있습니다.

예:

```powershell
cd D:\Gitea
.\gitea-1.21.10-gogit-windows-4.0-amd64.exe admin user generate-access-token `
  --username gzz12345 `
  --token-name codex-actions-api `
  --scopes read:user,write:repository `
  --raw
```

### 저장소 Actions 활성화

```powershell
$headers = @{
  Authorization = "token <액세스토큰>"
  "Content-Type" = "application/json"
}

$body = '{"has_actions":true}'

Invoke-WebRequest `
  -Method Patch `
  -Headers $headers `
  -Uri "http://127.0.0.1:3000/api/v1/repos/gzz12345/Project01" `
  -Body $body `
  -UseBasicParsing
```

성공 후 `has_actions`가 `true`로 변경됩니다.

## 12. 테스트 workflow 추가

### 주의사항

로컬 bare repository 경로로 직접 `git push`하면 Gitea 훅에서 아래 메시지로 거부될 수 있습니다.

```text
Gitea: Rejecting changes as Gitea environment not set.
```

그래서 이 환경에서는 Gitea API를 통해 파일을 추가했습니다.

### 테스트 workflow 내용

```yaml
name: hello

on:
  push:

jobs:
  test:
    runs-on: windows
    steps:
      - name: Show environment
        shell: pwsh
        run: |
          Write-Output "Hello from Gitea Actions"
          Write-Output "Repository: $env:GITHUB_REPOSITORY"
          Write-Output "Ref: $env:GITHUB_REF"
          Get-Location
```

### API로 workflow 업로드

```powershell
$headers = @{
  Authorization = "token <액세스토큰>"
  "Content-Type" = "application/json"
}

$content = @'
name: hello

on:
  push:

jobs:
  test:
    runs-on: windows
    steps:
      - name: Show environment
        shell: pwsh
        run: |
          Write-Output "Hello from Gitea Actions"
          Write-Output "Repository: $env:GITHUB_REPOSITORY"
          Write-Output "Ref: $env:GITHUB_REF"
          Get-Location
'@

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))

$body = @{
  branch = "main"
  content = $b64
  message = "Add Gitea Actions hello workflow"
} | ConvertTo-Json

Invoke-WebRequest `
  -Method Post `
  -Headers $headers `
  -Uri "http://127.0.0.1:3000/api/v1/repos/gzz12345/Project01/contents/.gitea/workflows/hello.yml" `
  -Body $body `
  -UseBasicParsing
```

실제 반영 위치:

- 저장소 경로: `gzz12345/Project01`
- workflow 경로: `.gitea/workflows/hello.yml`

## 13. workflow 실행 확인

runner 로그에 아래와 비슷한 메시지가 뜨면 이벤트를 잡은 것입니다.

```text
task 1 repo is gzz12345/Project01 https://github.com http://127.0.0.1:3000
```

확인 명령:

```powershell
Get-Content D:\Gitea\act_runner\runner.err.log -Tail 200
```

웹 UI 확인 위치:

- `http://127.0.0.1:3000/gzz12345/Project01`
- 저장소의 `Actions` 탭

## 14. runner 자동 시작 설정

### 시작 스크립트 생성

파일:

- `D:\Gitea\act_runner\start-runner.cmd`

내용:

```cmd
@echo off
cd /d D:\Gitea\act_runner
act_runner.exe -c config.yaml daemon >> runner.out.log 2>> runner.err.log
```

### 작업 스케줄러 등록 시도

아래 명령은 관리자 권한 부족으로 실패했습니다.

```powershell
schtasks /Create /F /SC ONLOGON /TN GiteaActRunner /TR "D:\Gitea\act_runner\start-runner.cmd"
```

실패 메시지:

```text
ERROR: Access is denied.
```

### 대체 방식: 현재 사용자 로그인 시 자동 시작

레지스트리 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`에 등록했습니다.

등록 명령:

```powershell
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" `
  /v GiteaActRunner `
  /t REG_SZ `
  /d "D:\Gitea\act_runner\start-runner.cmd" `
  /f
```

확인 명령:

```powershell
Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' | Select-Object GiteaActRunner
```

확인 결과:

- `D:\Gitea\act_runner\start-runner.cmd`

## 15. 최종 상태 요약

이 문서 작성 시점 기준 최종 상태는 다음과 같습니다.

1. Gitea 웹 언어 기본값에 한국어가 추가됨
2. 웹 접속 포트는 `3000`
3. `act_runner` 설치 완료
4. runner 등록 완료
5. runner 데몬 실행 중
6. `gzz12345/Project01` 저장소에서 Actions 활성화 완료
7. 테스트 workflow 업로드 완료
8. runner 로그에서 workflow task를 잡는 것 확인
9. 로그인 시 runner 자동 시작 등록 완료

## 16. 중요한 운영 메모

### 관리자 토큰 정리 권장

설정 과정에서 API 토큰을 여러 개 생성했으면, 작업 후 불필요한 토큰은 삭제하는 것이 좋습니다.

권장 이유:

- 보안 위험 감소
- 관리자 계정 토큰 남용 방지

### 재부팅 후 동작 방식

- 현재 설정은 Windows 서비스가 아니라 사용자 로그인 시 자동 시작 방식입니다.
- 따라서 PC가 켜진 뒤 해당 사용자 로그인이 이루어져야 runner가 자동 시작됩니다.

### 더 안정적인 운영을 원할 때

아래 중 하나를 추가로 고려할 수 있습니다.

1. 관리자 권한으로 Windows 작업 스케줄러 등록
2. NSSM 같은 도구로 runner를 Windows 서비스화
3. 별도 전용 runner 계정으로 분리 운영

## 17. 주요 파일 목록

- Gitea 설정 파일: `D:\Gitea\custom\conf\app.ini`
- runner 실행 파일: `D:\Gitea\act_runner\act_runner.exe`
- runner 설정 파일: `D:\Gitea\act_runner\config.yaml`
- runner 등록 정보: `D:\Gitea\act_runner\.runner`
- runner 시작 스크립트: `D:\Gitea\act_runner\start-runner.cmd`
- runner 에러 로그: `D:\Gitea\act_runner\runner.err.log`
- runner 출력 로그: `D:\Gitea\act_runner\runner.out.log`

## 18. 빠른 재실행 체크리스트

새로운 PC나 새 설치에서 다시 진행할 때는 아래 순서로 진행하면 됩니다.

1. `D:\Gitea\custom\conf\app.ini` 확인
2. `[i18n]` 섹션 추가 후 Gitea 재시작
3. 웹 포트 `3000` 확인
4. runner 등록 토큰 생성
5. `act_runner.exe` 다운로드
6. `config.yaml` 생성 후 `windows:host` 라벨로 수정
7. runner 등록
8. runner 데몬 실행
9. 저장소 `has_actions=true` 설정
10. `.gitea/workflows/*.yml` 업로드
11. runner 로그와 웹 UI에서 Actions 실행 확인
12. 자동 시작 등록
