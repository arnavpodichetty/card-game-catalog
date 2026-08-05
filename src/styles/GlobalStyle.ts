// GlobalStyle.ts — the only styles that can't be a component: element resets,
// the document background, and the :root custom-property defaults.
//
// The :root block is just a fallback — `applyTheme` overwrites most of these on
// mount. The few it never touches (--maxw, --shadow-card, --c-hard) are the
// real definitions and live here.
import { createGlobalStyle } from "styled-components";
import { COLORS, FONTS, LAYOUT, MEDIA } from "./tokens";

export const GlobalStyle = createGlobalStyle`
  :root {
    --c-bg:#F7F5FF; --c-surface:#FFFFFF; --c-ink:#1E1440; --c-muted:#7068A0;
    --c-border:#DDD7F5; --c-primary:#7C3AED; --c-secondary:#059669; --c-accent:#2D7CF6;
    --c-primary-ink:#FFFFFF; --c-accent-ink:#FFFFFF;
    --font-display:'Space Mono', monospace; --font-body:'Space Grotesk', sans-serif;
    --dw:700; --ls-display:-0.01em;
    --radius:18px; --radius-sm:10px; --radius-lg:27px; --radius-pill:999px;
    --maxw:${LAYOUT.maxWidth};
    --shadow-card:0 1px 2px rgba(40,30,15,.05), 0 10px 30px -14px rgba(40,30,15,.18);
    --c-hard:${COLORS.hard};
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }

  body {
    margin: 0;
    background-color: ${COLORS.bg};
    background-image: radial-gradient(circle, rgba(212,207,196,.4) 1px, transparent 1px);
    background-size: 24px 24px;
    color: ${COLORS.ink};
    font-family: ${FONTS.body};
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3 {
    margin: 0;
    font-family: ${FONTS.display};
    font-weight: ${FONTS.displayWeight};
    letter-spacing: ${FONTS.displayTracking};
    line-height: 1.05;
  }
  p { margin: 0; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }

  ::selection { background: ${COLORS.accent}; color: ${COLORS.accentInk}; }

  ${MEDIA.reducedMotion} {
    * { animation: none !important; transition: none !important; }
  }
`;
