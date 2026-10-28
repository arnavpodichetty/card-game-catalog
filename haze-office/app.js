// app.js — Haze Office: a daily movie-poster guessing game.
(function () {
  "use strict";

  const CFG = window.HAZE_CONFIG || {};
  const MAX = CFG.maxGuesses || 6;
  const MOVIES = window.MOVIES;
  const N = MOVIES.length;

  // Blur strength as a % of the poster's width (applied via CSS container units).
  const FOCUS_BLUR = [7.5, 5.2, 3.6, 2.4, 1.5, 0.8];
  const VARIANT_BLUR = [3.4, 2.5, 1.8, 1.2, 0.8, 0.5]; // index = misses beyond the last alternate poster
  const TEASER_BLUR = 9; // unplayed posters on the home page and in the archive

  const MODES = {
    focus: {
      name: "Focus",
      line: "One poster, heavily blurred. Every miss brings it a little more into focus.",
      help: "One poster, heavily blurred. Every wrong guess or skip sharpens it a little.",
    },
    variants: {
      name: "Variants",
      line: "The blur never lifts. Every miss shows you another poster for the same film.",
      help: "The blur stays fixed. Each wrong guess or skip unlocks another poster for the same film, and you can flip back through them.",
    },
  };
  const OTHER = { focus: "variants", variants: "focus" };

  // ---------- dates ----------
  const DAY_MS = 86400000;
  const [ly, lm, ld] = (CFG.launchDate || "2026-10-01").split("-").map(Number);
  const LAUNCH_UTC = Date.UTC(ly, lm - 1, ld);
  const localUTC = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const todayNum = () => Math.floor((localUTC(new Date()) - LAUNCH_UTC) / DAY_MS) + 1; // puzzle #1 = launch day
  const dateOf = (num) => new Date(LAUNCH_UTC + (num - 1) * DAY_MS);
  const fmt = (num, opts) => dateOf(num).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  const longDate = (num) => fmt(num, { weekday: "long", month: "long", day: "numeric" });
  const shortDate = (num) => fmt(num, { month: "short", day: "numeric" });

  // Each mode walks the list on its own track, offset by half so they never share a film on the same day.
  function movieFor(mode, num) {
    const i = (num - 1) + (mode === "variants" ? Math.floor(N / 2) : 0);
    return MOVIES[((i % N) + N) % N];
  }

  // ---------- titles & matching ----------
  const norm = (s) => s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^(the|a|an) /, "")
    .trim();
  const movieId = (m) => m.t + "|" + m.y;
  const byId = new Map(MOVIES.map((m) => [movieId(m), m]));
  const SEARCH = MOVIES.map((m) => ({ m, keys: [m.t, ...(m.a || [])].map(norm) }))
    .sort((a, b) => a.m.t.localeCompare(b.m.t) || a.m.y - b.m.y);

  function isCorrect(guess, answer) {
    if (!guess) return false;
    // Same title counts (e.g. the 1994 and 2019 "The Lion King").
    const gk = [guess.t, ...(guess.a || [])].map(norm);
    const ak = [answer.t, ...(answer.a || [])].map(norm);
    return movieId(guess) === movieId(answer) || gk.some((k) => ak.includes(k));
  }

  function suggest(q, exclude) {
    const nq = norm(q);
    if (!nq) return [];
    const starts = [], contains = [];
    for (const row of SEARCH) {
      if (exclude.has(movieId(row.m))) continue;
      if (row.keys.some((k) => k.startsWith(nq) || k.includes(" " + nq))) starts.push(row.m);
      else if (row.keys.some((k) => k.includes(nq))) contains.push(row.m);
    }
    return starts.concat(contains).slice(0, 8);
  }

  function exactMatch(text) {
    const nt = norm(text.replace(/\(\d{4}\)\s*$/, ""));
    const yr = (text.match(/\((\d{4})\)\s*$/) || [])[1];
    const hits = SEARCH.filter((r) => r.keys.includes(nt)).map((r) => r.m);
    if (yr) return hits.find((m) => String(m.y) === yr) || null;
    return hits.length ? hits[0] : null;
  }

  // ---------- storage ----------
  const STORE_KEY = "hazeoffice:v1";
  let store = null;
  try { store = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { store = null; }
  if (!store || !store.results) store = { results: { focus: {}, variants: {} }, seenHelp: false };
  if (!store.archiveMode) store.archiveMode = "focus";
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };

  const getGame = (mode, num) => store.results[mode][num] || { guesses: [], done: false, won: false, daily: false };
  const putGame = (mode, num, g) => { store.results[mode][num] = g; save(); };

  function stats(mode) {
    const res = store.results[mode];
    const daily = Object.entries(res).filter(([, g]) => g.done && g.daily).map(([n, g]) => [Number(n), g]);
    const wins = daily.filter(([, g]) => g.won);
    const dist = Array(MAX).fill(0);
    wins.forEach(([, g]) => { dist[g.guesses.length - 1]++; });
    const wonDays = new Set(wins.map(([n]) => n));
    let cur = 0, t = todayNum();
    if (!(res[t] && res[t].done)) t--; // today still open: streak runs through yesterday
    while (wonDays.has(t)) { cur++; t--; }
    let best = 0, run = 0, prev = null;
    [...wonDays].sort((a, b) => a - b).forEach((n) => { run = prev === n - 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; });
    return { played: daily.length, pct: daily.length ? Math.round((wins.length / daily.length) * 100) : 0, cur, best, dist };
  }

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const app = $("#app");

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 2000);
  }

  function countdown() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const p = (n) => String(n).padStart(2, "0");
    return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  }
  setInterval(() => document.querySelectorAll("[data-countdown]").forEach((el) => { el.textContent = countdown(); }), 1000);

  function statusOf(mode, num) {
    const g = getGame(mode, num);
    if (g.done) return g.won ? { cls: "won", text: `${g.guesses.length}/${MAX}` } : { cls: "lost", text: `X/${MAX}` };
    if (g.guesses.length) return { cls: "progress", text: `${g.guesses.length}/${MAX}` };
    return { cls: "new", text: "" };
  }

  // A poster tile that fills itself in from TMDB once it scrolls into view.
  // Unfinished puzzles stay heavily blurred so nothing is spoiled.
  const tileObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { tileObserver.unobserve(e.target); fillTile(e.target); } });
  }, { rootMargin: "300px" }) : null;

  function fillTile(el) {
    const movie = movieFor(el.dataset.mode, Number(el.dataset.num));
    window.Posters.getMain(movie).then(({ url }) => {
      const img = new Image();
      img.alt = "";
      img.onload = () => el.classList.add("loaded");
      img.src = url;
      el.appendChild(img);
    }).catch(() => el.classList.add("failed"));
  }
  function wireTiles(root) {
    root.querySelectorAll(".poster-tile[data-num]").forEach((el) => (tileObserver ? tileObserver.observe(el) : fillTile(el)));
  }
  function posterTile(mode, num, extraClass = "") {
    const done = getGame(mode, num).done;
    return `<span class="poster-tile ${done ? "is-clear" : ""} ${extraClass}" data-mode="${mode}" data-num="${num}" style="--blur:${done ? 0 : TEASER_BLUR}"></span>`;
  }

  // ---------- routing ----------
  function route() {
    const parts = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    const today = todayNum();
    if (parts[0] === "archive") return renderArchive();
    if (parts[0] === "focus" || parts[0] === "variants") {
      let num = parts[1] ? parseInt(parts[1], 10) : today;
      if (!(num >= 1 && num <= today)) num = today;
      return renderPlay(parts[0], num);
    }
    renderHome();
  }
  window.addEventListener("hashchange", () => { $("#toast").classList.remove("show"); route(); window.scrollTo(0, 0); });

  function setNav(active) {
    document.querySelectorAll(".nav a[data-nav]").forEach((a) => {
      const on = a.dataset.nav === active;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  // ---------- home ----------
  function feature(mode, num) {
    const g = getGame(mode, num);
    const st = statusOf(mode, num);
    const action = g.done ? "See the film" : g.guesses.length ? "Continue" : "Play";
    const result = g.done
      ? `<span class="mark mark--${st.cls}">${g.won ? `Solved ${st.text}` : "Missed"}</span>`
      : g.guesses.length ? `<span class="mark">${MAX - g.guesses.length} guesses left</span>` : `<span class="mark">${MAX} guesses</span>`;
    return `
      <a class="feature" href="#/${mode}">
        ${posterTile(mode, num, "feature__poster")}
        <span class="feature__body">
          <span class="label">${mode === "focus" ? "Feature one" : "Feature two"}</span>
          <span class="feature__name">${MODES[mode].name}</span>
          <span class="feature__line">${MODES[mode].line}</span>
          <span class="feature__foot">${result}<span class="feature__go">${action} <span aria-hidden="true">→</span></span></span>
        </span>
      </a>`;
  }

  function renderHome() {
    setNav("today");
    const t = todayNum();
    if (t < 1) {
      app.innerHTML = `<section class="home"><p class="label">Opening soon</p><h1 class="display">The first poster goes up on ${esc(longDate(1))}.</h1></section>`;
      return;
    }
    const recent = [];
    for (let n = t - 1; n >= Math.max(1, t - 6); n--) recent.push(n);
    app.innerHTML = `
      <section class="home">
        <header class="home__head">
          <p class="label">No. ${t} · ${esc(longDate(t))}</p>
          <h1 class="display">Name the film from its poster.</h1>
          <p class="lede">Two blurred posters a day. Six guesses each. New films at midnight.</p>
        </header>
        <div class="features">${feature("focus", t)}${feature("variants", t)}</div>
        ${recent.length ? `
        <section class="shelf">
          <header class="section-head"><h2 class="label">Earlier this week</h2><a class="section-head__more" href="#/archive">Full archive</a></header>
          <div class="shelf__row">
            ${recent.map((n) => {
              const st = statusOf("focus", n);
              return `<a class="shelf__item" href="#/focus/${n}" aria-label="Focus, No. ${n}${st.text ? ", " + st.text : ""}">
                ${posterTile("focus", n)}
                <span class="tile-cap"><span>No. ${n}</span>${st.text ? `<span class="mark mark--${st.cls}">${st.text}</span>` : ""}</span></a>`;
            }).join("")}
          </div>
        </section>` : ""}
      </section>`;
    wireTiles(app);
  }

  // ---------- archive ----------
  function renderArchive() {
    setNav("archive");
    const t = todayNum();
    const mode = store.archiveMode;
    let html = "", lastMonth = "";
    for (let n = t; n >= 1; n--) {
      const month = fmt(n, { month: "long", year: "numeric" });
      if (month !== lastMonth) {
        html += `${lastMonth ? "</div></section>" : ""}<section class="arch__month"><header class="section-head"><h2 class="label">${esc(month)}</h2></header><div class="grid">`;
        lastMonth = month;
      }
      const st = statusOf(mode, n);
      const g = getGame(mode, n);
      const title = g.done ? movieFor(mode, n).t : "";
      html += `<a class="grid__item" href="#/${mode}/${n}" aria-label="${MODES[mode].name}, No. ${n}${st.text ? ", " + st.text : ""}">
          ${posterTile(mode, n)}
          <span class="tile-cap"><span>No. ${n}${n === t ? " · Today" : ""}</span>${st.text ? `<span class="mark mark--${st.cls}">${st.text}</span>` : ""}</span>
          <span class="tile-sub">${title ? esc(title) : esc(shortDate(n))}</span></a>`;
    }
    if (lastMonth) html += "</div></section>";
    app.innerHTML = `
      <section class="archive">
        <header class="page-head">
          <div>
            <h1 class="display">Archive</h1>
            <p class="lede">Every poster since No. 1. Archive games don't count toward your streak.</p>
          </div>
          <nav class="tabs" aria-label="Mode">
            <button class="${mode === "focus" ? "on" : ""}" data-mode="focus" aria-pressed="${mode === "focus"}">Focus</button>
            <button class="${mode === "variants" ? "on" : ""}" data-mode="variants" aria-pressed="${mode === "variants"}">Variants</button>
          </nav>
        </header>
        ${html}
      </section>`;
    app.querySelectorAll(".tabs [data-mode]").forEach((b) => { b.onclick = () => { store.archiveMode = b.dataset.mode; save(); renderArchive(); }; });
    wireTiles(app);
  }

  // ---------- play ----------
  let playCtx = null;

  function renderPlay(mode, num) {
    setNav(num === todayNum() ? "today" : "archive");
    const answer = movieFor(mode, num);
    playCtx = { mode, num, answer, posters: null, view: 0, error: null };

    app.innerHTML = `
      <article class="film film--${mode}">
        <div class="film__media">
          <div class="frame" id="frame"><div class="frame__inner" id="frameInner"><div class="frame__msg frame__msg--loading">Loading poster</div></div></div>
          <div class="thumbs" id="thumbs" ${mode === "variants" ? "" : "hidden"}></div>
        </div>
        <div class="film__info">
          <nav class="tabs" aria-label="Mode">
            <a class="${mode === "focus" ? "on" : ""}" href="#/focus/${num}" ${mode === "focus" ? 'aria-current="page"' : ""}>Focus</a>
            <a class="${mode === "variants" ? "on" : ""}" href="#/variants/${num}" ${mode === "variants" ? 'aria-current="page"' : ""}>Variants</a>
          </nav>
          <p class="label film__kicker">No. ${num} · ${esc(longDate(num))}${num === todayNum() ? " · Today" : ""}</p>
          <div id="heading"></div>
          <div class="tries" id="tries"></div>
          <div id="panel"></div>
          <section>
            <header class="section-head"><h2 class="label">Your guesses</h2></header>
            <ol class="guesses" id="guesses"></ol>
          </section>
        </div>
      </article>`;

    renderAll();
    window.Posters.get(answer).then(({ posters }) => {
      if (!playCtx || playCtx.answer !== answer || playCtx.mode !== mode) return;
      playCtx.posters = posters;
      playCtx.view = mode === "variants" ? Math.min(getGame(mode, num).guesses.length, posters.length - 1) : 0;
      renderPoster();
    }).catch((e) => {
      console.error(e);
      if (!playCtx || playCtx.answer !== answer) return;
      playCtx.error = e instanceof window.Posters.MissingKeyError ? "key" : "load";
      renderPoster();
    });
  }

  function renderAll() { renderHeading(); renderTries(); renderPanel(); renderGuesses(); renderPoster(); }

  function blurFor(g) {
    const { mode, posters } = playCtx;
    if (g.done) return 0;
    const misses = g.guesses.length;
    if (mode === "focus") return FOCUS_BLUR[Math.min(misses, FOCUS_BLUR.length - 1)];
    const extra = Math.max(0, misses - ((posters ? posters.length : 1) - 1));
    return VARIANT_BLUR[Math.min(extra, VARIANT_BLUR.length - 1)];
  }

  // Unsolved: a question. Finished: the film's page header, credits from TMDB.
  function renderHeading() {
    const { mode, num, answer } = playCtx;
    const g = getGame(mode, num);
    const el = $("#heading");
    if (!g.done) {
      el.innerHTML = `<h1 class="film__title film__title--unknown">Which film is this?</h1>`;
      return;
    }
    el.innerHTML = `
      <h1 class="film__title">${esc(answer.t)} <span class="film__year">${answer.y}</span></h1>
      <p class="film__credits" id="credits">&nbsp;</p>
      <p class="film__tagline" id="tagline" hidden></p>`;
    window.Posters.details(answer).then((d) => {
      if (!playCtx || playCtx.answer !== answer) return;
      const bits = [];
      if (d.director) bits.push(`Directed by <strong>${esc(d.director)}</strong>`);
      if (d.runtime) bits.push(`${d.runtime} min`);
      if (d.genres.length) bits.push(esc(d.genres.join(", ")));
      $("#credits").innerHTML = bits.join('<span class="dot" aria-hidden="true">·</span>');
      if (d.tagline) { const tg = $("#tagline"); tg.textContent = d.tagline; tg.hidden = false; }
    }).catch(() => { const c = $("#credits"); if (c) c.innerHTML = ""; });
  }

  function renderTries() {
    const { mode, num } = playCtx;
    const g = getGame(mode, num);
    let bars = "";
    for (let i = 0; i < MAX; i++) {
      let cls = "try";
      if (i < g.guesses.length) cls += g.won && i === g.guesses.length - 1 ? " try--win" : g.guesses[i] ? " try--miss" : " try--skip";
      bars += `<span class="${cls}"></span>`;
    }
    const left = MAX - g.guesses.length;
    const note = g.done ? "" : `${left} ${left === 1 ? "guess" : "guesses"} left`;
    $("#tries").innerHTML = `<span class="tries__bars" aria-hidden="true">${bars}</span><span class="tries__note">${note}</span>`;
  }

  function renderPoster() {
    const { mode, num, posters, error } = playCtx;
    const g = getGame(mode, num);
    const inner = $("#frameInner");
    if (!inner) return;

    if (error) {
      inner.innerHTML = error === "key"
        ? `<div class="frame__msg"><strong>Posters need a TMDB key</strong><span>Add a free API key to config.js.</span></div>`
        : `<div class="frame__msg"><strong>This poster didn't load</strong><span>Check your connection and try again.</span><button class="btn btn--ghost btn--sm" id="retry">Try again</button></div>`;
      const retry = $("#retry");
      if (retry) retry.onclick = () => renderPlay(mode, num);
      return;
    }
    if (!posters) return;

    const idx = mode === "variants" ? Math.min(playCtx.view, posters.length - 1) : 0;
    const blur = blurFor(g);
    let img = inner.querySelector("img");
    if (!img) {
      inner.innerHTML = `<img alt="Mystery movie poster" draggable="false" />`;
      img = inner.querySelector("img");
      img.addEventListener("contextmenu", (e) => e.preventDefault());
      img.onerror = () => { playCtx.error = "load"; renderPoster(); };
    }
    if (img.getAttribute("src") !== posters[idx].full) {
      img.classList.add("swap");
      img.onload = () => img.classList.remove("swap");
      img.src = posters[idx].full;
    }
    $("#frame").style.setProperty("--blur", blur);

    if (mode === "variants") {
      const unlocked = g.done ? posters.length : Math.min(g.guesses.length + 1, posters.length);
      const total = Math.max(Math.min(MAX, posters.length), unlocked);
      let html = "";
      for (let i = 0; i < total; i++) {
        html += i < unlocked
          ? `<button class="thumb${i === idx ? " on" : ""}" data-i="${i}" aria-label="Poster ${i + 1}" aria-pressed="${i === idx}"><img src="${esc(posters[i].thumb)}" alt="" style="--blur:${blur}"/></button>`
          : `<span class="thumb thumb--locked" aria-label="Poster ${i + 1}, locked">${i + 1}</span>`;
      }
      const out = !g.done && posters.length - 1 < g.guesses.length;
      $("#thumbs").innerHTML = `<div class="thumbs__row">${html}</div>` +
        `<p class="thumbs__note">${out ? "That's every poster for this film. Each miss now lifts the blur instead." : `Poster ${idx + 1} of ${unlocked} unlocked`}</p>`;
      $("#thumbs").querySelectorAll("button.thumb").forEach((b) => {
        b.onclick = () => { playCtx.view = Number(b.dataset.i); renderPoster(); };
      });
    }
  }

  function renderGuesses() {
    const { mode, num } = playCtx;
    const g = getGame(mode, num);
    let html = "";
    for (let i = 0; i < MAX; i++) {
      if (i >= g.guesses.length) {
        html += `<li class="guess guess--empty"><span class="guess__n">${i + 1}</span><span class="guess__t"></span></li>`;
        continue;
      }
      const id = g.guesses[i];
      const m = id && byId.get(id);
      const win = g.won && i === g.guesses.length - 1;
      const cls = win ? "win" : m ? "miss" : "skip";
      html += `<li class="guess guess--${cls}">
        <span class="guess__n">${i + 1}</span>
        <span class="guess__t">${m ? `${esc(m.t)} <span class="guess__y">${m.y}</span>` : "Skipped"}</span>
        <span class="guess__mark">${win ? "Correct" : m ? "Wrong" : ""}</span></li>`;
    }
    $("#guesses").innerHTML = html;
  }

  function renderPanel() {
    const { mode, num } = playCtx;
    const g = getGame(mode, num);
    const panel = $("#panel");
    const other = OTHER[mode];

    if (g.done) {
      const otherDone = getGame(other, num).done;
      panel.innerHTML = `
        <div class="result">
          <p class="result__verdict result__verdict--${g.won ? "won" : "lost"}">${g.won ? (g.guesses.length === 1 ? "First try." : `Solved in ${g.guesses.length}.`) : "Not this time."}</p>
          <div class="result__actions">
            <button class="btn btn--solid" id="share">Share result</button>
            ${otherDone ? `<a class="btn btn--ghost" href="#/archive">Archive</a>` : `<a class="btn btn--ghost" href="#/${other}/${num}">Play ${MODES[other].name}</a>`}
          </div>
          ${num === todayNum() ? `<p class="result__next">Next films in <span data-countdown>${countdown()}</span></p>` : ""}
        </div>`;
      $("#share").onclick = () => share(mode, num);
      return;
    }

    panel.innerHTML = `
      <form class="guessbox" id="guessForm" autocomplete="off">
        <label class="visually-hidden" for="guessInput">Your guess</label>
        <div class="guessbox__field">
          <svg class="guessbox__icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>
          <input id="guessInput" type="text" placeholder="Search 639 films" spellcheck="false"
            role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="sugg" />
          <ul class="sugg" id="sugg" role="listbox" hidden></ul>
        </div>
        <div class="guessbox__btns">
          <button type="button" class="btn btn--ghost" id="skipBtn">Skip</button>
          <button type="submit" class="btn btn--solid" id="guessBtn">Guess</button>
        </div>
      </form>`;

    const input = $("#guessInput"), list = $("#sugg");
    let items = [], hi = -1, chosen = null;
    const exclude = new Set(g.guesses.filter(Boolean));

    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); hi = -1; };
    const draw = () => {
      if (!items.length) { close(); return; }
      list.innerHTML = items.map((m, i) => `<li role="option" id="opt${i}" class="${i === hi ? "on" : ""}" data-i="${i}" aria-selected="${i === hi}">
        <span>${esc(m.t)}</span><span class="sugg__y">${m.y}</span></li>`).join("");
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      if (hi >= 0) input.setAttribute("aria-activedescendant", "opt" + hi);
    };
    const pick = (m) => { chosen = m; input.value = `${m.t} (${m.y})`; close(); input.focus(); };

    input.addEventListener("input", () => { chosen = null; items = suggest(input.value, exclude); hi = items.length ? 0 : -1; draw(); });
    input.addEventListener("keydown", (e) => {
      if (list.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); hi = (hi + 1) % items.length; draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); hi = (hi - 1 + items.length) % items.length; draw(); }
      else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); pick(items[hi]); }
      else if (e.key === "Escape") { close(); }
    });
    list.addEventListener("mousedown", (e) => {
      const li = e.target.closest("li");
      if (li) { e.preventDefault(); pick(items[Number(li.dataset.i)]); }
    });
    input.addEventListener("blur", () => setTimeout(close, 120));

    $("#guessForm").onsubmit = (e) => {
      e.preventDefault();
      if (!input.value.trim()) { toast("Type a film title first"); return; }
      const m = chosen || exactMatch(input.value);
      if (!m) { toast("Pick a film from the list"); shake(); return; }
      if (exclude.has(movieId(m))) { toast("You already guessed that"); return; }
      commit(m);
    };
    $("#skipBtn").onclick = () => commit(null);
    if (matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
  }

  function shake() {
    const f = $("#guessForm");
    f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
  }

  function commit(m) {
    const { mode, num, answer } = playCtx;
    const g = getGame(mode, num);
    if (g.done) return;
    if (!g.guesses.length) g.daily = num === todayNum();
    g.guesses.push(m ? movieId(m) : null);
    if (m && isCorrect(m, answer)) { g.done = true; g.won = true; }
    else if (g.guesses.length >= MAX) { g.done = true; }
    putGame(mode, num, g);

    if (mode === "variants" && playCtx.posters) playCtx.view = Math.min(g.guesses.length, playCtx.posters.length - 1);
    if (!g.done) toast(m ? "Not this one" : "Skipped");
    renderAll();
    if (g.done) setTimeout(() => openStats(mode), 1600);
  }

  // ---------- share ----------
  function shareText(mode, num) {
    const g = getGame(mode, num);
    const squares = [];
    for (let i = 0; i < MAX; i++) {
      if (i >= g.guesses.length) squares.push("⬜");
      else if (g.won && i === g.guesses.length - 1) squares.push("🟩");
      else squares.push(g.guesses[i] ? "🟥" : "⬛");
    }
    return `Haze Office ${MODES[mode].name} No. ${num}  ${g.won ? g.guesses.length : "X"}/${MAX}\n${squares.join("")}\n${location.href.split("#")[0]}`;
  }
  async function share(mode, num) {
    const text = shareText(mode, num);
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      openModal(`<h2 class="modal__title">Your result</h2><textarea class="copybox" readonly rows="4">${esc(text)}</textarea><p class="muted">Select the text and copy it.</p>`);
      $(".copybox").select();
    }
  }

  // ---------- modals ----------
  const modal = $("#modal");
  function openModal(html) {
    $("#modalBody").innerHTML = html;
    if (!modal.open) modal.showModal();
  }
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) modal.close(); });

  function openHelp() {
    openModal(`
      <h2 class="modal__title">How to play</h2>
      <p>Name the film from its poster. Two new posters go up every day at midnight, one for each mode.</p>
      <dl class="help">
        <div><dt>Focus</dt><dd>${MODES.focus.help}</dd></div>
        <div><dt>Variants</dt><dd>${MODES.variants.help}</dd></div>
      </dl>
      <p>You get ${MAX} tries. Start typing and pick a film from the list. Remakes that share a title count as the same answer.</p>
      <p class="muted">Every film is a big hit or a widely known classic. Missed a day? The archive keeps every past poster.</p>
      <button class="btn btn--solid btn--full" data-close>Start playing</button>`);
    store.seenHelp = true; save();
  }

  function openStats(mode) {
    const onPlay = /^#\/(focus|variants)/.test(location.hash) && playCtx;
    if (!mode) mode = onPlay ? playCtx.mode : "focus";
    const s = stats(mode);
    const maxBar = Math.max(1, ...s.dist);
    const g = onPlay && playCtx.mode === mode ? getGame(mode, playCtx.num) : null;
    const lastWin = g && g.done && g.won ? g.guesses.length - 1 : -1;
    const bars = s.dist.map((v, i) => `<div class="bar"><span class="bar__n">${i + 1}</span>
      <span class="bar__track"><span class="bar__fill${i === lastWin ? " on" : ""}" style="width:${Math.max(6, (v / maxBar) * 100)}%"><span>${v}</span></span></span></div>`).join("");
    openModal(`
      <h2 class="modal__title">Your stats</h2>
      <nav class="tabs" aria-label="Stats mode">
        <button class="${mode === "focus" ? "on" : ""}" data-stats="focus" aria-pressed="${mode === "focus"}">Focus</button>
        <button class="${mode === "variants" ? "on" : ""}" data-stats="variants" aria-pressed="${mode === "variants"}">Variants</button>
      </nav>
      <div class="stats">
        <div><b>${s.played}</b><span>Played</span></div>
        <div><b>${s.pct}</b><span>Win %</span></div>
        <div><b>${s.cur}</b><span>Streak</span></div>
        <div><b>${s.best}</b><span>Best streak</span></div>
      </div>
      <header class="section-head"><h3 class="label">Guess distribution</h3></header>
      <div class="bars">${bars}</div>
      <p class="muted small">Counts daily games played on their own day.</p>
      ${g && g.done ? `<button class="btn btn--solid btn--full" id="mShare">Share result</button>` : ""}`);
    document.querySelectorAll("[data-stats]").forEach((b) => { b.onclick = () => openStats(b.dataset.stats); });
    const ms = $("#mShare");
    if (ms) ms.onclick = () => share(mode, playCtx.num);
  }

  $("#helpBtn").onclick = openHelp;
  $("#statsBtn").onclick = () => openStats();

  // ---------- go ----------
  route();
  if (!store.seenHelp) openHelp();

  // Roll the home page over to the new day if the tab is left open past midnight.
  let lastDay = todayNum();
  setInterval(() => {
    if (todayNum() !== lastDay) { lastDay = todayNum(); if (/^#?\/?$/.test(location.hash)) route(); }
  }, 30000);
})();
