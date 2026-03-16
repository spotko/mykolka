import { getCardSuitSymbol } from "@/lib/game/round";
import type { Player, RoundReveal } from "@/lib/game/types";

type RoundRevealOverlayProps = {
  players: Player[];
  reveals: RoundReveal[];
  visible: boolean;
};

export function RoundRevealOverlay({
  players,
  reveals,
  visible,
}: RoundRevealOverlayProps) {
  if (!visible || reveals.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[rgba(8,18,12,0.82)] p-5 shadow-glow backdrop-blur animate-[callout-in_220ms_ease-out]">
        <div className="text-center text-xs uppercase tracking-[0.24em] text-stone-400">
          Відкриті карти кола
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {reveals.map((reveal) => {
            const player = players.find((item) => item.id === reveal.playerId);
            const suit = getCardSuitSymbol(reveal.suit);
            const isRedSuit = suit === "♦" || suit === "♥";

            return (
              <div
                key={reveal.cardId}
                className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-center"
              >
                <div className="text-sm font-semibold text-stone-100">
                  {player?.name ?? "Гравець"}
                </div>
                <div className="mt-2 text-2xl font-bold text-stone-50">{reveal.rank}</div>
                <div className={["text-xl", isRedSuit ? "text-rose-400" : "text-stone-100"].join(" ")}>
                  {suit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
