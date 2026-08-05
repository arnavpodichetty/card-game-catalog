// tokens.ts — design tokens shared by every styled component.
//
// Palette / type / radius tokens resolve to the CSS custom properties that
// `applyTheme` (lib/theme.ts) writes onto <html> at runtime, so switching the
// theme still re-skins the whole app without React re-rendering. Literal values
// live here only where the design never themed them (card reds, pure white…).

export const COLORS = {
  // themed — driven by applyTheme
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  ink: "var(--c-ink)",
  muted: "var(--c-muted)",
  border: "var(--c-border)",
  primary: "var(--c-primary)",
  secondary: "var(--c-secondary)",
  accent: "var(--c-accent)",
  primaryInk: "var(--c-primary-ink)",
  accentInk: "var(--c-accent-ink)",

  // fixed
  white: "#fff",
  hard: "#1a1a1a",
  cardRed: "#e11d48",
  cardBlack: "#1E1440",
  cardJoker: "#7C3AED",
  /** Cairo's "KABUL!" alert red. */
  kabul: "#e11d48",
  cover: "#0f0a1e",
  tagEasyBg: "#dcfce7",
  tagEasyInk: "#166534",
  tagMediumBg: "#fef9c3",
  tagMediumInk: "#854d0e",
  tagHardBg: "#fee2e2",
  tagHardInk: "#991b1b",
} as const;

export const FONTS = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  /** Display weight — themed, since some type sets are heavier than others. */
  displayWeight: "var(--dw)",
  displayTracking: "var(--ls-display)",
} as const;

export const RADII = {
  sm: "var(--radius-sm)",
  md: "var(--radius)",
  lg: "var(--radius-lg)",
  pill: "var(--radius-pill)",
} as const;

export const SHADOWS = {
  card: "var(--shadow-card)",
} as const;

export const LAYOUT = {
  maxWidth: "1140px",
  navHeight: "62px",
} as const;

/** Media query helpers — `${MEDIA.sm} { ... }` inside a styled template. */
export const MEDIA = {
  lg: "@media(max-width:880px)",
  md: "@media(max-width:760px)",
  sm: "@media(max-width:560px)",
  reducedMotion: "@media(prefers-reduced-motion:reduce)",
} as const;

/** `color-mix` shorthand: mix(COLORS.primary, 58, "#000"). */
export const mix = (color: string, pct: number, into = "transparent") =>
  `color-mix(in srgb, ${color} ${pct}%, ${into})`;
