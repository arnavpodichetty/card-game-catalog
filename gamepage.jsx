// gamepage.jsx — individual game view
const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function DetailedRules({ sections }) {
  return (
    <div className="dr">
      {sections.map((section) =>
      <div className="dr__section" key={section.id}>
          <h3 className="dr__stitle">{section.title}</h3>

          {section.paras &&
        <div className="dr__paras">
              {section.paras.map((p, i) => <p className="dr__p" key={i}>{p}</p>)}
            </div>
        }

          {(section.intro || section.groups || section.items) &&
        <>
              {section.intro && <p className="dr__intro">{section.intro}</p>}

              {section.groups &&
          <div className="dr__groups">
                  {section.groups.map((group, gi) =>
            <div className="dr__group" key={gi}>
                      <div className="dr__ghead">
                        <span className="dr__gname">{group.name}</span>
                        {group.note && <span className="dr__gnote">{group.note}</span>}
                      </div>
                      <div className="dr__itemlist">
                        {group.items.map((item, ii) =>
                <div className="dr__item" key={ii}>
                            <span className="dr__iname">{item.name}</span>
                            <p className="dr__id">{item.d}</p>
                          </div>
                )}
                      </div>
                    </div>
            )}
                </div>
          }

              {section.items && !section.groups &&
          <div className="dr__itemlist">
                  {section.items.map((item, ii) =>
            <div className="dr__item" key={ii}>
                      <span className="dr__iname">{item.name}</span>
                      <p className="dr__id">{item.d}</p>
                    </div>
            )}
                </div>
          }
            </>
        }
        </div>
      )}
    </div>);

}

function genCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O
  let s = "";
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

function Accordion({ rules }) {
  return (
    <div className="acc">
      <div className="acc__item is-open">
        <div className="acc__body" style={{ gridTemplateRows: "1fr" }}>
          <div className="acc__bodyinner">
            {rules.map((r, i) =>
            <div className="acc__rule" key={i}>
                <span className="acc__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="acc__rulet">{r.t}</p>
                  <p className="acc__ruled">{r.d}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}

function RoomCode({ code, onNew, launchHref }) {
  const [copied, setCopied] = useStateG(false);
  const copy = () => {
    const txt = "Join my Card Game Catalog game — room code " + code;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="room">
      <span className="room__label">Your room is live — share the code</span>
      <div className="room__code">
        {code.split("").map((c, i) => <span className="room__char" key={i}>{c}</span>)}
      </div>
      <div className="room__actions">
        <Btn kind="secondary" size="md" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy invite"}
        </Btn>
        <button className="room__new" onClick={onNew}>New code</button>
      </div>
      <span className="room__hint">Players go to <b>cardgamecatalog.gg/join</b> and punch in <b>{code}</b>.</span>
      {launchHref && (
        <a className="room__launch" href={launchHref}>Start Game</a>
      )}
    </div>);

}

const CIRCLE_PEER_PREFIX = 'circleoftrust-';
const CIRCLE_MIN_PLAYERS = 5;

function CircleRoomPanel({ code, onNew, onJoinInstead }) {
  const [copied, setCopied] = useStateG(false);
  const [hostName, setHostName] = useStateG('Host');
  const [roster, setRoster] = useStateG([{ id: 'host', name: 'Host' }]);
  const peerRef = useRefG(null);
  const connsRef = useRefG([]); // [{ conn, name }]
  const hostNameRef = useRefG('Host');

  const rebuildRoster = () => {
    const list = [{ id: 'host', name: hostNameRef.current || 'Host' },
      ...connsRef.current.map(c => ({ id: c.conn.peer, name: c.name }))];
    setRoster(list);
    connsRef.current.forEach(c => {
      if (c.conn.open) { try { c.conn.send({ t: 'ROSTER', players: list }); } catch (_) {} }
    });
  };

  useEffectG(() => {
    connsRef.current = [];
    setRoster([{ id: 'host', name: hostNameRef.current || 'Host' }]);
    let destroyed = false;

    const init = () => {
      if (destroyed) return;
      const peer = new Peer(CIRCLE_PEER_PREFIX + code);
      peerRef.current = peer;

      peer.on('connection', (conn) => {
        conn.on('data', (data) => {
          if (data.t === 'JOIN') {
            const existing = connsRef.current.find(c => c.conn.peer === conn.peer);
            if (existing) existing.name = data.name;
            else connsRef.current.push({ conn, name: data.name });
            rebuildRoster();
          }
        });
        conn.on('close', () => {
          connsRef.current = connsRef.current.filter(c => c.conn !== conn);
          rebuildRoster();
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && !destroyed) {
          peer.destroy();
          setTimeout(init, 1500);
        }
      });
    };

    init();

    return () => {
      destroyed = true;
      peerRef.current?.destroy();
      peerRef.current = null;
      connsRef.current = [];
    };
  }, [code]);

  const updateHostName = (v) => {
    setHostName(v);
    hostNameRef.current = v;
    rebuildRoster();
  };

  const copy = () => {
    navigator.clipboard?.writeText('Join my Card Game Catalog game — room code ' + code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const ready = roster.length >= CIRCLE_MIN_PLAYERS;

  const handleStartGame = (e) => {
    e.preventDefault();
    if (!ready) return;
    connsRef.current.forEach(c => {
      try { if (c.conn.open) c.conn.send({ t: 'HOST_STARTING' }); } catch (_) {}
    });
    setTimeout(() => {
      peerRef.current?.destroy();
      peerRef.current = null;
      location.href = 'games/circleoftrust/CircleOfTrust.html?host=' + code + '&name=' + encodeURIComponent(hostNameRef.current || 'Host');
    }, 150);
  };

  return (
    <div className="room">
      <span className="room__label">Your room is live — share the code</span>
      <div className="room__code">
        {code.split('').map((c, i) => <span className="room__char" key={i}>{c}</span>)}
      </div>
      <input className="joininline__input" style={{ width: '160px', fontSize: '16px', letterSpacing: 0, textTransform: 'none' }}
        value={hostName} maxLength={20} placeholder="Your name"
        onChange={(e) => updateHostName(e.target.value)} />
      <div className="room__actions">
        <Btn kind="secondary" size="md" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy invite"}
        </Btn>
        <button className="room__new" onClick={onNew}>New code</button>
      </div>
      <span className="room__hint">Players go to Circle of Trust → Join and punch in <b>{code}</b>.</span>
      <span className="room__joined"><b>{roster.length}</b> / {CIRCLE_MIN_PLAYERS}+ joined — {roster.map(r => r.name).join(', ')}</span>
      <a className="room__launch" href={'games/circleoftrust/CircleOfTrust.html?host=' + code} onClick={handleStartGame}
        style={!ready ? { opacity: .45, pointerEvents: 'none' } : undefined}>
        {ready ? 'Start Game' : `Need ${CIRCLE_MIN_PLAYERS - roster.length} more`}
      </a>
      <button type="button" className="joininline__back" onClick={onJoinInstead}>Have a code instead? Join →</button>
    </div>
  );
}

function CircleJoinInline({ onBack }) {
  const [val, setVal] = useStateG("");
  const [name, setName] = useStateG("");
  const ok = val.trim().length >= 4 && name.trim().length > 0;
  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    location.href = 'games/circleoftrust/CircleOfTrust.html?join=' + val.trim() + '&name=' + encodeURIComponent(name.trim());
  };
  return (
    <form className="joininline" onSubmit={submit}>
      <label className="joininline__label">Your name</label>
      <input className="joininline__input" style={{ textTransform: 'none', letterSpacing: 0 }} maxLength={20}
        value={name} placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <label className="joininline__label">Enter a room code</label>
      <div className="joininline__row">
        <input className="joininline__input" maxLength={4} value={val} placeholder="XXXX"
          onChange={(e) => setVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
        <Btn kind="primary" size="md" type="submit" iconRight="arrow" disabled={!ok}
          style={!ok ? { opacity: 0.45, pointerEvents: "none" } : undefined}>Join</Btn>
      </div>
      <button type="button" className="joininline__back" onClick={onBack}>← Back</button>
    </form>);
}

function JoinInline({ onBack }) {
  const [val, setVal] = useStateG("");
  const ok = val.trim().length >= 4;
  return (
    <form className="joininline" onSubmit={(e) => {e.preventDefault();}}>
      <label className="joininline__label">Enter a room code</label>
      <div className="joininline__row">
        <input className="joininline__input" maxLength={4} value={val} placeholder="XXXX"
        onChange={(e) => setVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} autoFocus />
        <Btn kind="primary" size="md" type="submit" iconRight="arrow" disabled={!ok}
        style={!ok ? { opacity: 0.45, pointerEvents: "none" } : undefined}>Join</Btn>
      </div>
      <button type="button" className="joininline__back" onClick={onBack}>← Back</button>
    </form>);

}

function TellRoomPanel({ code, onNew }) {
  const [copied, setCopied] = useStateG(false);
  const [joinCount, setJoinCount] = useStateG(0);
  const peerRef = useRefG(null);
  const connsRef = useRefG([]);

  useEffectG(() => {
    setJoinCount(0);
    connsRef.current = [];
    let destroyed = false;

    const init = () => {
      if (destroyed) return;
      const peer = new Peer('thetell-' + code);
      peerRef.current = peer;

      peer.on('connection', (conn) => {
        conn.on('open', () => {
          connsRef.current.push(conn);
          setJoinCount(c => c + 1);
        });
        conn.on('close', () => {
          connsRef.current = connsRef.current.filter(c => c !== conn);
          setJoinCount(c => Math.max(0, c - 1));
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && !destroyed) {
          peer.destroy();
          setTimeout(init, 1500);
        }
      });
    };

    init();

    return () => {
      destroyed = true;
      peerRef.current?.destroy();
      peerRef.current = null;
      connsRef.current = [];
    };
  }, [code]);

  const copy = () => {
    navigator.clipboard?.writeText('Join my Card Game Catalog game — room code ' + code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleStartGame = (e) => {
    e.preventDefault();
    connsRef.current.forEach(conn => {
      try { if (conn.open) conn.send({ t: 'HOST_STARTING' }); } catch (_) {}
    });
    setTimeout(() => {
      peerRef.current?.destroy();
      peerRef.current = null;
      location.href = 'games/thetell/TheTell.html?host=' + code;
    }, 150);
  };

  return (
    <div className="room">
      <span className="room__label">Your room is live — share the code</span>
      <div className="room__code">
        {code.split('').map((c, i) => <span className="room__char" key={i}>{c}</span>)}
      </div>
      <div className="room__actions">
        <Btn kind="secondary" size="md" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy invite"}
        </Btn>
        <button className="room__new" onClick={onNew}>New code</button>
      </div>
      <span className="room__hint">Players go to <b>cardgamecatalog.gg/join</b> and punch in <b>{code}</b>.</span>
      <span className="room__joined"><b>{joinCount}</b> / 1 player joined</span>
      <a className="room__launch" href={`games/thetell/TheTell.html?host=${code}`} onClick={handleStartGame}>Start Game</a>
    </div>
  );
}

function GamePage({ game, go, openHow }) {
  const hasPlay = !!(game && game.playUrl);
  const [mode, setMode] = useStateG(hasPlay ? "idle" : "created");
  const [code, setCode] = useStateG(() => hasPlay ? "" : genCode());
  const [rulesMode, setRulesMode] = useStateG("quick"); // quick | detailed

  if (!game) {
    return (
      <main className="gamepage">
        <div className="notfound">
          <span>🃏</span>
          <h2>That game wandered off.</h2>
          <Btn kind="primary" size="md" icon="arrow" onClick={() => go("#/")}>Back to catalog</Btn>
        </div>
      </main>);

  }

  return (
    <main className={"gamepage gp--" + game.color}>
      <a className="backlink" href="#/" onClick={(e) => {e.preventDefault();go("#/");}}>
        ← All games
      </a>

      <section className="gp__hero">
        <div className="gp__heroL">
          <span className="gp__emoji" aria-hidden="true">{game.emoji}</span>
          <h1 className="gp__title">{game.title}</h1>
          <p className="gp__tagline">{game.tagline}</p>
          <div className="gp__tags">
            <Tag tone={TAG_TONE[game.genre]}>{game.genre}</Tag>
            <Tag tone={TAG_TONE[game.difficulty]}>{game.difficulty}</Tag>
            <Tag>{game.players} players</Tag>
            <Tag>{game.lengthLabel}</Tag>
          </div>
          <p className="gp__blurb">{game.blurb}</p>
        </div>

        <div className="gp__panel">
          {mode === "idle" && game.playUrl &&
          <div className="gp__start">
              <h2 className="gp__panelh">Start playing</h2>
              <p className="gp__panelp">Jump straight into a playable game against the house.</p>
              <Btn kind="primary" size="lg" full icon="play" href={game.playUrl}>Play Now</Btn>
            </div>
          }
          {mode === "created" && (
            game.id === "the-tell"
              ? <TellRoomPanel code={code} onNew={() => setCode(genCode())} />
              : game.id === "circle-of-trust"
              ? <CircleRoomPanel code={code} onNew={() => setCode(genCode())} onJoinInstead={() => setMode("joining")} />
              : <RoomCode code={code} onNew={() => setCode(genCode())} />
          )}
          {mode === "joining" && (
            game.id === "circle-of-trust"
              ? <CircleJoinInline onBack={() => setMode("created")} />
              : <JoinInline onBack={() => setMode("idle")} />
          )}
        </div>
      </section>

      <section className="gp__how" id="how">
        <div className="gp__howhead">
          <h2 className="section-h">How to play</h2>
          {game.detailedRules &&
          <div className="rules-tabs">
              <button
              className={"rules-tab" + (rulesMode === "quick" ? " is-on" : "")}
              onClick={() => setRulesMode("quick")}>
                Quick
              </button>
              <button
              className={"rules-tab" + (rulesMode === "detailed" ? " is-on" : "")}
              onClick={() => setRulesMode("detailed")}>Full Rules

            </button>
            </div>
          }
        </div>
        {rulesMode === "quick" && <Accordion rules={game.rules} />}
        {rulesMode === "detailed" && game.detailedRules && <DetailedRules sections={game.detailedRules} />}
      </section>

      <section className="gp__irl">
        <div className="gp__irlinner">
          <span className="gp__irlbadge"><Icon name="dice" size={18} /> IRL mode</span>
          <h3>Want to play in real life?</h3>
          <p>Here's how to set this up with a standard deck of cards.</p>
          <p className="gp__irltext">{game.irl}</p>
        </div>
      </section>
    </main>);

}

Object.assign(window, { GamePage });