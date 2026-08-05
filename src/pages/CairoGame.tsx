// CairoGame.tsx — Cairo: networked 2-player memory/deduction card game (PeerJS WebRTC)
// Host (Player 1) holds the authoritative game state; the guest sends actions,
// the host applies them and broadcasts the new state to both screens.
//
// Rendered as an in-app page: the launcher passes host/join codes as props
// (from the #/play/cairo?host=|join= route) instead of reading location.search.
import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import "./cairoGame.styles";

const PEER_PREFIX = 'cairo-';
const SNAP_SECONDS = 6; // how long the snap window stays open after a discard

/* ================= deck & rules helpers ================= */

function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:4}, () => c[Math.floor(Math.random() * c.length)]).join('');
}

function shuffleArr(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const suits = [['♥','red'],['♦','red'],['♣','black'],['♠','black']];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  let id = 0;
  for (const [suit, color] of suits)
    for (const rank of ranks)
      deck.push({ id: 'c' + (id++), rank, suit, color });
  deck.push({ id: 'c' + (id++), rank: 'JOKER', suit: '🃏', color: 'joker' });
  deck.push({ id: 'c' + (id++), rank: 'JOKER', suit: '🃏', color: 'joker' });
  return shuffleArr(deck);
}

function cardValue(c) {
  if (c.rank === 'JOKER') return -1;
  if (c.rank === 'K') return c.color === 'red' ? 0 : 13;
  if (c.rank === 'A') return 1;
  if (c.rank === 'J') return 11;
  if (c.rank === 'Q') return 12;
  return parseInt(c.rank, 10);
}

function cardLabel(c) {
  return c.rank === 'JOKER' ? 'Joker 🃏' : c.rank + c.suit;
}

function effectOf(rank) {
  if (rank === 'Q' || rank === 'K') return 'swap_look';
  if (rank === 'J' || rank === '10') return 'swap_blind';
  if (rank === '9' || rank === '8') return 'peek_own';
  if (rank === '7' || rank === '6') return 'peek_other';
  return null;
}

const EFFECT_LABEL = {
  swap_look:  'Switch any two cards and look at them',
  swap_blind: 'Switch any two cards — without looking',
  peek_own:   'Look at one of your own cards',
  peek_other: "Look at one of your opponent's cards",
};

function other(p) { return 1 - p; }
function pname(p) { return p === 0 ? 'Player 1' : 'Player 2'; }

/* ================= game state & reducer (runs on host) ================= */

function newGame() {
  const deck = buildDeck();
  const hands = [deck.splice(0, 4), deck.splice(0, 4)];
  const discard = [deck.pop()];
  return {
    phase: 'peek',          // peek | turn | drawn | effect | snap | give | gameover
    turn: 0,
    deck, discard, hands,   // hands[p] is row-major 2x2: [0,1] top row, [2,3] bottom row
    drawn: null, drawnFrom: null,
    effect: null,           // {kind, actor, picks:[{tp,slot}]}
    snapCtx: null,          // {passes:[bool,bool], token}
    give: null,             // {snapper, to}
    kabul: null,            // player index who called KABUL (their cards are locked)
    peekReady: [false, false],
    result: null,           // {totals:[a,b], winner: 0|1|null}
    note: 'Memorise your two bottom cards!',
  };
}

function recycle(g) {
  // When the deck runs dry, shuffle the discard pile (minus its top card) back in.
  if (g.deck.length === 0 && g.discard.length > 1) {
    const top = g.discard.pop();
    g.deck = shuffleArr(g.discard);
    g.discard = [top];
  }
}

function endGame(g) {
  g.phase = 'gameover';
  g.snapCtx = null; g.give = null; g.effect = null; g.drawn = null; g.drawnFrom = null;
  const totals = g.hands.map(h => h.reduce((s, c) => s + cardValue(c), 0));
  let winner = null;
  if (totals[0] < totals[1]) winner = 0;
  else if (totals[1] < totals[0]) winner = 1;
  g.result = { totals, winner };
  g.note = 'Game over — lowest hand wins.';
}

function advanceTurn(g) {
  g.snapCtx = null; g.drawn = null; g.drawnFrom = null; g.effect = null; g.give = null;
  const next = other(g.turn);
  if (g.kabul !== null && next === g.kabul) { endGame(g); return; }
  g.turn = next;
  g.phase = 'turn';
  g.note = pname(next) + (g.kabul !== null ? ' takes the FINAL turn!' : "'s turn — draw a card, or call KABUL.");
}

function startSnap(g, note) {
  g.drawn = null; g.drawnFrom = null; g.effect = null;
  g.phase = 'snap';
  g.snapCtx = { passes: [false, false], token: Math.random().toString(36).slice(2) };
  if (g.kabul !== null) g.snapCtx.passes[g.kabul] = true; // locked player can't snap
  g.note = note + ' Snap window open!';
}

// Applies action `a` from player `p` to game `g` (mutates). Returns an optional
// event object for private peeks / public reveals. Invalid actions are ignored.
function applyAction(g, p, a) {
  switch (a.t) {

    case 'peek_done': {
      if (g.phase !== 'peek') return;
      g.peekReady[p] = true;
      if (g.peekReady[0] && g.peekReady[1]) {
        g.phase = 'turn'; g.turn = 0;
        g.note = "Player 1's turn — draw a card, or call KABUL.";
      }
      return;
    }

    case 'kabul': {
      if (g.phase !== 'turn' || g.turn !== p || g.kabul !== null) return;
      g.kabul = p;
      g.turn = other(p);
      g.phase = 'turn';
      g.note = pname(p) + ' called KABUL! Their cards are locked. ' + pname(other(p)) + ' gets one final turn.';
      return;
    }

    case 'draw': {
      if (g.phase !== 'turn' || g.turn !== p) return;
      if (a.from === 'deck') {
        recycle(g);
        if (!g.deck.length) return;
        g.drawn = g.deck.pop(); g.drawnFrom = 'deck';
      } else {
        if (!g.discard.length) return;
        g.drawn = g.discard.pop(); g.drawnFrom = 'discard';
      }
      g.phase = 'drawn';
      g.note = pname(p) + ' drew from the ' + (a.from === 'deck' ? 'deck' : 'discard pile') + '.';
      return;
    }

    case 'discard_drawn': {
      // Only a card drawn from the deck may be discarded straight back.
      if (g.phase !== 'drawn' || g.turn !== p || g.drawnFrom !== 'deck') return;
      const c = g.drawn;
      g.discard.push(c);
      g.drawn = null; g.drawnFrom = null;
      const eff = effectOf(c.rank);
      if (a.withEffect && eff) {
        g.effect = { kind: eff, actor: p, picks: [] };
        g.phase = 'effect';
        g.note = pname(p) + ' discarded ' + cardLabel(c) + ' — effect: ' + EFFECT_LABEL[eff].toLowerCase() + '.';
        return;
      }
      startSnap(g, pname(p) + ' discarded ' + cardLabel(c) + '.');
      return;
    }

    case 'swap': {
      // Replace one of your hidden cards with the drawn card.
      if (g.phase !== 'drawn' || g.turn !== p) return;
      const h = g.hands[p];
      if (a.slot < 0 || a.slot >= h.length) return;
      const old = h[a.slot];
      h[a.slot] = g.drawn;
      g.drawn = null; g.drawnFrom = null;
      g.discard.push(old);
      startSnap(g, pname(p) + ' swapped a card into position ' + (a.slot + 1) + ' and discarded ' + cardLabel(old) + '.');
      return;
    }

    case 'effect_skip': {
      if (g.phase !== 'effect' || g.effect.actor !== p) return;
      startSnap(g, pname(p) + ' skipped the effect.');
      return;
    }

    case 'effect_pick': {
      if (g.phase !== 'effect' || g.effect.actor !== p) return;
      const { kind, picks } = g.effect;
      const tp = a.tp, slot = a.slot;
      if (tp !== 0 && tp !== 1) return;
      if (!g.hands[tp] || slot < 0 || slot >= g.hands[tp].length) return;
      if (g.kabul === tp) return; // KABUL caller's cards are locked

      if (kind === 'peek_own') {
        if (tp !== p) return;
        const card = g.hands[tp][slot];
        startSnap(g, pname(p) + ' peeked at one of their own cards.');
        return { type:'peek', for:p, title:'Your card — position ' + (slot + 1),
                 cards:[{ card, label:'Position ' + (slot + 1) }] };
      }
      if (kind === 'peek_other') {
        if (tp !== other(p)) return;
        const card = g.hands[tp][slot];
        startSnap(g, pname(p) + " peeked at one of " + pname(tp) + "'s cards.");
        return { type:'peek', for:p, title:pname(tp) + "'s card — position " + (slot + 1),
                 cards:[{ card, label:'Position ' + (slot + 1) }] };
      }

      // swap_look / swap_blind: needs two picks
      if (picks.length === 0) {
        g.effect.picks = [{ tp, slot }];
        g.note = 'First card selected — now pick a second card to switch it with.';
        return;
      }
      const first = picks[0];
      if (first.tp === tp && first.slot === slot) { // tap again to deselect
        g.effect.picks = [];
        g.note = 'Selection cleared — pick two cards to switch.';
        return;
      }
      const c1 = g.hands[first.tp][first.slot];
      const c2 = g.hands[tp][slot];
      g.hands[first.tp][first.slot] = c2;
      g.hands[tp][slot] = c1;
      const look = kind === 'swap_look';
      startSnap(g, pname(p) + ' switched two cards' + (look ? ' and looked at them' : ' (blind)') + '.');
      if (look) {
        return { type:'peek', for:p, title:'The switched cards (in their new spots)',
                 cards:[
                   { card:c2, label:pname(first.tp) + ' · pos ' + (first.slot + 1) },
                   { card:c1, label:pname(tp) + ' · pos ' + (slot + 1) },
                 ]};
      }
      return;
    }

    case 'snap_pass': {
      if (g.phase !== 'snap') return;
      g.snapCtx.passes[p] = true;
      if (g.snapCtx.passes[0] && g.snapCtx.passes[1]) advanceTurn(g);
      return;
    }

    case 'snap': {
      if (g.phase !== 'snap') return;
      if (p === g.kabul) return;                 // locked player can't snap
      if (g.snapCtx.passes[p]) return;           // already passed
      const tp = a.tp, slot = a.slot;
      if (tp !== 0 && tp !== 1) return;
      if (g.kabul === tp) return;                // can't touch locked cards
      const h = g.hands[tp];
      if (!h || slot < 0 || slot >= h.length) return;
      const top = g.discard[g.discard.length - 1];
      const card = h[slot];

      if (card.rank === top.rank) {
        // Successful snap — the card joins the discard pile.
        h.splice(slot, 1);
        g.discard.push(card);
        if (tp !== p) {
          // Snapped an opponent's card: give them one of yours.
          if (g.hands[p].length === 0) { advanceTurn(g); }
          else {
            g.phase = 'give';
            g.snapCtx = null;
            g.give = { snapper: p, to: tp };
            g.note = pname(p) + ' snapped ' + pname(tp) + "'s " + cardLabel(card) + '! Now they choose a card to give away.';
          }
          return { type:'reveal', title:'SNAP!',
                   msg:pname(p) + ' snapped ' + pname(tp) + "'s card — it matched the pile.",
                   cards:[{ card, label:'Snapped' }] };
        }
        if (h.length === 0) {
          endGame(g);
          return { type:'reveal', title:'SNAP!',
                   msg:pname(p) + ' snapped their last card — the game ends immediately!',
                   cards:[{ card, label:'Snapped' }] };
        }
        g.note = pname(p) + ' snapped ' + cardLabel(card) + '! Their hand shrinks.';
        advanceTurn(g);
        return { type:'reveal', title:'SNAP!',
                 msg:pname(p) + "'s card matched the pile and stays there.",
                 cards:[{ card, label:'Snapped' }] };
      }

      // Failed snap — card goes back, plus a penalty card from the deck.
      recycle(g);
      if (g.deck.length) g.hands[p].push(g.deck.pop());
      advanceTurn(g);
      g.note = pname(p) + "'s snap failed — " + cardLabel(card) + " doesn't match. Penalty card added to their hand.";
      return { type:'reveal', title:'Snap failed!',
               msg:'The card was ' + cardLabel(card) + ', which doesn\'t match the pile. ' + pname(p) + ' takes a penalty card.',
               cards:[{ card, label:'Attempted snap' }] };
    }

    case 'give': {
      if (g.phase !== 'give' || !g.give || g.give.snapper !== p) return;
      const h = g.hands[p];
      if (a.slot < 0 || a.slot >= h.length) return;
      const to = g.give.to;
      const c = h.splice(a.slot, 1)[0];
      g.hands[to].push(c);
      if (h.length === 0) { endGame(g); return; }
      advanceTurn(g);
      g.note = pname(p) + ' gave a face-down card to ' + pname(to) + '. ' + g.note;
      return;
    }

    case 'reset': {
      if (p !== 0) return; // host only
      const ng = newGame();
      Object.keys(g).forEach(k => delete g[k]);
      Object.assign(g, ng);
      return;
    }
  }
}

/* ================= presentational components ================= */

function CardFace({ card, lg, value, deal }: any) {
  const joker = card.rank === 'JOKER';
  const cls = ['kb-card',
    joker ? 'kb-card--joker' : (card.color === 'red' ? 'kb-card--red' : 'kb-card--black'),
    lg ? 'kb-card--lg' : '',
    deal ? 'kb-card--deal' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className="kb-card__rank">{joker ? 'JKR' : card.rank}</span>
      {!joker && <span className="kb-card__suit">{card.suit}</span>}
      <span className="kb-card__pip">{joker ? '🃏' : card.suit}</span>
      <span className="kb-card__rank kb-card__rank--br">{joker ? 'JKR' : card.rank}</span>
      {value !== undefined && <span className="kb-card__value">{value} pt{value === 1 ? '' : 's'}</span>}
    </div>
  );
}

function Slot({ num, clickable, selected, locked, onClick }) {
  const cls = ['kb-slot',
    clickable ? 'kb-slot--clickable' : 'kb-slot--inert',
    selected ? 'kb-slot--selected' : '',
    locked ? 'kb-slot--locked' : '',
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} type="button" onClick={clickable ? onClick : undefined} disabled={!clickable}>
      <span className="kb-slot__num">{num}</span>
    </button>
  );
}

function TopBar({ kabul }) {
  return (
    <div className="sg-topbar">
      <a className="sg-back" href="#/">← All games</a>
      <span className="sg-game-title">Cairo</span>
      <div className="sg-topbar__right">
        {kabul !== null && kabul !== undefined && <span className="kb-kabul-pill">KABUL!</span>}
      </div>
    </div>
  );
}

function Overlay({ title, msg, cards, onClose, closeLabel }) {
  return (
    <div className="kb-overlay">
      <div className="kb-overlay__panel">
        <h3 className="kb-overlay__title">{title}</h3>
        {msg && <p className="kb-overlay__msg">{msg}</p>}
        {cards && cards.length > 0 && (
          <div className="kb-peekcards">
            {cards.map((pc, i) => (
              <div className="kb-peekcard" key={i}>
                <CardFace card={pc.card} lg deal />
                {pc.label && <span className="kb-peekcard__label">{pc.label}</span>}
              </div>
            ))}
          </div>
        )}
        <button className="sg-btn sg-btn--primary" onClick={onClose}>{closeLabel || 'Got it'}</button>
      </div>
    </div>
  );
}

function WaitingScreen({ msg }) {
  return (
    <div className="sg-shell">
      <TopBar kabul={null} />
      <div className="sg-center">
        <div className="sg-lobby">
          <div className="sg-lobby__wait"><span className="sg-spinner" />{msg}</div>
        </div>
      </div>
    </div>
  );
}

function JoinLobby({ onConnect, onCancel, error, connecting }) {
  const [code, setCode] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (code.trim().length >= 2) onConnect(code.trim());
  };
  return (
    <div className="sg-shell">
      <TopBar kabul={null} />
      <div className="sg-center">
        <div className="sg-lobby">
          <h2 className="sg-lobby__title">Join a Game</h2>
          <p className="sg-lobby__sub">Enter the code from Player 1:</p>
          <form onSubmit={submit} className="sg-join-form">
            <input
              className="sg-code-input"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={4}
              placeholder="XXXX"
              autoFocus
              disabled={connecting}
            />
            {error && <p className="sg-net-error">{error}</p>}
            <button className="sg-btn sg-btn--primary sg-btn--lg" type="submit"
              disabled={connecting || code.trim().length < 2}>
              {connecting ? 'Connecting…' : 'Connect →'}
            </button>
          </form>
          <button className="sg-btn sg-btn--ghost" onClick={onCancel} disabled={connecting}>Back</button>
        </div>
      </div>
    </div>
  );
}

/* ================= main game ================= */

export function CairoGame({ hostCode, joinCode }: { hostCode?: string; joinCode?: string }) {
  /* --- screen routing --- */
  const [screen, setScreen] = useState('setup');
  // 'setup' | 'hosting' | 'joining' | 'connecting' | 'playing'
  const [myRole, setMyRole] = useState(null); // 'host' | 'guest'
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [joinTries, setJoinTries] = useState(0);
  const [guestConnected, setGuestConnected] = useState(false);

  /* --- network refs --- */
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const joinRetryRef = useRef(null);
  const guestCodeRef = useRef(null);
  const hostStartingRef = useRef(false);

  /* --- game state --- */
  const gameRef = useRef(null);        // host-only authoritative state
  const [view, setView] = useState(null); // what both players render from
  const [overlay, setOverlay] = useState(null); // {title,msg,cards}
  const [snapLeft, setSnapLeft] = useState(SNAP_SECONDS);
  const armedTokenRef = useRef(null);

  const me = myRole === 'host' ? 0 : 1;
  const opp = other(me);

  const send = (msg) => { if (connRef.current?.open) connRef.current.send(msg); };
  useEffect(() => () => peerRef.current?.destroy(), []);

  /* --- event (peek / reveal) handling for the local player --- */
  const handleEv = (ev, meIdx) => {
    if (!ev) return;
    if (ev.type === 'peek') {
      if (ev.for === meIdx) setOverlay({ title: ev.title, msg: ev.msg, cards: ev.cards });
    } else if (ev.type === 'reveal') {
      setOverlay({ title: ev.title, msg: ev.msg, cards: ev.cards });
    }
  };

  /* --- host: broadcast state + apply actions --- */
  const pushState = (ev) => {
    const g = gameRef.current;
    if (!g) return;
    const snap = JSON.parse(JSON.stringify(g));
    setView(snap);
    send({ t: 'STATE', g: snap, ev });
    handleEv(ev, 0);
  };

  const afterApply = (ev) => {
    const g = gameRef.current;
    // Arm the snap-window timer whenever a fresh snap phase begins.
    if (g.phase === 'snap' && g.snapCtx && armedTokenRef.current !== g.snapCtx.token) {
      const token = g.snapCtx.token;
      armedTokenRef.current = token;
      setTimeout(() => {
        const gg = gameRef.current;
        if (gg && gg.phase === 'snap' && gg.snapCtx?.token === token) {
          advanceTurn(gg);
          pushState(null);
        }
      }, SNAP_SECONDS * 1000);
    }
    pushState(ev);
  };

  const hostAct = (p, a) => {
    const g = gameRef.current;
    if (!g) return;
    const ev = applyAction(g, p, a);
    afterApply(ev);
  };

  // Viewer-agnostic action dispatcher.
  const act = (a) => {
    if (myRole === 'host') hostAct(0, a);
    else send({ t: 'ACT', a });
  };

  /* ========== HOST ========== */

  const startHosting = (existingCode?: string) => {
    const code = existingCode || genCode();
    setRoomCode(code);
    setMyRole('host');
    setScreen('hosting');
    setJoinError('');
    setGuestConnected(false);

    const peer = new Peer(PEER_PREFIX + code);
    peerRef.current = peer;

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        peer.destroy();
        if (existingCode) setTimeout(() => startHosting(existingCode), 1500);
        else startHosting();
      } else {
        setJoinError('Network error (' + (err.type || 'unknown') + '). Please try again.');
        setScreen('setup');
      }
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;

      conn.on('open', () => {
        setGuestConnected(true);
        gameRef.current = newGame();
        armedTokenRef.current = null;
        setOverlay(null);
        setScreen('playing');
        pushState(null);
      });

      conn.on('data', (data: any) => {
        if (data.t === 'ACT') hostAct(1, data.a);
      });

      conn.on('close', () => {
        setJoinError('Player 2 disconnected. Start a new game.');
        setGuestConnected(false);
        setScreen('setup');
      });
    });
  };

  /* ========== GUEST ========== */

  const attachGuestHandlers = (conn) => {
    conn.on('data', (data: any) => {
      if (data.t === 'HOST_STARTING') { hostStartingRef.current = true; return; }
      if (data.t === 'STATE') {
        setView(data.g);
        handleEv(data.ev, 1);
      }
    });

    conn.on('close', () => {
      if (hostStartingRef.current) {
        hostStartingRef.current = false;
        const code = guestCodeRef.current;
        if (!code || !peerRef.current) {
          setJoinError('Disconnected. Start a new game.');
          setScreen('setup');
          return;
        }
        let retries = 0;
        const retry = () => {
          if (!peerRef.current || retries >= 20) {
            setJoinError('Could not reconnect to Player 1. Start a new game.');
            setScreen('setup');
            return;
          }
          retries++;
          const newConn = peerRef.current.connect(PEER_PREFIX + code);
          connRef.current = newConn;
          const timer = setTimeout(retry, 3000);
          newConn.on('open', () => {
            clearTimeout(timer);
            connRef.current = newConn;
            setView(null);
            attachGuestHandlers(newConn);
          });
        };
        setTimeout(retry, 300);
        return;
      }
      setJoinError('Disconnected from Player 1. Start a new game.');
      setScreen('setup');
    });
  };

  const MAX_JOIN_TRIES = 30;

  const startJoining = (code) => {
    guestCodeRef.current = code;
    setConnecting(true);
    setJoinError('');
    setJoinTries(0);
    setMyRole('guest');
    setScreen('connecting');

    const peer = new Peer();
    peerRef.current = peer;
    const state = { connected: false, tries: 0, timer: null };
    joinRetryRef.current = state;

    const attempt = () => {
      if (state.connected) return;
      state.tries++;
      setJoinTries(state.tries);

      if (state.tries > MAX_JOIN_TRIES) {
        setJoinError('Could not reach the room. Make sure Player 1 has opened it, then try again.');
        setConnecting(false);
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
        setConnecting(false);
        setScreen('playing');
        setView(null); // wait for first STATE from host
        attachGuestHandlers(conn);
      });
    };

    peer.on('open', attempt);
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') return; // host not listening yet — keep retrying
      if (!state.connected) {
        setJoinError('Connection error. Please try again.');
        setConnecting(false);
      }
    });
  };

  const cancel = () => {
    if (joinRetryRef.current) {
      joinRetryRef.current.connected = true;
      clearTimeout(joinRetryRef.current.timer);
      joinRetryRef.current = null;
    }
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    setScreen('setup');
    setJoinError('');
    setConnecting(false);
  };

  /* --- auto-start from route params (launched from catalog) --- */
  useEffect(() => {
    if (hostCode) startHosting(hostCode);
    else if (joinCode) startJoining(joinCode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- local snap countdown (approximate; host timer is authoritative) --- */
  const snapToken = view?.snapCtx?.token;
  useEffect(() => {
    if (!snapToken) return;
    setSnapLeft(SNAP_SECONDS);
    const iv = setInterval(() => setSnapLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [snapToken]);

  /* ================= interaction rules (per viewer) ================= */

  const v = view;
  const myTurn = v && v.turn === me;

  // What clicking a slot in `tp`'s grid should do, given the current phase.
  const slotAction = (tp) => {
    if (!v) return null;
    if (v.phase === 'drawn' && myTurn && tp === me) return 'swap';
    if (v.phase === 'effect' && v.effect?.actor === me) {
      const k = v.effect.kind;
      if (v.kabul === tp) return null;
      if (k === 'peek_own' && tp === me) return 'effect';
      if (k === 'peek_other' && tp === opp) return 'effect';
      if (k === 'swap_look' || k === 'swap_blind') return 'effect';
      return null;
    }
    if (v.phase === 'snap' && me !== v.kabul && tp !== v.kabul && !v.snapCtx?.passes?.[me]) return 'snap';
    if (v.phase === 'give' && v.give?.snapper === me && tp === me) return 'give';
    return null;
  };

  const onSlotClick = (tp, slot) => {
    const mode = slotAction(tp);
    if (!mode) return;
    if (mode === 'swap')   act({ t:'swap', slot });
    if (mode === 'effect') act({ t:'effect_pick', tp, slot });
    if (mode === 'snap')   act({ t:'snap', tp, slot });
    if (mode === 'give')   act({ t:'give', slot });
  };

  const isSelected = (tp, slot) =>
    v?.effect?.picks?.some(pk => pk.tp === tp && pk.slot === slot);

  /* ================= screens ================= */

  if (screen === 'setup') {
    return (
      <div className="sg-shell">
        <TopBar kabul={null} />
        <div className="sg-center">
          <div className="sg-intro">
            <h1 className="sg-intro__title">Cairo</h1>
            <p className="sg-intro__sub">A memory game of low cards, sneaky peeks and lightning snaps — for 2 players on 2 devices.</p>
            <div className="sg-intro__rules">
              <div className="sg-intro__rule"><span className="sg-intro__n">1</span><span>You each get 4 face-down cards in a 2×2 grid. At the start you may memorise your <strong>two bottom cards</strong> — then they stay hidden.</span></div>
              <div className="sg-intro__rule"><span className="sg-intro__n">2</span><span>On your turn, draw from the deck or discard pile. Discard the drawn card (6–K trigger effects: peeks and switches), or swap it into your grid.</span></div>
              <div className="sg-intro__rule"><span className="sg-intro__n">3</span><span>After any discard, either player may <strong>snap</strong> a face-down card that matches the pile — even from the opponent's grid. A wrong snap costs a penalty card.</span></div>
              <div className="sg-intro__rule"><span className="sg-intro__n">4</span><span>Think your hand is lowest? Call <strong>KABUL!</strong> at the start of your turn. Your opponent gets one final turn, then everything is revealed — lowest total wins.</span></div>
            </div>
            <span className="sg-ref-label">Card values</span>
            <div className="sg-ref-cards">
              <span className="sg-ref-card">🃏 Joker = −1</span>
              <span className="sg-ref-card">Red K = 0</span>
              <span className="sg-ref-card">A = 1</span>
              <span className="sg-ref-card">2–10 = face value</span>
              <span className="sg-ref-card">J = 11</span>
              <span className="sg-ref-card">Q = 12</span>
              <span className="sg-ref-card">Black K = 13</span>
            </div>
            {joinError && <p className="sg-net-error">{joinError}</p>}
            <div className="sg-setup-actions">
              <button className="sg-btn sg-btn--primary sg-btn--lg" onClick={() => startHosting()}>Host a game</button>
              <button className="sg-btn sg-btn--secondary" onClick={() => setScreen('joining')}>Join with a code</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'hosting') {
    return (
      <div className="sg-shell">
        <TopBar kabul={null} />
        <div className="sg-center">
          <div className="sg-lobby">
            <h2 className="sg-lobby__title">Your room is open</h2>
            <p className="sg-lobby__sub">Share this code with Player 2:</p>
            <div className="sg-lobby__code">{roomCode}</div>
            <p className="sg-lobby__hint">Player 2 opens Cairo on their device, taps "Join with a code" and enters it.</p>
            <div className="sg-lobby__wait"><span className="sg-spinner" />Waiting for Player 2…</div>
            <button className="sg-btn sg-btn--ghost" onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'joining') {
    return <JoinLobby onConnect={startJoining} onCancel={cancel} error={joinError} connecting={connecting} />;
  }

  if (screen === 'connecting') {
    return (
      <div className="sg-shell">
        <TopBar kabul={null} />
        <div className="sg-center">
          <div className="sg-lobby">
            {joinError ? (
              <>
                <h2 className="sg-lobby__title">Couldn't connect</h2>
                <p className="sg-net-error">{joinError}</p>
                <button className="sg-btn sg-btn--ghost" onClick={cancel}>Back</button>
              </>
            ) : (
              <>
                <h2 className="sg-lobby__title">Joining the room…</h2>
                <div className="sg-lobby__wait">
                  <span className="sg-spinner" />
                  Connecting to Player 1{joinTries > 1 ? ` (attempt ${joinTries})` : ''}…
                </div>
                <p className="sg-lobby__hint">If this is taking a while, make sure Player 1 has opened the room.</p>
                <button className="sg-btn sg-btn--ghost" onClick={cancel}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- playing ----
  if (!v) return <WaitingScreen msg="Waiting for Player 1 to deal the cards…" />;

  /* ----- game over screen ----- */
  if (v.phase === 'gameover') {
    const { totals, winner } = v.result;
    let msg;
    if (winner === null) msg = "It's a Draw";
    else msg = '🏆 ' + pname(winner) + ' Wins!';
    return (
      <div className="sg-shell">
        <TopBar kabul={v.kabul} />
        <div className="sg-center">
          <div className="kb-gameover">
            <h2 className="kb-gameover__msg">{msg}</h2>
            <div className="kb-gameover__hands">
              {[0, 1].map(p => (
                <div className="kb-gameover__hand" key={p}>
                  <div className="kb-gameover__who">
                    <span>{pname(p)}{p === me ? ' (you)' : ''}{v.kabul === p ? ' — called KABUL' : ''}</span>
                    <span className={'kb-gameover__total' + (winner === p ? ' kb-gameover__total--win' : '')}>
                      {totals[p]} pts
                    </span>
                    {winner === p && <span className="kb-win-tag">LOWEST</span>}
                  </div>
                  <div className="kb-gameover__cards">
                    {v.hands[p].length === 0 && <span className="kb-pile-empty">EMPTY</span>}
                    {v.hands[p].map(c => <CardFace key={c.id} card={c} value={cardValue(c)} deal />)}
                  </div>
                </div>
              ))}
            </div>
            {me === 0 ? (
              <button className="sg-btn sg-btn--primary sg-btn--lg" onClick={() => act({ t:'reset' })}>Play Again</button>
            ) : (
              <p className="sg-lobby__hint" style={{marginTop:0}}>Waiting for Player 1 to restart…</p>
            )}
          </div>
        </div>
        {overlay && <Overlay {...overlay} onClose={() => setOverlay(null)} />}
      </div>
    );
  }

  /* ----- action bar contents ----- */
  const drawnEff = v.drawn ? effectOf(v.drawn.rank) : null;
  let status = null, sub = null, buttons = null;

  if (v.phase === 'peek') {
    status = 'Memorise your two bottom cards';
    sub = v.peekReady[me]
      ? 'Waiting for ' + pname(opp) + '…'
      : 'Only you can see them. Once you close the peek, they stay face down.';
  } else if (v.phase === 'turn') {
    if (myTurn) {
      status = v.kabul !== null ? 'Your FINAL turn!' : 'Your turn';
      sub = 'Tap the deck or the discard pile to draw' + (v.kabul === null ? ', or call KABUL to end the game.' : '.');
      buttons = v.kabul === null && (
        <button className="sg-btn sg-btn--kabul" onClick={() => act({ t:'kabul' })}>KABUL!</button>
      );
    } else {
      status = pname(opp) + (v.kabul !== null ? "'s final turn" : "'s turn");
      sub = 'Waiting for them to draw…';
    }
  } else if (v.phase === 'drawn') {
    if (myTurn) {
      status = 'You drew ' + cardLabel(v.drawn);
      if (v.drawnFrom === 'discard') {
        sub = 'Cards taken from the discard pile must go into your grid — tap one of your face-down cards to swap it in.';
      } else {
        sub = 'Discard it' + (drawnEff ? ' (with or without its effect)' : '') + ', or tap one of your face-down cards to swap it in.';
        buttons = (
          <>
            {drawnEff && (
              <button className="sg-btn sg-btn--primary" onClick={() => act({ t:'discard_drawn', withEffect:true })}>
                Discard & use effect
              </button>
            )}
            <button className={'sg-btn ' + (drawnEff ? 'sg-btn--secondary' : 'sg-btn--primary')}
              onClick={() => act({ t:'discard_drawn', withEffect:false })}>
              {drawnEff ? 'Discard without effect' : 'Discard'}
            </button>
          </>
        );
        if (drawnEff) sub = EFFECT_LABEL[drawnEff] + ' — or swap the card into your grid instead.';
      }
    } else {
      status = pname(opp) + ' drew a card…';
      sub = 'They\'re deciding what to do with it.';
    }
  } else if (v.phase === 'effect') {
    const k = v.effect.kind;
    if (v.effect.actor === me) {
      status = EFFECT_LABEL[k];
      if (k === 'peek_own') sub = 'Tap one of your face-down cards to look at it.';
      else if (k === 'peek_other') sub = "Tap one of your opponent's cards to look at it.";
      else sub = v.effect.picks.length === 0
        ? 'Tap any two cards on the table (yours or theirs) to switch them.'
        : 'Now tap a second card to complete the switch (tap the first again to cancel).';
      buttons = <button className="sg-btn sg-btn--ghost" onClick={() => act({ t:'effect_skip' })}>Skip effect</button>;
    } else {
      status = pname(opp) + ' is using an effect…';
      sub = EFFECT_LABEL[k];
    }
  } else if (v.phase === 'snap') {
    const top = v.discard[v.discard.length - 1];
    const iCanSnap = me !== v.kabul && !v.snapCtx.passes[me];
    status = 'SNAP window — pile shows ' + cardLabel(top);
    sub = iCanSnap
      ? 'Tap any face-down card you think matches ' + (top.rank === 'JOKER' ? 'the Joker' : 'rank ' + top.rank) + ' — yours or theirs. Wrong guess = penalty card!'
      : (v.snapCtx.passes[me] ? 'You passed — waiting for the window to close…' : 'Your cards are locked — you can\'t snap.');
    buttons = (
      <>
        <div className="kb-snapbar"><div className="kb-snapbar__fill" style={{width:(snapLeft / SNAP_SECONDS * 100) + '%'}} /></div>
        <button className="sg-btn sg-btn--sm sg-btn--secondary" onClick={() => act({ t:'snap_pass' })}
          disabled={!iCanSnap}>
          No snap — pass ({snapLeft}s)
        </button>
      </>
    );
  } else if (v.phase === 'give') {
    if (v.give.snapper === me) {
      status = 'Great snap! Now pay the price…';
      sub = 'Choose one of your face-down cards to give to ' + pname(v.give.to) + '.';
    } else {
      status = pname(opp) + ' snapped one of your cards!';
      sub = 'They\'re choosing which of their cards to give you.';
    }
  }

  /* ----- grids ----- */
  const renderGrid = (tp) => {
    const hand = v.hands[tp];
    const mode = slotAction(tp);
    const locked = v.kabul === tp;
    return (
      <div className={'kb-grid' + (hand.length > 4 ? ' kb-grid--wide' : '')}>
        {hand.length === 0 && <span className="kb-pile-empty">EMPTY</span>}
        {hand.map((c, i) => (
          <Slot key={c.id} num={i + 1}
            clickable={!!mode}
            selected={isSelected(tp, i)}
            locked={locked}
            onClick={() => onSlotClick(tp, i)}
          />
        ))}
      </div>
    );
  };

  const deckClickable = v.phase === 'turn' && myTurn && (v.deck.length > 0 || v.discard.length > 1);
  const discardTop = v.discard[v.discard.length - 1];
  const discardClickable = v.phase === 'turn' && myTurn && v.discard.length > 0;

  return (
    <div className="sg-shell">
      <TopBar kabul={v.kabul} />
      <p className="kb-note">{v.note}</p>
      <div className="sg-center" style={{alignItems:'flex-start'}}>
        <div className="kb-table">

          {/* opponent */}
          <section className="kb-side">
            <div className={'kb-side__label' + (v.turn === opp && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') ? ' kb-side__label--turn' : '')}>
              {v.turn === opp && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') && <span className="kb-turn-dot" />}
              {pname(opp)} (opponent)
              {v.kabul === opp && <span className="kb-locked-tag">LOCKED</span>}
            </div>
            {renderGrid(opp)}
          </section>

          {/* center: deck / discard / drawn */}
          <div className="kb-centerrow">
            <div className="kb-pilewrap">
              <span className="kb-pile-label">Deck · {v.deck.length}</span>
              {v.deck.length > 0 ? (
                <button type="button"
                  className={'kb-slot kb-deck' + (deckClickable ? ' kb-deck--clickable' : ' kb-slot--inert')}
                  onClick={deckClickable ? () => act({ t:'draw', from:'deck' }) : undefined}
                  disabled={!deckClickable}>
                  <span className="kb-slot__num">CAIRO</span>
                </button>
              ) : (
                <span className="kb-pile-empty">EMPTY</span>
              )}
            </div>

            <div className="kb-pilewrap">
              <span className="kb-pile-label">Discard</span>
              {discardTop ? (
                discardClickable ? (
                  <button type="button" style={{background:'none',border:'none',padding:0}}
                    onClick={() => act({ t:'draw', from:'discard' })}>
                    <div className="kb-discard-click"><CardFace card={discardTop} /></div>
                  </button>
                ) : (
                  <div className={v.phase === 'snap' ? 'kb-discard--snap kb-card-holder' : ''}>
                    <CardFace card={discardTop} deal />
                  </div>
                )
              ) : (
                <span className="kb-pile-empty">—</span>
              )}
            </div>

            {v.drawn && (
              <div className="kb-drawnwrap">
                <span className="kb-pile-label">Drawn card</span>
                {myTurn ? <CardFace card={v.drawn} deal /> : <div className="kb-drawn-hidden">?</div>}
              </div>
            )}
          </div>

          {/* me */}
          <section className="kb-side">
            {renderGrid(me)}
            <div className={'kb-side__label' + (myTurn && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') ? ' kb-side__label--turn' : '')}>
              {myTurn && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') && <span className="kb-turn-dot" />}
              {pname(me)} (you)
              {v.kabul === me && <span className="kb-locked-tag">LOCKED</span>}
            </div>
          </section>

          {/* action bar */}
          <div className="kb-actionbar">
            {status && <p className="kb-status">{status}</p>}
            {sub && <p className="kb-substatus">{sub}</p>}
            {buttons && <div className="kb-btnrow">{buttons}</div>}
          </div>
        </div>
      </div>

      {/* initial peek overlay */}
      {v.phase === 'peek' && !v.peekReady[me] && !overlay && (
        <Overlay
          title="Your two bottom cards"
          msg="Memorise them! Positions 3 and 4 in your grid. You won't see them again unless a card effect lets you peek."
          cards={[
            v.hands[me][2] && { card: v.hands[me][2], label: 'Position 3' },
            v.hands[me][3] && { card: v.hands[me][3], label: 'Position 4' },
          ].filter(Boolean)}
          closeLabel="I'll remember them"
          onClose={() => act({ t:'peek_done' })}
        />
      )}

      {/* effect peeks & snap reveals */}
      {overlay && <Overlay {...overlay} onClose={() => setOverlay(null)} />}
    </div>
  );
}

export default CairoGame;