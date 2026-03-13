import type { Player } from "@/lib/game/types";

type PlayersPanelProps = {
  activePlayerId: string | null;
  battleMessage?: string | null;
  currentPlayerId?: string | null;
  penaltyLimit?: number;
  players: Player[];
};

export function PlayersPanel({
  activePlayerId,
  battleMessage = null,
  currentPlayerId = null,
  penaltyLimit,
  players,
}: PlayersPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        {typeof penaltyLimit === "number" ? (
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-stone-300">
            Граємо до: {penaltyLimit}
          </span>
        ) : null}
        {battleMessage ? (
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-amber-100">
            {battleMessage}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={[
                "rounded-2xl border px-4 py-3 transition-colors",
                isActive
                  ? "border-amber-300/40 bg-amber-300/10"
                  : "border-white/10 bg-black/20",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-stone-50">
                    {player.name}
                  </p>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-[11px] text-stone-300">
                    {player.penaltyPoints}
                  </span>
                  {isCurrentPlayer ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-stone-200">
                      Ви
                    </span>
                  ) : null}
                </div>
                {isActive ? (
                  <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                    Хід зараз
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
