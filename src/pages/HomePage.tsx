// HomePage.tsx — catalog landing: filter toolbar + game grid.
import type React from "react";
import { useState, useMemo } from "react";
import { GAMES, GENRES, DIFFICULTIES, LENGTHS, PLAYER_OPTIONS } from "../data/games";
import { Tag, TAG_TONE } from "../components/Tag";
import { CardArt } from "../components/CardArt";
import {
  Filters, FiltersInner, FilterGroup, FilterLabel, FilterSep, PillSet, Pill, PillSub,
  FiltersMetaRow, SearchWrap, SearchIcon, SearchInput, SearchClear,
  FiltersMetaRight, FiltersCount, FiltersClear,
  Home, Catalog, Grid, Card, CardArtWrap, CardPlayers, CardBody, CardTitle,
  CardDesc, CardTags, Empty, EmptyFace,
} from "./homePage.styles";
import type { Game } from "../types";

type Go = (hash: string) => void;

interface FilterState {
  players: string;
  genres: string[];
  difficulty: string | null;
  length: string | null;
}

function GameCard({ game, go }: { game: Game; go: Go }) {
  return (
    <Card
      onClick={() => go("#/game/" + game.id)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go("#/game/" + game.id)}>
      <CardArtWrap>
        <CardArt game={game} />
        <CardPlayers>{game.players} players</CardPlayers>
      </CardArtWrap>
      <CardBody>
        <CardTitle>{game.title}</CardTitle>
        <CardDesc>{game.tagline}</CardDesc>
        <CardTags>
          <Tag tone={TAG_TONE[game.genre]}>{game.genre}</Tag>
          <Tag tone={TAG_TONE[game.difficulty]}>{game.difficulty}</Tag>
          <Tag>{game.lengthLabel}</Tag>
        </CardTags>
      </CardBody>
    </Card>
  );
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  count?: number;
  active: boolean;
  onClear: () => void;
  search: string;
  setSearch: (v: string) => void;
}

// Full-width filter toolbar attached under the nav.
function FilterBar({ filters, setFilters, count, active, onClear, search, setSearch }: FilterBarProps) {
  const toggleGenre = (g: string) =>
    setFilters((f) => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g] }));
  const setSingle = (key: "difficulty" | "length", val: string) =>
    setFilters((f) => ({ ...f, [key]: f[key] === val ? null : val }));
  const setPlayers = (v: string) => setFilters((f) => ({ ...f, players: v }));

  return (
    <Filters id="browse" style={{ borderStyle: "none" }}>
      <FiltersInner>
        <FilterGroup>
          <FilterLabel>Players</FilterLabel>
          <PillSet>
            {PLAYER_OPTIONS.map((o) => (
              <Pill key={o.key} $on={filters.players === o.key} onClick={() => setPlayers(o.key)}>
                {o.label}
              </Pill>
            ))}
          </PillSet>
        </FilterGroup>
        <FilterSep aria-hidden="true" />
        <FilterGroup>
          <FilterLabel>Length</FilterLabel>
          <PillSet>
            {LENGTHS.map((l) => (
              <Pill key={l.key} $len $on={filters.length === l.key} onClick={() => setSingle("length", l.key)}>
                <span>{l.label}</span><PillSub>{l.sub}</PillSub>
              </Pill>
            ))}
          </PillSet>
        </FilterGroup>
        <FilterSep aria-hidden="true" />
        <FilterGroup>
          <FilterLabel>Genre</FilterLabel>
          <PillSet>
            {GENRES.map((g) => (
              <Pill key={g} $on={filters.genres.includes(g)} onClick={() => toggleGenre(g)}>{g}</Pill>
            ))}
          </PillSet>
        </FilterGroup>
        <FilterSep aria-hidden="true" />
        <FilterGroup>
          <FilterLabel>Difficulty</FilterLabel>
          <PillSet>
            {DIFFICULTIES.map((d) => (
              <Pill key={d} $on={filters.difficulty === d} onClick={() => setSingle("difficulty", d)}>{d}</Pill>
            ))}
          </PillSet>
        </FilterGroup>

        {count !== undefined && (
          <FiltersMetaRow>
            <SearchWrap>
              <SearchIcon width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></SearchIcon>
              <SearchInput
                type="search"
                placeholder="Search games…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search games" />
              {search && (
                <SearchClear onClick={() => setSearch("")} aria-label="Clear search">✕</SearchClear>
              )}
            </SearchWrap>
            <FiltersMetaRight>
              <FiltersCount>{count} {count === 1 ? "game" : "games"}</FiltersCount>
              {active && <FiltersClear onClick={onClear}>Clear ✕</FiltersClear>}
            </FiltersMetaRight>
          </FiltersMetaRow>
        )}
      </FiltersInner>
    </Filters>
  );
}

export function HomePage({ go }: { go: Go }) {
  const [filters, setFilters] = useState<FilterState>({ players: "Any", genres: [], difficulty: null, length: null });
  const [search, setSearch] = useState("");

  const active = !!(filters.genres.length || filters.difficulty || filters.length || filters.players !== "Any");
  const clear = () => { setFilters({ players: "Any", genres: [], difficulty: null, length: null }); setSearch(""); };

  const results = useMemo(() => GAMES.filter((g) => {
    if (filters.players !== "Any") {
      if (filters.players === "8+") {
        if (g.maxPlayers < 8) return false;
      } else {
        const n = parseInt(filters.players);
        if (g.minPlayers > n || g.maxPlayers < n) return false;
      }
    }
    if (filters.genres.length && !filters.genres.includes(g.genre)) return false;
    if (filters.difficulty && g.difficulty !== filters.difficulty) return false;
    if (filters.length && g.length !== filters.length) return false;
    if (search.trim() && !g.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  }), [filters, search]);

  return (
    <>
      <FilterBar filters={filters} setFilters={setFilters} count={results.length} active={active} onClear={clear} search={search} setSearch={setSearch} />
      <Home style={{ height: "200px" }}>
        <Catalog style={{ padding: "0px 24px 80px" }}>
          {results.length ? (
            <Grid>
              {results.map((g) => <GameCard key={g.id} game={g} go={go} />)}
            </Grid>
          ) : (
            <Empty>
              <EmptyFace>🃏</EmptyFace>
              <h3>No games match that combo.</h3>
              <p>Loosen a filter or two — there's a game for every table.</p>
            </Empty>
          )}
        </Catalog>
      </Home>
    </>
  );
}
