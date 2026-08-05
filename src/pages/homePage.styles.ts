// homePage.styles.ts — catalog landing: filter toolbar and the game grid.
import styled, { css } from "styled-components";
import { COLORS, FONTS, LAYOUT, MEDIA, RADII, mix } from "../styles/tokens";

/* ---------- filter toolbar (attached under the nav) ---------- */
export const Filters = styled.section`
  background: ${COLORS.surface};
  border-bottom: 1.5px solid ${COLORS.border};
  position: sticky;
  top: var(--nav-height);
  z-index: 30;
  width: 100%;
`;

export const FiltersInner = styled.div`
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  padding: 13px 24px;
  display: flex;
  align-items: center;
  gap: 10px 18px;
  flex-wrap: wrap;

  ${MEDIA.sm} { padding: 12px 16px; gap: 9px 14px; }
`;

export const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const FilterLabel = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLORS.muted};
  white-space: nowrap;
`;

export const FilterSep = styled.span`
  width: 1.5px;
  align-self: center;
  height: 22px;
  background: ${COLORS.border};
  flex: none;

  ${MEDIA.sm} { display: none; }
`;

export const PillSet = styled.div`
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
`;

export const PillSub = styled.em`
  font-style: normal;
  font-size: 10.5px;
  font-weight: 600;
  color: ${COLORS.muted};
  font-family: ${FONTS.body};
`;

export const Pill = styled.button<{ $on?: boolean; $len?: boolean }>`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  padding: 9px 17px;
  border-radius: ${RADII.pill};
  border: 2px solid ${COLORS.border};
  background: ${COLORS.surface};
  color: ${COLORS.ink};
  transition: all 0.14s ease;
  line-height: 1;

  &:hover { border-color: ${COLORS.ink}; transform: translateY(-1px); }

  ${(p) => p.$len && css`
    display: inline-flex;
    flex-direction: row;
    align-items: baseline;
    gap: 6px;
    padding: 7px 14px;
  `}

  ${(p) => p.$on && css`
    background: ${COLORS.ink};
    border-color: ${COLORS.ink};
    color: ${COLORS.bg};
    padding: 9px 17px;
    box-shadow: 0 2px 10px ${mix(COLORS.ink, 28)};

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px ${mix(COLORS.ink, 30)};
    }
    ${PillSub} { color: ${mix(COLORS.bg, p.$len ? 70 : 75)}; }
  `}
`;

/* ---------- search + result count row ---------- */
export const FiltersMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 24px 10px;
  border-top: 1.5px solid ${COLORS.border};
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  width: 100%;
`;

export const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 320px;
  min-width: 140px;
`;

export const SearchIcon = styled.svg`
  position: absolute;
  left: 11px;
  color: ${COLORS.muted};
  pointer-events: none;
  flex-shrink: 0;
`;

export const SearchInput = styled.input`
  width: 100%;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13px;
  padding: 6px 32px 6px 32px;
  border-radius: ${RADII.pill};
  border: 1.5px solid ${COLORS.border};
  background: ${COLORS.bg};
  color: ${COLORS.ink};
  outline: none;
  transition: border-color 0.14s ease;

  &::placeholder { color: ${COLORS.muted}; font-weight: 500; }
  &:focus { border-color: ${COLORS.ink}; }
  &::-webkit-search-cancel-button { display: none; }
`;

export const SearchClear = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${COLORS.muted};
  font-size: 12px;
  padding: 2px;
  line-height: 1;
  transition: color 0.14s;

  &:hover { color: ${COLORS.ink}; }
`;

export const FiltersMetaRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

export const FiltersCount = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13px;
  color: ${COLORS.muted};
  white-space: nowrap;
`;

export const FiltersClear = styled.button`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  background: none;
  border: none;
  color: ${COLORS.primary};
  padding: 4px;
  transition: opacity 0.14s;

  &:hover { opacity: 0.65; }
`;

/* ---------- catalog + grid ---------- */
export const Home = styled.main`
  width: 100%;
`;

export const Catalog = styled.div`
  max-width: ${LAYOUT.maxWidth};
  margin: 0 auto;
  padding: 34px 24px 80px;
  width: 100%;

  ${MEDIA.sm} { padding-left: 16px; padding-right: 16px; }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-top: 30px;

  ${MEDIA.lg} { grid-template-columns: repeat(2, 1fr); }
  ${MEDIA.sm} { grid-template-columns: 1fr; }
`;

/* ---------- game card ---------- */
export const CardArtWrap = styled.div`
  position: relative;
  height: 134px;
  border-bottom: 1.5px solid ${COLORS.border};
  overflow: hidden;

  svg {
    display: block;
    width: 100%;
    height: 100%;
    transform-origin: center;
    transition: transform 0.35s ease;
  }
`;

export const Card = styled.article`
  position: relative;
  background: ${COLORS.surface};
  border: 1.5px solid ${COLORS.border};
  border-radius: ${RADII.lg};
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 14px ${mix(COLORS.primary, 12, "rgba(0,0,0,.06)")};
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.3, 1.2, 0.5, 1), box-shadow 0.18s, border-color 0.18s;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 14px 38px -4px ${mix(COLORS.primary, 26, "rgba(0,0,0,.13)")};
    border-color: ${mix(COLORS.primary, 35, COLORS.border)};

    ${CardArtWrap} svg { transform: scale(1.05); }
  }
`;

export const CardPlayers = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 11px;
  color: ${COLORS.ink};
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 4px 9px;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
`;

export const CardBody = styled.div`
  padding: 18px 20px 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const CardTitle = styled.h3`
  font-size: 24px;
  letter-spacing: -0.02em;
`;

export const CardDesc = styled.p`
  margin-top: 8px;
  color: ${COLORS.muted};
  font-size: 15px;
  line-height: 1.5;
  flex: 1;
  text-wrap: pretty;
`;

export const CardTags = styled.div`
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

/* ---------- empty state ---------- */
export const Empty = styled.div`
  text-align: center;
  padding: 70px 20px;

  h3 { font-size: 24px; }
  p { color: ${COLORS.muted}; margin-top: 8px; }
`;

export const EmptyFace = styled.span`
  font-size: 54px;
  display: block;
  margin-bottom: 14px;
`;
