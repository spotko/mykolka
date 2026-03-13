import fs from "node:fs";
import path from "node:path";
import type { GameRoom } from "@/lib/game/types";

export type RoomListener = (room: GameRoom) => void;

export interface RoomRepository {
  get(code: string): Promise<GameRoom | null>;
  has(code: string): Promise<boolean>;
  save(room: GameRoom): Promise<void>;
  subscribe(code: string, listener: RoomListener): () => void;
}

type PersistedRooms = Record<string, GameRoom>;

declare global {
  var __mykolkaRooms: Map<string, GameRoom> | undefined;
  var __mykolkaRoomListeners:
    | Map<string, Set<RoomListener>>
    | undefined;
  var __mykolkaRoomRepository: RoomRepository | undefined;
}

function getSharedRoomsMap() {
  if (!globalThis.__mykolkaRooms) {
    globalThis.__mykolkaRooms = new Map<string, GameRoom>();
  }

  return globalThis.__mykolkaRooms;
}

function getSharedListenersMap() {
  if (!globalThis.__mykolkaRoomListeners) {
    globalThis.__mykolkaRoomListeners = new Map<string, Set<RoomListener>>();
  }

  return globalThis.__mykolkaRoomListeners;
}

abstract class BaseRoomRepository implements RoomRepository {
  protected readonly listeners = getSharedListenersMap();

  abstract get(code: string): Promise<GameRoom | null>;
  abstract has(code: string): Promise<boolean>;
  abstract save(room: GameRoom): Promise<void>;

  subscribe(code: string, listener: RoomListener) {
    const normalizedCode = code.toUpperCase();
    const roomListeners = this.listeners.get(normalizedCode) ?? new Set<RoomListener>();
    roomListeners.add(listener);
    this.listeners.set(normalizedCode, roomListeners);

    return () => {
      const currentListeners = this.listeners.get(normalizedCode);
      if (!currentListeners) {
        return;
      }

      currentListeners.delete(listener);

      if (!currentListeners.size) {
        this.listeners.delete(normalizedCode);
      }
    };
  }

  protected notify(room: GameRoom) {
    const roomListeners = this.listeners.get(room.id);
    if (!roomListeners) {
      return;
    }

    for (const listener of roomListeners) {
      listener(room);
    }
  }
}

class InMemoryRoomRepository extends BaseRoomRepository {
  private readonly rooms = getSharedRoomsMap();

  async get(code: string) {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  async has(code: string) {
    return this.rooms.has(code.toUpperCase());
  }

  async save(room: GameRoom) {
    this.rooms.set(room.id, room);
    this.notify(room);
  }
}

class FileRoomRepository extends BaseRoomRepository {
  private readonly rooms = getSharedRoomsMap();
  private readonly storageFilePath = path.join(process.cwd(), ".data", "rooms.json");
  private loaded = false;

  async get(code: string) {
    await this.ensureStorageLoaded();
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  async has(code: string) {
    await this.ensureStorageLoaded();
    return this.rooms.has(code.toUpperCase());
  }

  async save(room: GameRoom) {
    await this.ensureStorageLoaded();
    this.rooms.set(room.id, room);
    this.persistAllRooms();
    this.notify(room);
  }

  private async ensureStorageLoaded() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;
    const persistedRooms = this.readPersistedRooms();

    for (const room of Object.values(persistedRooms)) {
      this.rooms.set(room.id, room);
    }
  }

  private persistAllRooms() {
    const serializedRooms = Object.fromEntries(this.rooms.entries());

    fs.mkdirSync(path.dirname(this.storageFilePath), { recursive: true });
    fs.writeFileSync(
      this.storageFilePath,
      JSON.stringify(serializedRooms, null, 2),
      "utf-8",
    );
  }

  private readPersistedRooms(): PersistedRooms {
    if (!fs.existsSync(this.storageFilePath)) {
      return {};
    }

    try {
      const raw = fs.readFileSync(this.storageFilePath, "utf-8");
      return JSON.parse(raw) as PersistedRooms;
    } catch {
      return {};
    }
  }
}

class RedisRoomRepository extends BaseRoomRepository {
  private readonly redisUrl: string;
  private readonly redisToken: string;
  private readonly fallbackRooms = getSharedRoomsMap();

  constructor() {
    super();

    const redisUrl = process.env.REDIS_REST_URL;
    const redisToken = process.env.REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      throw new Error(
        "Для ROOM_STORAGE=redis потрібні REDIS_REST_URL і REDIS_REST_TOKEN.",
      );
    }

    this.redisUrl = redisUrl.replace(/\/$/, "");
    this.redisToken = redisToken;
  }

  async get(code: string) {
    const normalizedCode = code.toUpperCase();
    const response = await fetch(
      `${this.redisUrl}/get/${encodeURIComponent(this.getKey(normalizedCode))}`,
      {
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Redis GET error: ${response.status}`);
    }

    const data = (await response.json()) as { result: string | null };
    if (!data.result) {
      return null;
    }

    const room = JSON.parse(data.result) as GameRoom;
    this.fallbackRooms.set(room.id, room);
    return room;
  }

  async has(code: string) {
    const room = await this.get(code);
    return Boolean(room);
  }

  async save(room: GameRoom) {
    const payload = JSON.stringify(room);
    const ttlSeconds = Number(process.env.ROOM_TTL_SECONDS ?? 60 * 60 * 12);

    const response = await fetch(
      `${this.redisUrl}/set/${encodeURIComponent(this.getKey(room.id))}/${encodeURIComponent(payload)}?EX=${ttlSeconds}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Redis SET error: ${response.status}`);
    }

    this.fallbackRooms.set(room.id, room);
    this.notify(room);
  }

  private getKey(code: string) {
    return `mykolka:room:${code.toUpperCase()}`;
  }
}

export function getRoomRepository(): RoomRepository {
  if (globalThis.__mykolkaRoomRepository) {
    return globalThis.__mykolkaRoomRepository;
  }

  const storageMode = process.env.ROOM_STORAGE?.toLowerCase() ?? "memory";

  const repository =
    storageMode === "redis"
      ? new RedisRoomRepository()
      : storageMode === "file"
      ? new FileRoomRepository()
      : new InMemoryRoomRepository();

  globalThis.__mykolkaRoomRepository = repository;
  return repository;
}
