// components.jsx — shared Card Game Catalog UI: logo, nav, pills, icons
const { useState, useEffect, useRef } = React;

/* ---------- icons (simple, friendly line/solid) ---------- */
function SuitLogo({ size = 30 }) {
  // chunky stacked-cards mark
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="16" height="21" rx="4" transform="rotate(-9 11 18.5)"
      fill="var(--c-accent)" stroke="var(--c-ink)" strokeWidth="2.2" />
      <rect x="9" y="4" width="16" height="21" rx="4" transform="rotate(7 17 14.5)"
      fill="var(--c-primary)" stroke="var(--c-ink)" strokeWidth="2.2" />
      <path d="M17 11.4c1.6-2.3 5-1 5 1.5 0 2.2-3.1 4-5 5.6-1.9-1.6-5-3.4-5-5.6 0-2.5 3.4-3.8 5-1.5Z"
      fill="#fff" stroke="var(--c-ink)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>);

}

/* ---------- mascot + hand-drawn flourishes ---------- */
function MascotDoodle({ size = 34, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" stroke="var(--c-ink)" strokeWidth="3.4"
    strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="30" cy="35" r="15.5" fill="var(--c-surface)" />
      <circle cx="22.5" cy="17" r="2.6" fill="var(--c-ink)" stroke="none" />
      <circle cx="37.5" cy="17" r="2.6" fill="var(--c-ink)" stroke="none" />
      <path d="M22.5 17q-5-7-11.5-5.5" />
      <path d="M37.5 17q5-7 11.5-5.5" />
      <circle cx="24.5" cy="33" r="1.7" fill="var(--c-ink)" stroke="none" />
      <circle cx="35.5" cy="33" r="1.7" fill="var(--c-ink)" stroke="none" />
      <path d="M24 43q6 4.5 12 0" />
    </svg>);

}

function HandUnderline({ width = 170, height = 14, color = "var(--sage, #7E9A5E)", style }) {
  return (
    <svg width={width} height={height} viewBox="0 0 170 14" fill="none" style={style} aria-hidden="true">
      <path d="M3 8 Q42 1 85 8 T167 6" stroke={color} strokeWidth="4.2" strokeLinecap="round" />
    </svg>);

}

/* ---------- scattered hand-placed props ---------- */
function StickyNoteDoodle({ style }) {
  return (
    <svg className="deco deco--sticky" style={style} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" fill="#F2D94E" stroke="#B8941E" strokeWidth="2" />
      <path d="M13 22h34M13 32h38M13 42h28" stroke="#8A701A" strokeWidth="2.6" strokeLinecap="round" />
    </svg>);

}
function PencilDoodle({ style }) {
  return (
    <svg className="deco deco--pencil" style={style} viewBox="0 0 130 34" aria-hidden="true">
      <rect x="4" y="11" width="94" height="12" rx="6" fill="#F2C14E" stroke="#2C2A24" strokeWidth="2.4" transform="rotate(-3 51 17)" />
      <path d="M96 10 L120 17 L96 24 Z" fill="#E8A870" stroke="#2C2A24" strokeWidth="2.4" strokeLinejoin="round" transform="rotate(-3 96 17)" />
      <rect x="2" y="10" width="12" height="14" fill="#D9556B" stroke="#2C2A24" strokeWidth="2.4" transform="rotate(-3 8 17)" />
    </svg>);

}
function DieDoodle({ style }) {
  return (
    <svg className="deco deco--die" style={style} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#FBF8EE" stroke="#2C2A24" strokeWidth="3" />
      <circle cx="19" cy="19" r="4.2" fill="#2C2A24" />
      <circle cx="45" cy="19" r="4.2" fill="#2C2A24" />
      <circle cx="32" cy="32" r="4.2" fill="#2C2A24" />
      <circle cx="19" cy="45" r="4.2" fill="#2C2A24" />
      <circle cx="45" cy="45" r="4.2" fill="#2C2A24" />
    </svg>);

}
function WashiTape({ style, color = "#D99A2B" }) {
  return <div className="deco deco--tape" style={{ background: color, ...style }} aria-hidden="true" />;
}
function TopPickBadge({ style }) {
  return (
    <div className="toppick" style={style} aria-hidden="true">
      <span className="toppick__star">★</span>
      <span className="toppick__label">top<br />pick</span>
    </div>);

}

/* ---------- per-game bespoke doodles (flagship games only) ---------- */
function DoodleLoneCard({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="37" y="23" width="46" height="64" rx="8" transform="rotate(-5 60 55)" />
      <circle cx="86" cy="30" r="3" fill="currentColor" stroke="none" />
      <path d="M86 31q4 7 -1 13" />
    </svg>);

}
function DoodleCrown({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M27 80 L23 45 L43 61 L60 28 L77 61 L97 45 L93 80 Z" />
      <path d="M27 80h66" />
    </svg>);

}
function DoodleMazeBrain({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M60 19c-21 0-35 14-35 33 0 13 8 19 8 29 0 11 11 17 27 17s27-6 27-17c0-10 8-16 8-29 0-19-14-33-35-33Z" />
      <path d="M45 40q9 10 0 19 -9 9 2 17" />
      <path d="M71 38q-9 10 2 19 9 9 -4 19" />
    </svg>);

}
function DoodleLinkedHands({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="60" cy="60" r="35" />
      <path d="M39 45q6-11 17-6q4 9-4 15" />
      <path d="M81 45q-6-11-17-6q-4 9 4 15" />
      <path d="M39 75q6 11 17 6q4-9-4-15" />
      <path d="M81 75q-6 11-17 6q-4-9 4-15" />
    </svg>);

}

const MOTIFS = {
  "lone-card-sweat": DoodleLoneCard,
  "crown": DoodleCrown,
  "maze-brain": DoodleMazeBrain,
  "linked-hands": DoodleLinkedHands
};
// Flagship games get a deliberately hand-picked color, looked up by name — never hashed/random.
const FLAGSHIP_PALETTE = {
  charcoal: "#2B2B2B",
  coral: "#C24A3D",
  steelblue: "#3F6FA3",
  sage: "#6E8B57"
};
const STICKER_TEXT = {
  "staff-pick": "★ staff pick!",
  "brain-melter": "brain-melter",
  "so-loud": "so loud!!"
};
function GameDoodle({ game }) {
  const Motif = game.motif && MOTIFS[game.motif];
  if (Motif) return <Motif className="gcard__doodle-svg" />;
  return <span className="gcard__doodle-emoji" aria-hidden="true">{game.emoji}</span>;
}

const ICONS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  play: "M8 5v14l11-7z",
  chevron: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5 13l4 4L19 7",
  dice: "M4 4h16v16H4z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
};
function Icon({ name, size = 20, stroke = 2.2, fill = "none", style }) {
  const solid = name === "play";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
    fill={solid ? "currentColor" : fill}
    stroke={solid ? "none" : "currentColor"}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>);

}

/* ---------- pills / tags ---------- */
const TAG_TONE = {
  Deception: "primary", Strategy: "secondary", Psychology: "accent", Party: "primary",
  Cooperative: "secondary", "Trick Taking": "accent",
  Easy: "easy", Medium: "medium", Hard: "hard"
};
function Tag({ children, tone }) {
  return <span className={"tag " + (tone ? "tag--" + tone : "")}>{children}</span>;
}

/* ---------- buttons ---------- */
function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, href, type, full, ...rest }) {
  const cls = `btn btn--${kind} btn--${size}${full ? " btn--full" : ""}`;
  const inner =
  <>
      {icon && <Icon name={icon} size={size === "lg" ? 22 : 18} />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 22 : 18} />}
    </>;

  if (href !== undefined) return <a className={cls} href={href} onClick={onClick} {...rest}>{inner}</a>;
  return <button className={cls} type={type || "button"} onClick={onClick} {...rest}>{inner}</button>;
}

/* ---------- top nav ---------- */
function Nav({ route, go }) {
  const onHome = route.view === "home";
  const onGame = route.view === "game";
  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="brand" href="#/" onClick={(e) => {e.preventDefault();go("#/");}}>
          <MascotDoodle size={38} />
          <span className="brand__nametext">
            <span className="brand__name">Card Game Catalog</span>
            {onHome && <HandUnderline width={190} style={{ marginTop: -4 }} />}
          </span>
        </a>
        <nav className="nav__links">
          {!onHome && !onGame &&
          <a className="nav__link" href="#/" onClick={(e) => {e.preventDefault();go("#/");}}>Browse</a>
          }
          {onHome && <span className="nav__hint">pull up a chair! ↴</span>}
          <Btn kind="join" size="sm" icon="arrow" href="#/join"
          onClick={(e) => {e.preventDefault();go("#/join");}}>Join Game</Btn>
        </nav>
      </div>
    </header>);

}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__fan"><HeroFan /></div>
      <div className="footer__inner">
        <div className="brand brand--sm"><SuitLogo size={24} /><span className="brand__name">Card Game Catalog</span></div>
        <p>Play any card game, anywhere, with anyone.</p>
        <span className="footer__wink">No app to download. Just pass the tablet around. ✦</span>
      </div>
    </footer>);

}

/* ---------- floating background cards ---------- */
const BG_CARDS = [
{ rank: "A", suit: "♠", red: false, x: 4, rot: -12, dur: 16, delay: 0 },
{ rank: "K", suit: "♥", red: true, x: 12, rot: 7, dur: 19, delay: 2.4 },
{ rank: "7", suit: "♣", red: false, x: 22, rot: -6, dur: 14, delay: 5.1 },
{ rank: "Q", suit: "♦", red: true, x: 33, rot: 10, dur: 17, delay: 1.2 },
{ rank: "J", suit: "♠", red: false, x: 44, rot: -15, dur: 21, delay: 8.0 },
{ rank: "10", suit: "♥", red: true, x: 55, rot: 4, dur: 15, delay: 3.7 },
{ rank: "9", suit: "♣", red: false, x: 65, rot: -9, dur: 18, delay: 6.5 },
{ rank: "A", suit: "♦", red: true, x: 74, rot: 13, dur: 13, delay: 0.8 },
{ rank: "8", suit: "♠", red: false, x: 84, rot: -5, dur: 20, delay: 4.2 },
{ rank: "K", suit: "♣", red: false, x: 92, rot: 8, dur: 16, delay: 7.3 }];


function FloatingCards() {
  return (
    <div className="bg-cards" aria-hidden="true">
      {BG_CARDS.map((c, i) =>
      <div
        key={i}
        className={"bg-card" + (c.red ? " bg-card--red" : "")}
        style={{
          left: c.x + "%",
          "--rot": c.rot + "deg",
          "--dur": c.dur + "s",
          "--delay": c.delay + "s"
        }}>
        
          <span className="bg-card__rank">{c.rank}</span>
          <span className="bg-card__suit">{c.suit}</span>
        </div>
      )}
    </div>);

}

/* ---------- custom illustrated artwork ---------- */
// Per-game "cover art" panel: themed color field, scattered suit pips, a hero token
function CardArt({ game }) {
  const c = "var(--c-" + game.color + ")";
  const seed = game.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const suits = ["♠", "♥", "♦", "♣"];
  const pips = [
  { x: 46, y: 34, s: 30, r: -16 }, { x: 258, y: 44, s: 38, r: 14 },
  { x: 240, y: 108, s: 26, r: -10 }, { x: 64, y: 106, s: 22, r: 12 }];

  return (
    <svg viewBox="0 0 300 134" preserveAspectRatio="xMidYMid slice" role="img" aria-label={game.title + " artwork"}>
      <rect width="300" height="134" fill={c} />
      <circle cx="252" cy="-6" r="78" fill="#fff" opacity=".13" />
      <circle cx="26" cy="150" r="66" fill="#000" opacity=".09" />
      {pips.map((p, i) =>
      <text key={i} x={p.x} y={p.y} fontSize={p.s} fill="#fff" opacity=".22"
      transform={`rotate(${p.r} ${p.x} ${p.y})`} textAnchor="middle"
      dominantBaseline="central" fontFamily="Georgia, 'Times New Roman', serif">{suits[(seed + i) % 4]}</text>
      )}
      <g transform="translate(150 67) rotate(-6)">
        <rect x="-38" y="-44" width="84" height="96" rx="14" fill="color-mix(in srgb, var(--c-primary) 40%, #000)" opacity=".35" />
        <rect x="-42" y="-48" width="84" height="96" rx="14" fill="#fff" stroke="var(--c-ink)" strokeWidth="2" />
        <text x="0" y="3" fontSize="44" textAnchor="middle" dominantBaseline="central">{game.emoji}</text>
      </g>
    </svg>);

}

// sparkle / 4-point star
function Spark({ x, y, s }) {
  const k = s * 0.16;
  const d = `M${x} ${y - s} C ${x + k} ${y - k}, ${x + k} ${y - k}, ${x + s} ${y} ` +
  `C ${x + k} ${y + k}, ${x + k} ${y + k}, ${x} ${y + s} ` +
  `C ${x - k} ${y + k}, ${x - k} ${y + k}, ${x - s} ${y} ` +
  `C ${x - k} ${y - k}, ${x - k} ${y - k}, ${x} ${y - s} Z`;
  return <path d={d} fill="var(--c-accent)" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />;
}

// a single chunky illustrated playing card
function ArtCard({ x, y, rot, suit, rank, red }) {
  const ink = "#1a1a1a";
  const col = red ? "var(--c-primary)" : ink;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-46" y="-66" width="96" height="136" rx="13" fill="var(--c-ink)" opacity=".25" />
      <rect x="-50" y="-70" width="96" height="136" rx="13" fill="#fff" stroke="var(--c-ink)" strokeWidth="2.5" />
      <text x="-36" y="-50" fontSize="21" fontFamily="Georgia, serif" fontWeight="700" fill={col} textAnchor="middle" dominantBaseline="central">{rank}</text>
      <text x="-36" y="-31" fontSize="17" fontFamily="Georgia, serif" fill={col} textAnchor="middle" dominantBaseline="central">{suit}</text>
      <text x="2" y="4" fontSize="62" fontFamily="Georgia, serif" fill={col} textAnchor="middle" dominantBaseline="central">{suit}</text>
    </g>);

}

// animated fanned hero deck
function HeroFan() {
  return (
    <svg viewBox="0 0 380 300" className="herofan" aria-hidden="true">
      <g className="herofan__inner">
        <circle cx="210" cy="150" r="132" fill="var(--c-accent)" opacity=".22" />
        <circle cx="116" cy="206" r="74" fill="var(--c-secondary)" opacity=".15" />
        <Spark x={40} y={66} s={17} />
        <Spark x={338} y={108} s={24} />
        <Spark x={306} y={256} s={15} />
        <ArtCard x={120} y={178} rot={-18} suit="♣" rank="7" red={false} />
        <ArtCard x={262} y={172} rot={16} suit="♦" rank="K" red={true} />
        <ArtCard x={192} y={150} rot={-2} suit="♠" rank="A" red={false} />
      </g>
    </svg>);

}

Object.assign(window, {
  SuitLogo, Icon, Tag, TAG_TONE, Btn, Nav, Footer, FloatingCards, CardArt, HeroFan,
  MascotDoodle, HandUnderline, StickyNoteDoodle, PencilDoodle, DieDoodle, WashiTape, TopPickBadge,
  GameDoodle, FLAGSHIP_PALETTE, STICKER_TEXT
});