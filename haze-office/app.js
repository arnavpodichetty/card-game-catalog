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

  const MODES = {
    focus: {
      name: "Focus",
      line: "One poster. It comes into focus with every miss.",
      help: "One poster, heavily blurred. Every wrong guess or skip sharpens it a little.",
    },
    variants: {
      name: "Variants",
      line: "Fixed blur. Every miss shows a different poster for the same film.",
      help: "The blur never lifts. Instead, each wrong guess or skip unlocks another poster for the same film. Flip back through them any time.",
    },
  };

  // ---------- dates ----------
  const DAY_MS = 86400000;
  const [ly, lm, ld] = (CFG.launchDate || "2026-10-01").split("-").map(Number);
  const LAUNCH_UTC = Date.UTC(ly, lm - 1, ld);
  const localUTC = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const todayNum = () => Math.floor((localUTC(new Date()) - LAUNCH_UTC) / DAY_MS) + 1; // puzzle #1 = launch day
  const dateOf = (num) => new Date(LAUNCH_UTC + (num - 1) * DAY_MS);
  const fmtDate = (num, opts) => dateOf(num).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  const shortDate = (num) => fmtDate(num, { weekday: "short", month: "short", day: "numeric" });
  const serial = (num) => "No. " + String(num).padStart(4, "0");

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
  const titleCount = new Map();
  MOVIES.forEach((m) => titleCount.set(norm(m.t), (titleCount.get(norm(m.t)) || 0) + 1));
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
  const label = (m) => m.t + (titleCount.get(norm(m.t)) > 1 ? ` (${m.y})` : "");
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
    return { cls: "new", text: "Play" };
  }

  // Letterboard text: one span per word so lines break between words, never inside one.
  const boardText = (s) => esc(s.toUpperCase()).split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");

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
  function ticket(mode, num) {
    const g = getGame(mode, num);
    const cta = g.done ? "See result" : g.guesses.length ? "Continue" : "Play today's poster";
    const stamp = g.done ? `<span class="stamp stamp--${g.won ? "won" : "lost"}">${g.won ? `Seen in ${g.guesses.length}` : "Missed"}</span>` : "";
    return `
      <a class="ticket ticket--${mode}" href="#/${mode}">
        <div class="ticket__main">
          <span class="ticket__admit">Admit one</span>
          <h2 class="ticket__name">${MODES[mode].name}</h2>
          <p class="ticket__desc">${MODES[mode].line}</p>
          <span class="ticket__cta">${cta} <span aria-hidden="true">→</span></span>
        </div>
        <div class="ticket__stub" aria-hidden="true">
          <span>${serial(num)}</span><span>${MAX} tries</span>
        </div>
        ${stamp}
      </a>`;
  }

  function renderHome() {
    setNav("today");
    const t = todayNum();
    if (t < 1) {
      app.innerHTML = `<section class="home">${marquee(["Coming soon", fmtDate(1, { month: "short", day: "numeric" })])}</section>`;
      return;
    }
    app.innerHTML = `
      <section class="home">
        ${marquee(["Now showing", fmtDate(t, { weekday: "short", month: "short", day: "numeric" }).replace(",", ""), `${serial(t)} · Two features`])}
        <p class="home__lede">Name the film from a blurred poster. A new one every day at midnight, in two ways to play.</p>
        <div class="tickets">${ticket("focus", t)}${ticket("variants", t)}</div>
        <p class="home__foot">Missed a day? <a href="#/archive">The archive</a> keeps every past poster playable.</p>
      </section>`;
  }

  function marquee(lines) {
    return `
      <div class="marquee" role="img" aria-label="${esc(lines.join(". "))}">
        <div class="marquee__board">
          ${lines.map((l, i) => `<p class="board__line${i === 1 ? " board__line--big" : ""}">${boardText(l)}</p>`).join("")}
        </div>
      </div>`;
  }

  // ---------- archive ----------
  function renderArchive() {
    setNav("archive");
    const t = todayNum();
    let rows = "", lastMonth = "";
    for (let n = t; n >= 1; n--) {
      const month = fmtDate(n, { month: "long", year: "numeric" });
      if (month !== lastMonth) {
        rows += `${lastMonth ? "</div>" : ""}<h2 class="arch__month">${esc(month)}</h2><div class="arch__group">`;
        lastMonth = month;
      }
      const chip = (mode) => {
        const st = statusOf(mode, n);
        return `<a class="chip chip--${st.cls}" href="#/${mode}/${n}" aria-label="${MODES[mode].name}, ${serial(n)}: ${st.text}">
          <span class="chip__mode">${MODES[mode].name}</span><span class="chip__st">${st.text}</span></a>`;
      };
      rows += `
        <div class="arch__row${n === t ? " arch__row--today" : ""}">
          <span class="arch__serial">${serial(n)}</span>
          <span class="arch__date">${esc(shortDate(n))}${n === t ? " <em>Today</em>" : ""}</span>
          <span class="arch__chips">${chip("focus")}${chip("variants")}</span>
        </div>`;
    }
    if (lastMonth) rows += "</div>";
    app.innerHTML = `
      <section class="archive">
        <h1 class="page-title">Archive</h1>
        <p class="page-lede">Every poster since opening night. Archive games don't change your streak.</p>
        <div class="arch">${rows || "<p>Nothing here yet.</p>"}</div>
      </section>`;
  }

  // ---------- play ----------
  let playCtx = null;

  function renderPlay(mode, num) {
    setNav(num === todayNum() ? "today" : "archive");
    const answer = movieFor(mode, num);
    const other = mode === "focus" ? "variants" : "focus";
    playCtx = { mode, num, answer, posters: null, view: 0, error: null };

    app.innerHTML = `
      <section class="play play--${mode}">
        <header class="play__head">
          <div class="play__titles">
            <p class="play__meta">${serial(num)} · ${esc(shortDate(num))}${num === todayNum() ? " · Today" : ""}</p>
            <h1 class="page-title">${MODES[mode].name}</h1>
          </div>
          <nav class="tabs" aria-label="Mode">
            <a class="${mode === "focus" ? "on" : ""}" href="#/focus/${num}" ${mode === "focus" ? 'aria-current="page"' : ""}>Focus</a>
            <a class="${mode === "variants" ? "on" : ""}" href="#/variants/${num}" ${mode === "variants" ? 'aria-current="page"' : ""}>Variants</a>
          </nav>
        </header>
        <div class="play__grid">
          <div class="stage">
            <div class="case">
              <div class="frame" id="frame"><div class="frame__inner" id="frameInner"><div class="developing">Loading poster</div></div></div>
            </div>
            <div class="thumbs" id="thumbs" ${mode === "variants" ? "" : "hidden"}></div>
          </div>
          <div class="side">
            <div class="punches" id="punches"></div>
            <div class="panel" id="panel"></div>
            <ol class="board guesses" id="guesses" aria-label="Your guesses"></ol>
            <p class="play__other">${getGame(other, num).done ? "" : `Also ${num === todayNum() ? "today" : "this day"}: <a href="#/${other}/${num}">${MODES[other].name}</a> · `}<a href="#/archive">Archive</a></p>
          </div>
        </div>
      </section>`;

    renderPanel();
    renderGuesses();
    renderPoster();

    window.Posters.get(answer).then((posters) => {
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

  function blurFor(g) {
    const { mode, posters } = playCtx;
    if (g.done) return 0;
    const misses = g.guesses.length;
    if (mode === "focus") return FOCUS_BLUR[Math.min(misses, FOCUS_BLUR.length - 1)];
    const extra = Math.max(0, misses - ((posters ? posters.length : 1) - 1));
    return VARIANT_BLUR[Math.min(extra, VARIANT_BLUR.length - 1)];
  }

  function renderPunches(g) {
    let html = "";
    for (let i = 0; i < MAX; i++) {
      let cls = "punch";
      if (i < g.guesses.length) cls += g.won && i === g.guesses.length - 1 ? " punch--win" : g.guesses[i] ? " punch--miss" : " punch--skip";
      else if (i === g.guesses.length && !g.done) cls += " punch--next";
      html += `<span class="${cls}"></span>`;
    }
    const left = MAX - g.guesses.length;
    const note = g.done ? (g.won ? `Solved in ${g.guesses.length}` : "Out of guesses") : `${left} ${left === 1 ? "guess" : "guesses"} left`;
    $("#punches").innerHTML = `<span class="punches__row" aria-hidden="true">${html}</span><span class="punches__note">${note}</span>`;
  }

  function renderPoster() {
    const { mode, num, posters, error } = playCtx;
    const g = getGame(mode, num);
    const inner = $("#frameInner");
    if (!inner) return;
    renderPunches(g);

    if (error) {
      inner.innerHTML = error === "key"
        ? `<div class="developing developing--msg"><strong>Posters need a TMDB key</strong><span>Add a free API key to <code>config.js</code> to load posters.</span></div>`
        : `<div class="developing developing--msg"><strong>This poster didn't load</strong><span>Check your connection and try again.</span><button class="btn btn--line btn--sm" id="retry">Try again</button></div>`;
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
      const thumbs = $("#thumbs");
      thumbs.innerHTML = `<div class="thumbs__row">${html}</div>` +
        (out ? `<p class="thumbs__note">No more posters for this film. Each miss now lifts the blur instead.</p>` : "");
      thumbs.querySelectorAll("button.thumb").forEach((b) => {
        b.onclick = () => { playCtx.view = Number(b.dataset.i); renderPoster(); };
      });
    }
  }

  function renderGuesses() {
    const { mode, num } = playCtx;
    const g = getGame(mode, num);
    let html = "";
    for (let i = 0; i < MAX; i++) {
      if (i >= g.guesses.length) { html += `<li class="guess guess--empty"><span class="guess__n">${i + 1}</span></li>`; continue; }
      const id = g.guesses[i];
      const m = id && byId.get(id);
      const win = g.won && i === g.guesses.length - 1;
      const cls = win ? "win" : m ? "miss" : "skip";
      html += `<li class="guess guess--${cls}">
        <span class="guess__n">${i + 1}</span>
        <span class="guess__t">${m ? boardText(label(m)) : boardText("Skipped")}</span>
        <span class="visually-hidden">${win ? "correct" : m ? "wrong" : ""}</span></li>`;
    }
    $("#guesses").innerHTML = html;
  }

  function renderPanel() {
    const { mode, num, answer } = playCtx;
    const g = getGame(mode, num);
    const panel = $("#panel");

    if (g.done) {
      const other = mode === "focus" ? "variants" : "focus";
      panel.innerHTML = `
        <div class="result">
          <p class="result__kicker result__kicker--${g.won ? "won" : "lost"}">${g.won ? (g.guesses.length === 1 ? "First try" : `Got it in ${g.guesses.length}`) : "The film was"}</p>
          <h2 class="result__title">${esc(answer.t)} <span>${answer.y}</span></h2>
          <div class="result__actions">
            <button class="btn btn--solid" id="share">Share result</button>
            ${getGame(other, num).done ? `<a class="btn btn--line" href="#/archive">Archive</a>` : `<a class="btn btn--line" href="#/${other}/${num}">Play ${MODES[other].name}</a>`}
          </div>
          ${num === todayNum() ? `<p class="result__next">Next poster in <span data-countdown>${countdown()}</span></p>` : ""}
        </div>`;
      $("#share").onclick = () => share(mode, num);
      return;
    }

    panel.innerHTML = `
      <form class="guessbox" id="guessForm" autocomplete="off">
        <label class="visually-hidden" for="guessInput">Your guess</label>
        <div class="guessbox__field">
          <input id="guessInput" type="text" placeholder="Search for a film" spellcheck="false"
            role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="sugg" />
          <ul class="sugg" id="sugg" role="listbox" hidden></ul>
        </div>
        <div class="guessbox__btns">
          <button type="button" class="btn btn--line" id="skipBtn">Skip</button>
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
    const pick = (m) => { chosen = m; input.value = label(m); close(); input.focus(); };

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
    if (matchMedia("(pointer: fine)").matches) input.focus();
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
    renderGuesses();
    renderPoster();
    renderPanel();
    if (g.done) setTimeout(() => openStats(mode), 1500);
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
    return `Haze Office ${MODES[mode].name} #${num} ${g.won ? g.guesses.length : "X"}/${MAX}\n${squares.join("")}\n${location.href.split("#")[0]}`;
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
      <p>Name the film from its poster. A new poster goes up every day at midnight, in two modes.</p>
      <dl class="help-modes">
        <div><dt>Focus</dt><dd>${MODES.focus.help}</dd></div>
        <div><dt>Variants</dt><dd>${MODES.variants.help}</dd></div>
      </dl>
      <p>You get <strong>${MAX} tries</strong>. Start typing and pick a film from the list. Remakes that share a title count as the same answer.</p>
      <p class="muted">Every film is a big hit or a widely known classic. Missed a day? The archive has every past poster.</p>
      <button class="btn btn--solid btn--full" data-close>Start playing</button>`);
    store.seenHelp = true; save();
  }

  function openStats(mode) {
    if (!mode) mode = playCtx && /^#\/(focus|variants)/.test(location.hash) ? playCtx.mode : "focus";
    const s = stats(mode);
    const maxBar = Math.max(1, ...s.dist);
    const g = playCtx && playCtx.mode === mode && /^#\/(focus|variants)/.test(location.hash) ? getGame(mode, playCtx.num) : null;
    const lastWin = g && g.done && g.won ? g.guesses.length - 1 : -1;
    const bars = s.dist.map((v, i) => `<div class="bar"><span class="bar__n">${i + 1}</span>
      <span class="bar__track"><span class="bar__fill${i === lastWin ? " on" : ""}" style="width:${Math.max(8, (v / maxBar) * 100)}%">${v}</span></span></div>`).join("");
    openModal(`
      <nav class="tabs tabs--modal" aria-label="Stats mode">
        <button class="${mode === "focus" ? "on" : ""}" data-stats="focus">Focus</button>
        <button class="${mode === "variants" ? "on" : ""}" data-stats="variants">Variants</button>
      </nav>
      <h2 class="modal__title">Your stats</h2>
      <div class="stats">
        <div><b>${s.played}</b><span>Played</span></div>
        <div><b>${s.pct}</b><span>Win %</span></div>
        <div><b>${s.cur}</b><span>Streak</span></div>
        <div><b>${s.best}</b><span>Best</span></div>
      </div>
      <h3 class="modal__sub">Guess distribution</h3>
      <div class="bars">${bars}</div>
      <p class="muted small">Counts daily games played on their own day. Archive games don't count.</p>
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
