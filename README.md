# Card Game Catalog

A React + TypeScript catalog of card games with networked (PeerJS/WebRTC)
multiplayer for select titles. Single-page app, hash-routed, built with Vite.

## Develop

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # typecheck (tsc) + production build to dist/
npm run typecheck  # type-check only
npm run preview    # preview the production build
```

## Structure

```
index.html                catalog entry — the only HTML file (SPA)
src/
  main.tsx                mounts <App>
  App.tsx                 theme + hash router + page switch
  types.ts                shared domain types (Game, Route, …)
  styles.css              catalog styles (CSS-variable theming)
  data/games.ts           catalog data + filter option tables
  lib/
    theme.ts              palettes / typography + applyTheme()
    router.ts             parseRoute() hash router
    genCode.ts            4-letter room codes
  components/             shared UI (Button, Nav, Tag, icons, CardArt, RoomPanel…)
  pages/
    HomePage.tsx          catalog grid + filters
    GamePage.tsx          game detail + host room panel
    JoinPage.tsx          guest room-code entry
    CairoGame.tsx  + cairoGame.css     in-app game (scoped styles)
    TheTellGame.tsx + theTellGame.css  in-app game (scoped styles)
```

## Routing

All views are hash routes inside the one page:

| Route                         | View                                    |
| ----------------------------- | --------------------------------------- |
| `#/`                          | catalog                                 |
| `#/game/:id`                  | game detail (host creates a room)       |
| `#/join`                      | guest enters a room code                |
| `#/play/:id?host=CODE`        | in-app game, launched as host           |
| `#/play/:id?join=CODE`        | in-app game, launched as guest          |

The host's room panel opens a PeerJS peer at `<prefix><code>`; the join flow
probes each registered game's peer id and routes the code to whichever game
answers. Each game renders inside a `.<game>-page` wrapper so its stylesheet
(which sets `:root` vars and element resets) stays scoped to that route.

## TypeScript

`tsconfig.json` is strict on app code but relaxes `noImplicitAny` and
`strictNullChecks` so the large game modules type-check cleanly; tighten these
incrementally.
