// roomPanel.styles.ts — the host's "room is live" panel.
import styled, { keyframes } from "styled-components";
import { COLORS, FONTS, MEDIA, RADII, mix } from "../styles/tokens";

export const pop = keyframes`
  from { transform: translateY(-6px) scale(0.99); }
  to   { transform: none; }
`;

export const Room = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  animation: ${pop} 0.22s ease both;
`;

export const RoomLabel = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${COLORS.muted};
`;

export const RoomCodeRow = styled.div`
  display: flex;
  gap: 9px;
`;

export const RoomChar = styled.span`
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 38px;
  width: 56px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${RADII.sm};
  background: ${mix(COLORS.primary, 12)};
  color: ${COLORS.primary};
  border: 2px solid ${mix(COLORS.primary, 35)};

  ${MEDIA.sm} { width: 48px; height: 56px; font-size: 30px; }
`;

export const RoomActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 4px;
`;

export const RoomNew = styled.button`
  background: none;
  border: none;
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 13px;
  color: ${COLORS.muted};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover { color: ${COLORS.ink}; }
`;

export const RoomHint = styled.span`
  font-size: 13px;
  color: ${COLORS.muted};
  line-height: 1.5;

  b { color: ${COLORS.ink}; }
`;

export const RoomJoined = styled.span`
  font-size: 13px;
  font-family: ${FONTS.display};
  font-weight: 600;
  color: ${COLORS.muted};
  margin-top: 4px;

  b { color: ${COLORS.ink}; }
`;

export const RoomLaunch = styled.a`
  display: block;
  padding: 11px 20px;
  width: 100%;
  background: ${COLORS.primary};
  color: ${COLORS.primaryInk};
  font-family: ${FONTS.display};
  font-weight: 600;
  font-size: 14px;
  border-radius: ${RADII.pill};
  text-decoration: none;
  text-align: center;

  &:hover { opacity: 0.88; }
`;
