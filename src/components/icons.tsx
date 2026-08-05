// icons.tsx — the brand mark and the shared line/solid icon set.
import type { CSSProperties } from "react";

export function SuitLogo({ size = 30 }: { size?: number }) {
  // chunky stacked-cards mark
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="16" height="21" rx="4" transform="rotate(-9 11 18.5)"
        fill="var(--c-accent)" stroke="var(--c-ink)" strokeWidth="2.2" />
      <rect x="9" y="4" width="16" height="21" rx="4" transform="rotate(7 17 14.5)"
        fill="var(--c-primary)" stroke="var(--c-ink)" strokeWidth="2.2" />
      <path d="M17 11.4c1.6-2.3 5-1 5 1.5 0 2.2-3.1 4-5 5.6-1.9-1.6-5-3.4-5-5.6 0-2.5 3.4-3.8 5-1.5Z"
        fill="#fff" stroke="var(--c-ink)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<string, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  play: "M8 5v14l11-7z",
  chevron: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5 13l4 4L19 7",
  dice: "M4 4h16v16H4z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
};

export interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, stroke = 2.2, fill = "none", style }: IconProps) {
  const solid = name === "play";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={solid ? "currentColor" : fill}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
