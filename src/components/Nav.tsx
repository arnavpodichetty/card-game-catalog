// Nav.tsx — top navigation bar.
import { SuitLogo } from "./icons";
import { Btn } from "./Button";
import { Brand, BrandName } from "./brand.styles";
import { NavBar, NavInner, NavLinks, NavLink } from "./nav.styles";
import type { Route } from "../types";

export function Nav({ route, go }: { route: Route; go: (hash: string) => void }) {
  const onHome = route.view === "home";
  const onGame = route.view === "game";
  return (
    <NavBar>
      <NavInner>
        <Brand href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>
          <SuitLogo size={38} />
          <BrandName>Card Game Catalog</BrandName>
        </Brand>
        <NavLinks>
          {!onHome && !onGame && (
            <NavLink href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>Browse</NavLink>
          )}
          <Btn kind="join" size="sm" icon="arrow" href="#/join"
            onClick={(e) => { e.preventDefault(); go("#/join"); }}>Join Game</Btn>
        </NavLinks>
      </NavInner>
    </NavBar>
  );
}
