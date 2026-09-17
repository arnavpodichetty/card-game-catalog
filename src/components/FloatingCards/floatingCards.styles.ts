// floatingCards.styles.ts — the decorative cards drifting down the background.
import styled, { css, keyframes } from "styled-components";
import { COLORS, FONTS, RADII } from "../../styles/tokens";

// The rotation stays a custom property because the keyframes need it mid-track.
const fall = keyframes`
  0%   { transform: translateY(-130px) rotate(var(--rot, 0deg)); opacity: 0; }
  7%   { opacity: 0.13; }
  88%  { opacity: 0.13; }
  100% { transform: translateY(110vh) rotate(var(--rot, 0deg)); opacity: 0; }
`;

export const BgCards = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

export const BgCardRank = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 15px;
  line-height: 1;
  color: ${COLORS.ink};
`;

export const BgCardSuit = styled.span`
  font-size: 18px;
  line-height: 1;
  color: ${COLORS.ink};
`;

interface BgCardProps {
  $x: number;
  $rot: number;
  $dur: number;
  $delay: number;
  $red: boolean;
}

export const BgCard = styled.div<BgCardProps>`
  position: absolute;
  top: -130px;
  left: ${(p) => p.$x}%;
  --rot: ${(p) => p.$rot}deg;
  width: 54px;
  height: 74px;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: ${RADII.sm};
  box-shadow: 0 2px 8px rgba(40, 30, 15, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  opacity: 0;
  animation: ${fall} ${(p) => p.$dur}s ${(p) => p.$delay}s linear infinite;

  ${(p) => p.$red && css`
    ${BgCardRank}, ${BgCardSuit} { color: ${COLORS.primary}; }
  `}
`;
