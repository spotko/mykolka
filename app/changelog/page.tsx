import { CHANGELOG_ITEMS } from "@/lib/changelog";

export default function ChangelogPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
          Changelog
        </p>
        <h1 className="mt-3 font-display text-4xl text-stone-50">
          Історія веб-версії
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200/85">
          Короткий список змін по веб-версії гри. Python-версія лишається
          окремою гілкою історії.
        </p>
      </section>

      {CHANGELOG_ITEMS.map((item) => (
        <section
          key={item.version}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl text-stone-50">{item.version}</h2>
            <div className="text-sm text-stone-400">{item.date}</div>
          </div>
          <div className="mt-2 text-sm uppercase tracking-[0.2em] text-amber-200/70">
            {item.title}
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200/85">
            {item.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
