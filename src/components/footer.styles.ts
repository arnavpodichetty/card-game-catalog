// footer.styles.ts — site footer and its animated card fan.
import styled from "styled-components";
import { COLORS, FONTS, LAYOUT } from "../styles/tokens";

export const FooterBar = styled.footer`
  margin-top: auto;
  border-top: 1.5px solid ${COLORS.border};
  background: ${COLORS.surface};
`;

export const FooterInner = styled.div`
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  padding: 34px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;

  p { color: ${COLORS.muted}; font-size: 15px; }
`;

export const FooterWink = styled.span`
  font-family: ${FONTS.display};
  font-size: 12.5px;
  color: ${COLORS.muted};
  opacity: 0.8;
  margin-top: 4px;
`;

export const FooterFan = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 0 10px;
  pointer-events: none;
  overflow: hidden;
  height: 160px;

  svg { width: 240px; height: auto; opacity: 0.7; }
`;
