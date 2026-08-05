// cairoGame.styles.ts — Cairo game screen.
//
// `CairoPage` re-declares the theme custom properties for its subtree, so the
// game keeps its own palette and display font regardless of the catalog theme,
// and nothing it sets leaks back out.
import styled, { css, keyframes } from "styled-components";
import { COLORS, FONTS, MEDIA, RADII, mix } from "../styles/tokens";

export const CairoPage = styled.div`
  --c-bg: #f7f5ff;
  --c-surface: #ffffff;
  --c-ink: #1e1440;
  --c-muted: #7068a0;
  --c-border: #ddd7f5;
  --c-primary: #7c3aed;
  --c-secondary: #059669;
  --c-accent: #2d7cf6;
  --c-primary-ink: #ffffff;
  --font-display: 'Space Mono', monospace;
  --font-body: 'Space Grotesk', sans-serif;
  --radius: 18px;
  --radius-pill: 999px;

  min-height: 100vh;
  background-color: ${COLORS.bg};
  background-image: radial-gradient(circle, rgba(124, 58, 237, 0.1) 1px, transparent 1px);
  background-size: 24px 24px;
  color: ${COLORS.ink};
  font-family: ${FONTS.body};
  font-size: 16px;
  -webkit-font-smoothing: antialiased;

  * { box-sizing: border-box; }
  h1, h2, h3 {
    margin: 0;
    font-family: ${FONTS.display};
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  p { margin: 0; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
`;

/* ---------- shell ---------- */
export const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Center = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px 32px;
`;

/* ---------- topbar ---------- */
export const TopBarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  flex-shrink: 0;
`;

export const BackLink = styled.a`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  color: ${COLORS.muted};
  transition: color 0.15s;

  &:hover { color: ${COLORS.ink}; }
`;

export const GameTitle = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
`;

export const TopBarRight = styled.div`
  min-width: 80px;
  display: flex;
  justify-content: flex-end;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.07); }
`;

export const KabulPill = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: ${COLORS.white};
  background: ${COLORS.kabul};
  border-radius: ${RADII.pill};
  padding: 5px 14px;
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

/* ---------- buttons ---------- */
type SgKind = "primary" | "kabul" | "secondary" | "ghost";

const raised = (color: string) => css`
  background: ${color};
  color: ${COLORS.white};
  box-shadow: 0 4px 0 ${mix(color, 58, "#000")};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${mix(color, 58, "#000")};
  }
`;

const KINDS: Record<SgKind, ReturnType<typeof css>> = {
  primary: raised(COLORS.primary),
  kabul: raised(COLORS.kabul),
  secondary: css`
    background: transparent;
    color: ${COLORS.primary};
    border-color: ${COLORS.primary};
    &:hover:not(:disabled) { background: ${mix(COLORS.primary, 8)}; }
  `,
  ghost: css`
    background: transparent;
    color: ${COLORS.muted};
    border-color: transparent;
    box-shadow: none;
    &:hover:not(:disabled) { color: ${COLORS.ink}; }
  `,
};

export const SgBtn = styled.button<{ $kind?: SgKind; $lg?: boolean; $sm?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: ${FONTS.display};
  font-weight: 700;
  border: 2px solid transparent;
  border-radius: ${RADII.pill};
  white-space: nowrap;
  padding: 12px 28px;
  font-size: 15px;
  transition: transform 0.14s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.14s ease, opacity 0.15s ease;

  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }
  &:disabled { opacity: 0.35; cursor: not-allowed; }

  ${(p) => KINDS[p.$kind ?? "primary"]}
  ${(p) => p.$lg && css`padding: 15px 40px; font-size: 17px;`}
  ${(p) => p.$sm && css`padding: 8px 20px; font-size: 13px;`}
`;

/* ---------- intro / rules ---------- */
export const Intro = styled.div`
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

export const IntroTitle = styled.h1`
  font-size: clamp(32px, 5vw, 52px);
  margin-bottom: 10px;
`;

export const IntroSub = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
  margin-bottom: 28px;
`;

export const IntroRules = styled.div`
  text-align: left;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const IntroRule = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  font-size: 14.5px;
  line-height: 1.5;
`;

export const IntroNum = styled.span`
  min-width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${COLORS.primary};
  color: ${COLORS.white};
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

export const RefLabel = styled.span`
  font-family: ${FONTS.display};
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.muted};
  display: block;
  margin-bottom: 10px;
`;

export const RefCards = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

export const RefCard = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: ${RADII.pill};
  border: 1.5px solid ${COLORS.border};
  background: ${COLORS.surface};
  color: ${COLORS.ink};
`;

export const SetupActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;

  ${SgBtn} { width: 100%; }
`;

/* ---------- lobby ---------- */
export const NetError = styled.p`
  color: ${COLORS.kabul};
  font-size: 14px;
  font-family: ${FONTS.display};
  text-align: center;
  margin: 4px 0;
`;

export const Lobby = styled.div`
  max-width: 480px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

export const LobbyTitle = styled.h2`
  font-size: clamp(24px, 4vw, 36px);
`;

export const LobbySub = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
  margin-top: -8px;
`;

export const LobbyCode = styled.div`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: clamp(40px, 8vw, 64px);
  letter-spacing: 0.18em;
  color: ${COLORS.primary};
  background: ${COLORS.surface};
  border: 2px solid ${COLORS.border};
  border-radius: ${RADII.md};
  padding: 18px 36px;
  line-height: 1;
  user-select: all;

  ${MEDIA.sm} { font-size: 40px; padding: 14px 24px; }
`;

export const LobbyHint = styled.p`
  color: ${COLORS.muted};
  font-size: 13px;
  max-width: 300px;
  line-height: 1.55;
  margin-top: -4px;
`;

export const LobbyWait = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${COLORS.muted};
  font-size: 14px;
  font-family: ${FONTS.display};
`;

const spin = keyframes`to { transform: rotate(360deg); }`;

export const Spinner = styled.span`
  display: inline-block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2.5px solid ${COLORS.border};
  border-top-color: ${COLORS.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

/* ---------- join form ---------- */
export const JoinForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
`;

export const CodeInput = styled.input`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: clamp(32px, 6vw, 52px);
  letter-spacing: 0.22em;
  text-align: center;
  width: 220px;
  padding: 14px 20px;
  border: 2px solid ${COLORS.border};
  border-radius: ${RADII.md};
  background: ${COLORS.surface};
  color: ${COLORS.ink};
  outline: none;
  transition: border-color 0.15s;

  &:focus { border-color: ${COLORS.primary}; }
  &::placeholder { color: ${COLORS.border}; letter-spacing: 0.12em; }
  &:disabled { opacity: 0.5; }
`;

/* ============================================================
   TABLE
   ============================================================ */
export const Table = styled.div`
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

export const Note = styled.p`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  color: ${COLORS.muted};
  text-align: center;
  min-height: 20px;
  padding: 0 12px;
  line-height: 1.45;
`;

export const Side = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const SideLabel = styled.div<{ $turn?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${(p) => (p.$turn ? COLORS.primary : COLORS.muted)};
`;

export const TurnDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${COLORS.primary};
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

export const LockedTag = styled.span`
  font-size: 10px;
  letter-spacing: 0.1em;
  color: ${COLORS.white};
  background: ${COLORS.kabul};
  border-radius: ${RADII.pill};
  padding: 2px 9px;
`;

export const HandGrid = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: ${(p) => (p.$wide ? "300px" : "200px")};

  ${MEDIA.sm} {
    max-width: ${(p) => (p.$wide ? "252px" : "170px")};
    gap: 6px;
  }
`;

/* ---------- card slot (face-down) ---------- */
const cardBack = css`
  border: 2px solid ${mix(COLORS.primary, 45, COLORS.border)};
  background: repeating-linear-gradient(
    45deg,
    ${mix(COLORS.primary, 82, "#000")} 0 6px,
    ${mix(COLORS.primary, 65, "#000")} 6px 12px
  );
`;

export const SlotNum = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.28);
  border-radius: ${RADII.pill};
  padding: 2px 9px;
`;

interface SlotProps {
  $clickable?: boolean;
  $selected?: boolean;
  $locked?: boolean;
}

export const Slot = styled.button<SlotProps>`
  width: 64px;
  height: 90px;
  border-radius: 9px;
  position: relative;
  flex: none;
  ${cardBack}
  box-shadow: 0 3px 10px -3px rgba(30, 20, 64, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  transition: transform 0.14s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.14s, border-color 0.14s,
    opacity 0.2s;

  ${(p) => p.$clickable && css`
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px -6px rgba(124, 58, 237, 0.5);
      border-color: ${COLORS.white};
    }
  `}

  ${(p) => p.$selected && css`
    border-color: ${COLORS.white};
    border-width: 3px;
    transform: translateY(-6px) scale(1.05);
    box-shadow: 0 12px 24px -8px rgba(124, 58, 237, 0.6);
  `}

  ${(p) => p.$locked && css`opacity: 0.55; filter: grayscale(0.4);`}

  ${MEDIA.sm} { width: 54px; height: 76px; }
`;

/* ---------- face-up card ---------- */
export const CardRankTl = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
  position: absolute;
  top: 5px;
  left: 7px;

  ${MEDIA.sm} { font-size: 11px; }
`;

export const CardRankBr = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
  position: absolute;
  bottom: 5px;
  right: 7px;
  transform: rotate(180deg);

  ${MEDIA.sm} { font-size: 11px; }
`;

export const CardSuit = styled.span`
  font-size: 10px;
  line-height: 1;
  position: absolute;
  top: 20px;
  left: 8px;
`;

export const CardPip = styled.span`
  font-size: 30px;
  line-height: 1;

  ${MEDIA.sm} { font-size: 24px; }
`;

export const CardValue = styled.span`
  position: absolute;
  bottom: -9px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 11px;
  color: ${COLORS.white};
  background: ${COLORS.ink};
  border-radius: ${RADII.pill};
  padding: 2px 8px;
  white-space: nowrap;
`;

const deal = keyframes`
  from { opacity: 0; transform: translateY(-14px) scale(0.9); }
  to   { opacity: 1; transform: none; }
`;

const TONE = {
  red: COLORS.cardRed,
  black: COLORS.cardBlack,
  joker: COLORS.cardJoker,
};

export const CardBox = styled.div<{ $tone: keyof typeof TONE; $lg?: boolean; $deal?: boolean }>`
  width: 64px;
  height: 90px;
  border-radius: 9px;
  background: ${COLORS.white};
  border: 2px solid ${COLORS.border};
  box-shadow: 0 3px 10px -3px rgba(30, 20, 64, 0.2);
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => TONE[p.$tone]};

  ${MEDIA.sm} { width: 54px; height: 76px; }

  ${(p) => p.$deal && css`animation: ${deal} 0.35s cubic-bezier(0.2, 1.1, 0.4, 1);`}

  ${(p) => p.$lg && css`
    width: 100px;
    height: 140px;
    border-radius: 12px;

    ${CardRankTl} { font-size: 18px; top: 8px; left: 10px; }
    ${CardRankBr} { font-size: 18px; bottom: 8px; right: 10px; }
    ${CardSuit} { font-size: 14px; top: 30px; left: 11px; }
    ${CardPip} { font-size: 52px; }

    ${MEDIA.sm} {
      width: 84px;
      height: 118px;
      ${CardPip} { font-size: 42px; }
    }
  `}
`;

/* ---------- center row: deck / discard / drawn ---------- */
export const CenterRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 22px;
  padding: 10px 0;
  flex-wrap: wrap;

  ${MEDIA.sm} { gap: 14px; }
`;

export const PileWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
`;

export const PileLabel = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${COLORS.muted};
`;

export const PileEmpty = styled.span`
  width: 64px;
  height: 90px;
  border-radius: 9px;
  border: 2px dashed ${COLORS.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.border};
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 11px;
  flex: none;

  ${MEDIA.sm} { width: 54px; height: 76px; }
`;

export const DiscardClick = styled.div`
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.14s, border-color 0.14s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px -6px rgba(124, 58, 237, 0.5);
    border-color: ${COLORS.primary};
  }
`;

/** Wraps the discard pile while a snap window is open. */
export const DiscardHolder = styled.div<{ $snap?: boolean }>`
  ${(p) => p.$snap && css`
    ${CardBox} {
      border-color: ${COLORS.secondary};
      border-width: 3px;
      box-shadow: 0 0 0 5px ${mix(COLORS.secondary, 22)};
    }
  `}
`;

export const DrawnWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
`;

export const DrawnHidden = styled.div`
  width: 64px;
  height: 90px;
  border-radius: 9px;
  flex: none;
  ${cardBack}
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 22px;

  ${MEDIA.sm} { width: 54px; height: 76px; }
`;

/* ---------- action bar ---------- */
export const ActionBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 0;
  min-height: 88px;
  width: 100%;
`;

export const Status = styled.p`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 15px;
  text-align: center;
  line-height: 1.45;
`;

export const SubStatus = styled.p`
  color: ${COLORS.muted};
  font-size: 13.5px;
  text-align: center;
  max-width: 440px;
  line-height: 1.5;
`;

export const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;

export const SnapBar = styled.div`
  width: 200px;
  height: 6px;
  border-radius: 3px;
  background: ${COLORS.border};
  overflow: hidden;
`;

export const SnapFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${COLORS.secondary};
  border-radius: 3px;
  transition: width 1s linear;
`;

/* ---------- overlay (peeks / reveals) ---------- */
const fade = keyframes`from { opacity: 0; } to { opacity: 1; }`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(30, 20, 64, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fade} 0.18s ease;
`;

export const OverlayPanel = styled.div`
  background: ${COLORS.surface};
  border: 2px solid ${COLORS.border};
  border-radius: ${RADII.md};
  padding: 28px 30px;
  max-width: 440px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
  animation: ${deal} 0.3s cubic-bezier(0.2, 1.1, 0.4, 1);
`;

export const OverlayTitle = styled.h3`
  font-size: 19px;
`;

export const OverlayMsg = styled.p`
  color: ${COLORS.muted};
  font-size: 14px;
  line-height: 1.5;
`;

export const PeekCards = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

export const PeekCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

export const PeekCardLabel = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.muted};
  max-width: 110px;
`;

/* ---------- game over ---------- */
export const GameOver = styled.div`
  max-width: 640px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
`;

export const GameOverMsg = styled.h2`
  font-size: clamp(26px, 4.5vw, 42px);
`;

export const GameOverHands = styled.div`
  display: flex;
  flex-direction: column;
  gap: 26px;
  width: 100%;
`;

export const GameOverHand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`;

export const GameOverWho = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const GameOverTotal = styled.span<{ $win?: boolean }>`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 20px;
  color: ${(p) => (p.$win ? COLORS.secondary : COLORS.primary)};
`;

export const WinTag = styled.span`
  font-size: 11px;
  color: ${COLORS.white};
  background: ${COLORS.secondary};
  border-radius: ${RADII.pill};
  padding: 3px 12px;
  letter-spacing: 0.1em;
`;

export const GameOverCards = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  padding-bottom: 6px;
`;
