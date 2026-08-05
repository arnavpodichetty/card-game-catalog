// Nav.tsx — top navigation bar.
import { SuitLogo } from "./icons";
import { Btn } from "./Button";
import type { Route } from "../types";

export function Nav({ route, go }: { route: Route; go: (hash: string) => void }) {
  const onHome = route.view === "home";
  const onGame = route.view === "game";
  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>
          <SuitLogo size={38} />
          <span className="brand__name">Card Game Catalog</span>
        </a>
        <nav className="nav__links">
          {!onHome && !onGame && (
            <a className="nav__link" href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>Browse</a>
          )}
          <Btn kind="join" size="sm" icon="arrow" href="#/join"
            onClick={(e) => { e.preventDefault(); go("#/join"); }}>Join Game</Btn>
        </nav>
      </div>
    </header>
  );
}
