// joinPage.styles.ts — the Jackbox-style room-code entry screen.
import styled, { css, keyframes } from "styled-components";
import { COLORS, FONTS, MEDIA, RADII, SHADOWS, mix } from "../styles/tokens";

const shake = keyframes`
  10%, 90%      { transform: translateX(-2px); }
  20%, 80%      { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60%      { transform: translateX(7px); }
`;

export const JoinMain = styled.main`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  position: relative;
  background: radial-gradient(
    120% 80% at 50% -10%,
    ${mix(COLORS.primary, 14, COLORS.bg)} 0%,
    ${COLORS.bg} 60%
  );
`;

export const JoinHome = styled.a`
  position: absolute;
  top: 26px;
  left: 28px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 17px;
  transition: transform 0.14s;

  &:hover { transform: translateY(-1px); }
`;

export const JoinStage = styled.div`
  width: 100%;
  max-width: 460px;
  text-align: center;
`;

export const JoinCards = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;

  span {
    font-size: 30px;
    width: 50px;
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.surface};
    border: 1.5px solid ${COLORS.border};
    border-radius: ${RADII.sm};
    box-shadow: ${SHADOWS.card};
  }
  span:nth-child(1) { transform: rotate(-9deg); color: ${COLORS.ink}; }
  span:nth-child(2) { transform: rotate(4deg) translateY(-4px); color: ${COLORS.primary}; }
  span:nth-child(3) { transform: rotate(-3deg) translateY(2px); color: ${COLORS.secondary}; }
  span:nth-child(4) { transform: rotate(8deg); color: ${COLORS.accent}; }
`;

export const JoinTitle = styled.h1`
  font-size: clamp(38px, 9vw, 58px);
  letter-spacing: -0.04em;
`;

export const JoinSub = styled.p`
  margin-top: 14px;
  color: ${COLORS.muted};
  font-size: 16.5px;
`;

export const JoinForm = styled.form`
  margin-top: 32px;
`;

/* ---------- the four code cells ---------- */
export const CodeCell = styled.span<{ $filled?: boolean; $active?: boolean }>`
  width: 66px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 44px;
  color: ${COLORS.ink};
  background: ${COLORS.surface};
  border: 2.5px solid ${COLORS.border};
  border-radius: ${RADII.md};
  transition: all 0.16s;

  ${(p) => p.$filled && css`border-color: ${COLORS.ink};`}
  ${(p) => p.$active && css`
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 4px ${mix(COLORS.primary, 18)};
  `}

  ${MEDIA.sm} { width: 58px; height: 74px; font-size: 38px; }
`;

export const CodeBox = styled.div<{ $error?: boolean }>`
  position: relative;
  display: flex;
  gap: 12px;
  justify-content: center;

  ${(p) => p.$error && css`
    animation: ${shake} 0.35s;
    ${CodeCell} { border-color: ${COLORS.primary}; }
  `}

  ${MEDIA.sm} { gap: 9px; }
`;

export const CodeInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: text;
  font-size: 16px;
  letter-spacing: 1em;
`;

export const JoinError = styled.p`
  margin-top: 16px;
  color: ${COLORS.primary};
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
`;

export const JoinGo = styled.button<{ $disabled?: boolean; $busy?: boolean }>`
  margin-top: 26px;
  width: 100%;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 20px;
  cursor: pointer;
  padding: 18px;
  border: none;
  border-radius: ${RADII.md};
  background: ${COLORS.primary};
  color: ${COLORS.primaryInk};
  box-shadow: 0 4px 0 ${mix(COLORS.primary, 62, "#000")};
  transition: transform 0.14s, box-shadow 0.14s, opacity 0.14s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${mix(COLORS.primary, 62, "#000")};
  }
  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  }

  ${(p) => p.$disabled && css`opacity: 0.4; cursor: not-allowed;`}
  ${(p) => p.$busy && css`opacity: 0.75; cursor: wait;`}
`;

export const JoinAlt = styled.p`
  margin-top: 26px;
  color: ${COLORS.muted};
  font-size: 14.5px;

  a {
    color: ${COLORS.primary};
    font-family: ${FONTS.display};
    font-weight: 600;
  }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
`;
