// button.styles.ts — the shared button surface, driven by $kind / $size / $full.
import styled, { css } from "styled-components";
import { COLORS, FONTS, RADII, mix } from "../styles/tokens";

export type BtnKind = "primary" | "secondary" | "join" | "outline" | "ghost";
export type BtnSize = "sm" | "md" | "lg";

const SIZES: Record<BtnSize, ReturnType<typeof css>> = {
  sm: css`padding: 7px 15px; font-size: 13px;`,
  md: css`padding: 10px 19px; font-size: 14.5px;`,
  lg: css`padding: 14px 27px; font-size: 17px;`,
};

/** primary / secondary / join share a hard drop shadow that lifts on hover. */
const raised = (color: string, ink: string, depth: number) => css`
  background: ${color};
  color: ${ink};
  border-color: transparent;
  box-shadow: 0 4px 0 ${mix(color, depth, "#000")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${mix(color, depth, "#000")};
  }
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }
`;

const KINDS: Record<BtnKind, ReturnType<typeof css>> = {
  primary: raised(COLORS.primary, COLORS.primaryInk, 58),
  secondary: raised(COLORS.secondary, COLORS.white, 58),
  join: raised(COLORS.accent, COLORS.accentInk, 52),
  outline: css`
    background: transparent;
    color: ${COLORS.ink};
    border-color: ${COLORS.ink};
    &:hover {
      background: ${COLORS.ink};
      color: ${COLORS.bg};
      transform: translateY(-2px);
    }
  `,
  ghost: css`
    background: ${COLORS.surface};
    color: ${COLORS.ink};
    border-color: ${COLORS.border};
    &:hover {
      border-color: ${COLORS.ink};
      transform: translateY(-2px);
    }
  `,
};

export const StyledBtn = styled.button<{ $kind: BtnKind; $size: BtnSize; $full?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  font-family: ${FONTS.display};
  font-weight: ${FONTS.displayWeight};
  letter-spacing: 0.01em;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: ${RADII.pill};
  white-space: nowrap;
  transition: transform 0.14s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.14s ease,
    background 0.15s ease, color 0.15s ease;

  ${(p) => SIZES[p.$size]}
  ${(p) => KINDS[p.$kind]}
  ${(p) => p.$full && css`width: 100%;`}
`;
