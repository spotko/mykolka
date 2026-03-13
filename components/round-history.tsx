import type { RoundHistoryItem, Player } from "@/lib/game/types";

type RoundHistoryProps = {
  items: RoundHistoryItem[];
  players: Player[];
};

export function RoundHistory({ items, players }: RoundHistoryProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-black/10 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
        Історія
      </p>
      <h2 className="mt-1 font-display text-xl text-stone-100">
        Останні раунди
      </h2>
      <div className="mt-4 space-y-2">
        {items.length > 0 ? (
          items.map((item) => {
            const loser = item.loserPlayerId
              ? players.find((player) => player.id === item.loserPlayerId)
              : null;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-sm text-stone-300"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Раунд {item.roundNumber}
                </div>
                <div className="mt-1">{item.message}</div>
                {loser ? (
                  <div className="mt-1 text-stone-500">Бал отримав: {loser.name}</div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-sm text-stone-500">
            Історія поки порожня.
          </div>
        )}
      </div>
    </section>
  );
}
