// cairoGame.styles.ts — Cairo game-screen styles as a TS module.
// Importing this file injects the stylesheet once (side effect), mirroring the
// old `import "./cairoGame.css"` while being a resolvable TS module.
// Scoped to `.cairo-page` so the game's theme vars and resets stay inside the
// game route and don't leak into the rest of the app.

export const cairoGameCss = `
/* ---------- theme + reset (scoped) ---------- */
.cairo-page {
  --c-bg:#F7F5FF; --c-surface:#FFFFFF; --c-ink:#1E1440; --c-muted:#7068A0;
  --c-border:#DDD7F5; --c-primary:#7C3AED; --c-secondary:#059669; --c-accent:#2D7CF6;
  --c-primary-ink:#FFFFFF;
  --font-display:'Space Mono', monospace; --font-body:'Space Grotesk', sans-serif;
  --radius:18px; --radius-pill:999px;
  --card-red:#e11d48;
  --card-black:#1E1440;
  --card-joker:#7C3AED;
  --kabul:#e11d48;

  min-height:100vh;
  background-color:var(--c-bg);
  background-image:radial-gradient(circle, rgba(124,58,237,.10) 1px, transparent 1px);
  background-size:24px 24px;
  color:var(--c-ink);font-family:var(--font-body);
  font-size:16px;-webkit-font-smoothing:antialiased;
}
.cairo-page *{box-sizing:border-box;}
.cairo-page h1,.cairo-page h2,.cairo-page h3{margin:0;font-family:var(--font-display);font-weight:700;letter-spacing:-0.02em;line-height:1.05;}
.cairo-page p{margin:0;}
.cairo-page a{color:inherit;text-decoration:none;}
.cairo-page button{font-family:inherit;cursor:pointer;}

/* ---------- shell ---------- */
.sg-shell{min-height:100vh;display:flex;flex-direction:column;}

/* ---------- topbar ---------- */
.sg-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:14px 24px;flex-shrink:0;}
.sg-back{font-family:var(--font-display);font-weight:700;font-size:13px;
  color:var(--c-muted);transition:color .15s;}
.sg-back:hover{color:var(--c-ink);}
.sg-game-title{font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:-0.02em;}
.sg-topbar__right{min-width:80px;display:flex;justify-content:flex-end;}
.kb-kabul-pill{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:.08em;
  color:#fff;background:var(--kabul);border-radius:var(--radius-pill);padding:5px 14px;
  animation:kb-pulse 1.2s ease-in-out infinite;}
@keyframes kb-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.07);}}

/* ---------- center wrapper ---------- */
.sg-center{flex:1;display:flex;align-items:center;justify-content:center;padding:12px 16px 32px;}

/* ---------- buttons ---------- */
.sg-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;
  font-family:var(--font-display);font-weight:700;
  border:2px solid transparent;border-radius:var(--radius-pill);white-space:nowrap;
  padding:12px 28px;font-size:15px;
  transition:transform .14s cubic-bezier(.3,1.4,.5,1), box-shadow .14s ease, opacity .15s ease;}
.sg-btn--primary{background:var(--c-primary);color:#fff;
  box-shadow:0 4px 0 color-mix(in srgb,var(--c-primary) 58%,#000);}
.sg-btn--primary:hover:not(:disabled){transform:translateY(-2px);
  box-shadow:0 6px 0 color-mix(in srgb,var(--c-primary) 58%,#000);}
.sg-btn--kabul{background:var(--kabul);color:#fff;
  box-shadow:0 4px 0 color-mix(in srgb,var(--kabul) 58%,#000);}
.sg-btn--kabul:hover:not(:disabled){transform:translateY(-2px);
  box-shadow:0 6px 0 color-mix(in srgb,var(--kabul) 58%,#000);}
.sg-btn--secondary{background:transparent;color:var(--c-primary);border-color:var(--c-primary);}
.sg-btn--secondary:hover:not(:disabled){background:color-mix(in srgb,var(--c-primary) 8%,transparent);}
.sg-btn--ghost{background:transparent;color:var(--c-muted);border-color:transparent;box-shadow:none;}
.sg-btn--ghost:hover:not(:disabled){color:var(--c-ink);}
.sg-btn--lg{padding:15px 40px;font-size:17px;}
.sg-btn--sm{padding:8px 20px;font-size:13px;}
.sg-btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25);}
.sg-btn:disabled{opacity:.35;cursor:not-allowed;}

/* ---------- intro / rules ---------- */
.sg-intro{max-width:600px;width:100%;text-align:center;}
.sg-intro__title{font-size:clamp(32px,5vw,52px);margin-bottom:10px;}
.sg-intro__sub{color:var(--c-muted);font-size:15px;margin-bottom:28px;}
.sg-intro__rules{text-align:left;background:var(--c-surface);border:1.5px solid var(--c-border);
  border-radius:16px;padding:20px 22px;margin-bottom:24px;display:flex;flex-direction:column;gap:12px;}
.sg-intro__rule{display:flex;gap:14px;align-items:flex-start;font-size:14.5px;line-height:1.5;}
.sg-intro__n{min-width:26px;height:26px;border-radius:50%;background:var(--c-primary);color:#fff;
  font-family:var(--font-display);font-weight:700;font-size:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.sg-ref-label{font-family:var(--font-display);font-size:12px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--c-muted);display:block;margin-bottom:10px;}
.sg-ref-cards{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:24px;}
.sg-ref-card{font-family:var(--font-display);font-weight:700;font-size:13px;
  padding:5px 12px;border-radius:var(--radius-pill);border:1.5px solid var(--c-border);
  background:var(--c-surface);color:var(--c-ink);}
.sg-setup-actions{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:320px;margin:0 auto;}
.sg-setup-actions .sg-btn{width:100%;}

/* ---------- error text ---------- */
.sg-net-error{color:#e11d48;font-size:14px;font-family:var(--font-display);text-align:center;margin:4px 0;}

/* ---------- lobby ---------- */
.sg-lobby{max-width:480px;width:100%;text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:20px;}
.sg-lobby__title{font-size:clamp(24px,4vw,36px);}
.sg-lobby__sub{color:var(--c-muted);font-size:15px;margin-top:-8px;}
.sg-lobby__code{font-family:var(--font-display);font-weight:700;
  font-size:clamp(40px,8vw,64px);letter-spacing:0.18em;color:var(--c-primary);
  background:var(--c-surface);border:2px solid var(--c-border);
  border-radius:var(--radius);padding:18px 36px;line-height:1;user-select:all;}
.sg-lobby__hint{color:var(--c-muted);font-size:13px;max-width:300px;line-height:1.55;margin-top:-4px;}
.sg-lobby__wait{display:flex;align-items:center;gap:10px;
  color:var(--c-muted);font-size:14px;font-family:var(--font-display);}

/* ---------- spinner ---------- */
@keyframes sg-spin{to{transform:rotate(360deg);}}
.sg-spinner{display:inline-block;width:18px;height:18px;flex-shrink:0;
  border:2.5px solid var(--c-border);border-top-color:var(--c-primary);
  border-radius:50%;animation:sg-spin .8s linear infinite;}

/* ---------- join form ---------- */
.sg-join-form{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;}
.sg-code-input{font-family:var(--font-display);font-weight:700;
  font-size:clamp(32px,6vw,52px);letter-spacing:0.22em;text-align:center;
  width:220px;padding:14px 20px;border:2px solid var(--c-border);border-radius:var(--radius);
  background:var(--c-surface);color:var(--c-ink);outline:none;transition:border-color .15s;}
.sg-code-input:focus{border-color:var(--c-primary);}
.sg-code-input::placeholder{color:var(--c-border);letter-spacing:0.12em;}
.sg-code-input:disabled{opacity:.5;}

/* ============================================================
   TABLE
   ============================================================ */
.kb-table{width:100%;max-width:820px;display:flex;flex-direction:column;align-items:center;gap:10px;}

/* note ticker */
.kb-note{font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--c-muted);
  text-align:center;min-height:20px;padding:0 12px;line-height:1.45;}

/* a "side" = one player's area */
.kb-side{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}
.kb-side__label{display:flex;align-items:center;gap:10px;
  font-family:var(--font-display);font-weight:700;font-size:12px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--c-muted);}
.kb-side__label--turn{color:var(--c-primary);}
.kb-turn-dot{width:8px;height:8px;border-radius:50%;background:var(--c-primary);
  animation:kb-pulse 1.2s ease-in-out infinite;}
.kb-locked-tag{font-size:10px;letter-spacing:.1em;color:#fff;background:var(--kabul);
  border-radius:var(--radius-pill);padding:2px 9px;}

/* player grid — 2 columns by default, wraps for penalty cards */
.kb-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:200px;}
.kb-grid--wide{max-width:300px;}   /* > 4 cards */
.kb-grid--reveal{max-width:none;}

/* ---------- card slot (face-down) ---------- */
.kb-slot{width:64px;height:90px;border-radius:9px;position:relative;flex:none;
  border:2px solid color-mix(in srgb,var(--c-primary) 45%,var(--c-border));
  background:
    repeating-linear-gradient(45deg,
      color-mix(in srgb,var(--c-primary) 82%,#000) 0 6px,
      color-mix(in srgb,var(--c-primary) 65%,#000) 6px 12px);
  box-shadow:0 3px 10px -3px rgba(30,20,64,.25);
  display:flex;align-items:center;justify-content:center;
  padding:0;transition:transform .14s cubic-bezier(.3,1.4,.5,1), box-shadow .14s, border-color .14s, opacity .2s;}
.kb-slot__num{font-family:var(--font-display);font-weight:700;font-size:13px;color:rgba(255,255,255,.9);
  background:rgba(0,0,0,.28);border-radius:var(--radius-pill);padding:2px 9px;}
.kb-slot--clickable{cursor:pointer;}
.kb-slot--clickable:hover{transform:translateY(-4px);
  box-shadow:0 10px 20px -6px rgba(124,58,237,.5);border-color:#fff;}
.kb-slot--selected{border-color:#fff;border-width:3px;
  transform:translateY(-6px) scale(1.05);
  box-shadow:0 12px 24px -8px rgba(124,58,237,.6);}
.kb-slot--inert{cursor:default;}
.kb-slot--locked{opacity:.55;filter:grayscale(.4);}
.kb-slot--peeked::after{content:'👁';position:absolute;top:-7px;right:-7px;font-size:13px;
  background:var(--c-surface);border:1.5px solid var(--c-border);border-radius:50%;
  width:22px;height:22px;display:flex;align-items:center;justify-content:center;}

/* ---------- face-up card ---------- */
.kb-card{width:64px;height:90px;border-radius:9px;background:#fff;
  border:2px solid var(--c-border);box-shadow:0 3px 10px -3px rgba(30,20,64,.2);
  position:relative;flex:none;display:flex;align-items:center;justify-content:center;}
.kb-card--red{color:var(--card-red);}
.kb-card--black{color:var(--card-black);}
.kb-card--joker{color:var(--card-joker);}
.kb-card--lg{width:100px;height:140px;border-radius:12px;}
.kb-card--deal{animation:kb-deal .35s cubic-bezier(.2,1.1,.4,1);}
@keyframes kb-deal{from{opacity:0;transform:translateY(-14px) scale(.9);}to{opacity:1;transform:none;}}
.kb-card__rank{font-family:var(--font-display);font-weight:700;font-size:13px;line-height:1;position:absolute;top:5px;left:7px;}
.kb-card__rank--br{top:auto;left:auto;bottom:5px;right:7px;transform:rotate(180deg);}
.kb-card__suit{font-size:10px;line-height:1;position:absolute;top:20px;left:8px;}
.kb-card__pip{font-size:30px;line-height:1;}
.kb-card--lg .kb-card__rank{font-size:18px;top:8px;left:10px;}
.kb-card--lg .kb-card__rank--br{top:auto;left:auto;bottom:8px;right:10px;}
.kb-card--lg .kb-card__suit{font-size:14px;top:30px;left:11px;}
.kb-card--lg .kb-card__pip{font-size:52px;}
.kb-card__value{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);
  font-family:var(--font-display);font-weight:700;font-size:11px;color:#fff;
  background:var(--c-ink);border-radius:var(--radius-pill);padding:2px 8px;white-space:nowrap;}

/* ---------- center row: deck / discard / drawn ---------- */
.kb-centerrow{display:flex;align-items:flex-start;justify-content:center;gap:22px;
  padding:10px 0;flex-wrap:wrap;}
.kb-pilewrap{display:flex;flex-direction:column;align-items:center;gap:7px;}
.kb-pile-label{font-family:var(--font-display);font-weight:700;font-size:10px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--c-muted);}
.kb-deck{cursor:default;}
.kb-deck--clickable{cursor:pointer;}
.kb-deck--clickable:hover{transform:translateY(-4px);box-shadow:0 10px 20px -6px rgba(124,58,237,.5);border-color:#fff;}
.kb-pile-empty{width:64px;height:90px;border-radius:9px;border:2px dashed var(--c-border);
  display:flex;align-items:center;justify-content:center;color:var(--c-border);
  font-family:var(--font-display);font-weight:700;font-size:11px;flex:none;}
.kb-discard-click{cursor:pointer;transition:transform .14s cubic-bezier(.3,1.4,.5,1), box-shadow .14s, border-color .14s;}
.kb-discard-click:hover{transform:translateY(-4px);
  box-shadow:0 10px 20px -6px rgba(124,58,237,.5);border-color:var(--c-primary);}
.kb-discard--snap .kb-card{border-color:var(--c-secondary);border-width:3px;
  box-shadow:0 0 0 5px color-mix(in srgb,var(--c-secondary) 22%,transparent);}
.kb-drawnwrap{display:flex;flex-direction:column;align-items:center;gap:7px;}
.kb-drawn-hidden{width:64px;height:90px;border-radius:9px;flex:none;
  border:2px solid color-mix(in srgb,var(--c-primary) 45%,var(--c-border));
  background:repeating-linear-gradient(45deg,
    color-mix(in srgb,var(--c-primary) 82%,#000) 0 6px,
    color-mix(in srgb,var(--c-primary) 65%,#000) 6px 12px);
  display:flex;align-items:center;justify-content:center;
  color:rgba(255,255,255,.85);font-family:var(--font-display);font-weight:700;font-size:22px;}

/* ---------- action bar ---------- */
.kb-actionbar{display:flex;flex-direction:column;align-items:center;gap:12px;
  padding:6px 12px 0;min-height:88px;width:100%;}
.kb-status{font-family:var(--font-display);font-weight:700;font-size:15px;text-align:center;line-height:1.45;}
.kb-substatus{color:var(--c-muted);font-size:13.5px;text-align:center;max-width:440px;line-height:1.5;}
.kb-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}

/* snap countdown bar */
.kb-snapbar{width:200px;height:6px;border-radius:3px;background:var(--c-border);overflow:hidden;}
.kb-snapbar__fill{height:100%;background:var(--c-secondary);border-radius:3px;
  transition:width 1s linear;}

/* color badge (effects / announcements) */
.sg-cbadge{font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:.04em;
  padding:3px 12px;border-radius:var(--radius-pill);border:2px solid;}
.sg-cbadge--effect{color:var(--c-primary);border-color:var(--c-primary);
  background:color-mix(in srgb,var(--c-primary) 8%,transparent);}

/* ---------- overlay (peeks / reveals) ---------- */
.kb-overlay{position:fixed;inset:0;z-index:50;background:rgba(30,20,64,.55);
  display:flex;align-items:center;justify-content:center;padding:20px;
  animation:kb-fade .18s ease;}
@keyframes kb-fade{from{opacity:0;}to{opacity:1;}}
.kb-overlay__panel{background:var(--c-surface);border:2px solid var(--c-border);
  border-radius:var(--radius);padding:28px 30px;max-width:440px;width:100%;
  display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;
  animation:kb-deal .3s cubic-bezier(.2,1.1,.4,1);}
.kb-overlay__title{font-size:19px;}
.kb-overlay__msg{color:var(--c-muted);font-size:14px;line-height:1.5;}
.kb-peekcards{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;}
.kb-peekcard{display:flex;flex-direction:column;align-items:center;gap:10px;}
.kb-peekcard__label{font-family:var(--font-display);font-weight:700;font-size:11px;
  letter-spacing:.1em;text-transform:uppercase;color:var(--c-muted);max-width:110px;}

/* ---------- game over ---------- */
.kb-gameover{max-width:640px;width:100%;text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:26px;}
.kb-gameover__msg{font-size:clamp(26px,4.5vw,42px);}
.kb-gameover__hands{display:flex;flex-direction:column;gap:26px;width:100%;}
.kb-gameover__hand{display:flex;flex-direction:column;align-items:center;gap:14px;}
.kb-gameover__who{display:flex;align-items:center;gap:12px;
  font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.1em;text-transform:uppercase;}
.kb-gameover__total{font-family:var(--font-display);font-weight:700;font-size:20px;color:var(--c-primary);}
.kb-gameover__total--win{color:var(--c-secondary);}
.kb-win-tag{font-size:11px;color:#fff;background:var(--c-secondary);
  border-radius:var(--radius-pill);padding:3px 12px;letter-spacing:.1em;}
.kb-gameover__cards{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding-bottom:6px;}

@media(max-width:560px){
  .kb-slot,.kb-card,.kb-drawn-hidden,.kb-pile-empty{width:54px;height:76px;}
  .kb-card__pip{font-size:24px;}
  .kb-card__rank{font-size:11px;}
  .kb-grid{max-width:170px;gap:6px;}
  .kb-grid--wide{max-width:252px;}
  .kb-centerrow{gap:14px;}
  .kb-card--lg{width:84px;height:118px;}
  .kb-card--lg .kb-card__pip{font-size:42px;}
  .sg-lobby__code{font-size:40px;padding:14px 24px;}
}
`;

// Inject once. Guarded by an id so hot-reloads / remounts don't duplicate it.
if (typeof document !== "undefined" && !document.getElementById("cairo-game-styles")) {
  const style = document.createElement("style");
  style.id = "cairo-game-styles";
  style.textContent = cairoGameCss;
  document.head.appendChild(style);
}
