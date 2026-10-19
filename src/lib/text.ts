import type { LangCode } from "../config/languages";
import type { Localized } from "./types";

export const t = (text: Localized | undefined, lang: LangCode): string =>
  text ? (text[lang] ?? text.en) : "";
