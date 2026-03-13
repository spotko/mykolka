"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function HomeLobby() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [penaltyLimit, setPenaltyLimit] = useState(3);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateRoom = async () => {
    setError("");

    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorName,
        penaltyLimit,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      room?: { id: string };
      playerId?: string;
    };

    if (!response.ok || !data.room || !data.playerId) {
      setError(data.error ?? "Не вдалося створити кімнату.");
      return;
    }

    window.sessionStorage.setItem(`mykolka-player:${data.room.id}`, data.playerId);
    window.sessionStorage.setItem(
      `mykolka-player-name:${data.room.id}`,
      creatorName.trim(),
    );
    startTransition(() => {
      router.push(`/room/${data.room?.id}`);
    });
  };

  const handleJoinRoom = () => {
    setError("");

    if (!joinName.trim()) {
      setError("Введіть ім'я гравця.");
      return;
    }

    if (!roomCode.trim()) {
      setError("Введіть код кімнати.");
      return;
    }

    startTransition(() => {
      router.push(
        `/room/${roomCode.trim().toUpperCase()}?name=${encodeURIComponent(joinName.trim())}`,
      );
    });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
        <h2 className="font-display text-2xl text-stone-50">Створити кімнату</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-stone-200">Ваше ім&apos;я</span>
            <input
              value={creatorName}
              onChange={(event) => setCreatorName(event.target.value)}
              placeholder="Наприклад, Миколка 👑"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-50 outline-none transition-colors focus:border-amber-300/40"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-stone-200">До скількох граємо?</span>
            <input
              type="number"
              min={1}
              max={10}
              value={penaltyLimit}
              onChange={(event) => setPenaltyLimit(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-50 outline-none transition-colors focus:border-amber-300/40"
            />
          </label>

          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isPending || !creatorName.trim()}
            className="w-full rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Створюємо..." : "Створити кімнату"}
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 shadow-glow backdrop-blur">
        <h2 className="font-display text-2xl text-stone-50">Увійти в кімнату</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-stone-200">Ваше ім&apos;я</span>
            <input
              value={joinName}
              onChange={(event) => setJoinName(event.target.value)}
              placeholder="Наприклад, Колоб"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-50 outline-none transition-colors focus:border-amber-300/40"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-stone-200">Код кімнати</span>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="Наприклад, A1B2"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-stone-50 outline-none transition-colors focus:border-amber-300/40"
            />
          </label>

          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={isPending || !joinName.trim() || !roomCode.trim()}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-stone-50 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Відкрити кімнату
          </button>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
