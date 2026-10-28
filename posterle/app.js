// app.js — Posterle: a daily movie-poster guessing game.
(function () {
  "use strict";

  const CFG = window.POSTERLE_CONFIG || {};
  const MAX = CFG.maxGuesses || 6;
  const MOVIES = window.MOVIES;
  const N = MOVIES.length;

  // Blur strength as a % of the poster's width (applied via CSS container units).
  const FOCUS_BLUR = [7.5, 5.2, 3.6, 2.4, 1.5, 0.8];
  const VARIANT_BLUR = [3.4, 2.5, 1.8, 1.2, 0.8, 0.5]; // index = misses beyond the last alternate poster

  const MODES = {
    focus: {
      name: "Focus",
      line: "One poster. It sharpens with every miss.",
      help: "You get a single, heavily blurred poster. Every wrong guess or skip brings it a little more into focus.",
    },
    variants: {
      name: "Variants",
      line: "Fixed blur. Every miss reveals a different poster.",
      help: "Every poster stays equally blurred. Each wrong guess or skip unlocks an alternate poster for the same film. Flip back through them any time.",
    },
  };

  // ---------- dates ----------
  const DAY_MS = 86400000;
  const [ly, lm, ld] = (CFG.launchDate || "2026-10-01").split("-").map(Number);
  const LAUNCH_UTC = Date.UTC(ly, lm - 1, ld);
  const localUTC = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const todayNum = () => Math.floor((localUTC(new Date()) - LAUNCH_UTC) / DAY_MS) + 1; // puzzle #1 = launch day
  const dateOf = (num) => new Date(LAUNCH_UTC + (num - 1) * DAY_MS);
  const fmtDate = (num, opts = { month: "long", day: "numeric", year: "numeric" }) =>
    dateOf(num).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });

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
  const sameTitle = new Map(); // normalized title -> count, to show years only when needed
  MOVIES.forEach((m) => sameTitle.set(norm(m.t), (sameTitle.get(norm(m.t)) || 0) + 1));
  const SEARCH = MOVIES.map((m) => ({ m, keys: [m.t, ...(m.a || [])].map(norm) }))
    .sort((a, b) => a.m.t.localeCompare(b.m.t) || a.m.y - b.m.y);

  function isCorrect(guess, answer) {
    if (!guess) return false;
    // Same title counts (e.g. the 1994 vs 2019 "The Lion King" share the guess).
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
  const STORE_KEY = "posterle:v1";
  let store;
  try { store = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { store = null; }
  if (!store || !store.results) store = { results: { focus: {}, variants: {} }, seenHelp: false };
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };

  function getGame(mode, num) {
    return store.results[mode][num] || { guesses: [], done: false, won: false, daily: false };
  }
  function putGame(mode, num, g) { store.results[mode][num] = g; save(); }

  function stats(mode) {
    const res = store.results[mode];
    const daily = Object.entries(res).filter(([, g]) => g.done && g.daily).map(([n, g]) => [Number(n), g]);
    const played = daily.length;
    const wins = daily.filter(([, g]) => g.won);
    const dist = Array(MAX).fill(0);
    wins.forEach(([, g]) => { dist[g.guesses.length - 1]++; });
    const wonDays = new Set(wins.map(([n]) => n));
    let cur = 0, t = todayNum();
    if (!(res[t] && res[t].done)) t--; // today still in play: streak runs through yesterday
    while (wonDays.has(t)) { cur++; t--; }
    let best = 0, run = 0, prev = null;
    [...wonDays].sort((a, b) => a - b).forEach((n) => { run = prev === n - 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; });
    return { played, wins: wins.length, pct: played ? Math.round((wins.length / played) * 100) : 0, cur, best, dist };
  }

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const label = (m) => m.t + (sameTitle.get(norm(m.t)) > 1 ? ` (${m.y})` : "");
  const app = $("#app");

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 2200);
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
    document.querySelectorAll(".nav a[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === active));
  }

  // ---------- home ----------
  function renderHome() {
    setNav("today");
    const t = todayNum();
    if (t < 1) {
      app.innerHTML = `<section class="home"><p class="eyebrow">Coming soon</p><h1 class="display">The first poster drops on ${esc(fmtDate(1))}.</h1></section>`;
      return;
    }
    const card = (mode) => {
      const st = statusOf(mode, t);
      const g = getGame(mode, t);
      const cta = g.done ? (g.won ? `Solved in ${g.guesses.length}` : "Missed it") : g.guesses.length ? "Continue" : "Play today's poster";
      return `
        <a class="mode-card mode-card--${mode}" href="#/${mode}">
          <div class="mode-card__art" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="mode-card__body">
            <h2>${MODES[mode].name}</h2>
            <p>${MODES[mode].line}</p>
            <span class="pill pill--${st.cls}">${esc(cta)} <span aria-hidden="true">→</span></span>
          </div>
        </a>`;
    };
    app.innerHTML = `
      <section class="home">
        <p class="eyebrow">No. ${t} · ${esc(fmtDate(t))}</p>
        <h1 class="display">Name the film<br/><em>from its poster.</em></h1>
        <p class="lede">A new mystery poster every day, in two ways to play. ${MAX} guesses each.</p>
        <div class="modes">${card("focus")}${card("variants")}</div>
        <p class="home__foot">Missed a day? <a href="#/archive">Browse the archive</a> — every past poster is still playable.</p>
      </section>`;
  }

  // ---------- archive ----------
  function renderArchive() {
    setNav("archive");
    const t = todayNum();
    let rows = "", lastMonth = "";
    for (let n = t; n >= 1; n--) {
      const month = fmtDate(n, { month: "long", year: "numeric" });
      if (month !== lastMonth) { rows += `<h3 class="arch__month">${esc(month)}</h3>`; lastMonth = month; }
      const chip = (mode) => {
        const st = statusOf(mode, n);
        return `<a class="chip chip--${st.cls}" href="#/${mode}/${n}" aria-label="${MODES[mode].name} No. ${n}: ${st.text}">
          <span class="chip__mode">${MODES[mode].name}</span><span class="chip__st">${st.text}</span></a>`;
      };
      rows += `
        <div class="arch__row${n === t ? " arch__row--today" : ""}">
          <div class="arch__day"><span class="arch__num">No. ${n}</span><span class="arch__date">${esc(fmtDate(n, { weekday: "short", month: "short", day: "numeric" }))}${n === t ? " · Today" : ""}</span></div>
          <div class="arch__chips">${chip("focus")}${chip("variants")}</div>
        </div>`;
    }
    app.innerHTML = `
      <section class="archive">
        <p class="eyebrow">Archive</p>
        <h1 class="display display--sm">Every poster so far</h1>
        <p class="lede">Archive games don't affect your streak.</p>
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
          <div>
            <p class="eyebrow">${num === todayNum() ? "Today" : "Archive"} · No. ${num} · ${esc(fmtDate(num, { month: "short", day: "numeric", year: "numeric" }))}</p>
            <h1 class="play__title">${MODES[mode].name}</h1>
          </div>
          <div class="seg" role="tablist" aria-label="Mode">
            <a role="tab" class="${mode === "focus" ? "on" : ""}" href="#/focus/${num}">Focus</a>
            <a role="tab" class="${mode === "variants" ? "on" : ""}" href="#/variants/${num}">Variants</a>
          </div>
        </header>
        <div class="stage">
          <div class="frame" id="frame">
            <div class="frame__inner" id="frameInner"><div class="developing"><span>Developing…</span></div></div>
          </div>
          <div class="thumbs" id="thumbs" ${mode === "variants" ? "" : "hidden"}></div>
          <div class="pips" id="pips" aria-label="Guesses"></div>
        </div>
        <div class="panel" id="panel"></div>
        <ol class="guesses" id="guesses"></ol>
        <p class="play__other">Also today: <a href="#/${other}/${num}">${MODES[other].name}</a> · <a href="#/archive">Archive</a></p>
      </section>`;

    renderPanel();
    renderGuesses();
    renderPoster();

    window.Posters.get(answer).then((posters) => {
      if (!playCtx || playCtx.answer !== answer || playCtx.mode !== mode) return;
      playCtx.posters = posters;
      const g = getGame(mode, num);
      playCtx.view = mode === "variants" ? Math.min(g.guesses.length, posters.length - 1) : 0;
      renderPoster();
    }).catch((e) => {
      console.error(e);
      if (!playCtx || playCtx.answer !== answer) return;
      playCtx.error = true;
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

  function renderPoster() {
    const { mode, num, posters, error } = playCtx;
    const g = getGame(mode, num);
    const inner = $("#frameInner");
    if (!inner) return;

    // pips
    const pips = [];
    for (let i = 0; i < MAX; i++) {
      const guess = g.guesses[i];
      let cls = "pip";
      if (i < g.guesses.length) cls += g.won && i === g.guesses.length - 1 ? " pip--win" : guess ? " pip--miss" : " pip--skip";
      else if (i === g.guesses.length && !g.done) cls += " pip--now";
      pips.push(`<span class="${cls}"></span>`);
    }
    $("#pips").innerHTML = pips.join("");

    if (error) {
      inner.innerHTML = `<div class="developing developing--err"><span>This poster didn't load.</span><button class="btn btn--ghost btn--sm" id="retry">Try again</button></div>`;
      $("#retry").onclick = () => renderPlay(mode, num);
      return;
    }
    if (!posters) return;

    const idx = mode === "variants" ? Math.min(playCtx.view, posters.length - 1) : 0;
    const blur = blurFor(g);
    let img = inner.querySelector("img");
    if (!img) {
      inner.innerHTML = `<img alt="Mystery movie poster" draggable="false" referrerpolicy="no-referrer" />`;
      img = inner.querySelector("img");
      img.addEventListener("contextmenu", (e) => e.preventDefault());
      img.onerror = () => { playCtx.error = true; renderPoster(); };
    }
    if (img.getAttribute("src") !== posters[idx]) {
      img.classList.add("swap");
      img.onload = () => img.classList.remove("swap");
      img.src = posters[idx];
    }
    $("#frame").style.setProperty("--blur", blur);
    $("#frame").classList.toggle("revealed", blur === 0);

    if (mode === "variants") {
      const unlocked = g.done ? posters.length : Math.min(g.guesses.length + 1, posters.length);
      const total = Math.max(Math.min(MAX, posters.length), unlocked);
      let html = "";
      for (let i = 0; i < total; i++) {
        if (i < unlocked) html += `<button class="thumb${i === idx ? " on" : ""}" data-i="${i}" aria-label="Poster ${i + 1}"><img src="${esc(posters[i])}" alt="" style="--blur:${blur}" referrerpolicy="no-referrer"/></button>`;
        else html += `<span class="thumb thumb--locked" aria-label="Locked poster">${i + 1}</span>`;
      }
      const thumbs = $("#thumbs");
      thumbs.innerHTML = html;
      thumbs.querySelectorAll("button.thumb").forEach((b) => {
        b.onclick = () => { playCtx.view = Number(b.dataset.i); renderPoster(); };
      });
      const note = !g.done && posters.length - 1 < g.guesses.length
        ? `<p class="thumbs__note">That's every poster we have for this one — misses now lift the blur instead.</p>` : "";
      thumbs.insertAdjacentHTML("beforeend", note);
    }
  }

  function renderGuesses() {
    const { mode, num } = playCtx;
    const g = getGame(mode, num);
    $("#guesses").innerHTML = g.guesses.map((id, i) => {
      const m = id && byId.get(id);
      const win = g.won && i === g.guesses.length - 1;
      return `<li class="guess ${win ? "guess--win" : m ? "guess--miss" : "guess--skip"}">
        <span class="guess__n">${i + 1}</span>
        <span class="guess__t">${m ? esc(label(m)) : "Skipped"}</span>
        <span class="guess__mark" aria-hidden="true">${win ? "✓" : m ? "✕" : "—"}</span></li>`;
    }).join("");
  }

  function renderPanel() {
    const { mode, num, answer } = playCtx;
    const g = getGame(mode, num);
    const panel = $("#panel");

    if (g.done) {
      const isToday = num === todayNum();
      const other = mode === "focus" ? "variants" : "focus";
      const otherSt = getGame(other, num);
      panel.innerHTML = `
        <div class="result ${g.won ? "result--won" : "result--lost"}">
          <p class="eyebrow">${g.won ? (g.guesses.length === 1 ? "First try. Impressive." : `Got it in ${g.guesses.length}`) : "Not this time"}</p>
          <h2 class="result__title">${esc(answer.t)} <span>${answer.y}</span></h2>
          <div class="result__actions">
            <button class="btn btn--gold" id="share">Share result</button>
            ${otherSt.done ? `<a class="btn btn--ghost" href="#/archive">Archive</a>` : `<a class="btn btn--ghost" href="#/${other}/${num}">Play ${MODES[other].name}</a>`}
          </div>
          ${isToday ? `<p class="result__next">Next poster in <span data-countdown>${countdown()}</span></p>` : ""}
        </div>`;
      $("#share").onclick = () => share(mode, num);
      return;
    }

    panel.innerHTML = `
      <form class="guessbox" id="guessForm" autocomplete="off">
        <div class="guessbox__field">
          <input id="guessInput" type="text" placeholder="Search for a film…" aria-label="Your guess" spellcheck="false"
            role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="sugg" />
          <ul class="sugg" id="sugg" role="listbox" hidden></ul>
        </div>
        <div class="guessbox__btns">
          <button type="button" class="btn btn--ghost" id="skipBtn">Skip</button>
          <button type="submit" class="btn btn--gold" id="guessBtn">Guess</button>
        </div>
      </form>
      <p class="hint">${g.guesses.length} of ${MAX} guesses used</p>`;

    const input = $("#guessInput"), list = $("#sugg");
    let items = [], hi = -1, chosen = null;
    const exclude = new Set(g.guesses.filter(Boolean));

    const close = () => { list.hidden = true; input.setAttribute("aria-expanded", "false"); hi = -1; };
    const draw = () => {
      if (!items.length) { close(); return; }
      list.innerHTML = items.map((m, i) => `<li role="option" id="opt${i}" class="${i === hi ? "on" : ""}" data-i="${i}" aria-selected="${i === hi}">
        <span>${esc(m.t)}</span><span class="sugg__y">${m.y}</span></li>`).join("");
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      if (hi >= 0) input.setAttribute("aria-activedescendant", "opt" + hi); else input.removeAttribute("aria-activedescendant");
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
      const m = chosen || exactMatch(input.value);
      if (!input.value.trim()) { toast("Type a film title first"); return; }
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
    if (!g.done) toast(m ? "Not quite" : "Skipped");
    renderGuesses();
    renderPoster();
    renderPanel();
    if (g.done) setTimeout(() => openStats(mode), 1400);
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
    const score = g.won ? `${g.guesses.length}/${MAX}` : `X/${MAX}`;
    return `Posterle ${MODES[mode].name} #${num} ${score}\n🎬 ${squares.join("")}\n${location.href.split("#")[0]}`;
  }
  async function share(mode, num) {
    const text = shareText(mode, num);
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      prompt("Copy your result:", text);
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
      <p>Guess the film from its poster. There's a new one every day, at midnight your time, in two modes.</p>
      <div class="help-modes">
        <div><h3>Focus</h3><p>${MODES.focus.help}</p></div>
        <div><h3>Variants</h3><p>${MODES.variants.help}</p></div>
      </div>
      <p>You have <strong>${MAX} tries</strong>. Start typing and pick a film from the list. Remakes that share a title count as the same answer.</p>
      <p class="muted">Every film here was a big hit or is a widely known classic — no deep cuts. Missed a day? The archive has every past poster.</p>
      <button class="btn btn--gold btn--full" data-close>Start playing</button>`);
    store.seenHelp = true; save();
  }

  function openStats(mode) {
    mode = mode || (playCtx && location.hash.includes(playCtx.mode) ? playCtx.mode : "focus");
    const s = stats(mode);
    const maxBar = Math.max(1, ...s.dist);
    const g = playCtx && playCtx.mode === mode ? getGame(mode, playCtx.num) : null;
    const lastWin = g && g.done && g.won ? g.guesses.length - 1 : -1;
    const bars = s.dist.map((v, i) => `<div class="bar"><span class="bar__n">${i + 1}</span>
      <span class="bar__fill${i === lastWin ? " on" : ""}" style="width:${Math.max(7, (v / maxBar) * 100)}%">${v}</span></div>`).join("");
    const shareBtn = g && g.done ? `<button class="btn btn--gold btn--full" id="mShare">Share result</button>` : "";
    openModal(`
      <div class="seg seg--modal" role="tablist">
        <button class="${mode === "focus" ? "on" : ""}" data-stats="focus">Focus</button>
        <button class="${mode === "variants" ? "on" : ""}" data-stats="variants">Variants</button>
      </div>
      <h2 class="modal__title">Statistics</h2>
      <div class="stats">
        <div><b>${s.played}</b><span>Played</span></div>
        <div><b>${s.pct}</b><span>Win %</span></div>
        <div><b>${s.cur}</b><span>Streak</span></div>
        <div><b>${s.best}</b><span>Best</span></div>
      </div>
      <h3 class="modal__sub">Guess distribution</h3>
      <div class="bars">${bars}</div>
      <p class="muted small">Stats count daily games played on their own day. Archive games don't count.</p>
      ${shareBtn}`);
    document.querySelectorAll("[data-stats]").forEach((b) => { b.onclick = () => openStats(b.dataset.stats); });
    const ms = $("#mShare");
    if (ms) ms.onclick = () => share(mode, playCtx.num);
  }

  $("#helpBtn").onclick = openHelp;
  $("#statsBtn").onclick = () => openStats();

  // ---------- go ----------
  route();
  if (!store.seenHelp) openHelp();

  // Roll over to the new day if the tab is left open past midnight.
  let lastDay = todayNum();
  setInterval(() => {
    if (todayNum() !== lastDay) { lastDay = todayNum(); if (/^#?\/?$/.test(location.hash)) route(); }
  }, 30000);
})();
