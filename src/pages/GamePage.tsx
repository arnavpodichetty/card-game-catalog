// GamePage.tsx — individual game view: hero, room panel, rules, IRL mode.
import { useState } from "react";
import { Btn } from "../components/Button";
import { Icon } from "../components/icons";
import { Tag, TAG_TONE } from "../components/Tag";
import { RoomPanel, RoomCode } from "../components/RoomPanel";
import { genCode } from "../lib/genCode";
import {
  GamePageMain, BackLink, NotFound,
  Hero, HeroLeft, HeroEmoji, HeroTitle, HeroTagline, HeroTags, HeroBlurb,
  Panel, PanelStart, PanelHeading, PanelCopy,
  HowSection, HowHead, SectionHeading, RulesTabs, RulesTab,
  Acc, AccItem, AccBody, AccBodyInner, AccRule, AccNum, AccRuleTitle, AccRuleDesc,
  IrlSection, IrlInner, IrlBadge, IrlText,
  Dr, DrSection, DrTitle, DrParas, DrP, DrIntro, DrGroups, DrGroupHead,
  DrGroupName, DrGroupNote, DrItemList, DrItem, DrItemName, DrItemDesc,
} from "./gamePage.styles";
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
    <Dr>
      {sections.map((section) => (
        <DrSection key={section.id}>
          <DrTitle>{section.title}</DrTitle>

          {section.paras && (
            <DrParas>
              {section.paras.map((p, i) => <DrP key={i}>{p}</DrP>)}
            </DrParas>
          )}

          {(section.intro || section.groups || section.items) && (
            <>
              {section.intro && <DrIntro>{section.intro}</DrIntro>}

              {section.groups && (
                <DrGroups>
                  {section.groups.map((group, gi) => (
                    <div key={gi}>
                      <DrGroupHead>
                        <DrGroupName>{group.name}</DrGroupName>
                        {group.note && <DrGroupNote>{group.note}</DrGroupNote>}
                      </DrGroupHead>
                      <DrItemList>
                        {group.items.map((item, ii) => (
                          <DrItem key={ii}>
                            <DrItemName>{item.name}</DrItemName>
                            <DrItemDesc>{item.d}</DrItemDesc>
                          </DrItem>
                        ))}
                      </DrItemList>
                    </div>
                  ))}
                </DrGroups>
              )}

              {section.items && !section.groups && (
                <DrItemList>
                  {section.items.map((item, ii) => (
                    <DrItem key={ii}>
                      <DrItemName>{item.name}</DrItemName>
                      <DrItemDesc>{item.d}</DrItemDesc>
                    </DrItem>
                  ))}
                </DrItemList>
              )}
            </>
          )}
        </DrSection>
      ))}
    </Dr>
  );
}

function Accordion({ rules }: { rules: QuickRule[] }) {
  return (
    <Acc>
      <AccItem $open>
        <AccBody $open>
          <AccBodyInner>
            {rules.map((r, i) => (
              <AccRule key={i}>
                <AccNum>{String(i + 1).padStart(2, "0")}</AccNum>
                <div>
                  <AccRuleTitle>{r.t}</AccRuleTitle>
                  <AccRuleDesc>{r.d}</AccRuleDesc>
                </div>
              </AccRule>
            ))}
          </AccBodyInner>
        </AccBody>
      </AccItem>
    </Acc>
  );
}

export function GamePage({ game, go, openHow }: { game?: Game; go: Go; openHow?: boolean }) {
  const hasPlay = !!(game && game.playUrl);
  const [mode] = useState(hasPlay ? "idle" : "created");
  const [code, setCode] = useState(() => (hasPlay ? "" : genCode()));
  const [rulesMode, setRulesMode] = useState("quick"); // quick | detailed

  if (!game) {
    return (
      <GamePageMain>
        <NotFound>
          <span>🃏</span>
          <h2>That game wandered off.</h2>
          <Btn kind="primary" size="md" icon="arrow" onClick={() => go("#/")}>Back to catalog</Btn>
        </NotFound>
      </GamePageMain>
    );
  }

  const net = NETWORKED[game.id];

  return (
    <GamePageMain>
      <BackLink href="#/" onClick={(e) => { e.preventDefault(); go("#/"); }}>
        ← All games
      </BackLink>

      <Hero>
        <HeroLeft>
          <HeroEmoji aria-hidden="true">{game.emoji}</HeroEmoji>
          <HeroTitle>{game.title}</HeroTitle>
          <HeroTagline $color={game.color}>{game.tagline}</HeroTagline>
          <HeroTags>
            <Tag tone={TAG_TONE[game.genre]}>{game.genre}</Tag>
            <Tag tone={TAG_TONE[game.difficulty]}>{game.difficulty}</Tag>
            <Tag>{game.players} players</Tag>
            <Tag>{game.lengthLabel}</Tag>
          </HeroTags>
          <HeroBlurb>{game.blurb}</HeroBlurb>
        </HeroLeft>

        <Panel>
          {mode === "idle" && game.playUrl && (
            <PanelStart>
              <PanelHeading>Start playing</PanelHeading>
              <PanelCopy>Jump straight into a playable game against the house.</PanelCopy>
              <Btn kind="primary" size="lg" full icon="play" href={game.playUrl}>Play Now</Btn>
            </PanelStart>
          )}
          {mode === "created" && (
            net ? (
              <RoomPanel code={code} onNew={() => setCode(genCode())} peerPrefix={net.peerPrefix} launchRoute={net.launchRoute} />
            ) : (
              <RoomCode code={code} onNew={() => setCode(genCode())} />
            )
          )}
        </Panel>
      </Hero>

      <HowSection id="how">
        <HowHead>
          <SectionHeading>How to play</SectionHeading>
          {game.detailedRules && (
            <RulesTabs>
              <RulesTab $on={rulesMode === "quick"} onClick={() => setRulesMode("quick")}>
                Quick
              </RulesTab>
              <RulesTab $on={rulesMode === "detailed"} onClick={() => setRulesMode("detailed")}>
                Full Rules
              </RulesTab>
            </RulesTabs>
          )}
        </HowHead>
        {rulesMode === "quick" && <Accordion rules={game.rules} />}
        {rulesMode === "detailed" && game.detailedRules && <DetailedRules sections={game.detailedRules} />}
      </HowSection>

      <IrlSection>
        <IrlInner>
          <IrlBadge><Icon name="dice" size={18} /> IRL mode</IrlBadge>
          <h3>Want to play in real life?</h3>
          <p>Here's how to set this up with a standard deck of cards.</p>
          <IrlText>{game.irl}</IrlText>
        </IrlInner>
      </IrlSection>
    </GamePageMain>
  );
}
