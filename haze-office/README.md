# Haze Office

A daily movie-poster guessing game, in the spirit of Wordle. Plain HTML/CSS/JS, no build step.

## Modes

- **Focus**: one heavily blurred poster. Each wrong guess or skip sharpens it.
- **Variants**: every poster stays at the same blur. Each wrong guess or skip unlocks a different
  poster for the same film. If a film runs out of alternates, further misses lift the blur.

Both modes get a new film every day at local midnight (6 guesses each). The **Archive** lists every
day since launch, and all of them stay playable. Stats and streaks are per mode, stored in the
browser, and count only puzzles played on their own day.

## Setup

1. Get a free TMDB API key at https://www.themoviedb.org/settings/api (either the v3 "API Key" or
   the v4 "API Read Access Token" works).
2. Paste it into `config.js` as `tmdbApiKey`.
3. Serve the folder with any static host (GitHub Pages, Netlify) or locally:
   `python3 -m http.server 8000`

Without a key the game shows a "Posters need a TMDB key" message in the poster frame.
The key is visible in the page source; TMDB's read-only keys are meant for client-side use.

## Posters

All posters come from TMDB at 780px wide. For each film the game finds it by title and year,
takes TMDB's main poster, then adds alternates from TMDB's poster gallery. Alternates are compared
with a small perceptual hash so near-identical copies (same art, different text) are dropped.
Results are cached in the browser so a film always shows the same posters.

If the title search ever picks the wrong film, add its TMDB id to that entry in `movies.js`,
for example `{"t":"Contact","y":1997,"tmdb":686}`.

## Design

Modeled on how film sites present a catalog: each puzzle is a film page (poster left, serif title,
credits from TMDB once solved), the archive is a poster grid, and the interface stays achromatic so
the posters carry the color. Square corners, uppercase interface labels on hairline rules.
Fonts: Newsreader (titles) and Schibsted Grotesk (interface), from Google Fonts.

## Films

`movies.js` holds 639 well-known films (major box-office hits, widely seen classics and award
winners). **The list order is the schedule**, so add new films only at the end. Each mode walks
the list on its own track, offset by half its length, so the two modes never show the same film
on the same day.

`config.js` also sets `launchDate` (puzzle #1). Changing it re-maps every day, so set it once.
