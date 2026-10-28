// posters.js — everything the game needs from TMDB.
//
//   Posters.get(movie)     → { posters: [{ full, thumb }], id }  main poster + distinct alternates
//   Posters.getMain(movie) → { url, id }                          just the main poster (archive grid)
//   Posters.details(movie) → { director, runtime, genres, tagline } shown once a puzzle is finished
//
// Alternates are compared with a tiny perceptual hash so near-identical copies are dropped.
// Everything is cached in localStorage so a film always shows the same posters.

(function () {
  const VERSION = 3;
  const MAX_POSTERS = 8;
  const IMG = "https://image.tmdb.org/t/p/";
  const API = "https://api.themoviedb.org/3";

  const cfg = () => window.HAZE_CONFIG || {};
  const keyFor = (movie) => movie.t + " (" + movie.y + ")";
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  class MissingKeyError extends Error {}

  // ---------- cache ----------
  const cacheGet = (k) => { try { return JSON.parse(localStorage.getItem(`hazeoffice:${k}:v${VERSION}`) || "null"); } catch (e) { return null; } };
  const cacheSet = (k, v) => { try { localStorage.setItem(`hazeoffice:${k}:v${VERSION}`, JSON.stringify(v)); } catch (e) { /* full or blocked */ } };

  // ---------- API ----------
  function auth() {
    const key = (cfg().tmdbApiKey || "").trim();
    if (!key) throw new MissingKeyError("No TMDB API key in config.js");
    const bearer = key.length > 60; // v4 read access token vs v3 api key
    return { opts: bearer ? { headers: { Authorization: "Bearer " + key } } : {}, qs: bearer ? "" : "api_key=" + encodeURIComponent(key) + "&" };
  }

  async function api(path, params = "") {
    const { opts, qs } = auth();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await fetch(`${API}${path}?${qs}${params}`, { ...opts, signal: ctl.signal });
      if (res.status === 401) throw new MissingKeyError("TMDB rejected the API key");
      if (!res.ok) throw new Error("TMDB HTTP " + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  // Find the film: { id, path } of its main poster.
  async function search(movie) {
    const cached = cacheGet("main:" + keyFor(movie));
    if (cached) return cached;
    let found = null;
    if (movie.tmdb) {
      const d = await api(`/movie/${movie.tmdb}`);
      found = { id: d.id, path: d.poster_path };
    } else {
      const want = [movie.t, ...(movie.a || [])].map(norm);
      for (const yr of ["&primary_release_year=" + movie.y, "&year=" + movie.y, ""]) {
        const r = await api("/search/movie", `query=${encodeURIComponent(movie.t)}${yr}&include_adult=false`);
        const hits = (r.results || []).filter((m) => m.poster_path);
        const hit = hits.find((m) => want.includes(norm(m.title)) || want.includes(norm(m.original_title))) || hits[0];
        if (hit) { found = { id: hit.id, path: hit.poster_path }; break; }
      }
    }
    if (!found || !found.path) throw new Error("TMDB: no match for " + keyFor(movie));
    cacheSet("main:" + keyFor(movie), found);
    return found;
  }

  // ---------- image probing + perceptual hash ----------
  function probe(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      let settled = false;
      const done = (r) => { if (!settled) { settled = true; resolve(r); } };
      img.onload = () => {
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
        done({ ok: true, hash, tone });
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
  async function pickDistinct(mainPath, altPaths) {
    const main = await probe(IMG + "w185" + mainPath);
    if (!main.ok) return null;
    const kept = [{ path: mainPath, ...main }];
    const seen = new Set([mainPath]);
    const paths = altPaths.filter((p) => p && !seen.has(p) && seen.add(p)).slice(0, 30);
    const probes = await Promise.all(paths.map((p) => probe(IMG + "w185" + p)));
    paths.forEach((path, i) => {
      const p = probes[i];
      if (kept.length >= MAX_POSTERS || !p.ok || kept.some((k) => similar(k, p))) return;
      kept.push({ path, ...p });
    });
    return kept.map((k) => k.path);
  }

  async function loadAll(movie) {
    let paths = cacheGet("posters:" + keyFor(movie));
    const { id, path } = await search(movie);
    if (!paths || !paths.length) {
      const imgs = await api(`/movie/${id}/images`, "include_image_language=en,null");
      const alts = (imgs.posters || [])
        .filter((p) => p.width >= 500)
        .sort((a, b) => (b.vote_average - a.vote_average) || (b.vote_count - a.vote_count))
        .map((p) => p.file_path);
      paths = await pickDistinct(path, alts);
      if (!paths) throw new Error("TMDB: poster failed to load");
      cacheSet("posters:" + keyFor(movie), paths);
    }
    return { id, posters: paths.map((p) => ({ full: IMG + "w780" + p, thumb: IMG + "w185" + p })) };
  }

  async function loadDetails(movie) {
    const cached = cacheGet("details:" + keyFor(movie));
    if (cached) return cached;
    const { id } = await search(movie);
    const d = await api(`/movie/${id}`, "append_to_response=credits");
    const directors = ((d.credits && d.credits.crew) || []).filter((c) => c.job === "Director").map((c) => c.name);
    const out = {
      director: directors.slice(0, 2).join(" & "),
      runtime: d.runtime || null,
      genres: (d.genres || []).slice(0, 3).map((g) => g.name),
      tagline: d.tagline || "",
    };
    cacheSet("details:" + keyFor(movie), out);
    return out;
  }

  // De-duplicate concurrent requests for the same thing.
  const inflight = new Map();
  function once(kind, movie, fn) {
    const k = kind + ":" + keyFor(movie);
    if (!inflight.has(k)) inflight.set(k, fn(movie).catch((e) => { inflight.delete(k); throw e; }));
    return inflight.get(k);
  }

  window.Posters = {
    MissingKeyError,
    get: (movie) => once("all", movie, loadAll),
    getMain: (movie) => once("main", movie, async (m) => { const { id, path } = await search(m); return { id, url: IMG + "w342" + path }; }),
    details: (movie) => once("details", movie, loadDetails),
  };
})();
