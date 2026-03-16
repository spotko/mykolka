import fs from "node:fs";
import path from "node:path";

export type LossStatEntry = {
  losses: number;
  name: string;
};

export type LossStats = Record<string, LossStatEntry>;

export interface StatsRepository {
  getAll(): Promise<LossStats>;
  saveAll(stats: LossStats): Promise<void>;
}

declare global {
  var __mykolkaLossStats: LossStats | undefined;
  var __mykolkaStatsRepository: StatsRepository | undefined;
}

function getSharedStats() {
  if (!globalThis.__mykolkaLossStats) {
    globalThis.__mykolkaLossStats = {};
  }

  return globalThis.__mykolkaLossStats;
}

class InMemoryStatsRepository implements StatsRepository {
  async getAll() {
    return getSharedStats();
  }

  async saveAll(stats: LossStats) {
    const sharedStats = getSharedStats();

    for (const key of Object.keys(sharedStats)) {
      delete sharedStats[key];
    }

    Object.assign(sharedStats, stats);
  }
}

class FileStatsRepository implements StatsRepository {
  private readonly storageFilePath = path.join(process.cwd(), ".data", "stats.json");
  private loaded = false;

  async getAll() {
    await this.ensureLoaded();
    return getSharedStats();
  }

  async saveAll(stats: LossStats) {
    globalThis.__mykolkaLossStats = stats;
    fs.mkdirSync(path.dirname(this.storageFilePath), { recursive: true });
    fs.writeFileSync(this.storageFilePath, JSON.stringify(stats, null, 2), "utf-8");
  }

  private async ensureLoaded() {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    if (!fs.existsSync(this.storageFilePath)) {
      globalThis.__mykolkaLossStats = {};
      return;
    }

    try {
      const raw = fs.readFileSync(this.storageFilePath, "utf-8");
      globalThis.__mykolkaLossStats = JSON.parse(raw) as LossStats;
    } catch {
      globalThis.__mykolkaLossStats = {};
    }
  }
}

class RedisStatsRepository implements StatsRepository {
  private readonly redisUrl: string;
  private readonly redisToken: string;

  constructor() {
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

  async getAll() {
    const response = await fetch(
      `${this.redisUrl}/get/${encodeURIComponent(this.getKey())}`,
      {
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Redis stats GET error: ${response.status}`);
    }

    const data = (await response.json()) as { result: string | null };
    return data.result ? (JSON.parse(data.result) as LossStats) : {};
  }

  async saveAll(stats: LossStats) {
    const payload = JSON.stringify(stats);

    const response = await fetch(
      `${this.redisUrl}/set/${encodeURIComponent(this.getKey())}/${encodeURIComponent(payload)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Redis stats SET error: ${response.status}`);
    }
  }

  private getKey() {
    return "mykolka:stats:losses";
  }
}

export function getStatsRepository(): StatsRepository {
  if (globalThis.__mykolkaStatsRepository) {
    return globalThis.__mykolkaStatsRepository;
  }

  const storageMode = process.env.ROOM_STORAGE?.toLowerCase() ?? "memory";
  const repository =
    storageMode === "redis"
      ? new RedisStatsRepository()
      : storageMode === "file"
      ? new FileStatsRepository()
      : new InMemoryStatsRepository();

  globalThis.__mykolkaStatsRepository = repository;
  return repository;
}
