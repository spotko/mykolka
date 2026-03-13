export type Player = {
  id: string;
  name: string;
  penaltyPoints: number;
  joinedAt: number;
};

export type GameStatus = "lobby" | "in_round" | "battle" | "round_end" | "game_over";

export type TableCard = {
  id: string;
  rank: string;
  suit: string;
  revealedByPlayerId: string | null;
  position: number;
};

export type DiscardedCard = {
  id: string;
  rank: string;
  suit: string;
  discardedInRound: number;
};

export type RoundReveal = {
  playerId: string;
  cardId: string;
  rank: string;
  suit: string;
};

export type RoundSummary = {
  loserPlayerId: string | null;
  lowestRank: string | null;
  battlePlayerIds: string[];
  message: string;
};

export type RoundHistoryItem = {
  id: string;
  roundNumber: number;
  message: string;
  loserPlayerId: string | null;
};

export type ActivityLogItem = {
  id: string;
  message: string;
  createdAt: number;
};

export type GameRoom = {
  id: string;
  status: GameStatus;
  penaltyLimit: number;
  players: Player[];
  activePlayerId: string | null;
  roundStarterId: string | null;
  tableCards: TableCard[];
  discardPile: DiscardedCard[];
  roundNumber: number;
  currentRoundReveals: RoundReveal[];
  battleParticipantIds: string[];
  battleReveals: RoundReveal[];
  lastRoundSummary: RoundSummary | null;
  roundHistory: RoundHistoryItem[];
  activityLog: ActivityLogItem[];
};
