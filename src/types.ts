// types.ts — shared domain types for the catalog.

export type Tone = "primary" | "secondary" | "accent" | "easy" | "medium" | "hard";

// A single quick rule shown in the accordion.
export interface QuickRule {
  t: string;
  d: string;
}

// Full-rules building blocks.
export interface RuleItem {
  name: string;
  d: string;
}
export interface RuleGroup {
  name: string;
  note?: string;
  items: RuleItem[];
}
export interface RuleSection {
  id: string;
  title: string;
  paras?: string[];
  intro?: string;
  groups?: RuleGroup[];
  items?: RuleItem[];
}

export interface Game {
  id: string;
  title: string;
  tagline: string;
  blurb: string;
  genre: string;
  difficulty: string;
  players: string;
  minPlayers: number;
  maxPlayers: number;
  length: string;
  lengthLabel: string;
  color: string;
  emoji: string;
  rules: QuickRule[];
  irl: string;
  detailedRules?: RuleSection[];
  playUrl?: string;
}

// Filter option tables.
export interface LengthOption {
  key: string;
  label: string;
  sub: string;
}
export interface PlayerOption {
  key: string;
  label: string;
}

// Hash-router route shapes.
export type Route =
  | { view: "home" }
  | { view: "join" }
  | { view: "game"; id?: string; how: boolean }
  | { view: "play"; id?: string; host?: string; join?: string };

// Active theme selection.
export interface Tweaks {
  palette: string;
  type: string;
  radius: number;
}
