import type { ActivityLogItem } from "@/lib/game/types";

type ActivityLogProps = {
  items: ActivityLogItem[];
  title?: string;
};

export function ActivityLog({ items, title = "Події кімнати" }: ActivityLogProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
        Активність
      </p>
      <h2 className="mt-2 font-display text-2xl text-stone-50">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200"
            >
              {item.message}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
            Поки що без нових подій.
          </div>
        )}
      </div>
    </section>
  );
}
