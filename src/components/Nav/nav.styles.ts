// nav.styles.ts — the sticky top navigation bar.
import styled from "styled-components";
import { COLORS, FONTS, LAYOUT, MEDIA, mix } from "../../styles/tokens";

export const NavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  background: ${mix(COLORS.bg, 86)};
  backdrop-filter: blur(10px);
  border-bottom: 1.5px solid ${COLORS.border};
  --nav-height: ${LAYOUT.navHeight};
`;

export const NavInner = styled.div`
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--nav-height);

  ${MEDIA.sm} { padding: 12px 16px; }
`;

export const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 18px;
`;

export const NavLink = styled.a`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.muted};
  transition: color 0.15s;

  &:hover { color: ${COLORS.ink}; }
`;
