// posters.js — finds a film's main poster plus visually distinct alternate posters on TMDB.
//
// Needs config.tmdbApiKey (free at https://www.themoviedb.org/settings/api).
// Every alternate is compared with the posters already kept using a tiny perceptual
// hash, so near-identical copies (same art, different text) are dropped.
// Results are cached in localStorage so a film always shows the same posters.

(function () {
  const CACHE_VERSION = 2;
  const MAX_POSTERS = 8;
  const IMG = "https://image.tmdb.org/t/p/";
  const API = "https://api.themoviedb.org/3";

  const cfg = () => window.HAZE_CONFIG || {};
  const keyFor = (movie) => movie.t + " (" + movie.y + ")";
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  class MissingKeyError extends Error {}

  async function getJSON(url, opts = {}, timeout = 12000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: ctl.signal });
      if (res.status === 401) throw new MissingKeyError("TMDB rejected the API key");
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  // ---------- image probing + perceptual hash ----------
  function probe(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      let settled = false;
      const done = (r) => { if (!settled) { settled = true; resolve(r); } };
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        let hash = null, tone = null;
        try {
          const c = document.createElement("canvas");
          c.width = 9; c.height = 8;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, 9, 8);
          const d = ctx.getImageData(0, 0, 9, 8).data;
          const lum = []; let r = 0, g = 0, b = 0;
          for (let i = 0; i < d.length; i += 4) {
            lum.push(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
            r += d[i]; g += d[i + 1]; b += d[i + 2];
          }
          hash = [];
          for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) hash.push(lum[y * 9 + x] < lum[y * 9 + x + 1] ? 1 : 0);
          const n = d.length / 4; tone = [r / n, g / n, b / n];
        } catch (e) { /* not readable cross-origin: keep it, skip de-dupe */ }
        done({ ok: true, w, h, hash, tone });
      };
      img.onerror = () => done({ ok: false });
      setTimeout(() => done({ ok: false }), 15000);
      img.src = url;
    });
  }

  function similar(a, b) {
    if (!a.hash || !b.hash) return false;
    let dist = 0;
    for (let i = 0; i < 64; i++) if (a.hash[i] !== b.hash[i]) dist++;
    const toneGap = Math.abs(a.tone[0] - b.tone[0]) + Math.abs(a.tone[1] - b.tone[1]) + Math.abs(a.tone[2] - b.tone[2]);
    return dist <= 12 && toneGap < 60;
  }

  // Keep the main poster, then every alternate that looks different from all kept ones.
  // Hashing uses small w185 images; the game displays w780.
  async function pickDistinct(mainPath, altPaths) {
    const main = await probe(IMG + "w185" + mainPath);
    if (!main.ok) return null;
    const kept = [{ path: mainPath, ...main }];
    const seen = new Set([mainPath]);
    const paths = altPaths.filter((p) => p && !seen.has(p) && seen.add(p)).slice(0, 30);
    const probes = await Promise.all(paths.map((p) => probe(IMG + "w185" + p)));
    paths.forEach((path, i) => {
      const p = probes[i];
      if (kept.length >= MAX_POSTERS || !p.ok) return;
      if (kept.some((k) => similar(k, p))) return;
      kept.push({ path, ...p });
    });
    return kept.map((k) => k.path);
  }

  async function lookup(movie, key) {
    const bearer = key.length > 60; // v4 read access token vs v3 api key
    const opts = bearer ? { headers: { Authorization: "Bearer " + key } } : {};
    const auth = bearer ? "" : "api_key=" + encodeURIComponent(key) + "&";

    let id = movie.tmdb, mainPath = null;
    if (!id) {
      const want = [movie.t, ...(movie.a || [])].map(norm);
      for (const yr of ["&primary_release_year=" + movie.y, "&year=" + movie.y, ""]) {
        const r = await getJSON(`${API}/search/movie?${auth}query=${encodeURIComponent(movie.t)}${yr}&include_adult=false`, opts);
        const hits = (r.results || []).filter((m) => m.poster_path);
        const hit = hits.find((m) => want.includes(norm(m.title)) || want.includes(norm(m.original_title))) || hits[0];
        if (hit) { id = hit.id; mainPath = hit.poster_path; break; }
      }
      if (!id) throw new Error("TMDB: no match for " + keyFor(movie));
    }
    const [details, imgs] = await Promise.all([
      mainPath ? null : getJSON(`${API}/movie/${id}?${auth}`, opts),
      getJSON(`${API}/movie/${id}/images?${auth}include_image_language=en,null`, opts),
    ]);
    if (!mainPath) mainPath = details.poster_path;
    const alts = (imgs.posters || [])
      .filter((p) => p.width >= 500)
      .sort((a, b) => (b.vote_average - a.vote_average) || (b.vote_count - a.vote_count))
      .map((p) => p.file_path);
    if (!mainPath && alts.length) mainPath = alts[0];
    if (!mainPath) throw new Error("TMDB: no poster for " + keyFor(movie));
    const paths = await pickDistinct(mainPath, alts);
    if (!paths) throw new Error("TMDB: poster failed to load");
    return paths;
  }

  const inflight = new Map();

  async function load(movie) {
    const key = (cfg().tmdbApiKey || "").trim();
    if (!key) throw new MissingKeyError("No TMDB API key in config.js");
    const cacheKey = `hazeoffice:posters:v${CACHE_VERSION}:${keyFor(movie)}`;
    let paths = null;
    try { paths = JSON.parse(localStorage.getItem(cacheKey) || "null"); } catch (e) { /* storage unavailable */ }
    if (!paths || !paths.length) {
      paths = await lookup(movie, key);
      try { localStorage.setItem(cacheKey, JSON.stringify(paths)); } catch (e) { /* ignore */ }
    }
    return paths.map((p) => ({ full: IMG + "w780" + p, thumb: IMG + "w185" + p }));
  }

  window.Posters = {
    MissingKeyError,
    get(movie) {
      const k = keyFor(movie);
      if (!inflight.has(k)) {
        inflight.set(k, load(movie).catch((e) => { inflight.delete(k); throw e; }));
      }
      return inflight.get(k);
    },
  };
})();
