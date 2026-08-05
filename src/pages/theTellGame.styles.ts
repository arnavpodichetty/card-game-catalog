// theTellGame.styles.ts — The Tell game screen.
//
// `TheTellPage` re-declares the theme custom properties for its subtree, so the
// game keeps its own palette and display font regardless of the catalog theme,
// and nothing it sets leaks back out.
import styled, { css, keyframes } from "styled-components";
import { COLORS, FONTS, MEDIA, RADII, mix } from "../styles/tokens";

export const TheTellPage = styled.div`
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
  --dw: 700;
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
  transition: background 0.3s;
`;

export const Center = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 40px;
`;

/* ---------- topbar ---------- */
export const TopBarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
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

export const RoundInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const RoundNum = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  color: ${COLORS.muted};
  letter-spacing: 0.08em;
`;

export const RoundScores = styled.div`
  display: flex;
  gap: 20px;
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 15px;

  strong { color: ${COLORS.primary}; }
`;

/* ---------- buttons ---------- */
type SgKind = "primary" | "ghost";

export const SgBtn = styled.button<{ $kind?: SgKind; $lg?: boolean }>`
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

  ${(p) => (p.$kind ?? "primary") === "primary" && css`
    background: ${COLORS.primary};
    color: ${COLORS.white};
    box-shadow: 0 4px 0 ${mix(COLORS.primary, 58, "#000")};

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 0 ${mix(COLORS.primary, 58, "#000")};
    }
  `}

  ${(p) => p.$kind === "ghost" && css`
    background: transparent;
    color: ${COLORS.muted};
    border-color: transparent;
    box-shadow: none;

    &:hover:not(:disabled) { color: ${COLORS.ink}; }
  `}

  ${(p) => p.$lg && css`padding: 15px 40px; font-size: 17px;`}
`;

/* ---------- playing card ---------- */
export const Rank = styled.span<{ $pos: "tl" | "br" }>`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 17px;
  line-height: 1;
  position: absolute;

  ${(p) => p.$pos === "tl" && css`top: 7px; left: 9px;`}
  ${(p) => p.$pos === "br" && css`bottom: 7px; right: 9px; transform: rotate(180deg);`}

  ${MEDIA.sm} { font-size: 14px; }
`;

export const Suit = styled.span`
  font-size: 12px;
  line-height: 1;
  position: absolute;
  top: 25px;
  left: 11px;
`;

export const Pip = styled.span`
  font-size: 44px;
  line-height: 1;

  ${MEDIA.sm} { font-size: 36px; }
`;

export const SmallCard = styled.button<{ $red?: boolean; $selected?: boolean }>`
  width: 90px;
  height: 126px;
  border-radius: 10px;
  background: ${COLORS.white};
  border: 2px solid ${COLORS.border};
  box-shadow: 0 4px 12px -4px rgba(30, 20, 64, 0.18);
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${(p) => (p.$red ? COLORS.cardRed : COLORS.cardBlack)};
  transition: transform 0.14s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.14s, border-color 0.14s;

  &:hover:not(:disabled) {
    transform: translateY(-5px);
    box-shadow: 0 10px 22px -6px rgba(30, 20, 64, 0.28);
  }

  ${(p) => p.$selected && css`
    border-color: ${COLORS.primary};
    border-width: 3px;
    transform: translateY(-10px) scale(1.06);
    box-shadow: 0 14px 28px -8px rgba(124, 58, 237, 0.45);

    &:hover:not(:disabled) {
      transform: translateY(-10px) scale(1.06);
      box-shadow: 0 14px 28px -8px rgba(124, 58, 237, 0.45);
    }
  `}

  ${MEDIA.sm} { width: 76px; height: 106px; }
`;

export const Hand = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 28px 0 24px;

  ${MEDIA.sm} { gap: 7px; }
`;

/* ---------- pick screen ---------- */
export const Pick = styled.div`
  max-width: 680px;
  width: 100%;
  text-align: center;
`;

export const PickWho = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${COLORS.primary};
  display: block;
  margin-bottom: 8px;
`;

export const PickLabel = styled.h2`
  font-size: clamp(22px, 3.5vw, 32px);
  margin-bottom: 10px;
`;

export const PickSub = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
`;

export const PickConfirm = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`;

export const PickAnnounce = styled.p`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

/* ---------- color badge ---------- */
export const ColorBadgePill = styled.span<{ $red?: boolean }>`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  padding: 4px 14px;
  border-radius: ${RADII.pill};
  border: 2px solid;

  ${(p) => p.$red
    ? css`
        color: ${COLORS.cardRed};
        border-color: ${COLORS.cardRed};
        background: ${mix(COLORS.cardRed, 10)};
      `
    : css`
        color: ${COLORS.cardBlack};
        border-color: ${COLORS.border};
        background: ${COLORS.surface};
      `}
`;

/* ---------- reveal screen ---------- */
export const Reveal = styled.div`
  max-width: 640px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

export const RevealMsg = styled.div<{ $tone: "win" | "tie" }>`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: clamp(20px, 3.5vw, 30px);
  color: ${(p) => (p.$tone === "win" ? COLORS.secondary : COLORS.muted)};
`;

export const RevealCards = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
`;

export const RevealVs = styled.div`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 20px;
  color: ${COLORS.muted};
`;

export const BigCardWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
`;

export const BigCardLabel = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.muted};
`;

const bigdeal = keyframes`
  from { opacity: 0; transform: translateY(-18px) scale(0.9); }
  to   { opacity: 1; transform: none; }
`;

export const BigCardBox = styled.div<{ $red?: boolean; $winner?: boolean }>`
  width: 126px;
  height: 176px;
  border-radius: 14px;
  background: ${COLORS.white};
  border: 2px solid ${COLORS.border};
  box-shadow: 0 8px 24px -8px rgba(30, 20, 64, 0.22);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${bigdeal} 0.4s cubic-bezier(0.2, 1.1, 0.4, 1);
  color: ${(p) => (p.$red ? COLORS.cardRed : COLORS.cardBlack)};

  ${(p) => p.$winner && css`
    border-color: ${COLORS.secondary};
    border-width: 3px;
    box-shadow: 0 12px 32px -10px ${mix(COLORS.secondary, 50)};
  `}
`;

export const BigRankTl = styled.span`
  position: absolute;
  top: 9px;
  left: 11px;
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 22px;
`;

export const BigSuitTl = styled.span`
  position: absolute;
  top: 33px;
  left: 13px;
  font-size: 17px;
`;

export const BigPip = styled.span`
  font-size: 68px;
  line-height: 1;
`;

export const BigRankBr = styled.span`
  position: absolute;
  bottom: 9px;
  right: 11px;
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 22px;
  transform: rotate(180deg);
`;

export const RevealScores = styled.div`
  display: flex;
  gap: 24px;
`;

export const ScoreBox = styled.div<{ $win?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: 14px;
  padding: 14px 28px;
  min-width: 90px;

  span {
    font-family: ${FONTS.display};
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${COLORS.muted};
  }
  strong {
    font-family: ${FONTS.display};
    font-weight: 700;
    font-size: 36px;
    line-height: 1;
  }

  ${(p) => p.$win && css`
    border-color: ${COLORS.secondary};
    box-shadow: 0 4px 14px -4px ${mix(COLORS.secondary, 30)};

    strong { color: ${COLORS.secondary}; }
  `}
`;

/* ---------- game over ---------- */
export const GameOver = styled.div`
  max-width: 480px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`;

export const GameOverMsg = styled.h2`
  font-size: clamp(28px, 5vw, 46px);
`;

export const GameOverScores = styled.div`
  display: flex;
  gap: 24px;
`;

export const GameOverScore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: 16px;
  padding: 22px 36px;

  span {
    font-family: ${FONTS.display};
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${COLORS.muted};
  }
  strong {
    font-family: ${FONTS.display};
    font-weight: 700;
    font-size: 48px;
    line-height: 1;
    color: ${COLORS.primary};
  }
`;

/* ---------- lobby ---------- */
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

export const NetError = styled.p`
  color: ${COLORS.cardRed};
  font-size: 14px;
  font-family: ${FONTS.display};
  text-align: center;
  margin: 4px 0;
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
