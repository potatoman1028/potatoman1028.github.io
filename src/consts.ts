import type { Metadata, Site, Socials } from "@types";

export const SITE: Site = {
  TITLE: "POTATO'S CORNER",
  DESCRIPTION: "기술 및 개발 블로그",
  EMAIL: "hgkim@example.com",
  NUM_POSTS_ON_HOMEPAGE: 5,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Astro Micro is an accessible theme for Astro.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "GitHub",
    HREF: "https://github.com/potatoman1028",
  },
  {
    NAME: "Author: HyoGon Kim",
    HREF: "https://github.com/potatoman1028",
  },
];
