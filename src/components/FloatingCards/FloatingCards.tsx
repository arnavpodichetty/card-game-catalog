// FloatingCards.tsx — decorative playing cards drifting in the background.
import { BgCards, BgCard, BgCardRank, BgCardSuit } from "./floatingCards.styles";

interface BgCardData {
  rank: string; suit: string; red: boolean;
  x: number; rot: number; dur: number; delay: number;
}

const BG_CARDS: BgCardData[] = [
  { rank: "A", suit: "♠", red: false, x: 4, rot: -12, dur: 16, delay: 0 },
  { rank: "K", suit: "♥", red: true, x: 12, rot: 7, dur: 19, delay: 2.4 },
  { rank: "7", suit: "♣", red: false, x: 22, rot: -6, dur: 14, delay: 5.1 },
  { rank: "Q", suit: "♦", red: true, x: 33, rot: 10, dur: 17, delay: 1.2 },
  { rank: "J", suit: "♠", red: false, x: 44, rot: -15, dur: 21, delay: 8.0 },
  { rank: "10", suit: "♥", red: true, x: 55, rot: 4, dur: 15, delay: 3.7 },
  { rank: "9", suit: "♣", red: false, x: 65, rot: -9, dur: 18, delay: 6.5 },
  { rank: "A", suit: "♦", red: true, x: 74, rot: 13, dur: 13, delay: 0.8 },
  { rank: "8", suit: "♠", red: false, x: 84, rot: -5, dur: 20, delay: 4.2 },
  { rank: "K", suit: "♣", red: false, x: 92, rot: 8, dur: 16, delay: 7.3 },
];

export function FloatingCards() {
  return (
    <BgCards aria-hidden="true">
      {BG_CARDS.map((c, i) => (
        <BgCard key={i} $x={c.x} $rot={c.rot} $dur={c.dur} $delay={c.delay} $red={c.red}>
          <BgCardRank>{c.rank}</BgCardRank>
          <BgCardSuit>{c.suit}</BgCardSuit>
        </BgCard>
      ))}
    </BgCards>
  );
}
