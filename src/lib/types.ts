import type { LangCode } from "../config/languages";

/** Text in every supported language. Missing languages fall back to English. */
export type Localized = Partial<Record<LangCode, string>> & { en: string };

/* Everything the renderer can draw. Story JSON may only use these keys (checked by src/lib/validate.ts). */
export const BACKGROUNDS = ["stage", "forest-day", "forest-evening", "campfire", "night-moon"] as const;
export const CHARACTER_KEYS = ["fufu", "rabbit", "monkey", "otter", "jackal", "oldman", "phra-in"] as const;
export const PROPS = ["fish", "mango", "corn", "fire", "petals", "moon-rabbit", "grass"] as const;
export const ACTIONS = ["idle", "wave", "hop", "walk-in", "bow", "jump", "glow"] as const;
export const TRANSITIONS = ["cloud", "iris", "sparkle", "fade"] as const;
export const STORY_STATUSES = ["draft", "approved", "published"] as const;

export type BackgroundKey = (typeof BACKGROUNDS)[number];
export type CharacterKey = (typeof CHARACTER_KEYS)[number];
export type PropKey = (typeof PROPS)[number];
export type Action = (typeof ACTIONS)[number];
export type StoryStatus = (typeof STORY_STATUSES)[number];

export interface CastMember {
  character: CharacterKey;
  /** Position on the 1920×1080 stage (feet / bottom-centre of the character). */
  x: number;
  y: number;
  scale?: number;
  /** Face left instead of right. */
  flip?: boolean;
  action?: Action;
  /** Start the action when this line begins (default: scene start). */
  actionAt?: string;
  /** Target x for "jump". */
  toX?: number;
  /** Only appear from this line id onward (inclusive). */
  fromLine?: string;
}

export interface PropPlacement {
  prop: PropKey;
  x: number;
  y: number;
  scale?: number;
  fromLine?: string;
  /** Hide from this line id onward. */
  untilLine?: string;
}

export interface Line {
  id: string;
  /** Who speaks. "fufu" is the narrator voice. */
  speaker: CharacterKey;
  text: Localized;
  /** Don't show a subtitle (e.g. the moral, already shown on the card). */
  noSubtitle?: boolean;
}

export interface Scene {
  id: string;
  background: BackgroundKey;
  /** Big title card shown over the scene. */
  title?: Localized;
  /** Show the story moral as a card (outro). */
  showMoral?: boolean;
  /** Show Fufu in the corner as narrator (story scenes). */
  narratorCorner?: boolean;
  cast: CastMember[];
  props?: PropPlacement[];
  /** How this scene enters: cloud | iris | sparkle | fade (auto when omitted). */
  transition?: (typeof TRANSITIONS)[number];
  /** Background music track in public/music (auto from the background when omitted). */
  music?: string;
  /** Slow camera zoom from 1 to this value over the scene. */
  zoomTo?: number;
  lines: Line[];
}

export interface Story {
  id: string;
  /** draft → approved → published (managed by the n8n workflows). */
  status?: StoryStatus;
  title: Localized;
  moral: Localized;
  /** One or two sentences for the YouTube description. */
  summary?: Localized;
  /** Title on the thumbnail; use "\n" to choose where the line breaks. Defaults to title. */
  thumbnailTitle?: Localized;
  /** Scene drawn on the YouTube thumbnail. */
  thumbnailScene?: string;
  /** New characters/backgrounds/props the story would need (filled by the draft step). */
  assetRequests?: string[];
  scenes: Scene[];
  /** Scene ids used for the 9:16 Short (keep under ~55 s). */
  shortScenes: string[];
}

/** Timing of one line after TTS (or estimation), in frames. */
export interface LineTiming {
  id: string;
  sceneId: string;
  start: number;
  duration: number;
  /** staticFile path of the audio, or null when no TTS audio exists yet. */
  audio: string | null;
}

export interface SceneTiming {
  id: string;
  start: number;
  duration: number;
}

export type Format = "landscape" | "vertical";

export interface StoryProps {
  storyId: string;
  lang: LangCode;
  format: Format;
  /** Filled in by calculateMetadata. */
  timing?: { scenes: SceneTiming[]; lines: LineTiming[] };
  [key: string]: unknown;
}
