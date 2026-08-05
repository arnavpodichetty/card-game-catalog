// theme.ts — palette / typography option tables and the DOM applier.
// Themes are expressed entirely as CSS custom properties on <html>, so styling
// stays in styles.css and only the variable values change here.
import type { Tweaks } from "../types";

interface Palette {
  bg: string; surface: string; ink: string; muted: string; border: string;
  primary: string; secondary: string; accent: string;
  primaryInk: string; accentInk: string;
}
interface TypeSet {
  display: string; body: string; dw: number; ls: string;
}

export const PALETTES: Record<string, Palette> = {
  "Royal Purple":     { bg: "#F7F5FF", surface: "#FFFFFF", ink: "#1E1440", muted: "#7068A0", border: "#DDD7F5", primary: "#7C3AED", secondary: "#059669", accent: "#2D7CF6", primaryInk: "#FFFFFF", accentInk: "#FFFFFF" },
  "Coral & Clover":   { bg: "#FFFDF5", surface: "#FFFFFF", ink: "#241F1A", muted: "#7A7167", border: "#EAE2D2", primary: "#F4683C", secondary: "#2D6A4F", accent: "#F2C14E", primaryInk: "#FFFFFF", accentInk: "#3A2D08" },
  "Berry & Mint":     { bg: "#FFFBFC", surface: "#FFFFFF", ink: "#241B2E", muted: "#7C7186", border: "#EFE6EE", primary: "#FF5C8A", secondary: "#3A2E6E", accent: "#27C5A0", primaryInk: "#FFFFFF", accentInk: "#0A2C24" },
  "Tangerine & Navy": { bg: "#FFFFFF", surface: "#FFFFFF", ink: "#16223B", muted: "#6A7488", border: "#E6E9F0", primary: "#FF6B4A", secondary: "#1B2A4A", accent: "#FFCD3C", primaryInk: "#FFFFFF", accentInk: "#3A2C00" },
  "Grape Soda":       { bg: "#FBF8FF", surface: "#FFFFFF", ink: "#241B33", muted: "#7B7088", border: "#EBE4F3", primary: "#7A5AE0", secondary: "#1F8A5B", accent: "#F2C14E", primaryInk: "#FFFFFF", accentInk: "#39280A" },
};
export const PALETTE_KEYS = Object.keys(PALETTES);
export const PALETTE_SWATCHES = PALETTE_KEYS.map((k) => [PALETTES[k].primary, PALETTES[k].secondary, PALETTES[k].accent]);

export const TYPES: Record<string, TypeSet> = {
  "Soft Sans":      { display: "'DM Sans', sans-serif", body: "'DM Sans', sans-serif", dw: 600, ls: "-0.02em" },
  "Grotesk":        { display: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif", dw: 600, ls: "-0.025em" },
  "Mono · Grotesk": { display: "'Space Mono', monospace", body: "'Space Grotesk', sans-serif", dw: 700, ls: "-0.01em" },
  "DM Mono · Sans": { display: "'DM Mono', monospace", body: "'DM Sans', sans-serif", dw: 500, ls: "-0.02em" },
  "Montserrat":     { display: "'Montserrat', sans-serif", body: "'Montserrat', sans-serif", dw: 700, ls: "-0.02em" },
  "Noto Sans":      { display: "'Noto Sans', sans-serif", body: "'Noto Sans', sans-serif", dw: 600, ls: "-0.01em" },
  "Tahoma":         { display: "Tahoma, sans-serif", body: "Tahoma, sans-serif", dw: 700, ls: "-0.01em" },
  "Verdana":        { display: "Verdana, sans-serif", body: "Verdana, sans-serif", dw: 700, ls: "0em" },
};
export const TYPE_KEYS = Object.keys(TYPES);

export const TWEAK_DEFAULTS: Tweaks = {
  palette: "Royal Purple",
  type: "Soft Sans",
  radius: 18,
};

// Write the active theme onto :root as CSS custom properties.
export function applyTheme(t: Tweaks) {
  const p = PALETTES[t.palette] || PALETTES["Coral & Clover"];
  const ty = TYPES[t.type] || TYPES["Mono · Grotesk"];
  const r = document.documentElement;
  r.style.setProperty("--c-bg", p.bg);
  r.style.setProperty("--c-surface", p.surface);
  r.style.setProperty("--c-ink", p.ink);
  r.style.setProperty("--c-muted", p.muted);
  r.style.setProperty("--c-border", p.border);
  r.style.setProperty("--c-primary", p.primary);
  r.style.setProperty("--c-secondary", p.secondary);
  r.style.setProperty("--c-accent", p.accent);
  r.style.setProperty("--c-primary-ink", p.primaryInk);
  r.style.setProperty("--c-accent-ink", p.accentInk);
  r.style.setProperty("--font-display", ty.display);
  r.style.setProperty("--font-body", ty.body);
  r.style.setProperty("--dw", String(ty.dw));
  r.style.setProperty("--ls-display", ty.ls);
  r.style.setProperty("--radius", t.radius + "px");
  r.style.setProperty("--radius-sm", Math.max(4, Math.round(t.radius * 0.55)) + "px");
  r.style.setProperty("--radius-lg", Math.round(t.radius * 1.5) + "px");
  r.style.setProperty("--radius-pill", (t.radius >= 14 ? 999 : t.radius + 6) + "px");
}
