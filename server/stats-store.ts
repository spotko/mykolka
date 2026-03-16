import { getStatsRepository } from "@/server/stats-repository";

const statsRepository = getStatsRepository();

export type LossLeaderboardEntry = {
  losses: number;
  name: string;
  rank: number;
};

export async function recordPlayerLoss(name: string) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return;
  }

  const currentStats = await statsRepository.getAll();
  const existingEntry = currentStats[normalizedName];

  const nextStats = {
    ...currentStats,
    [normalizedName]: {
      name: existingEntry?.name ?? name.trim(),
      losses: (existingEntry?.losses ?? 0) + 1,
    },
  };

  await statsRepository.saveAll(nextStats);
}

export async function getLossLeaderboard() {
  const stats = await statsRepository.getAll();

  return Object.values(stats)
    .sort((left, right) => right.losses - left.losses || left.name.localeCompare(right.name, "uk"))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) satisfies LossLeaderboardEntry[];
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}
