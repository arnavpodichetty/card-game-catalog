// app.styles.ts — the root shell that stacks nav, page and footer.
import styled from "styled-components";
import { BgCards } from "../components/floatingCards.styles";

export const AppShell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  /* Everything except the drifting background sits above it. */
  > *:not(${BgCards}) {
    position: relative;
    z-index: 1;
  }
`;

export const ViewFade = styled.div`
  opacity: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
`;
