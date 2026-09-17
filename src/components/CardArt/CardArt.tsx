// CardArt.tsx — illustrated SVG artwork: per-game covers and the hero fan.
import type { Game } from "../types";
import { HeroFanSvg } from "./cardArt.styles";

// Per-game "cover art": themed color field, scattered suit pips, a hero token.
export function CardArt({ game }: { game: Game }) {
  const c = "var(--c-" + game.color + ")";
  const seed = game.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const suits = ["♠", "♥", "♦", "♣"];
  const pips = [
    { x: 46, y: 34, s: 30, r: -16 }, { x: 258, y: 44, s: 38, r: 14 },
    { x: 240, y: 108, s: 26, r: -10 }, { x: 64, y: 106, s: 22, r: 12 },
  ];

  return (
    <svg viewBox="0 0 300 134" preserveAspectRatio="xMidYMid slice" role="img" aria-label={game.title + " artwork"}>
      <rect width="300" height="134" fill={c} />
      <circle cx="252" cy="-6" r="78" fill="#fff" opacity=".13" />
      <circle cx="26" cy="150" r="66" fill="#000" opacity=".09" />
      {pips.map((p, i) => (
        <text key={i} x={p.x} y={p.y} fontSize={p.s} fill="#fff" opacity=".22"
          transform={`rotate(${p.r} ${p.x} ${p.y})`} textAnchor="middle"
          dominantBaseline="central" fontFamily="Georgia, 'Times New Roman', serif">{suits[(seed + i) % 4]}</text>
      ))}
      <g transform="translate(150 67) rotate(-6)">
        <rect x="-38" y="-44" width="84" height="96" rx="14" fill="color-mix(in srgb, var(--c-primary) 40%, #000)" opacity=".35" />
        <rect x="-42" y="-48" width="84" height="96" rx="14" fill="#fff" stroke="var(--c-ink)" strokeWidth="2" />
        <text x="0" y="3" fontSize="44" textAnchor="middle" dominantBaseline="central">{game.emoji}</text>
      </g>
    </svg>
  );
}

// sparkle / 4-point star
function Spark({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s * 0.16;
  const d = `M${x} ${y - s} C ${x + k} ${y - k}, ${x + k} ${y - k}, ${x + s} ${y} ` +
    `C ${x + k} ${y + k}, ${x + k} ${y + k}, ${x} ${y + s} ` +
    `C ${x - k} ${y + k}, ${x - k} ${y + k}, ${x - s} ${y} ` +
    `C ${x - k} ${y - k}, ${x - k} ${y - k}, ${x} ${y - s} Z`;
  return <path d={d} fill="var(--c-accent)" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />;
}

// a single chunky illustrated playing card
function ArtCard({ x, y, rot, suit, rank, red }: { x: number; y: number; rot: number; suit: string; rank: string; red: boolean }) {
  const ink = "#1a1a1a";
  const col = red ? "var(--c-primary)" : ink;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-46" y="-66" width="96" height="136" rx="13" fill="var(--c-ink)" opacity=".25" />
      <rect x="-50" y="-70" width="96" height="136" rx="13" fill="#fff" stroke="var(--c-ink)" strokeWidth="2.5" />
      <text x="-36" y="-50" fontSize="21" fontFamily="Georgia, serif" fontWeight="700" fill={col} textAnchor="middle" dominantBaseline="central">{rank}</text>
      <text x="-36" y="-31" fontSize="17" fontFamily="Georgia, serif" fill={col} textAnchor="middle" dominantBaseline="central">{suit}</text>
      <text x="2" y="4" fontSize="62" fontFamily="Georgia, serif" fill={col} textAnchor="middle" dominantBaseline="central">{suit}</text>
    </g>
  );
}

// animated fanned hero deck
export function HeroFan() {
  return (
    <HeroFanSvg viewBox="0 0 380 300" aria-hidden="true">
      <g>
        <circle cx="210" cy="150" r="132" fill="var(--c-accent)" opacity=".22" />
        <circle cx="116" cy="206" r="74" fill="var(--c-secondary)" opacity=".15" />
        <Spark x={40} y={66} s={17} />
        <Spark x={338} y={108} s={24} />
        <Spark x={306} y={256} s={15} />
        <ArtCard x={120} y={178} rot={-18} suit="♣" rank="7" red={false} />
        <ArtCard x={262} y={172} rot={16} suit="♦" rank="K" red={true} />
        <ArtCard x={192} y={150} rot={-2} suit="♠" rank="A" red={false} />
      </g>
    </HeroFanSvg>
  );
}
