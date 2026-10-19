import type { Story } from "../lib/types";
import rabbitInTheMoon from "./rabbit-in-the-moon.json";

/** Register every story here. One JSON file per story. */
export const STORIES: Story[] = [rabbitInTheMoon as Story];

export const getStory = (id: string): Story => {
  const story = STORIES.find((s) => s.id === id);
  if (!story) throw new Error(`Unknown story: ${id}`);
  return story;
};
