// CairoGame.tsx — Cairo: networked 2-player memory/deduction card game (PeerJS WebRTC)
// Host (Player 1) holds the authoritative game state; the guest sends actions,
// the host applies them and broadcasts the new state to both screens.
//
// Rendered as an in-app page: the launcher passes host/join codes as props
// (from the #/play/cairo?host=|join= route) instead of reading location.search.
import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import {
  Shell, Center, TopBarRow, BackLink, GameTitle, TopBarRight, KabulPill, SgBtn,
  Intro, IntroTitle, IntroSub, IntroRules, IntroRule, IntroNum,
  RefLabel, RefCards, RefCard, SetupActions,
  NetError, Lobby, LobbyTitle, LobbySub, LobbyCode, LobbyHint, LobbyWait, Spinner,
  JoinForm, CodeInput,
  Table, Note, Side, SideLabel, TurnDot, LockedTag, HandGrid,
  Slot as SlotBtn, SlotNum,
  CardBox, CardRankTl, CardRankBr, CardSuit, CardPip, CardValue,
  CenterRow, PileWrap, PileLabel, PileEmpty, DiscardClick, DiscardHolder,
  DrawnWrap, DrawnHidden,
  ActionBar, Status, SubStatus, BtnRow, SnapBar, SnapFill,
  Overlay as OverlayBg, OverlayPanel, OverlayTitle, OverlayMsg,
  PeekCards, PeekCard, PeekCardLabel,
  GameOver, GameOverMsg, GameOverHands, GameOverHand, GameOverWho,
  GameOverTotal, WinTag, GameOverCards,
} from "./cairoGame.styles";

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
  const tone = joker ? 'joker' : (card.color === 'red' ? 'red' : 'black');
  return (
    <CardBox $tone={tone} $lg={lg} $deal={deal}>
      <CardRankTl>{joker ? 'JKR' : card.rank}</CardRankTl>
      {!joker && <CardSuit>{card.suit}</CardSuit>}
      <CardPip>{joker ? '🃏' : card.suit}</CardPip>
      <CardRankBr>{joker ? 'JKR' : card.rank}</CardRankBr>
      {value !== undefined && <CardValue>{value} pt{value === 1 ? '' : 's'}</CardValue>}
    </CardBox>
  );
}

function Slot({ num, clickable, selected, locked, onClick }) {
  return (
    <SlotBtn $clickable={clickable} $selected={selected} $locked={locked}
      type="button" onClick={clickable ? onClick : undefined} disabled={!clickable}>
      <SlotNum>{num}</SlotNum>
    </SlotBtn>
  );
}

function TopBar({ kabul }) {
  return (
    <TopBarRow>
      <BackLink href="#/">← All games</BackLink>
      <GameTitle>Cairo</GameTitle>
      <TopBarRight>
        {kabul !== null && kabul !== undefined && <KabulPill>KABUL!</KabulPill>}
      </TopBarRight>
    </TopBarRow>
  );
}

function Overlay({ title, msg, cards, onClose, closeLabel }) {
  return (
    <OverlayBg>
      <OverlayPanel>
        <OverlayTitle>{title}</OverlayTitle>
        {msg && <OverlayMsg>{msg}</OverlayMsg>}
        {cards && cards.length > 0 && (
          <PeekCards>
            {cards.map((pc, i) => (
              <PeekCard key={i}>
                <CardFace card={pc.card} lg deal />
                {pc.label && <PeekCardLabel>{pc.label}</PeekCardLabel>}
              </PeekCard>
            ))}
          </PeekCards>
        )}
        <SgBtn $kind="primary" onClick={onClose}>{closeLabel || 'Got it'}</SgBtn>
      </OverlayPanel>
    </OverlayBg>
  );
}

function WaitingScreen({ msg }) {
  return (
    <Shell>
      <TopBar kabul={null} />
      <Center>
        <Lobby>
          <LobbyWait><Spinner />{msg}</LobbyWait>
        </Lobby>
      </Center>
    </Shell>
  );
}

function JoinLobby({ onConnect, onCancel, error, connecting }) {
  const [code, setCode] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (code.trim().length >= 2) onConnect(code.trim());
  };
  return (
    <Shell>
      <TopBar kabul={null} />
      <Center>
        <Lobby>
          <LobbyTitle>Join a Game</LobbyTitle>
          <LobbySub>Enter the code from Player 1:</LobbySub>
          <JoinForm onSubmit={submit}>
            <CodeInput
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={4}
              placeholder="XXXX"
              autoFocus
              disabled={connecting}
            />
            {error && <NetError>{error}</NetError>}
            <SgBtn $kind="primary" $lg type="submit"
              disabled={connecting || code.trim().length < 2}>
              {connecting ? 'Connecting…' : 'Connect →'}
            </SgBtn>
          </JoinForm>
          <SgBtn $kind="ghost" onClick={onCancel} disabled={connecting}>Back</SgBtn>
        </Lobby>
      </Center>
    </Shell>
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
      <Shell>
        <TopBar kabul={null} />
        <Center>
          <Intro>
            <IntroTitle>Cairo</IntroTitle>
            <IntroSub>A memory game of low cards, sneaky peeks and lightning snaps — for 2 players on 2 devices.</IntroSub>
            <IntroRules>
              <IntroRule><IntroNum>1</IntroNum><span>You each get 4 face-down cards in a 2×2 grid. At the start you may memorise your <strong>two bottom cards</strong> — then they stay hidden.</span></IntroRule>
              <IntroRule><IntroNum>2</IntroNum><span>On your turn, draw from the deck or discard pile. Discard the drawn card (6–K trigger effects: peeks and switches), or swap it into your grid.</span></IntroRule>
              <IntroRule><IntroNum>3</IntroNum><span>After any discard, either player may <strong>snap</strong> a face-down card that matches the pile — even from the opponent's grid. A wrong snap costs a penalty card.</span></IntroRule>
              <IntroRule><IntroNum>4</IntroNum><span>Think your hand is lowest? Call <strong>KABUL!</strong> at the start of your turn. Your opponent gets one final turn, then everything is revealed — lowest total wins.</span></IntroRule>
            </IntroRules>
            <RefLabel>Card values</RefLabel>
            <RefCards>
              <RefCard>🃏 Joker = −1</RefCard>
              <RefCard>Red K = 0</RefCard>
              <RefCard>A = 1</RefCard>
              <RefCard>2–10 = face value</RefCard>
              <RefCard>J = 11</RefCard>
              <RefCard>Q = 12</RefCard>
              <RefCard>Black K = 13</RefCard>
            </RefCards>
            {joinError && <NetError>{joinError}</NetError>}
            <SetupActions>
              <SgBtn $kind="primary" $lg onClick={() => startHosting()}>Host a game</SgBtn>
              <SgBtn $kind="secondary" onClick={() => setScreen('joining')}>Join with a code</SgBtn>
            </SetupActions>
          </Intro>
        </Center>
      </Shell>
    );
  }

  if (screen === 'hosting') {
    return (
      <Shell>
        <TopBar kabul={null} />
        <Center>
          <Lobby>
            <LobbyTitle>Your room is open</LobbyTitle>
            <LobbySub>Share this code with Player 2:</LobbySub>
            <LobbyCode>{roomCode}</LobbyCode>
            <LobbyHint>Player 2 opens Cairo on their device, taps "Join with a code" and enters it.</LobbyHint>
            <LobbyWait><Spinner />Waiting for Player 2…</LobbyWait>
            <SgBtn $kind="ghost" onClick={cancel}>Cancel</SgBtn>
          </Lobby>
        </Center>
      </Shell>
    );
  }

  if (screen === 'joining') {
    return <JoinLobby onConnect={startJoining} onCancel={cancel} error={joinError} connecting={connecting} />;
  }

  if (screen === 'connecting') {
    return (
      <Shell>
        <TopBar kabul={null} />
        <Center>
          <Lobby>
            {joinError ? (
              <>
                <LobbyTitle>Couldn't connect</LobbyTitle>
                <NetError>{joinError}</NetError>
                <SgBtn $kind="ghost" onClick={cancel}>Back</SgBtn>
              </>
            ) : (
              <>
                <LobbyTitle>Joining the room…</LobbyTitle>
                <LobbyWait>
                  <Spinner />
                  Connecting to Player 1{joinTries > 1 ? ` (attempt ${joinTries})` : ''}…
                </LobbyWait>
                <LobbyHint>If this is taking a while, make sure Player 1 has opened the room.</LobbyHint>
                <SgBtn $kind="ghost" onClick={cancel}>Cancel</SgBtn>
              </>
            )}
          </Lobby>
        </Center>
      </Shell>
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
      <Shell>
        <TopBar kabul={v.kabul} />
        <Center>
          <GameOver>
            <GameOverMsg>{msg}</GameOverMsg>
            <GameOverHands>
              {[0, 1].map(p => (
                <GameOverHand key={p}>
                  <GameOverWho>
                    <span>{pname(p)}{p === me ? ' (you)' : ''}{v.kabul === p ? ' — called KABUL' : ''}</span>
                    <GameOverTotal $win={winner === p}>
                      {totals[p]} pts
                    </GameOverTotal>
                    {winner === p && <WinTag>LOWEST</WinTag>}
                  </GameOverWho>
                  <GameOverCards>
                    {v.hands[p].length === 0 && <PileEmpty>EMPTY</PileEmpty>}
                    {v.hands[p].map(c => <CardFace key={c.id} card={c} value={cardValue(c)} deal />)}
                  </GameOverCards>
                </GameOverHand>
              ))}
            </GameOverHands>
            {me === 0 ? (
              <SgBtn $kind="primary" $lg onClick={() => act({ t:'reset' })}>Play Again</SgBtn>
            ) : (
              <LobbyHint style={{marginTop:0}}>Waiting for Player 1 to restart…</LobbyHint>
            )}
          </GameOver>
        </Center>
        {overlay && <Overlay {...overlay} onClose={() => setOverlay(null)} />}
      </Shell>
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
        <SgBtn $kind="kabul" onClick={() => act({ t:'kabul' })}>KABUL!</SgBtn>
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
              <SgBtn $kind="primary" onClick={() => act({ t:'discard_drawn', withEffect:true })}>
                Discard & use effect
              </SgBtn>
            )}
            <SgBtn $kind={drawnEff ? 'secondary' : 'primary'}
              onClick={() => act({ t:'discard_drawn', withEffect:false })}>
              {drawnEff ? 'Discard without effect' : 'Discard'}
            </SgBtn>
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
      buttons = <SgBtn $kind="ghost" onClick={() => act({ t:'effect_skip' })}>Skip effect</SgBtn>;
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
        <SnapBar><SnapFill $pct={snapLeft / SNAP_SECONDS * 100} /></SnapBar>
        <SgBtn $sm $kind="secondary" onClick={() => act({ t:'snap_pass' })}
          disabled={!iCanSnap}>
          No snap — pass ({snapLeft}s)
        </SgBtn>
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
      <HandGrid $wide={hand.length > 4}>
        {hand.length === 0 && <PileEmpty>EMPTY</PileEmpty>}
        {hand.map((c, i) => (
          <Slot key={c.id} num={i + 1}
            clickable={!!mode}
            selected={isSelected(tp, i)}
            locked={locked}
            onClick={() => onSlotClick(tp, i)}
          />
        ))}
      </HandGrid>
    );
  };

  const deckClickable = v.phase === 'turn' && myTurn && (v.deck.length > 0 || v.discard.length > 1);
  const discardTop = v.discard[v.discard.length - 1];
  const discardClickable = v.phase === 'turn' && myTurn && v.discard.length > 0;

  return (
    <Shell>
      <TopBar kabul={v.kabul} />
      <Note>{v.note}</Note>
      <Center style={{alignItems:'flex-start'}}>
        <Table>

          {/* opponent */}
          <Side>
            <SideLabel $turn={v.turn === opp && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect')}>
              {v.turn === opp && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') && <TurnDot />}
              {pname(opp)} (opponent)
              {v.kabul === opp && <LockedTag>LOCKED</LockedTag>}
            </SideLabel>
            {renderGrid(opp)}
          </Side>

          {/* center: deck / discard / drawn */}
          <CenterRow>
            <PileWrap>
              <PileLabel>Deck · {v.deck.length}</PileLabel>
              {v.deck.length > 0 ? (
                <SlotBtn type="button"
                  $clickable={deckClickable}
                  onClick={deckClickable ? () => act({ t:'draw', from:'deck' }) : undefined}
                  disabled={!deckClickable}>
                  <SlotNum>CAIRO</SlotNum>
                </SlotBtn>
              ) : (
                <PileEmpty>EMPTY</PileEmpty>
              )}
            </PileWrap>

            <PileWrap>
              <PileLabel>Discard</PileLabel>
              {discardTop ? (
                discardClickable ? (
                  <button type="button" style={{background:'none',border:'none',padding:0}}
                    onClick={() => act({ t:'draw', from:'discard' })}>
                    <DiscardClick><CardFace card={discardTop} /></DiscardClick>
                  </button>
                ) : (
                  <DiscardHolder $snap={v.phase === 'snap'}>
                    <CardFace card={discardTop} deal />
                  </DiscardHolder>
                )
              ) : (
                <PileEmpty>—</PileEmpty>
              )}
            </PileWrap>

            {v.drawn && (
              <DrawnWrap>
                <PileLabel>Drawn card</PileLabel>
                {myTurn ? <CardFace card={v.drawn} deal /> : <DrawnHidden>?</DrawnHidden>}
              </DrawnWrap>
            )}
          </CenterRow>

          {/* me */}
          <Side>
            {renderGrid(me)}
            <SideLabel $turn={myTurn && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect')}>
              {myTurn && (v.phase === 'turn' || v.phase === 'drawn' || v.phase === 'effect') && <TurnDot />}
              {pname(me)} (you)
              {v.kabul === me && <LockedTag>LOCKED</LockedTag>}
            </SideLabel>
          </Side>

          {/* action bar */}
          <ActionBar>
            {status && <Status>{status}</Status>}
            {sub && <SubStatus>{sub}</SubStatus>}
            {buttons && <BtnRow>{buttons}</BtnRow>}
          </ActionBar>
        </Table>
      </Center>

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
    </Shell>
  );
}

export default CairoGame;