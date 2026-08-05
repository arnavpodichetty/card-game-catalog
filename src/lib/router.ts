// router.ts — tiny hash router. Routes:
//   #/                        → home
//   #/join                    → join a room (probes for the right game)
//   #/game/:id                → game detail (?how=1 opens the how-to-play section)
//   #/play/:id?host=|join=    → in-app game, launched as host or guest
import type { Route } from "../types";

export function parseRoute(): Route {
  const h = (location.hash || "#/").replace(/^#/, "");
  const [path, query] = h.split("?");
  const parts = path.split("/").filter(Boolean); // ['game','id'] etc
  const q = new URLSearchParams(query || "");
  if (parts[0] === "join") return { view: "join" };
  if (parts[0] === "play") {
    return { view: "play", id: parts[1], host: q.get("host") || undefined, join: q.get("join") || undefined };
  }
  if (parts[0] === "game") return { view: "game", id: parts[1], how: q.get("how") === "1" };
  return { view: "home" };
}
