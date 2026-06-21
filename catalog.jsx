// catalog.jsx — Homepage: hero, filter bar, game grid
const { useState: useStateC, useMemo } = React;

/* ---------- game card ---------- */
function GameCard({ game, go }) {
  return (
    <article className={"card card--" + game.color}
    onClick={() => go("#/game/" + game.id)}
    role="button" tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && go("#/game/" + game.id)}>
      <div className="card__art">
        <CardArt game={game} />
        <span className="card__players">{game.players} players</span>
      </div>
      <div className="card__body">
        <h3 className="card__title">{game.title}</h3>
        <p className="card__desc">{game.tagline}</p>
        <div className="card__tags">
          <Tag tone={TAG_TONE[game.genre]}>{game.genre}</Tag>
          <Tag tone={TAG_TONE[game.difficulty]}>{game.difficulty}</Tag>
          <Tag>{game.lengthLabel}</Tag>
        </div>
      </div>
    </article>);

}

/* ---------- filter toolbar (attached under nav, full-width) ---------- */
function FilterBar({ filters, setFilters, count, active, onClear, search, setSearch }) {
  const toggleGenre = (g) =>
  setFilters((f) => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g] }));
  const setSingle = (key, val) =>
  setFilters((f) => ({ ...f, [key]: f[key] === val ? null : val }));
  const setPlayers = (v) => setFilters((f) => ({ ...f, players: v }));

  return (
    <section className="filters" id="browse" style={{ borderStyle: "none" }}>
      <div className="filters__inner">
        <div className="filtergroup">
          <span className="filters__label">Players</span>
          <div className="pillset">
            {PLAYER_OPTIONS.map((o) =>
            <button key={o.key}
            className={"pill pill--toggle" + (filters.players === o.key ? " is-on" : "")}
            onClick={() => setPlayers(o.key)}>{o.label}</button>
            )}
          </div>
        </div>
        <span className="filters__sep" aria-hidden="true" />
        <div className="filtergroup">
          <span className="filters__label">Length</span>
          <div className="pillset">
            {LENGTHS.map((l) =>
            <button key={l.key}
            className={"pill pill--toggle pill--len" + (filters.length === l.key ? " is-on" : "")}
            onClick={() => setSingle("length", l.key)}>
                <span>{l.label}</span><em>{l.sub}</em>
              </button>
            )}
          </div>
        </div>
        <span className="filters__sep" aria-hidden="true" />
        <div className="filtergroup">
          <span className="filters__label">Genre</span>
          <div className="pillset">
            {GENRES.map((g) =>
            <button key={g}
            className={"pill pill--toggle" + (filters.genres.includes(g) ? " is-on" : "")}
            onClick={() => toggleGenre(g)}>{g}</button>
            )}
          </div>
        </div>
        <span className="filters__sep" aria-hidden="true" />
        <div className="filtergroup">
          <span className="filters__label">Difficulty</span>
          <div className="pillset">
            {DIFFICULTIES.map((d) =>
            <button key={d}
            className={"pill pill--toggle" + (filters.difficulty === d ? " is-on" : "")}
            onClick={() => setSingle("difficulty", d)}>{d}</button>
            )}
          </div>
        </div>

        {count !== undefined &&
        <div className="filters__meta-row">
            <div className="filters__search-wrap">
              <svg className="filters__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
              <input
              className="filters__search"
              type="search"
              placeholder="Search games…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search games" />
            
              {search &&
            <button className="filters__search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
            }
            </div>
            <div className="filters__meta-right">
              <span className="filters__count">{count} {count === 1 ? "game" : "games"}</span>
              {active && <button className="filters__clear" onClick={onClear}>Clear ✕</button>}
            </div>
          </div>
        }
      </div>
    </section>);

}

/* ---------- homepage ---------- */
function HomePage({ go }) {
  const [filters, setFilters] = useStateC({ players: "Any", genres: [], difficulty: null, length: null });
  const [search, setSearch] = useStateC("");

  const active = filters.genres.length || filters.difficulty || filters.length || filters.players !== "Any";
  const clear = () => {setFilters({ players: "Any", genres: [], difficulty: null, length: null });setSearch("");};

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
      <main className="home" style={{ height: "200px" }}>
        <div className="catalog" style={{ padding: "0px 24px 80px" }}>
          {results.length ?
          <div className="grid">
              {results.map((g) => <GameCard key={g.id} game={g} go={go} />)}
            </div> :
          <div className="empty">
              <span className="empty__face">🃏</span>
              <h3>No games match that combo.</h3>
              <p>Loosen a filter or two — there's a game for every table.</p>
            </div>
          }
        </div>
      </main>
    </>);


}

Object.assign(window, { HomePage, GameCard, FilterBar });