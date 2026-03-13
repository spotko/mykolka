import {
  createRoomSnapshot,
  determineFirstPlayer,
  resetRoomForNewGame,
} from "@/lib/game/setup";
import {
  advanceAfterRoundPause,
  revealCardForActivePlayer,
} from "@/lib/game/round";
import type { GameRoom, Player } from "@/lib/game/types";
import { getRoomRepository } from "@/server/room-repository";

const roomRepository = getRoomRepository();

declare global {
  var __mykolkaRoundTimers: Map<string, ReturnType<typeof setTimeout>> | undefined;
  var __mykolkaActiveConnections: Map<string, Set<string>> | undefined;
}

const roundTimers = globalThis.__mykolkaRoundTimers ?? new Map<string, ReturnType<typeof setTimeout>>();
const activeConnections =
  globalThis.__mykolkaActiveConnections ?? new Map<string, Set<string>>();

if (!globalThis.__mykolkaRoundTimers) {
  globalThis.__mykolkaRoundTimers = roundTimers;
}

if (!globalThis.__mykolkaActiveConnections) {
  globalThis.__mykolkaActiveConnections = activeConnections;
}

type CreateRoomInput = {
  creatorName: string;
  penaltyLimit: number;
};

type JoinRoomInput = {
  code: string;
  playerName: string;
};

type ReconnectRoomInput = {
  code: string;
  playerId?: string;
  playerName?: string;
};

type PresenceInput = {
  code: string;
  playerId?: string;
  playerName?: string;
};

type RevealInput = {
  code: string;
  playerId: string;
  cardId: string;
};

export async function createRoom({ creatorName, penaltyLimit }: CreateRoomInput) {
  const code = await generateRoomCode();
  const creator = createPlayer(creatorName, 1);
  const room = createRoomSnapshot({
    id: code,
    players: [creator],
    penaltyLimit,
  });

  await storeRoom(
    appendActivity(room, `${creator.name} створив кімнату.`),
  );

  return { room, playerId: creator.id };
}

export async function getRoom(code: string) {
  return roomRepository.get(code);
}

export async function joinRoom({ code, playerName }: JoinRoomInput) {
  const room = await getRoom(code);
  if (!room) {
    return { error: "Кімнату не знайдено." as const };
  }

  if (room.status !== "lobby") {
    return { error: "До кімнати можна приєднатись лише до першого ходу." as const };
  }

  const existingPlayer = room.players.find(
    (player) => normalizeName(player.name) === normalizeName(playerName),
  );
  if (existingPlayer) {
    return { room, playerId: existingPlayer.id };
  }

  const nextPlayer = createPlayer(playerName, room.players.length + 1);
  const players = [...room.players, nextPlayer];
  const firstPlayer = determineFirstPlayer(players);
  const nextRoom: GameRoom = {
    ...room,
    players,
    activePlayerId: firstPlayer?.id ?? null,
    roundStarterId: firstPlayer?.id ?? null,
  };

  await storeRoom(appendActivity(nextRoom, `${nextPlayer.name} приєднався до кімнати.`));
  return { room: nextRoom, playerId: nextPlayer.id };
}

export async function reconnectRoom({ code, playerId, playerName }: ReconnectRoomInput) {
  const room = await getRoom(code);
  if (!room) {
    return { error: "Кімнату не знайдено." as const };
  }

  const existingById = playerId
    ? room.players.find((player) => player.id === playerId)
    : null;
  if (existingById) {
    return { room, playerId: existingById.id };
  }

  const normalizedName = playerName ? normalizeName(playerName) : null;
  const existingByName = normalizedName
    ? room.players.find((player) => normalizeName(player.name) === normalizedName)
    : null;

  if (existingByName) {
    return { room, playerId: existingByName.id };
  }

  return { error: "Не вдалося відновити підключення до кімнати." as const };
}

export async function revealForPlayer({ code, playerId, cardId }: RevealInput) {
  const room = await getRoom(code);
  if (!room) {
    return { error: "Кімнату не знайдено." as const };
  }

  if (room.players.length < 2) {
    return { error: "Для старту гри потрібно щонайменше 2 гравці." as const };
  }

  if (room.activePlayerId !== playerId) {
    return { error: "Зараз не ваш хід." as const };
  }

  const nextStatus = room.status === "lobby" ? "in_round" : room.status;
  const updatedRoom = revealCardForActivePlayer(
    {
      ...room,
      status: nextStatus,
    },
    cardId,
  );
  const finalizedRoom = markGameOverIfNeeded(updatedRoom);

  await storeRoom(finalizedRoom);
  return { room: finalizedRoom };
}

export async function continueAfterPause(code: string) {
  const room = await getRoom(code);
  if (!room) {
    return { error: "Кімнату не знайдено." as const };
  }

  if (room.status === "game_over") {
    return { room };
  }

  const updatedRoom = advanceAfterRoundPause(room);
  const finalizedRoom = markGameOverIfNeeded(updatedRoom);
  await storeRoom(finalizedRoom);
  return { room: finalizedRoom };
}

export async function resetRoom(code: string) {
  const room = await getRoom(code);
  if (!room) {
    return { error: "Кімнату не знайдено." as const };
  }

  const updatedRoom = resetRoomForNewGame(room);
  await storeRoom(updatedRoom);
  return { room: updatedRoom };
}

export async function registerPresence({ code, playerId, playerName }: PresenceInput) {
  const room = await getRoom(code);
  if (!room) {
    return;
  }

  const connectionKey = playerId ?? normalizeName(playerName ?? "");
  if (!connectionKey) {
    return;
  }

  const roomConnections = activeConnections.get(room.id) ?? new Set<string>();
  if (roomConnections.has(connectionKey)) {
    return;
  }

  roomConnections.add(connectionKey);
  activeConnections.set(room.id, roomConnections);

  const player = playerId
    ? room.players.find((currentPlayer) => currentPlayer.id === playerId)
    : room.players.find(
        (currentPlayer) => normalizeName(currentPlayer.name) === normalizeName(playerName ?? ""),
      );

  if (player) {
    await storeRoom(appendActivity(room, `${player.name} у кімнаті.`));
  }
}

export async function unregisterPresence({ code, playerId, playerName }: PresenceInput) {
  const room = await getRoom(code);
  if (!room) {
    return;
  }

  const connectionKey = playerId ?? normalizeName(playerName ?? "");
  if (!connectionKey) {
    return;
  }

  const roomConnections = activeConnections.get(room.id);
  if (!roomConnections) {
    return;
  }

  roomConnections.delete(connectionKey);

  if (!roomConnections.size) {
    activeConnections.delete(room.id);
  }

  const player = playerId
    ? room.players.find((currentPlayer) => currentPlayer.id === playerId)
    : room.players.find(
        (currentPlayer) => normalizeName(currentPlayer.name) === normalizeName(playerName ?? ""),
      );

  if (player) {
    await storeRoom(appendActivity(room, `${player.name} вийшов з кімнати.`));
  }
}

export function subscribeToRoom(code: string, listener: (room: GameRoom) => void) {
  return roomRepository.subscribe(code, listener);
}

function createPlayer(name: string, order: number): Player {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    penaltyPoints: 0,
    joinedAt: order,
  };
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

async function generateRoomCode() {
  let code = "";

  do {
    code = Math.random().toString(36).slice(2, 6).toUpperCase();
  } while (await roomRepository.has(code));

  return code;
}

function markGameOverIfNeeded(room: GameRoom): GameRoom {
  const losingPlayer = room.players.find(
    (player) => player.penaltyPoints >= room.penaltyLimit,
  );

  if (!losingPlayer) {
    return room;
  }

  return {
    ...room,
    status: "game_over",
    activePlayerId: null,
    lastRoundSummary: {
      loserPlayerId: losingPlayer.id,
      lowestRank: room.lastRoundSummary?.lowestRank ?? null,
      battlePlayerIds: [],
      message: `${losingPlayer.name} набрав ${room.penaltyLimit} штрафні бали і програв партію.`,
    },
    roundHistory: [
      {
        id: crypto.randomUUID(),
        roundNumber: room.roundNumber,
        message: `${losingPlayer.name} програв партію.`,
        loserPlayerId: losingPlayer.id,
      },
      ...room.roundHistory,
    ].slice(0, 6),
  };
}

async function storeRoom(room: GameRoom) {
  await roomRepository.save(room);
  syncRoundTimer(room);
}

function syncRoundTimer(room: GameRoom) {
  const existingTimer = roundTimers.get(room.id);

  if (existingTimer && room.status !== "round_end") {
    clearTimeout(existingTimer);
    roundTimers.delete(room.id);
  }

  if (room.status !== "round_end" || roundTimers.has(room.id)) {
    return;
  }

  const nextRoundTimer = setTimeout(async () => {
    roundTimers.delete(room.id);
    const latestRoom = await getRoom(room.id);

    if (!latestRoom || latestRoom.status !== "round_end") {
      return;
    }

    const updatedRoom = advanceAfterRoundPause(latestRoom);
    const finalizedRoom = markGameOverIfNeeded(updatedRoom);
    await storeRoom(finalizedRoom);
  }, 2500);

  roundTimers.set(room.id, nextRoundTimer);
}

function appendActivity(room: GameRoom, message: string): GameRoom {
  return {
    ...room,
    activityLog: [
      {
        id: crypto.randomUUID(),
        message,
        createdAt: Date.now(),
      },
      ...room.activityLog,
    ].slice(0, 8),
  };
}
