import { getCardSuitSymbol } from "@/lib/game/round";
import type { DiscardedCard } from "@/lib/game/types";

type DiscardPileProps = {
  cards: DiscardedCard[];
};

export function DiscardPile({ cards }: DiscardPileProps) {
  const recentCards = cards.slice(0, 6);

  return (
    <section className="rounded-2xl border border-white/8 bg-black/10 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
            Відбій
          </p>
          <h2 className="mt-1 font-display text-xl text-stone-100">
            Скинуті карти
          </h2>
        </div>
        <div className="rounded-full border border-white/8 bg-black/15 px-3 py-1.5 text-xs text-stone-300">
          У відбої: {cards.length}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {recentCards.length > 0 ? (
          recentCards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-sm text-stone-300"
            >
              Раунд {card.discardedInRound} · {card.rank}
              {getCardSuitSymbol(card.suit)}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-sm text-stone-500">
            Поки що у відбої порожньо.
          </div>
        )}
      </div>
    </section>
  );
}
