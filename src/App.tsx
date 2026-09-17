// App.tsx — root: applies the theme, watches the hash route, renders the page.
import { useState, useEffect } from "react";
import { applyTheme, TWEAK_DEFAULTS } from "./lib/theme";
import { parseRoute } from "./lib/router";
import { GAMES } from "./data/games";
import { Nav } from "./components/Nav/Nav";
import { FloatingCards } from "./components/FloatingCards";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { JoinPage } from "./pages/JoinPage";
import { CairoGame } from "./pages/CairoGame";
import { TheTellGame } from "./pages/TheTellGame";
import { CairoPage } from "./pages/cairoGame.styles";
import { TheTellPage } from "./pages/theTellGame.styles";
import { GamePageMain, NotFound, BackLink } from "./pages/gamePage.styles";
import { AppShell, ViewFade } from "./styles/app.styles";

// In-app games, keyed by play-route id. Each renders inside a scoped wrapper
// that owns the game's own theme vars and element resets, so they can't leak
// into the rest of the app.
function PlayView({ id, host, join }: { id?: string; host?: string; join?: string }) {
  if (id === "cairo") {
    return <CairoPage><CairoGame hostCode={host} joinCode={join} /></CairoPage>;
  }
  if (id === "the-tell") {
    return <TheTellPage><TheTellGame hostCode={host} joinCode={join} /></TheTellPage>;
  }
  return (
    <GamePageMain>
      <NotFound>
        <span>🃏</span>
        <h2>That game wandered off.</h2>
        <BackLink href="#/">← Back to catalog</BackLink>
      </NotFound>
    </GamePageMain>
  );
}

export default function App() {
  const [t] = useState(TWEAK_DEFAULTS);
  const [route, setRoute] = useState(parseRoute());

  useEffect(() => {
    const onHash = () => { setRoute(parseRoute()); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { applyTheme(t); }, [t.palette, t.type, t.radius]);

  const go = (hash: string) => { location.hash = hash; };

  let page;
  if (route.view === "join") page = <JoinPage go={go} />;
  else if (route.view === "play") page = <PlayView id={route.id} host={route.host} join={route.join} />;
  else if (route.view === "game") page = <GamePage game={GAMES.find((g) => g.id === route.id)} go={go} openHow={route.how} />;
  else page = <HomePage go={go} />;

  // Games run full-screen with their own chrome; the catalog shows nav + background.
  const isPlay = route.view === "play";
  const showNav = route.view === "home" || route.view === "game";
  const routeId = "id" in route ? route.id : "";

  return (
    <AppShell>
      {!isPlay && <FloatingCards />}
      {showNav && <Nav route={route} go={go} />}
      <ViewFade key={route.view + (routeId || "")}>{page}</ViewFade>
    </AppShell>
  );
}
