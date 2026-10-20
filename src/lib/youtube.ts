import type { LangCode } from "../config/languages";
import { UI } from "../config/ui";
import { t } from "./text";
import type { Format, Story } from "./types";

/** Text shown on YouTube, per language. Edit freely; no keyword stuffing. */
const COPY: Record<LangCode, { tagline: string; lesson: string; about: string; hashtags: string[]; tags: string[]; titleSuffix: string }> = {
  en: {
    tagline: "Thai Folktale for Kids",
    lesson: "Today's lesson",
    about:
      "Fufu the fluffy lion cub retells folktales from Thailand in short, gentle stories for young children, with a simple lesson at the end of every tale.",
    hashtags: ["#bedtimestories", "#folktales", "#kidsstories"],
    tags: ["Thai folktale", "folktales for kids", "bedtime story", "kids story", "moral story", "Fufu Tales"],
    titleSuffix: "Fufu Tales",
  },
  th: {
    tagline: "นิทานพื้นบ้านไทย",
    lesson: "ข้อคิด",
    about: "ฟูฟู สิงโตน้อยขนฟู พาเพื่อนๆ ไปฟังนิทานพื้นบ้านไทย เล่าใหม่ให้สั้น เข้าใจง่าย เหมาะสำหรับเด็กเล็ก และมีข้อคิดดีๆ ท้ายเรื่องทุกตอน",
    hashtags: ["#นิทาน", "#นิทานพื้นบ้านไทย", "#นิทานเด็ก"],
    tags: ["นิทาน", "นิทานพื้นบ้านไทย", "นิทานเด็ก", "นิทานก่อนนอน", "นิทานมีข้อคิด", "นิทานฟูฟู"],
    titleSuffix: "นิทานฟูฟู",
  },
};

export interface YouTubeMeta {
  title: string;
  description: string;
  tags: string[];
  defaultLanguage: string;
  /** 1 = Film & Animation. Change in YOUTUBE_CATEGORY_ID if you prefer 27 (Education). */
  categoryId: string;
  madeForKids: true;
  privacyStatus: "private";
}

export const youtubeMeta = (story: Story, lang: LangCode, format: Format): YouTubeMeta => {
  const c = COPY[lang] ?? COPY.en;
  const title = t(story.title, lang);
  const short = format === "vertical";
  const summary = story.summary ? t(story.summary, lang) : "";
  const moral = t(story.moral, lang);

  const fullTitle = short
    ? `${title} | ${c.titleSuffix} #shorts`
    : `${title} | ${c.tagline} | ${c.titleSuffix}`;

  const description = [
    summary,
    "",
    `${c.lesson}: ${moral}`,
    "",
    c.about,
    "",
    [...c.hashtags, short ? "#shorts" : ""].filter(Boolean).join(" "),
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n")
    .trim();

  return {
    title: fullTitle.slice(0, 100),
    description: description.slice(0, 4900),
    tags: [title, ...c.tags],
    defaultLanguage: lang,
    categoryId: process.env.YOUTUBE_CATEGORY_ID ?? "1",
    madeForKids: true,
    privacyStatus: "private",
  };
};

/** Channel name for the on-screen UI, re-exported for convenience. */
export const channelName = (lang: LangCode) => t(UI.channel, lang);
