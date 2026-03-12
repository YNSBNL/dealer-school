export type DeckSuit = "S" | "H" | "D" | "C";
export type DeckRank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface DeckCard {
  rank: DeckRank;
  suit: DeckSuit;
}

export const DECK_SUITS: DeckSuit[] = ["S", "H", "D", "C"];
export const DECK_RANKS: DeckRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUIT_SYMBOLS: Record<DeckSuit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_COLORS: Record<DeckSuit, string> = { S: "#1a1a1a", H: "#C62828", D: "#C62828", C: "#1a1a1a" };

export function createShuffledDeck(): DeckCard[] {
  const deck = DECK_SUITS.flatMap((suit) => DECK_RANKS.map((rank) => ({ rank, suit })));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

export function drawCards(deck: DeckCard[], count: number): DeckCard[] {
  return deck.splice(0, count);
}

export function formatCardLabel(card: DeckCard): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}
