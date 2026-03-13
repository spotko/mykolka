import Link from "next/link";
import { DemoRoomClient } from "@/components/demo-room-client";
import { OnlineRoomClient } from "@/components/online-room-client";
import { createRoomSnapshot } from "@/lib/game/setup";
import type { Player } from "@/lib/game/types";

const demoPlayers: Player[] = [
  {
    id: "p1",
    name: "Миколка 👑",
    penaltyPoints: 0,
    joinedAt: 1,
  },
  {
    id: "p2",
    name: "Олена",
    penaltyPoints: 1,
    joinedAt: 2,
  },
  {
    id: "p3",
    name: "Микола Паламарчук",
    penaltyPoints: 0,
    joinedAt: 3,
  },
  {
    id: "p4",
    name: "Іра",
    penaltyPoints: 2,
    joinedAt: 4,
  },
];

type RoomPageProps = {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    name?: string;
  }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { code } = await params;
  const { name } = await searchParams;

  if (code.toLowerCase() !== "demo") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <OnlineRoomClient code={code.toUpperCase()} initialJoinName={name} />
      </main>
    );
  }

  const room = createRoomSnapshot({
    id: code.toUpperCase(),
    players: demoPlayers,
    penaltyLimit: 3,
  });

  const firstPlayer = room.players.find((player) => player.id === room.activePlayerId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
            Кімната {room.id}
          </p>
          <h1 className="mt-3 font-display text-4xl text-stone-50">
            Лобі та порядок першого ходу
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200/85">
            Це перша жива версія кімнати. Уже зараз ми визначаємо першого
            гравця за вашими правилами: спочатку шукаємо Миколку, потім будь-кого
            з іменем Микола, а якщо нікого немає — беремо першого за часом
            приєднання.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-50">
          Перший хід: <strong>{firstPlayer?.name ?? "не визначено"}</strong>
          <div className="mt-1 text-amber-100/80">
            Ліміт штрафів: {room.penaltyLimit}
          </div>
        </div>
      </section>

      <DemoRoomClient initialRoom={room} />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
            Що вже працює
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200/85">
            <li>Визначення першого гравця за правилами Миколки.</li>
            <li>Черга ходу, відкриття карт і завершення раунду.</li>
            <li>Нарахування штрафного балу тому, хто витягнув найменшу карту.</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
            Що далі
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-200/85">
            <li>Повноцінний батл для нічиєї на найменшій карті.</li>
            <li>Пауза після раунду і відбій без перезавантаження сторінки.</li>
            <li>Потім підключимо реальні кімнати через Socket.IO.</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
            Навігація
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 transition-colors hover:bg-black/30"
            >
              На головну
            </Link>
            <Link
              href="/room/demo"
              className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-amber-50 transition-colors hover:bg-amber-300/15"
            >
              Оновити демо-кімнату
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
