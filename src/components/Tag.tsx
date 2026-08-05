// Tag.tsx — small pill used for genre / difficulty / length labels.
import type { ReactNode } from "react";
import type { Tone } from "../types";

// Maps a label to its color tone. Exported so pages can look up a game's tone.
export const TAG_TONE: Record<string, Tone> = {
  Deception: "primary", Strategy: "secondary", Psychology: "accent", Party: "primary",
  Easy: "easy", Medium: "medium", Hard: "hard",
};

export function Tag({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return <span className={"tag " + (tone ? "tag--" + tone : "")}>{children}</span>;
}
