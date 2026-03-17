title: "사이트 내 검색 강화를 위한 태그 가이드"
description: "게시글이 더 잘 검색되도록 하는 태그 활용법과 추천 태그 리스트입니다."
date: "2026-03-17"
tags: ["tags", "search", "guide", "pagefind", "seo", "keywords"]
---

# 사이트 내 검색 강화를 위한 태그 가이드

블로그에 도입된 **내부 검색(Pagefind)** 및 **외부 검색(구글/네이버)** 기능을 극대화하기 위해, 게시글 작성 시 활용할 수 있는 태그(Tags) 관리 가이드를 마련했습니다.

---

## 1. 검색 원리 및 적용 사항
- **자동 키워드 추출**: 게시글 상단(Frontmatter)의 `tags`에 적힌 단어들은 이제 자동으로 사이트의 `<meta name="keywords">` 태그로 변환됩니다.
- **내부 검색 반영**: 사이트 내 검색창에서 특정 태그를 입력하면 해당 단어가 포함된 게시글이 우선순위로 노출됩니다.

---

## 2. 추천 태그 리스트 (적용 가능 예시)
글을 작성할 때 아래 카테고리별 태그를 조합해서 사용하면 검색 효율이 높아집니다.

### 🤖 AI 및 자동화
- `AI`, `Agent`, `Automation`, `LLM`, `Prompt`, `Giscus`, `OpenAI`

### 💻 개발 및 기술
- `Astro`, `Nextjs`, `TypeScript`, `JavaScript`, `CSS`, `Tailwind`, `GitHub-Actions`, `Vercel`

### 🧪 프로젝트 및 리포트
- `Project`, `DevLog`, `Report`, `Study`, `Troubleshooting`, `Modernization`

### 🔍 마케팅 및 SEO
- `SEO`, `Search-Engine`, `Google-Console`, `Naver-Advisor`, `Google`, `Naver`

---

## 3. 태그 작성 팁
1.  **소문자 통일**: 검색 일관성을 위해 가급적 영문 태그는 소문자 위주로 사용하거나 띄어쓰기 대신 하이픈(`-`)을 사용하는 것이 좋습니다 (예: `github-actions`).
2.  **구체적 단어 사용**: 단순히 `개발` 보다는 `astro-development` 처럼 구체적인 단어를 섞으면 더 정확한 검색 결과가 나옵니다.
3.  **다중 태그**: 하나의 글에 3~5개 정도의 핵심 태그를 부여하는 것이 가장 효과적입니다.

---

## 4. 결론
이제 `welcome.md`와 같은 파일의 `tags: ["intro", "welcome"]` 부분을 수정하거나 새 글에 태그를 추가하는 것만으로도 검색 품질을 비약적으로 높일 수 있습니다.
