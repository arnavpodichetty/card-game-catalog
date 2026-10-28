// config.js — site settings for Posterle.
window.POSTERLE_CONFIG = {
  // Optional but recommended. A free TMDB API key (v3 "API Key" or v4 "Read Access Token")
  // from https://www.themoviedb.org/settings/api gives sharper posters and many more
  // alternate posters for Variants mode. Leave empty to use Wikipedia (no key needed).
  tmdbApiKey: "",

  // Puzzle #1 is this date. The archive covers every day from here to today.
  // Changing it shifts which film lands on which day, so set it once and leave it.
  launchDate: "2026-10-01",

  // Number of guesses per puzzle.
  maxGuesses: 6,
};
