// RoomPanel.tsx — the host's "room is live" panel for networked games.
//
// The Cairo and The Tell panels were byte-for-byte identical apart from their
// PeerJS id prefix and launch route, so they collapse into one component
// parameterized by `peerPrefix` and `launchRoute`.
import type React from "react";
import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import type { DataConnection } from "peerjs";
import { Btn } from "./Button";
import {
  Room, RoomLabel, RoomCodeRow, RoomChar, RoomActions,
  RoomNew, RoomHint, RoomJoined, RoomLaunch,
} from "./roomPanel.styles";

export interface RoomPanelProps {
  code: string;
  onNew: () => void;
  peerPrefix: string;
  /** Hash route the host navigates to on Start, e.g. "#/play/cairo". */
  launchRoute: string;
}

export function RoomPanel({ code, onNew, peerPrefix, launchRoute }: RoomPanelProps) {
  const [copied, setCopied] = useState(false);
  const [joinCount, setJoinCount] = useState(0);
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<DataConnection[]>([]);

  // Open a PeerJS host under `<prefix><code>` and track how many guests join.
  // Retries once if the id is briefly taken (e.g. after regenerating a code).
  useEffect(() => {
    setJoinCount(0);
    connsRef.current = [];
    let destroyed = false;

    const init = () => {
      if (destroyed) return;
      const peer = new Peer(peerPrefix + code);
      peerRef.current = peer;

      peer.on("connection", (conn: DataConnection) => {
        conn.on("open", () => {
          connsRef.current.push(conn);
          setJoinCount((c) => c + 1);
        });
        conn.on("close", () => {
          connsRef.current = connsRef.current.filter((c) => c !== conn);
          setJoinCount((c) => Math.max(0, c - 1));
        });
      });

      peer.on("error", (err: { type?: string }) => {
        if (err.type === "unavailable-id" && !destroyed) {
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
  }, [code, peerPrefix]);

  const copy = () => {
    navigator.clipboard?.writeText("Join my Card Game Catalog game — room code " + code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    connsRef.current.forEach((conn) => {
      try { if (conn.open) conn.send({ t: "HOST_STARTING" }); } catch (_) {}
    });
    setTimeout(() => {
      peerRef.current?.destroy();
      peerRef.current = null;
      location.href = `${launchRoute}?host=${code}`;
    }, 150);
  };

  return (
    <Room>
      <RoomLabel>Your room is live — share the code</RoomLabel>
      <RoomCodeRow>
        {code.split("").map((c, i) => <RoomChar key={i}>{c}</RoomChar>)}
      </RoomCodeRow>
      <RoomActions>
        <Btn kind="secondary" size="md" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy invite"}
        </Btn>
        <RoomNew onClick={onNew}>New code</RoomNew>
      </RoomActions>
      <RoomHint>Players go to <b>cardgamecatalog.gg/join</b> and punch in <b>{code}</b>.</RoomHint>
      <RoomJoined><b>{joinCount}</b> / 1 player joined</RoomJoined>
      <RoomLaunch href={`${launchRoute}?host=${code}`} onClick={handleStartGame}>Start Game</RoomLaunch>
    </Room>
  );
}

// Static room panel for games without live networking (just a shareable code).
export function RoomCode({ code, onNew, launchHref }: { code: string; onNew: () => void; launchHref?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const txt = "Join my Card Game Catalog game — room code " + code;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Room>
      <RoomLabel>Your room is live — share the code</RoomLabel>
      <RoomCodeRow>
        {code.split("").map((c, i) => <RoomChar key={i}>{c}</RoomChar>)}
      </RoomCodeRow>
      <RoomActions>
        <Btn kind="secondary" size="md" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy invite"}
        </Btn>
        <RoomNew onClick={onNew}>New code</RoomNew>
      </RoomActions>
      <RoomHint>Players go to <b>cardgamecatalog.gg/join</b> and punch in <b>{code}</b>.</RoomHint>
      {launchHref && <RoomLaunch href={launchHref}>Start Game</RoomLaunch>}
    </Room>
  );
}
