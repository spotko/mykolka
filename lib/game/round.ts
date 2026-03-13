import type { GameRoom, Player, RoundReveal, RoundSummary, TableCard } from "@/lib/game/types";
import { createFreshTable } from "@/lib/game/setup";

const RANK_STRENGTH: Record<string, number> = {
  "6": 0,
  "7": 1,
  "8": 2,
  "9": 3,
  "10": 4,
  J: 5,
  Q: 6,
  K: 7,
  A: 8,
};

export function revealCardForActivePlayer(room: GameRoom, cardId: string): GameRoom {
  if (!room.activePlayerId) {
    return room;
  }

  const card = room.tableCards.find((tableCard) => tableCard.id === cardId);
  if (!card || card.revealedByPlayerId) {
    return room;
  }

  const updatedCard: TableCard = {
    ...card,
    revealedByPlayerId: room.activePlayerId,
  };

  const updatedTable = room.tableCards.map((tableCard) =>
    tableCard.id === cardId ? updatedCard : tableCard,
  );

  const nextReveal: RoundReveal = {
    playerId: room.activePlayerId,
    cardId: updatedCard.id,
    rank: updatedCard.rank,
    suit: updatedCard.suit,
  };

  if (room.status === "battle") {
    return resolveBattleTurn(room, updatedTable, nextReveal);
  }

  const currentRoundReveals = [...room.currentRoundReveals, nextReveal];
  const roundFinished = currentRoundReveals.length === room.players.length;

  if (!roundFinished) {
    return {
      ...room,
      status: "in_round",
      tableCards: updatedTable,
      currentRoundReveals,
      battleParticipantIds: [],
      battleReveals: [],
      lastRoundSummary: null,
      activePlayerId: getNextPlayerInOrder(room.players, room.activePlayerId),
    };
  }

  const summary = summarizeRound(room.players, currentRoundReveals);
  if (summary.battlePlayerIds.length > 1) {
    const firstBattlePlayerId = getNextBattlePlayerId(
      room.players,
      summary.battlePlayerIds,
      null,
    );

    return {
      ...room,
      status: "battle",
      tableCards: updatedTable,
      currentRoundReveals,
      battleParticipantIds: summary.battlePlayerIds,
      battleReveals: [],
      lastRoundSummary: {
        ...summary,
        message: `Батл між ${getPlayerNames(room.players, summary.battlePlayerIds).join(", ")}.`,
      },
      activePlayerId: firstBattlePlayerId,
    };
  }

  return finalizeResolvedRound(
    {
      ...room,
      currentRoundReveals,
    },
    updatedTable,
    summary,
  );
}

export function getNextPlayerInOrder(players: Player[], currentPlayerId: string) {
  const currentIndex = players.findIndex((player) => player.id === currentPlayerId);
  if (currentIndex === -1) {
    return players[0]?.id ?? null;
  }

  return players[(currentIndex + 1) % players.length]?.id ?? null;
}

export function getCardSuitSymbol(suit: string) {
  const symbols: Record<string, string> = {
    clubs: "♣",
    diamonds: "♦",
    hearts: "♥",
    spades: "♠",
  };

  return symbols[suit] ?? suit;
}

export function getCurrentPhaseLabel(room: GameRoom) {
  if (room.status === "battle") {
    return "Батл";
  }

  if (room.status === "round_end") {
    return "Пауза";
  }

  if (room.status === "game_over") {
    return "Кінець гри";
  }

  return "Основний раунд";
}

export function advanceAfterRoundPause(room: GameRoom): GameRoom {
  if (room.status !== "round_end") {
    return room;
  }

  const discardCardIds = new Set([
    ...room.currentRoundReveals.map((reveal) => reveal.cardId),
    ...room.battleReveals.map((reveal) => reveal.cardId),
  ]);
  const discardedCards = room.tableCards
    .filter((tableCard) => discardCardIds.has(tableCard.id))
    .map((tableCard) => ({
      id: tableCard.id,
      rank: tableCard.rank,
      suit: tableCard.suit,
      discardedInRound: room.roundNumber,
    }));
  const tableWithoutDiscard = room.tableCards
    .filter((tableCard) => !discardCardIds.has(tableCard.id))
    .map((tableCard, index) => ({
      ...tableCard,
      position: index,
      revealedByPlayerId: null,
    }));
  const shouldRefreshTable = tableWithoutDiscard.length < room.players.length;
  const tableCards = shouldRefreshTable
    ? createFreshTable(`${room.id}-round-${room.roundNumber + 1}`)
    : tableWithoutDiscard;

  return {
    ...room,
    status: "in_round",
    tableCards,
    discardPile: [...discardedCards, ...room.discardPile],
    currentRoundReveals: [],
    battleParticipantIds: [],
    battleReveals: [],
    activePlayerId: room.roundStarterId,
    roundNumber: room.roundNumber + 1,
  };
}

function summarizeRound(players: Player[], reveals: RoundReveal[]): RoundSummary {
  const sortedByStrength = [...reveals].sort(
    (left, right) => RANK_STRENGTH[left.rank] - RANK_STRENGTH[right.rank],
  );
  const lowestRank = sortedByStrength[0]?.rank ?? null;
  const battlePlayers = reveals
    .filter((reveal) => reveal.rank === lowestRank)
    .map((reveal) => reveal.playerId);

  if (battlePlayers.length > 1) {
    return {
      loserPlayerId: null,
      lowestRank,
      battlePlayerIds: battlePlayers,
      message: `Нічия на найменшій карті (${lowestRank}). На наступному кроці додамо повноцінний батл.`,
    };
  }

  const loserPlayerId = battlePlayers[0] ?? null;
  const loser = players.find((player) => player.id === loserPlayerId);

  return {
    loserPlayerId,
    lowestRank,
    battlePlayerIds: [],
    message: loser
      ? `${loser.name} програв раунд і отримав 1 штрафний бал.`
      : "Раунд завершено.",
  };
}

function resolveBattleTurn(
  room: GameRoom,
  updatedTable: TableCard[],
  nextReveal: RoundReveal,
): GameRoom {
  if (!room.battleParticipantIds.includes(nextReveal.playerId)) {
    return room;
  }

  const battleReveals = [...room.battleReveals, nextReveal];
  const battleFinished = battleReveals.length === room.battleParticipantIds.length;

  if (!battleFinished) {
    return {
      ...room,
      status: "battle",
      tableCards: updatedTable,
      battleReveals,
      activePlayerId: getNextBattlePlayerId(
        room.players,
        room.battleParticipantIds,
        room.activePlayerId,
      ),
    };
  }

  const summary = summarizeRound(room.players, battleReveals);

  if (summary.battlePlayerIds.length > 1) {
    const firstBattlePlayerId = getNextBattlePlayerId(
      room.players,
      summary.battlePlayerIds,
      null,
    );

    return {
      ...room,
      status: "battle",
      tableCards: updatedTable,
      battleParticipantIds: summary.battlePlayerIds,
      battleReveals: [],
      lastRoundSummary: {
        ...summary,
        message: `Батл триває між ${getPlayerNames(room.players, summary.battlePlayerIds).join(", ")}.`,
      },
      activePlayerId: firstBattlePlayerId,
    };
  }

  return finalizeResolvedRound(
    {
      ...room,
      battleReveals,
    },
    updatedTable,
    {
      ...summary,
      message: (() => {
        const loser = room.players.find((player) => player.id === summary.loserPlayerId);
        return loser
          ? `${loser.name} програв батл і отримав 1 штрафний бал.`
          : "Батл завершено.";
      })(),
    },
  );
}

function finalizeResolvedRound(
  room: GameRoom,
  updatedTable: TableCard[],
  summary: RoundSummary,
): GameRoom {
  const players = applyPenalty(room.players, summary.loserPlayerId);
  const nextStarterId = summary.loserPlayerId ?? room.roundStarterId;

  return {
    ...room,
    status: "round_end",
    players,
    tableCards: updatedTable,
    currentRoundReveals: room.currentRoundReveals,
    battleParticipantIds: room.battleParticipantIds,
    battleReveals: room.battleReveals,
    lastRoundSummary: summary,
    roundStarterId: nextStarterId ?? null,
    activePlayerId: null,
    roundHistory: [
      {
        id: crypto.randomUUID(),
        roundNumber: room.roundNumber,
        message: summary.message,
        loserPlayerId: summary.loserPlayerId,
      },
      ...room.roundHistory,
    ].slice(0, 6),
  };
}

function applyPenalty(players: Player[], loserPlayerId: string | null) {
  if (!loserPlayerId) {
    return players;
  }

  return players.map((player) =>
    player.id === loserPlayerId
      ? {
          ...player,
          penaltyPoints: player.penaltyPoints + 1,
        }
      : player,
  );
}

function getNextBattlePlayerId(
  players: Player[],
  battleParticipantIds: string[],
  currentPlayerId: string | null,
) {
  const orderedBattleIds = players
    .filter((player) => battleParticipantIds.includes(player.id))
    .map((player) => player.id);

  if (!orderedBattleIds.length) {
    return null;
  }

  if (!currentPlayerId) {
    return orderedBattleIds[0] ?? null;
  }

  const currentIndex = orderedBattleIds.indexOf(currentPlayerId);
  if (currentIndex === -1) {
    return orderedBattleIds[0] ?? null;
  }

  return orderedBattleIds[(currentIndex + 1) % orderedBattleIds.length] ?? null;
}

function getPlayerNames(players: Player[], ids: string[]) {
  return players
    .filter((player) => ids.includes(player.id))
    .map((player) => player.name);
}
