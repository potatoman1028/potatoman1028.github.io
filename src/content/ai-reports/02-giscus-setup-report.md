title: "Giscus 댓글 시스템 개인화 및 설정 리포트"
description: "기존 데모 저장소에서 본인 저장소로 댓글 시스템을 이전하고 최적화한 기록입니다."
date: "2026-03-17"
tags: ["giscus", "comments", "setup", "github-discussions", "personalization"]
---

# Giscus 댓글 시스템 개인화 및 설정 리포트

블로그의 사용자 경험을 완성하기 위해, 기존 템플릿의 데모 저장소를 바라보던 Giscus 댓글 시스템을 사용자 본인의 저장소로 연결하고 최적화하는 작업을 수행했습니다.

---

## 1. 현황 및 목표
- **문제점**: 블로그 하단의 댓글창이 템플릿 제작자의 저장소를 참조하고 있어, 데모 관리용 댓글들이 노출되고 본인이 관리할 수 없는 상태였습니다.
- **목표**: 
  - 본인 소유의 GitHub 저장소(`potatoman1028.github.io`)와 댓글 시스템 연결.
  - 한국어 인터페이스 적용 및 입력창 위치 조정.
  - 비정상적인 데모 댓글 데이터 제거.

---

## 2. 구현 계획 및 사용자 가이드
이 작업은 코드 수정뿐만 아니라 사용자측의 GitHub 설정이 병행되어야 했습니다.

1.  **저장소 설정**: `Settings > General > Discussions` 활성화.
2.  **Giscus 권한 부여**: GitHub App을 통한 저장소 접근 권한 허용.
3.  **환경 프로젝트 값 추출**: [giscus.app](https://giscus.app/ko)을 통해 `repo-id` 및 `category-id` 확인.

---

## 3. 기술적 구현 내용
`src/components/Giscus.astro` 파일을 수정하여 추출된 고유 ID 값들을 반영했습니다.

### 주요 수정 코드 (diff)
```astro
 <script
   is:inline
   data-astro-rerun
   src="https://giscus.app/client.js"
-  data-repo="trevortylerlee/astro-micro"
-  data-repo-id="R_kgDOL_6l9Q"
+  data-repo="potatoman1028/potatoman1028.github.io"
+  data-repo-id="R_kgDOIE2urg"
   data-category="Announcements"
-  data-category-id="DIC_kwDOL_6l9c4Cfk55"
+  data-category-id="DIC_kwDOIE2urs4CSWRt"
   ...
-  data-input-position="top"
+  data-input-position="bottom"
-  data-lang="en"
+  data-lang="ko"
   ...
 ></script>
```

---

## 4. 최종 결과 및 검증
- **검증 대상**: `http://localhost:4321/blog/welcome`
- **결과**:
  - 댓글 섹션이 성공적으로 로드됨.
  - Giscus 서버 요청 시 본인의 `data-repo-id`가 정확히 전달됨을 확인.
  - 입력창 위치 및 언어 설정이 의도대로 반영됨.
  - 이전의 데모 댓글들이 더 이상 나타나지 않음.

---

## 5. 결론
이제 블로그의 모든 상호작용(댓글, 반응)이 사용자님의 GitHub Discussions 시스템 내 `Announcements` 카테고리에 안전하게 기록됩니다.
