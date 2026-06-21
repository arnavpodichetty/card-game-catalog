// joinpage.jsx — minimal jackbox-style room entry
const { useState: useStateJ } = React;

function JoinPage({ go }) {
  const [code, setCode] = useStateJ("");
  const [state, setState] = useStateJ("idle"); // idle | joining | error
  const clean = code.trim();
  const ok = clean.length === 4;

  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    setState("joining");
    location.href = "games/thetell/TheTell.html?join=" + clean;
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
            {state === "joining" ? "Joining…" : "Join Game"}
          </button>
        </form>

        <p className="join__alt">
          Don't have a code? <a href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>Browse games →</a>
        </p>
      </div>
    </main>
  );
}

Object.assign(window, { JoinPage });
