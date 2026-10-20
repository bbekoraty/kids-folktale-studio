import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, LANG_CODES } from "./config/languages";
import type { StoryProps } from "./lib/types";
import { calculateStoryMetadata, StoryVideo } from "./StoryVideo";
import { STORIES } from "./stories";
import { CharacterSheet } from "./CharacterSheet";
import { Thumbnail } from "./Thumbnail";

/**
 * One composition per story × language × format.
 * Ids: <story>-<lang> (16:9) and <story>-<lang>-short (9:16).
 */
export const Root: React.FC = () => (
  <>
    <Composition id="character-sheet" component={CharacterSheet} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 6} />
    {STORIES.map((story) => (
      <Folder key={story.id} name={story.id}>
        {LANG_CODES.map((lang) => (
          <React.Fragment key={lang}>
            <Composition
              id={`${story.id}-${lang}`}
              component={StoryVideo}
              width={1920}
              height={1080}
              fps={FPS}
              durationInFrames={FPS * 10}
              defaultProps={{ storyId: story.id, lang, format: "landscape" }}
              calculateMetadata={calculateStoryMetadata}
            />
            <Composition
              id={`${story.id}-${lang}-thumb`}
              component={Thumbnail}
              width={1280}
              height={720}
              fps={FPS}
              durationInFrames={1}
              defaultProps={{ storyId: story.id, lang }}
            />
            <Composition
              id={`${story.id}-${lang}-short`}
              component={StoryVideo}
              width={1080}
              height={1920}
              fps={FPS}
              durationInFrames={FPS * 10}
              defaultProps={{ storyId: story.id, lang, format: "vertical" }}
              calculateMetadata={calculateStoryMetadata}
            />
          </React.Fragment>
        ))}
      </Folder>
    ))}
  </>
);
