// config.js — site settings for Haze Office.
window.HAZE_CONFIG = {
  // Required. Posters come from TMDB. Get a free key at https://www.themoviedb.org/settings/api
  // and paste either the "API Key" (v3) or the "API Read Access Token" (v4) here.
  // It is visible to anyone who views the page source; TMDB read-only keys are meant for that.
  tmdbApiKey: "",

  // Puzzle #1 is this date. The archive covers every day from here to today.
  // Changing it shifts which film lands on which day, so set it once and leave it.
  launchDate: "2026-10-01",

  // Number of guesses per puzzle.
  maxGuesses: 6,
};
