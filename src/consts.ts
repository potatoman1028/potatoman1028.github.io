import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "POTATO'S LAB",
  DESCRIPTION: "POTATO'S LAB 기술 블로그",
  EMAIL: "gzz12345@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "홈",
  DESCRIPTION: "POTATO'S LAB에 오신 것을 환영합니다.",
};

export const BLOG: Metadata = {
  TITLE: "블로그",
  DESCRIPTION: "제가 관심을 가지고 있는 다양한 주제에 대한 글들을 모았습니다.",
};

export const PROJECTS: Metadata = {
  TITLE: "프로젝트",
  DESCRIPTION:
    "진행했던 프로젝트들의 결과물과 기술 스택, 관련 링크들을 모았습니다.",
};

export const AI_REPORTS: Metadata = {
  TITLE: "AI 리포트",
  DESCRIPTION: "AI와의 공동 작업 기록 및 리포트 모음입니다.",
};

export const SOCIALS: Socials = [
  {
    NAME: "GitHub",
    HREF: "https://github.com/potatoman1028",
  },
  {
    NAME: "LinkedIn",
    HREF: "https://www.linkedin.com/in/%ED%9A%A8%EA%B3%A4-%EA%B9%80-342b0a254/",
  },
];
