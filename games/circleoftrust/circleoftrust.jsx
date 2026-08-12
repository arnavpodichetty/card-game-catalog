// circleoftrust.jsx — Circle of Trust: networked 5+ player cooperative deduction game (PeerJS WebRTC, star topology)
const { useState, useEffect, useRef } = React;

const PEER_PREFIX = 'circleoftrust-';
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 20; // headroom under the 52-card deck limit
const MAX_JOIN_TRIES = 30;

/* ---------- deck / ranking helpers ---------- */
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUE_OF = {};
RANKS.forEach((r, i) => { VALUE_OF[r] = i + 2; });

function buildDeck() {
  const deck = [];
  RANKS.forEach((rank) => {
    SUITS.forEach((suit) => {
      deck.push({ rank, suit, value: VALUE_OF[rank], color: (suit === '♥' || suit === '♦') ? 'red' : 'black' });
    });
  });
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// entries: [{ id, value }] — one per player
function computeRanking(entries) {
  const byValue = {};
  entries.forEach((e) => { (byValue[e.value] = byValue[e.value] || []).push(e.id); });
  const uniqueValues = Object.keys(byValue).map(Number).sort((a, b) => a - b);
  const posByValue = {};
  uniqueValues.forEach((v, i) => { posByValue[v] = i + 1; });
  let pairs = 0, triplets = 0, quads = 0;
  const groupByValue = {};
  uniqueValues.forEach((v) => {
    const ids = byValue[v];
    groupByValue[v] = ids;
    if (ids.length === 2) pairs++;
    else if (ids.length === 3) triplets++;
    else if (ids.length === 4) quads++;
  });
  const truePosById = {};
  entries.forEach((e) => { truePosById[e.id] = posByValue[e.value]; });
  return { positions: uniqueValues.length, pairs, triplets, quads, truePosById, groupByValue };
}

// Team wins only if every player matches their true position; tied players must
// submit the identical number, and it must equal their shared true position —
// a mismatched pair is wrong for BOTH members even if one guessed the right number.
function computeResults(entries, round2Answers, ranking) {
  const results = {};
  entries.forEach((e) => {
    const id = e.id;
    const truePos = ranking.truePosById[id];
    const group = ranking.groupByValue[e.value];
    let correct;
    if (group.length > 1) {
      const allSame = group.every((gid) => round2Answers[gid] === round2Answers[group[0]]);
      correct = allSame && round2Answers[group[0]] === truePos;
    } else {
      correct = round2Answers[id] === truePos;
    }
    results[id] = { truePos, correct, answer: round2Answers[id] };
  });
  const teamWin = Object.values(results).every((r) => r.correct);
  return { results, teamWin };
}

function phraseDuplicates(infoBar) {
  const parts = [];
  if (infoBar.pairs) parts.push(`${infoBar.pairs} pair${infoBar.pairs > 1 ? 's' : ''}`);
  if (infoBar.triplets) parts.push(`${infoBar.triplets} triplet${infoBar.triplets > 1 ? 's' : ''}`);
  if (infoBar.quads) parts.push(`${infoBar.quads} quad${infoBar.quads > 1 ? 's' : ''}`);
  return parts.length ? parts.join(', ') : 'None';
}

/* ---------- room-session leaderboard (host-authoritative, shared by everyone) ---------- */
// Personal score only ever reflects Round 2 correctness — computeResults() never looks at Round 1.
// The host recomputes this map in full on every reveal and rebroadcasts it (plus sends it to
// latecomers via ROSTER), so every player's browser is always showing the same numbers.
function applyResultsToLeaderboard(leaderboard, results, namesById) {
  const next = { ...leaderboard };
  Object.keys(results).forEach((id) => {
    const prev = next[id] || { name: namesById[id] || 'Player', correct: 0, played: 0 };
    next[id] = {
      name: namesById[id] || prev.name,
      played: prev.played + 1,
      correct: prev.correct + (results[id].correct ? 1 : 0),
    };
  });
  return next;
}

/* ---------- presentational bits ---------- */
function TopBar({ label }) {
  return (
    <div className="ct-topbar">
      <a className="ct-back" href="../../index.html">← All games</a>
      <span className="ct-game-title">Circle of Trust</span>
      <span className="ct-roundlabel">{label || ''}</span>
    </div>
  );
}

function MiniCard({ card }) {
  if (!card) return <div className="ct-tile__card ct-tile__card--hidden">?</div>;
  return (
    <div className={`ct-tile__card ct-tile__card--${card.color}`}>
      <span className="ct-tile__rank">{card.rank}</span>
      <span className="ct-tile__pip">{card.suit}</span>
    </div>
  );
}

function PlayerTile({ player, isMe, isTurn, badge }) {
  return (
    <div className={`ct-tile${isTurn ? ' ct-tile--turn' : ''}${isMe ? ' ct-tile--me' : ''}`}>
      <span className="ct-tile__name">{player.name}{isMe ? ' (you)' : ''}</span>
      <MiniCard card={player.card} />
      {badge}
    </div>
  );
}

function LeaderboardPanel({ leaderboard, teamRecord }) {
  const entries = Object.entries(leaderboard);
  return (
    <div className="ct-leaderboard">
      <span className="ct-leaderboard__team">Team record <strong>{teamRecord.wins}–{teamRecord.losses}</strong></span>
      {entries.length > 0 && (
        <div className="ct-leaderboard__players">
          {entries.map(([id, e]) => (
            <span key={id} className="ct-leaderboard__chip">{e.name} <strong>{e.correct}/{e.played}</strong></span>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBarDisplay({ infoBar }) {
  return (
    <div className="ct-infobar">
      <div className="ct-infobar__stat"><strong>{infoBar.playerCount}</strong><span>Players</span></div>
      <div className="ct-infobar__stat"><strong>{infoBar.positions}</strong><span>Positions</span></div>
      <div className="ct-infobar__stat"><strong style={{ fontSize: 15 }}>{phraseDuplicates(infoBar)}</strong><span>Duplicates</span></div>
    </div>
  );
}

function NumberPad({ n, selected, onSelect, onConfirm, disabled }) {
  const nums = Array.from({ length: n }, (_, i) => i + 1);
  return (
    <>
      <div className="ct-pad">
        {nums.map((v) => (
          <button key={v} type="button" disabled={disabled}
            className={`ct-pad__btn${selected === v ? ' ct-pad__btn--selected' : ''}`}
            onClick={() => onSelect(v)}>{v}</button>
        ))}
      </div>
      {selected != null && (
        <button className="ct-btn ct-btn--primary" disabled={disabled} onClick={onConfirm}>
          Confirm →
        </button>
      )}
    </>
  );
}

/* ===== MAIN GAME ===== */
function CircleOfTrust() {
  const [role, setRole] = useState(null); // 'host' | 'guest'
  const [phase, setPhase] = useState('loading');
  // 'loading' | 'noparams' | 'connecting' | 'error' | 'lobby' | 'round1' | 'round2' | 'reveal'
  const [errorMsg, setErrorMsg] = useState('');
  const [joinTries, setJoinTries] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState('');
  const [roster, setRoster] = useState([]); // [{id,name}]

  const [dealt, setDealt] = useState([]); // [{id,name,card|null}]
  const [infoBar, setInfoBar] = useState(null);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [round1Answers, setRound1Answers] = useState({});
  const [round2Answers, setRound2Answers] = useState({});
  const [revealData, setRevealData] = useState(null);
  const [numSel, setNumSel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState({}); // id -> {name, correct, played}
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0 });

  /* refs mirroring state for use inside network callbacks */
  const peerRef = useRef(null);
  const connRef = useRef(null); // guest's single connection to host
  const joinRetryRef = useRef(null);
  const hostStartingRef = useRef(null);
  const guestCodeRef = useRef(null);
  const guestNameRef = useRef(null);
  const myIdRef = useRef(null);
  const phaseRef = useRef('loading');

  const playersRef = useRef([]); // host only: [{id,name,conn}]
  const cardByIdRef = useRef({}); // host only, authoritative
  const entriesRef = useRef([]); // host only: [{id,value}]
  const rankingRef = useRef(null); // host only
  const turnOrderRef = useRef([]);
  const currentTurnIdxRef = useRef(0);
  const round1AnswersRef = useRef({});
  const round2AnswersRef = useRef({}); // host only, authoritative
  const lastStartIdRef = useRef(null); // host only: previous round's starting player, can't repeat
  const leaderboardRef = useRef({}); // host only, authoritative
  const teamRecordRef = useRef({ wins: 0, losses: 0 }); // host only, authoritative

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { myIdRef.current = myId; }, [myId]);
  useEffect(() => { setSubmitting(false); }, [currentIdx, phase]);
  useEffect(() => () => peerRef.current?.destroy(), []);

  const broadcastAll = (msg) => {
    playersRef.current.forEach((p) => {
      if (p.conn && p.conn.open) { try { p.conn.send(msg); } catch (_) {} }
    });
  };

  const rebuildRosterAndBroadcast = () => {
    const list = playersRef.current.map((p) => ({ id: p.id, name: p.name }));
    setRoster(list);
    broadcastAll({ t: 'ROSTER', players: list, leaderboard: leaderboardRef.current, teamRecord: teamRecordRef.current });
  };

  /* ========== HOST ========== */

  const handleRound1Submit = (id, value) => {
    if (turnOrderRef.current[currentTurnIdxRef.current] !== id) return;
    if (!(Number.isInteger(value) && value >= 1 && value <= rankingRef.current.positions)) return;
    round1AnswersRef.current = { ...round1AnswersRef.current, [id]: value };
    setRound1Answers(round1AnswersRef.current);
    const nextIdx = currentTurnIdxRef.current + 1;
    broadcastAll({ t: 'ROUND1_ANSWER', id, value, nextIdx });
    if (nextIdx >= turnOrderRef.current.length) {
      currentTurnIdxRef.current = 0;
      setCurrentIdx(0);
      setPhase('round2');
      broadcastAll({ t: 'ROUND2_START' });
    } else {
      currentTurnIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
    }
  };

  const handleRound2Submit = (id, value) => {
    if (turnOrderRef.current[currentTurnIdxRef.current] !== id) return;
    if (!(Number.isInteger(value) && value >= 1 && value <= rankingRef.current.positions)) return;
    round2AnswersRef.current = { ...round2AnswersRef.current, [id]: value };
    setRound2Answers(round2AnswersRef.current);
    const nextIdx = currentTurnIdxRef.current + 1;
    broadcastAll({ t: 'ROUND2_ANSWER', id, value, nextIdx });
    if (nextIdx >= turnOrderRef.current.length) {
      const { results, teamWin } = computeResults(entriesRef.current, round2AnswersRef.current, rankingRef.current);
      const namesById = {};
      playersRef.current.forEach((p) => { namesById[p.id] = p.name; });
      const newLeaderboard = applyResultsToLeaderboard(leaderboardRef.current, results, namesById);
      const newTeamRecord = {
        wins: teamRecordRef.current.wins + (teamWin ? 1 : 0),
        losses: teamRecordRef.current.losses + (teamWin ? 0 : 1),
      };
      leaderboardRef.current = newLeaderboard;
      teamRecordRef.current = newTeamRecord;
      setLeaderboard(newLeaderboard);
      setTeamRecord(newTeamRecord);
      const payload = {
        t: 'REVEAL',
        cardById: cardByIdRef.current,
        round1: round1AnswersRef.current,
        round2: round2AnswersRef.current,
        results, teamWin,
        leaderboard: newLeaderboard,
        teamRecord: newTeamRecord,
      };
      setPhase('reveal');
      setRevealData(payload);
      broadcastAll(payload);
    } else {
      currentTurnIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
    }
  };

  const dealCards = () => {
    const ids = playersRef.current.map((p) => p.id);
    const deck = shuffle(buildDeck());
    const cardById = {};
    ids.forEach((id, i) => { cardById[id] = deck[i]; });
    const entries = ids.map((id) => ({ id, value: cardById[id].value }));
    const ranking = computeRanking(entries);

    // Random starting player, but never the same one two deals in a row.
    const eligible = ids.length > 1 ? ids.filter((id) => id !== lastStartIdRef.current) : ids;
    const chosenId = eligible[Math.floor(Math.random() * eligible.length)];
    const startIdx = ids.indexOf(chosenId);
    const order = ids.slice(startIdx).concat(ids.slice(0, startIdx));
    lastStartIdRef.current = chosenId;

    cardByIdRef.current = cardById;
    entriesRef.current = entries;
    rankingRef.current = ranking;
    turnOrderRef.current = order;
    currentTurnIdxRef.current = 0;
    round1AnswersRef.current = {};
    round2AnswersRef.current = {};

    const infoBarData = { playerCount: ids.length, positions: ranking.positions, pairs: ranking.pairs, triplets: ranking.triplets, quads: ranking.quads };

    const hostPublic = playersRef.current.map((q) => ({ id: q.id, name: q.name, card: q.id === 'host' ? null : cardById[q.id] }));
    setDealt(hostPublic);
    setInfoBar(infoBarData);
    setTurnOrder(order);
    setCurrentIdx(0);
    setRound1Answers({});
    setRound2Answers({});
    setRevealData(null);
    setPhase('round1');

    playersRef.current.forEach((p) => {
      if (!p.conn) return;
      const guestPublic = playersRef.current.map((q) => ({ id: q.id, name: q.name, card: q.id === p.id ? null : cardById[q.id] }));
      if (p.conn.open) {
        try { p.conn.send({ t: 'DEAL', players: guestPublic, infoBar: infoBarData, turnOrder: order, startingId: order[0] }); } catch (_) {}
      }
    });
  };

  const playAgain = () => {
    if (playersRef.current.length < MIN_PLAYERS) { setPhase('lobby'); return; }
    dealCards();
  };

  const handleGuestClose = (conn) => {
    const wasKnown = playersRef.current.some((p) => p.conn === conn);
    playersRef.current = playersRef.current.filter((p) => p.conn !== conn);
    rebuildRosterAndBroadcast();
    if (wasKnown && phaseRef.current !== 'lobby') {
      broadcastAll({ t: 'ABORTED', reason: 'A player disconnected — back to the lobby.' });
      phaseRef.current = 'lobby';
      setPhase('lobby');
      setDealt([]); setInfoBar(null); setTurnOrder([]); setCurrentIdx(0);
      setRound1Answers({}); setRound2Answers({}); setRevealData(null);
      setErrorMsg('A player disconnected — back to the lobby.');
    }
  };

  const startHosting = (code, name) => {
    setRole('host'); setMyId('host'); myIdRef.current = 'host'; setMyName(name);
    setRoomCode(code); setPhase('lobby');
    if (playersRef.current.length === 0) {
      playersRef.current = [{ id: 'host', name, conn: null }];
      setRoster([{ id: 'host', name }]);
    }

    const peer = new Peer(PEER_PREFIX + code);
    peerRef.current = peer;

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data.t === 'JOIN') {
          const existing = playersRef.current.find((p) => p.conn === conn);
          if (existing) {
            existing.name = data.name;
            rebuildRosterAndBroadcast();
          } else if (playersRef.current.length >= MAX_PLAYERS) {
            try { conn.send({ t: 'ROOM_FULL' }); } catch (_) {}
            setTimeout(() => { try { conn.close(); } catch (_) {} }, 200);
          } else {
            playersRef.current.push({ id: conn.peer, name: data.name, conn });
            rebuildRosterAndBroadcast();
          }
        } else if (data.t === 'ROUND1_SUBMIT') {
          handleRound1Submit(conn.peer, data.value);
        } else if (data.t === 'ROUND2_SUBMIT') {
          handleRound2Submit(conn.peer, data.value);
        }
      });
      conn.on('close', () => handleGuestClose(conn));
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        peer.destroy();
        setTimeout(() => startHosting(code, name), 1500);
      } else {
        setErrorMsg('Network error (' + (err.type || 'unknown') + '). Please try again.');
        setPhase('error');
      }
    });
  };

  /* ========== GUEST ========== */

  const attachGuestHandlers = (conn) => {
    conn.on('data', (data) => {
      if (data.t === 'HOST_STARTING') { hostStartingRef.current = true; return; }
      if (data.t === 'ROOM_FULL') {
        setErrorMsg('That room is full. Ask the host to start a new one.');
        setPhase('error');
        return;
      }
      if (data.t === 'ROSTER') {
        setRoster(data.players);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.teamRecord) setTeamRecord(data.teamRecord);
        return;
      }
      if (data.t === 'DEAL') {
        setDealt(data.players);
        setInfoBar(data.infoBar);
        setTurnOrder(data.turnOrder);
        setCurrentIdx(0);
        setRound1Answers({});
        setRound2Answers({});
        setRevealData(null);
        setPhase('round1');
        return;
      }
      if (data.t === 'ROUND1_ANSWER') {
        setRound1Answers((a) => ({ ...a, [data.id]: data.value }));
        setCurrentIdx(data.nextIdx);
        return;
      }
      if (data.t === 'ROUND2_START') {
        setCurrentIdx(0);
        setPhase('round2');
        return;
      }
      if (data.t === 'ROUND2_ANSWER') {
        setRound2Answers((a) => ({ ...a, [data.id]: data.value }));
        setCurrentIdx(data.nextIdx);
        return;
      }
      if (data.t === 'REVEAL') {
        setPhase('reveal');
        setRevealData(data);
        setLeaderboard(data.leaderboard);
        setTeamRecord(data.teamRecord);
        return;
      }
      if (data.t === 'ABORTED') {
        setErrorMsg(data.reason);
        setPhase('lobby');
        setDealt([]); setInfoBar(null); setTurnOrder([]); setCurrentIdx(0);
        setRound1Answers({}); setRound2Answers({}); setRevealData(null);
        return;
      }
    });

    conn.on('close', () => {
      if (hostStartingRef.current) {
        hostStartingRef.current = false;
        const code = guestCodeRef.current;
        if (!code || !peerRef.current) {
          setErrorMsg('Disconnected. Ask the host for a new room.');
          setPhase('error');
          return;
        }
        let retries = 0;
        const retry = () => {
          if (!peerRef.current || retries >= 20) {
            setErrorMsg('Could not reconnect to the host. Ask them to start a new room.');
            setPhase('error');
            return;
          }
          retries++;
          const newConn = peerRef.current.connect(PEER_PREFIX + code);
          connRef.current = newConn;
          const timer = setTimeout(retry, 3000);
          newConn.on('open', () => {
            clearTimeout(timer);
            connRef.current = newConn;
            try { newConn.send({ t: 'JOIN', name: guestNameRef.current }); } catch (_) {}
            setPhase('lobby');
            attachGuestHandlers(newConn);
          });
        };
        setTimeout(retry, 300);
        return;
      }
      setErrorMsg('Disconnected from the host. Ask them to start a new room.');
      setPhase('error');
    });
  };

  const startJoining = (code, name) => {
    setRole('guest'); setMyName(name);
    guestCodeRef.current = code; guestNameRef.current = name;
    setPhase('connecting');

    const peer = new Peer();
    peerRef.current = peer;
    const state = { connected: false, tries: 0, timer: null };
    joinRetryRef.current = state;

    const attempt = () => {
      if (state.connected) return;
      state.tries++;
      setJoinTries(state.tries);
      if (state.tries > MAX_JOIN_TRIES) {
        setErrorMsg('Could not reach the room. Make sure the host has opened it, then try again.');
        setPhase('error');
        return;
      }
      const conn = peer.connect(PEER_PREFIX + code);
      connRef.current = conn;
      state.timer = setTimeout(() => { if (!state.connected) attempt(); }, 3000);
      conn.on('open', () => {
        if (state.connected) { conn.close(); return; }
        state.connected = true;
        clearTimeout(state.timer);
        connRef.current = conn;
        setMyId(peer.id); myIdRef.current = peer.id;
        try { conn.send({ t: 'JOIN', name }); } catch (_) {}
        setPhase('lobby');
        attachGuestHandlers(conn);
      });
    };

    peer.on('open', attempt);
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') return;
      if (!state.connected) {
        setErrorMsg('Connection error. Please try again.');
        setPhase('error');
      }
    });
  };

  /* ========== BOOTSTRAP ========== */

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hostCode = params.get('host');
    const joinCode = params.get('join');
    if (hostCode) startHosting(hostCode, params.get('name') || 'Host');
    else if (joinCode) startJoining(joinCode, params.get('name') || 'Player');
    else setPhase('noparams');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========== submit helper (shared by host + guest UI) ========== */
  const submitAnswer = (value) => {
    setSubmitting(true);
    if (phase === 'round1') {
      if (role === 'host') handleRound1Submit('host', value);
      else if (connRef.current && connRef.current.open) connRef.current.send({ t: 'ROUND1_SUBMIT', value });
    } else if (phase === 'round2') {
      if (role === 'host') handleRound2Submit('host', value);
      else if (connRef.current && connRef.current.open) connRef.current.send({ t: 'ROUND2_SUBMIT', value });
    }
    setNumSel(null);
  };

  /* ========== RENDER ========== */

  if (phase === 'noparams') {
    return (
      <div className="ct-shell">
        <TopBar />
        <div className="ct-center">
          <div className="ct-lobby">
            <h2 className="ct-lobby__title">Circle of Trust</h2>
            <p className="ct-lobby__hint">This game is launched from a room on the Card Game Catalog — head back and create or join a room there.</p>
            <a className="ct-btn ct-btn--primary" href="../../index.html">← Back to catalog</a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'connecting') {
    return (
      <div className="ct-shell">
        <TopBar />
        <div className="ct-center">
          <div className="ct-lobby">
            <h2 className="ct-lobby__title">Joining the circle…</h2>
            <div className="ct-lobby__wait">
              <span className="ct-spinner" />
              Connecting to the host{joinTries > 1 ? ` (attempt ${joinTries})` : ''}…
            </div>
            <p className="ct-lobby__hint">If this is taking a while, make sure the host has opened the room.</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="ct-shell">
        <TopBar />
        <div className="ct-center">
          <div className="ct-lobby">
            <h2 className="ct-lobby__title">Couldn't connect</h2>
            <p className="ct-net-error">{errorMsg}</p>
            <a className="ct-btn ct-btn--primary" href="../../index.html">← Back to catalog</a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'lobby') {
    const ready = roster.length >= MIN_PLAYERS;
    return (
      <div className="ct-shell">
        <TopBar label="Lobby" />
        <LeaderboardPanel leaderboard={leaderboard} teamRecord={teamRecord} />
        <div className="ct-center">
          <div className="ct-lobby">
            <h2 className="ct-lobby__title">{role === 'host' ? 'Your room is live' : 'Waiting for the host'}</h2>
            {role === 'host' && <div className="ct-lobby__code">{roomCode}</div>}
            {errorMsg && <p className="ct-net-error">{errorMsg}</p>}
            <div className="ct-roster">
              {roster.map((p) => (
                <span key={p.id} className={`ct-roster__chip${p.id === myId ? ' ct-roster__chip--me' : ''}`}>{p.name}</span>
              ))}
            </div>
            <p className="ct-lobby__hint">{roster.length} / {MIN_PLAYERS}+ joined — need at least {MIN_PLAYERS} players to deal.</p>
            {role === 'host' ? (
              <button className="ct-btn ct-btn--primary ct-btn--lg" disabled={!ready} onClick={dealCards}>
                {ready ? 'Deal Cards →' : `Need ${MIN_PLAYERS - roster.length} more`}
              </button>
            ) : (
              <div className="ct-lobby__wait"><span className="ct-spinner" />Waiting for the host to deal…</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'round1' || phase === 'round2') {
    const isMyTurn = turnOrder[currentIdx] === myId;
    const currentPlayer = dealt.find((p) => p.id === turnOrder[currentIdx]);
    return (
      <div className="ct-shell">
        <TopBar label={phase === 'round1' ? 'Round 1 — Say it out loud' : 'Round 2 — Final answer'} />
        <LeaderboardPanel leaderboard={leaderboard} teamRecord={teamRecord} />
        <div className="ct-center">
          <div className="ct-board">
            {infoBar && <InfoBarDisplay infoBar={infoBar} />}
            <div className={`ct-turnbanner${isMyTurn ? ' ct-turnbanner--me' : ' ct-turnbanner--wait'}`}>
              {isMyTurn ? "It's your turn — what's your position?" : `Waiting for ${currentPlayer ? currentPlayer.name : '…'}…`}
            </div>
            <div className="ct-grid">
              {dealt.map((p) => {
                const answers = phase === 'round1' ? round1Answers : round2Answers;
                const badge = answers[p.id] != null ? <span className="ct-tile__badge">{answers[p.id]}</span> : null;
                return (
                  <PlayerTile key={p.id} player={p} isMe={p.id === myId} isTurn={turnOrder[currentIdx] === p.id} badge={badge} />
                );
              })}
            </div>
            {isMyTurn && infoBar && (
              <NumberPad n={infoBar.positions} selected={numSel} disabled={submitting} onSelect={setNumSel} onConfirm={() => submitAnswer(numSel)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'reveal' && revealData) {
    const { cardById, results, teamWin } = revealData;
    return (
      <div className="ct-shell">
        <TopBar label="Reveal" />
        <LeaderboardPanel leaderboard={leaderboard} teamRecord={teamRecord} />
        <div className="ct-center">
          <div className="ct-reveal">
            <div className={`ct-reveal__msg ${teamWin ? 'ct-reveal__msg--win' : 'ct-reveal__msg--lose'}`}>
              {teamWin ? '🎉 The circle wins — every position matched!' : '💔 The circle loses — someone missed their position.'}
            </div>
            <div className="ct-grid">
              {dealt.map((p) => {
                const r = results[p.id];
                const card = cardById[p.id];
                const badge = r && (
                  <span className={`ct-tile__badge ${r.correct ? 'ct-tile__badge--right' : 'ct-tile__badge--wrong'}`}>
                    said {r.answer ?? '—'} · true {r.truePos}
                  </span>
                );
                return <PlayerTile key={p.id} player={{ ...p, card }} isMe={p.id === myId} isTurn={false} badge={badge} />;
              })}
            </div>
            {role === 'host' ? (
              <button className="ct-btn ct-btn--primary ct-btn--lg" onClick={playAgain}>Deal Again →</button>
            ) : (
              <p className="ct-lobby__hint">Waiting for the host to deal again…</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-shell">
      <TopBar />
      <div className="ct-center"><div className="ct-lobby__wait"><span className="ct-spinner" />Loading…</div></div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CircleOfTrust />);
