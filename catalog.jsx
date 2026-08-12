// catalog.jsx — Homepage: search row, sidebar filters, game grid
const { useState: useStateC, useMemo } = React;

/* ---------- game card (stacked-deck sticker look) ---------- */
function GameCard({ game, go }) {
  const isFlagship = !!game.motif;
  const style = isFlagship ? { "--card-accent": FLAGSHIP_PALETTE[game.accent] } : undefined;
  return (
    <article className={"gcard" + (!isFlagship ? " gcard--" + game.color : "")}
    style={style}
    onClick={() => go("#/game/" + game.id)}
    role="button" tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && go("#/game/" + game.id)}>
      {game.sticker &&
      <span className={"gcard__sticker gcard__sticker--" + game.sticker}>{STICKER_TEXT[game.sticker]}</span>
      }
      <span className="gcard__titlepill">{game.title}</span>
      <div className="gcard__art"><GameDoodle game={game} /></div>
      <p className="gcard__tagline">{game.tagline}</p>
      <div className="gcard__pills">
        <Tag tone={TAG_TONE[game.genre]}>{game.genre}</Tag>
        <Tag tone={TAG_TONE[game.difficulty]}>{game.difficulty}</Tag>
        <Tag>{game.lengthLabel}</Tag>
      </div>
      <div className="gcard__playerbar">{game.players} PLAYERS</div>
    </article>);

}

/* ---------- sidebar filter panel ---------- */
function FilterBar({ filters, setFilters, active, onClear }) {
  const toggleGenre = (g) =>
  setFilters((f) => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g] }));
  const setSingle = (key, val) =>
  setFilters((f) => ({ ...f, [key]: f[key] === val ? null : val }));
  const setPlayers = (v) => setFilters((f) => ({ ...f, players: v }));

  return (
    <aside className="sidefilters">
      <div className="sidefilters__head">
        <h2 className="sidefilters__h">filters</h2>
        <HandUnderline width={90} height={10} color="var(--orange, #D9773D)" />
      </div>

      <div className="filtergroup filtergroup--v">
        <span className="filters__label">players</span>
        <div className="pillset">
          {PLAYER_OPTIONS.map((o) =>
          <button key={o.key}
          className={"pill pill--toggle" + (filters.players === o.key ? " is-on" : "")}
          onClick={() => setPlayers(o.key)}>{o.label}</button>
          )}
        </div>
      </div>

      <div className="sidefilters__sep" aria-hidden="true" />

      <div className="filtergroup filtergroup--v">
        <span className="filters__label">length</span>
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

      <div className="sidefilters__sep" aria-hidden="true" />

      <div className="filtergroup filtergroup--v">
        <span className="filters__label">genre</span>
        <div className="pillset">
          {GENRES.map((g) =>
          <button key={g}
          className={"pill pill--toggle" + (filters.genres.includes(g) ? " is-on" : "")}
          onClick={() => toggleGenre(g)}>{g}</button>
          )}
        </div>
      </div>

      <div className="sidefilters__sep" aria-hidden="true" />

      <div className="filtergroup filtergroup--v">
        <span className="filters__label">difficulty</span>
        <div className="pillset">
          {DIFFICULTIES.map((d) =>
          <button key={d}
          className={"pill pill--toggle" + (filters.difficulty === d ? " is-on" : "")}
          onClick={() => setSingle("difficulty", d)}>{d}</button>
          )}
        </div>
      </div>

      <TopPickBadge style={{ position: "absolute", top: -16, right: -16 }} />

      <button className="sidefilters__reset" onClick={onClear} disabled={!active}>
        <DieDoodle style={{ width: 15, height: 15, position: "static", filter: "none" }} /> reset
      </button>
    </aside>);

}

/* ---------- search + count row ---------- */
function SearchRow({ search, setSearch, count }) {
  return (
    <div className="searchrow">
      <div className="searchrow__box">
        <span className="searchrow__pencil" aria-hidden="true">✎</span>
        <input
        className="searchrow__input"
        type="search"
        placeholder="search games…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search games" />

        {search &&
        <button className="searchrow__clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
        }
      </div>
      <div className="searchrow__count">
        <MascotDoodle size={26} />
        <span className="searchrow__counttext">{count} game{count === 1 ? "" : "s"}!</span>
      </div>
    </div>);

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
    <main className="home">
      <div className="catalog">
        <SearchRow search={search} setSearch={setSearch} count={results.length} />

        <div className="catalog__layout">
          <FilterBar filters={filters} setFilters={setFilters} active={active} onClear={clear} />

          <div className="catalog__grid-wrap">
            <PencilDoodle style={{ position: "absolute", left: -10, bottom: -30, width: 110, height: 29, transform: "rotate(-8deg)" }} />
            <DieDoodle style={{ position: "absolute", right: -14, bottom: -18, width: 50, height: 50, transform: "rotate(10deg)" }} />
            <StickyNoteDoodle style={{ position: "absolute", right: 90, bottom: -20, width: 52, height: 52, transform: "rotate(6deg)" }} />

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
        </div>
      </div>
    </main>);


}

Object.assign(window, { HomePage, GameCard, FilterBar });
