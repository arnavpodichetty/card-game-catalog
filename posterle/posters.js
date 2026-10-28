// posters.js — finds a film's main poster plus visually distinct alternate posters.
//
// Sources (fetched by the player's browser):
//   1. TMDB, when config.tmdbApiKey is set — main poster + many alternates.
//   2. Wikipedia otherwise — main poster from English Wikipedia; alternates from
//      other-language Wikipedias, which often carry a different regional release poster.
// Every candidate is loaded, checked for a poster-like shape, and compared with a
// tiny perceptual hash so near-identical posters are dropped.
// Results are cached in localStorage so a film always shows the same posters.

(function () {
  const CACHE_VERSION = 1;
  const MAX_ALTS = 7;
  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

  // Wikipedias that host local copies of film posters (most others only allow free images).
  const ALT_WIKIS = ["ru", "it", "uk", "fa", "he", "vi", "ar", "hu", "sr", "tr", "id", "hy", "ka", "bg", "el", "fi", "th", "hi", "bn", "kk", "ms", "az", "ur", "ta"];

  const cfg = () => window.POSTERLE_CONFIG || {};

  function keyFor(movie) { return movie.t + " (" + movie.y + ")"; }

  async function getJSON(url, opts = {}, timeout = 12000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: ctl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  // ---------- image probing + perceptual hash ----------
  function probe(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      const done = (r) => { img.onload = img.onerror = null; resolve(r); };
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
        } catch (e) { /* image not readable cross-origin: keep it, skip de-dupe */ }
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

  const posterShaped = (p) => p.ok && p.w >= 120 && p.h / p.w >= 1.3 && p.h / p.w <= 1.65;

  // Keep the first poster, then every candidate that looks different from all kept ones.
  async function pickDistinct(primaryUrl, candidateUrls) {
    const kept = [];
    const primary = await probe(primaryUrl);
    if (!primary.ok) return null;
    kept.push({ url: primaryUrl, ...primary });
    const seen = new Set([primaryUrl]);
    const urls = candidateUrls.filter((u) => u && !seen.has(u) && seen.add(u)).slice(0, 24);
    const probes = await Promise.all(urls.map(probe));
    urls.forEach((url, i) => {
      const p = probes[i];
      if (kept.length > MAX_ALTS) return;
      if (!posterShaped(p)) return;
      if (kept.some((k) => similar(k, p))) return;
      kept.push({ url, ...p });
    });
    return kept.map((k) => k.url);
  }

  // ---------- TMDB ----------
  async function fromTMDB(movie, key) {
    const bearer = key.length > 60;
    const opts = bearer ? { headers: { Authorization: "Bearer " + key } } : {};
    const auth = bearer ? "" : "api_key=" + encodeURIComponent(key) + "&";
    const base = "https://api.themoviedb.org/3";
    const q = encodeURIComponent(movie.t);
    let hit = null;
    for (const yr of ["&primary_release_year=" + movie.y, "&year=" + movie.y, ""]) {
      const r = await getJSON(`${base}/search/movie?${auth}query=${q}${yr}&include_adult=false`, opts);
      hit = (r.results || []).find((m) => m.poster_path);
      if (hit) break;
    }
    if (!hit) throw new Error("TMDB: not found");
    const imgs = await getJSON(`${base}/movie/${hit.id}/images?${auth}include_image_language=en,null`, opts);
    const alts = (imgs.posters || [])
      .slice()
      .sort((a, b) => (b.vote_average - a.vote_average) || (b.vote_count - a.vote_count))
      .map((p) => TMDB_IMG + p.file_path);
    const posters = await pickDistinct(TMDB_IMG + hit.poster_path, alts);
    if (!posters) throw new Error("TMDB: poster failed to load");
    return posters;
  }

  // ---------- Wikipedia ----------
  const wikiAPI = (lang) => `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*`;
  const thumbOf = (p) => (p && (p.thumbnail && p.thumbnail.source)) || (p && p.original && p.original.source) || null;

  async function fromWikipedia(movie) {
    const cands = movie.w ? [movie.w] : [`${movie.t} (${movie.y} film)`, `${movie.t} (film)`, movie.t];
    const url = wikiAPI("en") + "&action=query&redirects=1&prop=pageimages|pageprops|description" +
      "&piprop=thumbnail|original&pithumbsize=640&pilicense=any&ppprop=wikibase_item&titles=" +
      encodeURIComponent(cands.join("|"));
    const r = await getJSON(url);
    const pages = ((r.query && r.query.pages) || []).filter((p) => !p.missing && thumbOf(p));
    const score = (p) => {
      const d = (p.description || "").toLowerCase();
      let s = 0;
      if (d.includes("film") || d.includes("movie")) s += 2;
      if (d.includes(String(movie.y))) s += 3;
      if (d.includes("disambiguation") || d.includes("novel") || d.includes("franchise")) s -= 5;
      if (p.title.includes("(" + movie.y + " film)")) s += 1;
      return s;
    };
    pages.sort((a, b) => score(b) - score(a));
    const page = movie.w ? pages[0] : pages.find((p) => score(p) >= 2);
    if (!page) throw new Error("Wikipedia: no poster for " + keyFor(movie));
    const primary = thumbOf(page);

    // Alternates: same film on other-language Wikipedias, via Wikidata sitelinks.
    let altUrls = [];
    const qid = page.pageprops && page.pageprops.wikibase_item;
    if (qid) {
      try {
        const wd = await getJSON(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&ids=${qid}`);
        const links = (wd.entities && wd.entities[qid] && wd.entities[qid].sitelinks) || {};
        const targets = ALT_WIKIS.filter((l) => links[l + "wiki"]).slice(0, 14);
        const results = await Promise.all(targets.map(async (lang) => {
          try {
            const rr = await getJSON(wikiAPI(lang) + "&action=query&prop=pageimages&piprop=thumbnail|original&pithumbsize=640&pilicense=any&titles=" +
              encodeURIComponent(links[lang + "wiki"].title), {}, 8000);
            return thumbOf(((rr.query && rr.query.pages) || [])[0]);
          } catch (e) { return null; }
        }));
        altUrls = results.filter(Boolean);
      } catch (e) { /* alternates are best-effort */ }
    }
    const posters = await pickDistinct(primary, altUrls);
    if (!posters) throw new Error("Wikipedia: poster failed to load");
    return posters;
  }

  // ---------- public API ----------
  const inflight = new Map();

  async function load(movie) {
    const key = (cfg().tmdbApiKey || "").trim();
    const source = key ? "tmdb" : "wiki";
    const cacheKey = `posterle:posters:v${CACHE_VERSION}:${source}:${keyFor(movie)}`;
    try {
      const hit = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (hit && hit.length) return hit;
    } catch (e) { /* storage unavailable */ }

    let posters;
    if (key) {
      try { posters = await fromTMDB(movie, key); }
      catch (e) { console.warn("[posterle] TMDB failed, falling back to Wikipedia:", e); posters = await fromWikipedia(movie); }
    } else {
      posters = await fromWikipedia(movie);
    }
    try { localStorage.setItem(cacheKey, JSON.stringify(posters)); } catch (e) { /* ignore */ }
    return posters;
  }

  window.Posters = {
    get(movie) {
      const k = keyFor(movie);
      if (!inflight.has(k)) {
        const p = load(movie).catch((e) => { inflight.delete(k); throw e; });
        inflight.set(k, p);
      }
      return inflight.get(k);
    },
  };
})();
