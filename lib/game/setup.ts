import type { GameRoom, Player, TableCard } from "@/lib/game/types";

const CARD_RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
const CARD_SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;

export type CardRank = (typeof CARD_RANKS)[number];
export type CardSuit = (typeof CARD_SUITS)[number];

export function hasMykolkaCrown(name: string) {
  return normalizeName(name).includes("миколка");
}

export function hasMykolaName(name: string) {
  return normalizeName(name).includes("микол");
}

export function determineFirstPlayer(players: Player[]) {
  const mykolka = players.find((player) => hasMykolkaCrown(player.name));
  if (mykolka) {
    return mykolka;
  }

  const mykola = players.find((player) => hasMykolaName(player.name));
  if (mykola) {
    return mykola;
  }

  return [...players].sort((left, right) => left.joinedAt - right.joinedAt)[0] ?? null;
}

export function createFreshTable(seed = "table"): TableCard[] {
  const cards = CARD_SUITS.flatMap((suit) =>
    CARD_RANKS.map((rank) => ({
      id: `${seed}-${rank}-${suit}`,
      rank,
      suit,
      revealedByPlayerId: null,
      position: 0,
    })),
  );

  return shuffle(cards).map((card, index) => ({
    ...card,
    position: index,
  }));
}

export function createRoomSnapshot(params: {
  id: string;
  players: Player[];
  penaltyLimit: number;
}): GameRoom {
  const firstPlayer = determineFirstPlayer(params.players);

  return {
    id: params.id,
    status: "lobby",
    penaltyLimit: params.penaltyLimit,
    players: params.players,
    activePlayerId: firstPlayer?.id ?? null,
    roundStarterId: firstPlayer?.id ?? null,
    tableCards: createFreshTable(params.id),
    discardPile: [],
    roundNumber: 1,
    currentRoundReveals: [],
    battleParticipantIds: [],
    battleReveals: [],
    lastRoundSummary: null,
    roundHistory: [],
    activityLog: [],
  };
}

export function resetRoomForNewGame(room: GameRoom): GameRoom {
  const resetPlayers = room.players.map((player) => ({
    ...player,
    penaltyPoints: 0,
  }));
  const firstPlayer = determineFirstPlayer(resetPlayers);

  return {
    id: room.id,
    status: "lobby",
    penaltyLimit: room.penaltyLimit,
    players: resetPlayers,
    activePlayerId: firstPlayer?.id ?? null,
    roundStarterId: firstPlayer?.id ?? null,
    tableCards: createFreshTable(`${room.id}-new-game`),
    discardPile: [],
    roundNumber: 1,
    currentRoundReveals: [],
    battleParticipantIds: [],
    battleReveals: [],
    lastRoundSummary: {
      loserPlayerId: null,
      lowestRank: null,
      battlePlayerIds: [],
      message: "Нова партія готова. Кімната знову відкрита до першого ходу.",
    },
    roundHistory: [],
    activityLog: [],
  };
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
