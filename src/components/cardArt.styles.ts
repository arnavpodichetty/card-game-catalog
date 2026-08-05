// cardArt.styles.ts — the gently bobbing hero fan.
import styled, { keyframes } from "styled-components";

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
`;

export const HeroFanSvg = styled.svg`
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  transform-origin: center;
  animation: ${bob} 5s ease-in-out infinite;
`;
