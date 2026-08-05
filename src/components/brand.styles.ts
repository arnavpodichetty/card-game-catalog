// brand.styles.ts — the logo + wordmark lockup, shared by Nav and Footer.
import styled, { css } from "styled-components";
import { FONTS } from "../styles/tokens";

export const BrandName = styled.span`
  font-family: ${FONTS.display};
  font-weight: 700;
  font-size: 26px;
  letter-spacing: -0.03em;
`;

/** Renders an <a> by default; Footer passes `as="div"` for the static lockup. */
export const Brand = styled.a<{ $sm?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;

  ${(p) => p.$sm && css`
    ${BrandName} { font-size: 18px; }
  `}
`;
