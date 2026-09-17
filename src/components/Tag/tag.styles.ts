// tag.styles.ts — the genre / difficulty pill.
import styled, { css } from "styled-components";
import { COLORS, FONTS, RADII, mix } from "../../styles/tokens";
import type { Tone } from "../../types";

const TONES: Record<Tone, ReturnType<typeof css>> = {
  primary: css`
    background: ${mix(COLORS.primary, 16)};
    color: ${mix(COLORS.primary, 72, "#000")};
  `,
  secondary: css`
    background: ${mix(COLORS.secondary, 16)};
    color: ${mix(COLORS.secondary, 78, "#000")};
  `,
  accent: css`
    background: ${mix(COLORS.accent, 26)};
    color: ${COLORS.accentInk};
  `,
  easy: css`background: ${COLORS.tagEasyBg}; color: ${COLORS.tagEasyInk};`,
  medium: css`background: ${COLORS.tagMediumBg}; color: ${COLORS.tagMediumInk};`,
  hard: css`background: ${COLORS.tagHardBg}; color: ${COLORS.tagHardInk};`,
};

export const StyledTag = styled.span<{ $tone?: Tone }>`
  display: inline-flex;
  align-items: center;
  font-family: ${FONTS.display};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 4px 11px;
  border-radius: ${RADII.pill};
  white-space: nowrap;
  background: ${mix(COLORS.ink, 7)};
  color: ${COLORS.ink};

  ${(p) => p.$tone && TONES[p.$tone]}
`;
