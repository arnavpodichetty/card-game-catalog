// GamePage.tsx — individual game view: hero, room panel, rules, IRL mode.
import { useState } from "react";
import { Btn } from "../components/Button";
import { Icon } from "../components/icons";
import { Tag, TAG_TONE } from "../components/Tag";
import { RoomPanel, RoomCode } from "../components/RoomPanel";
import { genCode } from "../lib/genCode";
import type { Game, RuleSection, QuickRule } from "../types";

type Go = (hash: string) => void;

// Per-game launch config for the networked room panels. launchRoute is the
// in-app hash route the host navigates to on Start.
const NETWORKED: Record<string, { peerPrefix: string; launchRoute: string }> = {
  "the-tell": { peerPrefix: "thetell-", launchRoute: "#/play/the-tell" },
  "cairo": { peerPrefix: "cairo-", launchRoute: "#/play/cairo" },
};

function DetailedRules({ sections }: { sections: RuleSection[] }) {
  return (
    <div className="dr">
      {sections.map((section) => (
        <div className="dr__section" key={section.id}>
          <h3 className="dr__stitle">{section.title}</h3>

          {section.paras && (
            <div className="dr__paras">
              {section.paras.map((p, i) => <p className="dr__p" key={i}>{p}</p>)}
            </div>
          )}

          {(section.intro || section.groups || section.items) && (
            <>
              {section.intro && <p className="dr__intro">{section.intro}</p>}

              {section.groups && (
                <div className="dr__groups">
                  {section.groups.map((group, gi) => (
                    <div className="dr__group" key={gi}>
                      <div className="dr__ghead">
                        <span className="dr__gname">{group.name}</span>
                        {group.note && <span className="dr__gnote">{group.note}</span>}
                      </div>
                      <div className="dr__itemlist">
                        {group.items.map((item, ii) => (
                          <div className="dr__item" key={ii}>
                            <span className="dr__iname">{item.name}</span>
                            <p className="dr__id">{item.d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.items && !section.groups && (
                <div className="dr__itemlist">
                  {section.items.map((item, ii) => (
                    <div className="dr__item" key={ii}>
                      <span className="dr__iname">{item.name}</span>
                      <p className="dr__id">{item.d}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Accordion({ rules }: { rules: QuickRule[] }) {
  return (
    <div className="acc">
      <div className="acc__item is-open">
        <div className="acc__body" style={{ gridTemplateRows: "1fr" }}>
          <div className="acc__bodyinner">
            {rules.map((r, i) => (
              <div className="acc__rule" key={i}>
                <span className="acc__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="acc__rulet">{r.t}</p>
                  <p className="acc__ruled">{r.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GamePage({ game, go, openHow }: { game?: Game; go: Go; openHow?: boolean }) {
  const hasPlay = !!(game && game.playUrl);
  const [mode] = useState(hasPlay ? "idle" : "created");
  const [code, setCode] = useState(() => (hasPlay ? "" : genCode()));
  const [rulesMode, setRulesMode] = useState("quick"); // quick | detailed

  if (!game) {
    return (
      <main className="gamepage">
        <div className="notfound">
          <span>🃏</span>
          <h2>That game wandered off.</h2>
          <Btn kind="primary" size="md" icon="arrow" onClick={() => go("#/")}>Back to catalog</Btn>
        </div>
      </main>
    );
  }

  const net = NETWORKED[game.id];

  return (
    <main className={"gamepage gp--" + game.color}>
      <a className="backlink" href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>
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
          {mode === "idle" && game.playUrl && (
            <div className="gp__start">
              <h2 className="gp__panelh">Start playing</h2>
              <p className="gp__panelp">Jump straight into a playable game against the house.</p>
              <Btn kind="primary" size="lg" full icon="play" href={game.playUrl}>Play Now</Btn>
            </div>
          )}
          {mode === "created" && (
            net ? (
              <RoomPanel code={code} onNew={() => setCode(genCode())} peerPrefix={net.peerPrefix} launchRoute={net.launchRoute} />
            ) : (
              <RoomCode code={code} onNew={() => setCode(genCode())} />
            )
          )}
        </div>
      </section>

      <section className="gp__how" id="how">
        <div className="gp__howhead">
          <h2 className="section-h">How to play</h2>
          {game.detailedRules && (
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
          )}
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
    </main>
  );
}
