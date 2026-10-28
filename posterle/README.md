# Posterle

A daily movie-poster guessing game, in the spirit of Wordle. Plain HTML/CSS/JS — no build step.

## Modes

- **Focus** — one heavily blurred poster. Each wrong guess or skip sharpens it.
- **Variants** — every poster stays at the same blur. Each wrong guess or skip unlocks a
  different poster for the same film. If a film runs out of alternates, further misses lift the blur.

Both modes get a new film every day at local midnight (6 guesses each). The **Archive** lists every
day since launch, and all of them stay playable. Stats and streaks are per mode, stored in the
browser, and count only puzzles played on their own day.

## Running it

Serve the folder with any static server (opening `index.html` straight from disk also works):

```sh
cd posterle && python3 -m http.server 8000
```

It works on GitHub Pages, Netlify, etc. as-is.

## Posters

Posters are fetched by the player's browser and cached locally:

- **TMDB (recommended).** Put a free API key in `config.js` (`tmdbApiKey`). TMDB has dozens of
  posters per popular film, so Variants mode gets the full 6 posters. The key is visible to anyone
  who views the page source, which is normal for TMDB's read-only keys.
- **Wikipedia (no key).** The main poster comes from English Wikipedia; alternates come from other
  language Wikipedias, which often use a different regional poster. Fewer alternates per film.

Alternate posters are compared with a small perceptual hash, so near-identical copies are dropped.

## Films

`movies.js` holds 639 well-known films (major box-office hits, widely seen classics and award
winners). **The list order is the schedule**, so add new films only at the end. Each mode walks
the list on its own track, offset by half its length, so the two modes never show the same film
on the same day.

`config.js` also sets `launchDate` (puzzle #1). Changing it re-maps every day, so set it once.
