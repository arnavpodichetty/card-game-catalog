// gamePage.styles.ts — the individual game view: hero, room panel, rules, IRL.
import styled, { css } from "styled-components";
import { COLORS, FONTS, LAYOUT, MEDIA, RADII, SHADOWS, mix } from "../styles/tokens";

/* ---------- page shell ---------- */
export const GamePageMain = styled.main`
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  padding: 30px 24px 90px;
  width: 100%;

  ${MEDIA.sm} { padding-left: 16px; padding-right: 16px; }
`;

export const BackLink = styled.a`
  display: inline-flex;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.muted};
  margin-bottom: 24px;
  transition: color 0.14s, transform 0.14s;

  &:hover { color: ${COLORS.ink}; transform: translateX(-3px); }
`;

export const NotFound = styled.div`
  text-align: center;
  padding: 90px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  span { font-size: 60px; }
`;

/* ---------- hero ---------- */
export const Hero = styled.section`
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 42px;
  align-items: start;

  ${MEDIA.lg} { grid-template-columns: 1fr; gap: 28px; }
`;

export const HeroLeft = styled.div`
  min-width: 0;
`;

export const HeroEmoji = styled.span`
  font-size: 58px;
  line-height: 1;
  display: block;
  margin-bottom: 14px;
`;

export const HeroTitle = styled.h1`
  font-size: clamp(38px, 6vw, 60px);
  letter-spacing: -0.04em;
`;

/** The tagline picks up the game's accent color. */
export const HeroTagline = styled.p<{ $color?: string }>`
  margin-top: 10px;
  font-size: 20px;
  font-family: ${FONTS.display};
  font-weight: 600;
  color: ${COLORS.secondary};

  ${(p) => p.$color === "primary" && css`color: ${COLORS.primary};`}
  ${(p) => p.$color === "accent" && css`color: ${mix(COLORS.accent, 72, "#000")};`}
`;

export const HeroTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
`;

export const HeroBlurb = styled.p`
  margin-top: 22px;
  font-size: 17.5px;
  line-height: 1.6;
  color: ${COLORS.ink};
  max-width: 54ch;
  text-wrap: pretty;
`;

/* ---------- room / start panel ---------- */
export const Panel = styled.div`
  position: sticky;
  top: 90px;
  margin-top: 48px;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: ${RADII.lg};
  padding: 26px 24px;
  box-shadow: ${SHADOWS.card};

  ${MEDIA.lg} { position: static; }
`;

export const PanelStart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PanelHeading = styled.h2`
  font-size: 22px;
`;

export const PanelCopy = styled.p`
  color: ${COLORS.muted};
  font-size: 14.5px;
  margin-bottom: 6px;
  line-height: 1.5;
`;

/* ---------- how to play ---------- */
export const HowSection = styled.section`
  margin-top: 64px;
`;

export const HowHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
`;

export const SectionHeading = styled.h2`
  font-size: 30px;
  letter-spacing: -0.03em;
`;

export const RulesTabs = styled.div`
  display: flex;
  gap: 3px;
  background: ${mix(COLORS.ink, 8)};
  border-radius: ${RADII.pill};
  padding: 3px;
`;

export const RulesTab = styled.button<{ $on?: boolean }>`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13px;
  padding: 7px 15px;
  border-radius: ${RADII.pill};
  border: none;
  background: transparent;
  color: ${COLORS.muted};
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  line-height: 1;

  &:hover { color: ${COLORS.ink}; }

  ${(p) => p.$on && css`
    background: ${COLORS.surface};
    color: ${COLORS.ink};
    box-shadow: 0 1px 4px rgba(40, 30, 15, 0.12);
  `}
`;

/* ---------- quick rules accordion ---------- */
export const Acc = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const AccItem = styled.div<{ $open?: boolean }>`
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: ${RADII.md};
  overflow: hidden;
  transition: border-color 0.16s, box-shadow 0.16s;

  ${(p) => p.$open && css`
    border-color: ${mix(COLORS.ink, 22, COLORS.border)};
    box-shadow: ${SHADOWS.card};
  `}
`;

export const AccBody = styled.div<{ $open?: boolean }>`
  display: grid;
  grid-template-rows: ${(p) => (p.$open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.26s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const AccBodyInner = styled.div`
  overflow: hidden;
`;

export const AccRule = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 20px;
  border-top: 1px solid ${COLORS.border};

  &:first-child { border-top: none; }
  ${MEDIA.sm} { gap: 12px; }
`;

export const AccNum = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
  color: ${COLORS.primary};
  background: ${mix(COLORS.primary, 12)};
  width: 34px;
  height: 34px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
`;

export const AccRuleTitle = styled.p`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 15px;
  color: ${COLORS.ink};
  margin: 0 0 4px;
`;

export const AccRuleDesc = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
  line-height: 1.6;
  text-wrap: pretty;
  margin: 0;
`;

/* ---------- IRL mode ---------- */
export const IrlSection = styled.section`
  margin-top: 34px;
`;

export const IrlInner = styled.div`
  background: ${mix(COLORS.secondary, 9, COLORS.surface)};
  border: 1.5px solid ${mix(COLORS.secondary, 22, COLORS.border)};
  border-radius: ${RADII.lg};
  padding: 28px 30px;

  h3 { font-size: 22px; }
  p { color: ${COLORS.muted}; margin-top: 6px; }
`;

export const IrlBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: ${COLORS.white};
  background: ${COLORS.secondary};
  padding: 6px 13px;
  border-radius: ${RADII.pill};
  margin-bottom: 14px;
`;

export const IrlText = styled.p`
  /* Wins over the generic <p> rule in IrlInner. */
  && {
    color: ${COLORS.ink};
    margin-top: 12px;
    font-size: 15.5px;
    line-height: 1.65;
    max-width: 70ch;
  }
`;

/* ---------- detailed rules document ---------- */
export const Dr = styled.div`
  display: flex;
  flex-direction: column;
`;

export const DrSection = styled.div`
  padding: 24px 0;
  border-top: 1.5px solid ${COLORS.border};

  &:first-child { border-top: none; padding-top: 4px; }
`;

export const DrTitle = styled.h3`
  font-size: 18px;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
`;

export const DrParas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const DrP = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
  line-height: 1.65;
  text-wrap: pretty;
`;

export const DrIntro = styled.p`
  color: ${COLORS.muted};
  font-size: 15px;
  line-height: 1.65;
  margin-bottom: 16px;
  text-wrap: pretty;
`;

export const DrGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const DrGroupHead = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

export const DrGroupName = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${COLORS.ink};
`;

export const DrGroupNote = styled.span`
  font-size: 12px;
  color: ${COLORS.muted};
  font-style: italic;
`;

export const DrItemList = styled.div`
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: ${RADII.md};
  overflow: hidden;
`;

export const DrItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px 16px;
  border-bottom: 1px solid ${COLORS.border};

  &:last-child { border-bottom: none; }
`;

export const DrItemName = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13.5px;
  color: ${COLORS.ink};
`;

export const DrItemDesc = styled.p`
  color: ${COLORS.muted};
  font-size: 14.5px;
  line-height: 1.6;
  text-wrap: pretty;
`;
