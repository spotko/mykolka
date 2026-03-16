import { getLossLeaderboard } from "@/server/stats-store";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const leaderboard = await getLossLeaderboard();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-200/70">Статистика</p>
        <h1 className="mt-3 font-display text-4xl text-stone-50">Топ програшів</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200/85">
          Хто назбирав найбільше програних партій, той і вище в рейтингу.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/15 text-sm font-semibold text-amber-100">
                    {entry.rank}
                  </span>
                  <span className="text-base font-semibold text-stone-50">{entry.name}</span>
                </div>
                <div className="text-sm text-stone-300">
                  Програшів: <strong className="text-stone-100">{entry.losses}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
            Поки що ще немає жодної завершеної партії.
          </div>
        )}
      </section>
    </main>
  );
}
