import type { LangCode } from "../config/languages";

/** Text in every supported language. Missing languages fall back to English. */
export type Localized = Partial<Record<LangCode, string>> & { en: string };

export type BackgroundKey =
  | "stage"
  | "forest-day"
  | "forest-evening"
  | "campfire"
  | "night-moon";

export type CharacterKey =
  | "fufu"
  | "rabbit"
  | "monkey"
  | "otter"
  | "jackal"
  | "oldman"
  | "phra-in";

export type PropKey = "fish" | "mango" | "corn" | "fire" | "petals" | "moon-rabbit" | "grass";

export type Action = "idle" | "wave" | "hop" | "walk-in" | "bow" | "jump" | "glow";

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
  /** Slow camera zoom from 1 to this value over the scene. */
  zoomTo?: number;
  lines: Line[];
}

export interface Story {
  id: string;
  title: Localized;
  moral: Localized;
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
