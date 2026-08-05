// TheTellGame.tsx — The Tell: networked 2-player deduction game (PeerJS WebRTC)
//
// Rendered as an in-app page: the launcher passes host/join codes as props
// (from the #/play/the-tell?host=|join= route) instead of location.search.
import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import {
  Shell, Center, TopBarRow, BackLink, GameTitle, RoundInfo, RoundNum, RoundScores,
  SgBtn, SmallCard, Rank, Suit, Pip, Hand,
  Pick, PickWho, PickLabel, PickSub, PickConfirm, PickAnnounce, ColorBadgePill,
  Reveal, RevealMsg, RevealCards, RevealVs, BigCardWrap, BigCardLabel, BigCardBox,
  BigRankTl, BigSuitTl, BigPip, BigRankBr, RevealScores, ScoreBox,
  GameOver, GameOverMsg, GameOverScores, GameOverScore,
  Lobby, LobbyTitle, LobbySub, LobbyHint, LobbyWait, Spinner, NetError,
  JoinForm, CodeInput,
} from "./theTellGame.styles";

const CARDS = [
  { rank:'8',  suit:'♥', color:'red',   order:1 },
  { rank:'9',  suit:'♠', color:'black', order:2 },
  { rank:'10', suit:'♦', color:'red',   order:3 },
  { rank:'J',  suit:'♣', color:'black', order:4 },
  { rank:'Q',  suit:'♥', color:'red',   order:5 },
  { rank:'K',  suit:'♠', color:'black', order:6 },
  { rank:'A',  suit:'♦', color:'red',   order:7 },
];

// Prefix keeps room codes distinct from other PeerJS users on the shared cloud server
const PEER_PREFIX = 'thetell-';

function genCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:4}, () => c[Math.floor(Math.random() * c.length)]).join('');
}

/* ---- SCard ---- */
function SCard({ card, selected, onClick }) {
  const red = card.color === 'red';
  return (
    <SmallCard $red={red} $selected={selected} onClick={onClick} type="button">
      <Rank $pos="tl">{card.rank}</Rank>
      <Suit>{card.suit}</Suit>
      <Pip>{card.suit}</Pip>
      <Rank $pos="br">{card.rank}</Rank>
    </SmallCard>
  );
}

/* ---- BigCard ---- */
function BigCard({ card, winner }) {
  return (
    <BigCardBox $red={card.color === 'red'} $winner={winner}>
      <BigRankTl>{card.rank}</BigRankTl>
      <BigSuitTl>{card.suit}</BigSuitTl>
      <BigPip>{card.suit}</BigPip>
      <BigRankBr>{card.rank}</BigRankBr>
    </BigCardBox>
  );
}

/* ---- ColorBadge ---- */
function ColorBadge({ color }) {
  return <ColorBadgePill $red={color === 'red'}>{color.toUpperCase()}</ColorBadgePill>;
}

/* ---- TopBar ---- */
function TopBar({ scores, round, showRound }) {
  return (
    <TopBarRow>
      <BackLink href="#/">← All games</BackLink>
      {showRound ? (
        <RoundInfo>
          <RoundNum>Round {round} of 7</RoundNum>
          <RoundScores>
            <span>P1 <strong>{scores[0]}</strong></span>
            <span>P2 <strong>{scores[1]}</strong></span>
          </RoundScores>
        </RoundInfo>
      ) : (
        <GameTitle>The Tell</GameTitle>
      )}
      <div style={{width:'80px'}} />
    </TopBarRow>
  );
}

/* ---- Join Lobby ---- */
function JoinLobby({ onConnect, onCancel, error, connecting }) {
  const [code, setCode] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (code.trim().length >= 2) onConnect(code.trim());
  };
  return (
    <Shell>
      <TopBar showRound={false} scores={[0,0]} round={1} />
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
            <SgBtn
              $kind="primary"
              $lg
              type="submit"
              disabled={connecting || code.trim().length < 2}
            >
              {connecting ? 'Connecting…' : 'Connect →'}
            </SgBtn>
          </JoinForm>
          <SgBtn $kind="ghost" onClick={onCancel} disabled={connecting}>Back</SgBtn>
        </Lobby>
      </Center>
    </Shell>
  );
}

/* ---- Waiting Screen ---- */
function WaitingScreen({ msg, scores, round }) {
  return (
    <Shell>
      <TopBar scores={scores || [0,0]} round={round || 1} showRound={(round || 0) > 0} />
      <Center>
        <Lobby>
          <LobbyWait>
            <Spinner />
            {msg}
          </LobbyWait>
        </Lobby>
      </Center>
    </Shell>
  );
}

/* ---- Pick Screen ---- */
function PickScreen({ playerLabel, hand, selected, onSelect, onConfirm, round, scores, label, sub, showColor }) {
  return (
    <Shell>
      <TopBar scores={scores} round={round} showRound={true} />
      <Center>
        <Pick>
          <PickWho>{playerLabel}</PickWho>
          <PickLabel>{label}</PickLabel>
          <PickSub>{sub}</PickSub>
          <Hand>
            {hand.map(c => (
              <SCard key={c.rank} card={c}
                selected={selected?.rank === c.rank}
                onClick={() => onSelect(c)}
              />
            ))}
          </Hand>
          {selected && (
            <PickConfirm>
              {showColor && (
                <PickAnnounce>
                  You're playing a <ColorBadge color={selected.color} /> card
                </PickAnnounce>
              )}
              <SgBtn $kind="primary" onClick={onConfirm}>
                Confirm →
              </SgBtn>
            </PickConfirm>
          )}
        </Pick>
      </Center>
    </Shell>
  );
}

/* ---- Reveal Screen ---- */
function RevealScreen({ result, scores, round, onNext, isHost }) {
  const { winner, p1card, p2card } = result;
  const isLast = round >= 7;
  let msg, tone;
  if (winner === 0) { msg = 'Player 1 wins the round!'; tone = 'win'; }
  else if (winner === 1) { msg = 'Player 2 wins the round!'; tone = 'win'; }
  else { msg = 'Tie — no point awarded'; tone = 'tie'; }
  return (
    <Shell>
      <TopBar scores={scores} round={round} showRound={true} />
      <Center>
        <Reveal>
          <RevealMsg $tone={tone}>{msg}</RevealMsg>
          <RevealCards>
            <BigCardWrap>
              <BigCardLabel>Player 1</BigCardLabel>
              <BigCard card={p1card} winner={winner === 0} />
            </BigCardWrap>
            <RevealVs>VS</RevealVs>
            <BigCardWrap>
              <BigCardLabel>Player 2</BigCardLabel>
              <BigCard card={p2card} winner={winner === 1} />
            </BigCardWrap>
          </RevealCards>
          <RevealScores>
            <ScoreBox $win={winner === 0}>
              <span>P1</span><strong>{scores[0]}</strong>
            </ScoreBox>
            <ScoreBox $win={winner === 1}>
              <span>P2</span><strong>{scores[1]}</strong>
            </ScoreBox>
          </RevealScores>
          {isHost ? (
            <SgBtn $kind="primary" $lg onClick={onNext}>
              {isLast ? 'See Final Results →' : `Round ${round + 1} →`}
            </SgBtn>
          ) : (
            <LobbyHint style={{marginTop:0}}>
              Waiting for Player 1 to continue…
            </LobbyHint>
          )}
        </Reveal>
      </Center>
    </Shell>
  );
}

/* ---- Game Over Screen ---- */
function GameOverScreen({ scores, onReset, isHost }) {
  const [s1, s2] = scores;
  let msg;
  if (s1 > s2) msg = '🏆 Player 1 Wins!';
  else if (s2 > s1) msg = '🏆 Player 2 Wins!';
  else msg = "It's a Draw";
  return (
    <Shell>
      <TopBar showRound={false} scores={scores} round={7} />
      <Center>
        <GameOver>
          <GameOverMsg>{msg}</GameOverMsg>
          <GameOverScores>
            <GameOverScore>
              <span>Player 1</span><strong>{s1}</strong><span>points</span>
            </GameOverScore>
            <GameOverScore>
              <span>Player 2</span><strong>{s2}</strong><span>points</span>
            </GameOverScore>
          </GameOverScores>
          {isHost ? (
            <SgBtn $kind="primary" $lg onClick={onReset}>Play Again</SgBtn>
          ) : (
            <LobbyHint style={{marginTop:0}}>Waiting for Player 1 to restart…</LobbyHint>
          )}
        </GameOver>
      </Center>
    </Shell>
  );
}

/* ===== MAIN GAME ===== */
export function TheTellGame({ hostCode, joinCode }: { hostCode?: string; joinCode?: string }) {
  /* --- Screen routing --- */
  const [screen, setScreen] = useState('setup');
  // 'setup' | 'hosting' | 'joining' | 'connecting' | 'playing'
  const [myRole, setMyRole] = useState(null); // 'host' | 'guest'
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [joinTries, setJoinTries] = useState(0);

  /* --- Network refs --- */
  const peerRef = useRef(null);
  const connRef = useRef(null);
  const joinRetryRef = useRef(null);

  /* --- Game state (rendered) --- */
  const [phase, setPhase] = useState('');
  /*
    host phases:  'i_first' | 'wait_guest_response' | 'wait_guest_first' | 'i_second' | 'reveal' | 'gameover'
    guest phases: 'wait_host' | 'i_first' | 'wait_host_response' | 'i_second' | 'reveal' | 'gameover'
  */
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState([0, 0]);
  const [myHand, setMyHand] = useState([...CARDS]);
  const [mySel, setMySel] = useState(null);
  const [announcedColor, setAnnouncedColor] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  /* --- Refs for latest state (safe to read inside connection callbacks) --- */
  const mySelRef = useRef(null);
  const roundRef = useRef(1);
  const scoresRef = useRef([0, 0]);
  const myHandRef = useRef([...CARDS]);
  const guestCardRef = useRef(null); // host: guest's card this round
  const guestCodeRef = useRef(null); // guest: room code, for reconnect after HOST_STARTING
  const hostStartingRef = useRef(false); // guest: suppress error on expected disconnect

  useEffect(() => { mySelRef.current = mySel; }, [mySel]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { myHandRef.current = myHand; }, [myHand]);

  /* --- Send helper --- */
  const send = (msg) => {
    if (connRef.current?.open) connRef.current.send(msg);
  };

  /* --- Cleanup on unmount --- */
  useEffect(() => () => peerRef.current?.destroy(), []);

  /* ========== HOST ========== */

  const startHosting = (existingCode?: string) => {
    const code = existingCode || genCode();
    setRoomCode(code);
    setMyRole('host');
    setScreen('hosting');
    setJoinError('');

    const peer = new Peer(PEER_PREFIX + code);
    peerRef.current = peer;

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        // Id still registered (e.g. just reloaded). Keep the SAME code so the
        // shared invite stays valid — retry shortly once the old peer expires.
        peer.destroy();
        if (existingCode) {
          setTimeout(() => startHosting(existingCode), 1500);
        } else {
          startHosting(); // fresh random code is fine when none was shared yet
        }
      } else {
        setJoinError('Network error (' + (err.type || 'unknown') + '). Please try again.');
        setScreen('setup');
      }
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;

      conn.on('open', () => {
        const r = 1;
        const sc = [0, 0];
        const hand = [...CARDS];
        setScreen('playing');
        setRound(r);         roundRef.current = r;
        setScores(sc);       scoresRef.current = sc;
        setMyHand(hand);     myHandRef.current = hand;
        setMySel(null);      mySelRef.current = null;
        guestCardRef.current = null;
        setAnnouncedColor(null);
        setRoundResult(null);
        // Round 1: host (P1) goes first on odd rounds
        setPhase('i_first');
        send({ t: 'ROUND_START', round: r, scores: sc, guestFirst: false });
      });

      conn.on('data', (data: any) => {
        // Host data handler — reads refs, writes via setters (no stale closure risk)
        if (data.t === 'ANNOUNCED') {
          // Guest went first and announced their color
          guestCardRef.current = data.card;
          setAnnouncedColor(data.color);
          setMySel(null);
          setPhase('i_second');
        } else if (data.t === 'PICKED') {
          // Guest responded to host's announcement → store their card, then resolve
          guestCardRef.current = data.card;
          hostResolve(mySelRef.current, data.card);
        }
      });

      conn.on('close', () => {
        setJoinError('Player 2 disconnected. Start a new game.');
        setScreen('setup');
      });
    });
  };

  const hostResolve = (hostCard, guestCard) => {
    const sc = [...scoresRef.current];
    let winner = null;
    if (hostCard.order > guestCard.order) winner = 0;      // host = P1
    else if (guestCard.order > hostCard.order) winner = 1; // guest = P2
    if (winner !== null) sc[winner]++;
    const result = { winner, p1card: hostCard, p2card: guestCard };
    scoresRef.current = sc;
    setScores(sc);
    setRoundResult(result);
    setPhase('reveal');
    send({ t: 'REVEAL', result, scores: sc });
  };

  // Called when host clicks "Next Round" (host controls round pacing)
  const hostNextRound = () => {
    const r = roundRef.current;
    const sc = scoresRef.current;
    const myCard = mySelRef.current;
    const guestCard = guestCardRef.current;

    // Remove host's played card
    const newHand = myHandRef.current.filter(c => c.rank !== myCard?.rank);
    setMyHand(newHand);
    myHandRef.current = newHand;
    
    if (r >= 7) {
      setPhase('gameover');
      send({ t: 'GAME_OVER', scores: sc, guestPlayedCard: guestCard });
      return;
    }

    const nextR = r + 1;
    setRound(nextR);    roundRef.current = nextR;
    setMySel(null);     mySelRef.current = null;
    guestCardRef.current = null;
    setAnnouncedColor(null);
    setRoundResult(null);

    // Even rounds: guest (P2) goes first
    const guestFirst = nextR % 2 === 0;
    setPhase(guestFirst ? 'wait_guest_first' : 'i_first');
    send({ t: 'ROUND_START', round: nextR, scores: sc, guestFirst, guestPlayedCard: guestCard });
  };

  const hostReset = () => {
    const r = 1;
    const sc = [0, 0];
    const hand = [...CARDS];
    setRound(r);         roundRef.current = r;
    setScores(sc);       scoresRef.current = sc;
    setMyHand(hand);     myHandRef.current = hand;
    setMySel(null);      mySelRef.current = null;
    guestCardRef.current = null;
    setAnnouncedColor(null);
    setRoundResult(null);
    setPhase('i_first');
    send({ t: 'RESET' });
  };

  /* ========== GUEST ========== */

  // Guest's message handlers, attached to whichever connection opens first
  const attachGuestHandlers = (conn) => {
    conn.on('data', (data: any) => {
      if (data.t === 'HOST_STARTING') {
        hostStartingRef.current = true;
        return;
      }
      if (data.t === 'ROUND_START') {
        if (data.guestPlayedCard) {
          setMyHand(h => h.filter(c => c.rank !== data.guestPlayedCard.rank));
        }
        setRound(data.round);
        setScores(data.scores);
        setMySel(null);
        setAnnouncedColor(null);
        setRoundResult(null);
        setPhase(data.guestFirst ? 'i_first' : 'wait_host');
      } else if (data.t === 'ANNOUNCED') {
        setAnnouncedColor(data.color);
        setRound(data.round);
        setMySel(null);
        setPhase('i_second');
      } else if (data.t === 'REVEAL') {
        setScores(data.scores);
        setRoundResult(data.result);
        setPhase('reveal');
      } else if (data.t === 'GAME_OVER') {
        if (data.guestPlayedCard) {
          setMyHand(h => h.filter(c => c.rank !== data.guestPlayedCard.rank));
        }
        setScores(data.scores);
        setPhase('gameover');
      } else if (data.t === 'RESET') {
        setMyHand([...CARDS]);
        setMySel(null);
        setAnnouncedColor(null);
        setRoundResult(null);
        setRound(1);
        setScores([0, 0]);
        setPhase('wait_host');
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
        // Host moved to game page — retry until their new peer is ready
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
            setMySel(null);
            setAnnouncedColor(null);
            setRoundResult(null);
            setRound(0);
            setScores([0, 0]);
            setPhase('wait_host');
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

  const MAX_JOIN_TRIES = 30; // ~90s of retrying while the host gets ready

  const startJoining = (code) => {
    guestCodeRef.current = code;
    setConnecting(true);
    setJoinError('');
    setJoinTries(0);
    setMyRole('guest');
    setScreen('connecting');

    const peer = new Peer(); // random ID for guest
    peerRef.current = peer;
    const state = { connected: false, tries: 0, timer: null };
    joinRetryRef.current = state;

    // One connection attempt. The host's PeerJS id may not exist yet
    // (host hasn't opened their room), so we retry until it does.
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

      // If this attempt hasn't opened shortly, try again.
      state.timer = setTimeout(() => { if (!state.connected) attempt(); }, 3000);

      conn.on('open', () => {
        if (state.connected) { conn.close(); return; } // ignore duplicate opens
        state.connected = true;
        clearTimeout(state.timer);
        connRef.current = conn;
        setConnecting(false);
        setScreen('playing');
        setMyHand([...CARDS]);
        myHandRef.current = [...CARDS];
        setMySel(null);
        setScores([0, 0]);
        setRound(0);
        setPhase('wait_host');
        attachGuestHandlers(conn);
      });
    };

    peer.on('open', attempt);

    peer.on('error', (err) => {
      // 'peer-unavailable' just means the host isn't listening yet — keep retrying.
      if (err.type === 'peer-unavailable') return;
      if (!state.connected) {
        setJoinError('Connection error. Please try again.');
        setConnecting(false);
      }
    });
  };

  /* --- Cancel / back --- */
  const cancel = () => {
    if (joinRetryRef.current) {
      joinRetryRef.current.connected = true; // stop any pending retries
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

  /* --- Auto-start from route params (launched from catalog) --- */
  useEffect(() => {
    if (hostCode) startHosting(hostCode);
    else if (joinCode) startJoining(joinCode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ========== RENDER ========== */

  if (screen === 'hosting') return (
    <Shell>
      <TopBar showRound={false} scores={[0,0]} round={1} />
      <Center>
        <Lobby>
          <LobbyWait><Spinner />Starting game…</LobbyWait>
          <SgBtn $kind="ghost" onClick={cancel}>Cancel</SgBtn>
        </Lobby>
      </Center>
    </Shell>
  );
  if (screen === 'joining') return <JoinLobby onConnect={startJoining} onCancel={cancel} error={joinError} connecting={connecting} />;
  if (screen === 'connecting') {
    return (
      <Shell>
        <TopBar showRound={false} scores={[0,0]} round={1} />
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
                <LobbyHint>
                  If this is taking a while, make sure Player 1 has clicked "Start game".
                </LobbyHint>
                <SgBtn $kind="ghost" onClick={cancel}>Cancel</SgBtn>
              </>
            )}
          </Lobby>
        </Center>
      </Shell>
    );
  }

  // ---- Playing ----
  const isHost = myRole === 'host';

  if (phase === 'wait_host')           return <WaitingScreen msg="Waiting for Player 1 to start the round…" scores={scores} round={round} />;
  if (phase === 'wait_guest_first')    return <WaitingScreen msg="Waiting for Player 2 to pick…" scores={scores} round={round} />;
  if (phase === 'wait_guest_response') return <WaitingScreen msg="Waiting for Player 2 to respond…" scores={scores} round={round} />;
  if (phase === 'wait_host_response')  return <WaitingScreen msg="Waiting for Player 1 to respond…" scores={scores} round={round} />;

  if (phase === 'i_first') {
    return (
      <PickScreen
        playerLabel={isHost ? 'Player 1' : 'Player 2'}
        hand={myHand}
        selected={mySel}
        onSelect={setMySel}
        onConfirm={() => {
          if (!mySel) return;
          setAnnouncedColor(mySel.color);
          if (isHost) {
            setPhase('wait_guest_response');
            send({ t: 'ANNOUNCED', color: mySel.color, round });
          } else {
            send({ t: 'ANNOUNCED', color: mySel.color, card: mySel });
            setPhase('wait_host_response');
          }
        }}
        round={round}
        scores={scores}
        label="Pick your card secretly"
        sub="You go first this round."
        showColor={true}
      />
    );
  }

  if (phase === 'i_second') {
    return (
      <PickScreen
        playerLabel={isHost ? 'Player 1' : 'Player 2'}
        hand={myHand}
        selected={mySel}
        onSelect={setMySel}
        onConfirm={() => {
          if (!mySel) return;
          if (isHost) {
            hostResolve(mySel, guestCardRef.current);
          } else {
            send({ t: 'PICKED', card: mySel });
            setPhase('wait_host_response');
          }
        }}
        round={round}
        scores={scores}
        label="Pick your response card"
        sub={<>Opponent played a <ColorBadge color={announcedColor} /> card.</>}
        showColor={false}
      />
    );
  }

  if (phase === 'reveal') return (
    <RevealScreen
      result={roundResult}
      scores={scores}
      round={round}
      onNext={isHost ? hostNextRound : undefined}
      isHost={isHost}
    />
  );

  if (phase === 'gameover') return (
    <GameOverScreen
      scores={scores}
      onReset={isHost ? hostReset : undefined}
      isHost={isHost}
    />
  );

  return <WaitingScreen msg="Connecting…" scores={[0,0]} round={0} />;
}

export default TheTellGame;
