import { CardPreview } from "@/components/card-preview";
import Link from "next/link";

const previewCards = Array.from({ length: 12 }, (_, index) => index);

export function GameTable() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
            Стіл
          </p>
          <h2 className="font-display text-2xl">36 карт на старті партії</h2>
        </div>
        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          👉 Зараз хід: Миколка 👑
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {previewCards.map((card) => (
          <CardPreview key={card} label="A" suit="♠" revealed={card === 1} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-200/80">
        <Link
          href="/room/demo"
          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 transition-colors hover:bg-black/30"
        >
          Відкрити демо-кімнату
        </Link>
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
          Наступний етап: натискання на карту і логіка раунду
        </span>
      </div>
    </section>
  );
}
