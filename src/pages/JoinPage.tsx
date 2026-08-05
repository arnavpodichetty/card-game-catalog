// JoinPage.tsx — minimal Jackbox-style room entry.
//
// A 4-letter code alone doesn't say which game the host is running, so on
// submit we probe every registered game's PeerJS id (prefix + code) in
// parallel and redirect to whichever room answers first.
import type React from "react";
import { useState, useRef, useEffect } from "react";
import Peer from "peerjs";
import type { DataConnection } from "peerjs";
import { SuitLogo } from "../components/icons";

type Go = (hash: string) => void;
type JoinState = "idle" | "joining" | "error";

interface Probe {
  done: boolean;
  failed: number;
  peer: Peer;
  timer: ReturnType<typeof setTimeout> | null;
}

// Register every networked game here. `route` is the in-app play route.
const JOINABLE_GAMES = [
  { prefix: "thetell-", route: "#/play/the-tell?join=" },
  { prefix: "cairo-", route: "#/play/cairo?join=" },
];

const PROBE_TIMEOUT_MS = 8000;

export function JoinPage({ go }: { go: Go }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<JoinState>("idle");
  const probeRef = useRef<Probe | null>(null);
  const clean = code.trim();
  const ok = clean.length === 4;

  const cleanupProbe = () => {
    if (probeRef.current) {
      clearTimeout(probeRef.current.timer);
      probeRef.current.peer?.destroy();
      probeRef.current = null;
    }
  };
  useEffect(() => cleanupProbe, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || state === "joining") return;
    setState("joining");
    cleanupProbe();

    const probe: Probe = { done: false, failed: 0, peer: new Peer(), timer: null };
    probeRef.current = probe;

    const fail = () => {
      if (probe.done) return;
      probe.done = true;
      cleanupProbe();
      setState("error");
    };

    // If nothing answers within the timeout, treat the code as dead.
    probe.timer = setTimeout(fail, PROBE_TIMEOUT_MS);

    probe.peer.on("open", () => {
      JOINABLE_GAMES.forEach((game) => {
        const conn: DataConnection = probe.peer.connect(game.prefix + clean);
        conn.on("open", () => {
          if (probe.done) { conn.close(); return; }
          probe.done = true;
          if (probe.timer) clearTimeout(probe.timer);
          // Hand off cleanly — the game page opens its own peer connection.
          try { conn.close(); } catch (_) {}
          probe.peer.destroy();
          location.href = game.route + clean;
        });
      });
    });

    probe.peer.on("error", (err: { type?: string }) => {
      // 'peer-unavailable' fires once per game whose room doesn't exist.
      if (err.type === "peer-unavailable") {
        probe.failed++;
        if (probe.failed >= JOINABLE_GAMES.length) fail();
        return;
      }
      fail();
    });
  };

  return (
    <main className="join">
      <a className="join__home" href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>
        <SuitLogo size={26} /><span>Card Game Catalog</span>
      </a>

      <div className="join__stage">
        <div className="join__cards" aria-hidden="true">
          <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
        </div>
        <h1 className="join__title">Enter your<br />room code</h1>
        <p className="join__sub">Ask the host for the four-letter code on their screen.</p>

        <form className="join__form" onSubmit={submit}>
          <div className={"codebox" + (state === "error" ? " is-error" : "") + (state === "joining" ? " is-busy" : "")}>
            {[0, 1, 2, 3].map((i) => (
              <span className={"codebox__cell" + (clean.length === i ? " is-active" : "") + (clean[i] ? " is-filled" : "")} key={i}>
                {clean[i] || ""}
              </span>
            ))}
            <input className="codebox__input" maxLength={4} value={code} autoFocus
              inputMode="text" autoCapitalize="characters" autoComplete="off"
              onChange={(e) => { setState("idle"); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); }} />
          </div>

          {state === "error" && <p className="join__err">No room with that code. Double-check with the host.</p>}

          <button className={"join__go" + (ok ? "" : " is-disabled") + (state === "joining" ? " is-busy" : "")}
            type="submit" disabled={!ok || state === "joining"}>
            {state === "joining" ? "Finding your room…" : "Join Game"}
          </button>
        </form>

        <p className="join__alt">
          Don't have a code? <a href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>Browse games →</a>
        </p>
      </div>
    </main>
  );
}
