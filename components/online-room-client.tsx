"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CardPreview } from "@/components/card-preview";
import { DiscardPile } from "@/components/discard-pile";
import { PlayersPanel } from "@/components/players-panel";
import { RoundHistory } from "@/components/round-history";
import { RoundNotice } from "@/components/round-notice";
import { getCardSuitSymbol } from "@/lib/game/round";
import type { GameRoom } from "@/lib/game/types";

type OnlineRoomClientProps = {
  code: string;
  initialJoinName?: string;
};

type RoomResponse = {
  room?: GameRoom;
  playerId?: string;
  error?: string;
};

export function OnlineRoomClient({ code, initialJoinName }: OnlineRoomClientProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [hasTriedReconnect, setHasTriedReconnect] = useState(false);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const storageKey = `mykolka-player:${code}`;
  const storageNameKey = `mykolka-player-name:${code}`;
  const currentPlayer = room?.players.find((player) => player.id === playerId) ?? null;
  const activePlayer = room?.players.find((player) => player.id === room.activePlayerId) ?? null;
  const losingPlayer = room?.players.find(
    (player) => player.penaltyPoints === room.penaltyLimit,
  );
  const roundLoser = room?.lastRoundSummary?.loserPlayerId
    ? room.players.find((player) => player.id === room.lastRoundSummary?.loserPlayerId) ?? null
    : null;
  const canSubmitJoin = playerName.trim().length > 0;
  const canStartGame = Boolean(room && room.players.length >= 2);
  const battleMessage =
    room?.status === "battle" ? room.lastRoundSummary?.message ?? "Батл триває." : null;

  useEffect(() => {
    const storedPlayerId = window.sessionStorage.getItem(storageKey);
    const storedPlayerName = window.sessionStorage.getItem(storageNameKey);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    if (initialJoinName) {
      setPlayerName(initialJoinName);
    } else if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }

    void fetchRoom();
    setHasTriedReconnect(false);
  }, [initialJoinName, storageKey, storageNameKey]);

  useEffect(() => {
    const eventUrl = new URL(`/api/rooms/${code}/events`, window.location.origin);

    if (playerId) {
      eventUrl.searchParams.set("playerId", playerId);
    }

    if (playerName.trim()) {
      eventUrl.searchParams.set("playerName", playerName.trim());
    }

    const events = new EventSource(eventUrl.toString());

    events.addEventListener("room", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as RoomResponse;
      if (payload.room) {
        setRoom(payload.room);
        setLoading(false);
        setError("");
      }
    });

    events.onerror = () => {
      events.close();
    };

    return () => {
      events.close();
    };
  }, [code, playerId, playerName]);

  useEffect(() => {
    if (!room || currentPlayer || joining || reconnecting || hasTriedReconnect) {
      return;
    }

    const storedPlayerId = window.sessionStorage.getItem(storageKey) ?? undefined;
    const storedPlayerName =
      window.sessionStorage.getItem(storageNameKey) ?? initialJoinName ?? undefined;

    if (!storedPlayerId && !storedPlayerName) {
      return;
    }

    setHasTriedReconnect(true);
    void handleReconnect(storedPlayerId, storedPlayerName);
  }, [
    currentPlayer,
    hasTriedReconnect,
    initialJoinName,
    joining,
    reconnecting,
    room,
    storageKey,
    storageNameKey,
  ]);

  async function fetchRoom(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    }

    const response = await fetch(`/api/rooms/${code}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as RoomResponse;

    if (!response.ok || !data.room) {
      setError(data.error ?? "Не вдалося завантажити кімнату.");
      setLoading(false);
      return;
    }

    setRoom(data.room);
    setError("");
    setLoading(false);
  }

  const handleJoin = async (overrideName?: string) => {
    setJoining(true);
    setError("");
    const nameToJoin = (overrideName ?? playerName).trim();

    const response = await fetch(`/api/rooms/${code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "join",
        playerName: nameToJoin,
      }),
    });

    const data = (await response.json()) as RoomResponse;
    if (!response.ok || !data.room || !data.playerId) {
      setError(data.error ?? "Не вдалося приєднатися до кімнати.");
      setJoining(false);
      return;
    }

    window.sessionStorage.setItem(storageKey, data.playerId);
    window.sessionStorage.setItem(storageNameKey, nameToJoin);
    setPlayerId(data.playerId);
    setPlayerName(nameToJoin);
    setRoom(data.room);
    setJoining(false);
  };

  const handleReconnect = async (savedPlayerId?: string, savedPlayerName?: string) => {
    setReconnecting(true);

    const response = await fetch(`/api/rooms/${code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reconnect",
        playerId: savedPlayerId,
        playerName: savedPlayerName,
      }),
    });

    const data = (await response.json()) as RoomResponse;
    if (response.ok && data.room && data.playerId) {
      window.sessionStorage.setItem(storageKey, data.playerId);
      if (savedPlayerName) {
        window.sessionStorage.setItem(storageNameKey, savedPlayerName);
        setPlayerName(savedPlayerName);
      }
      setPlayerId(data.playerId);
      setRoom(data.room);
      setError("");
    }

    setReconnecting(false);
  };

  const handleReveal = async (cardId: string) => {
    if (!playerId) {
      setError("Спочатку увійдіть у кімнату.");
      return;
    }

    setBusyCardId(cardId);
    setError("");

    const response = await fetch(`/api/rooms/${code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reveal",
        playerId,
        cardId,
      }),
    });

    const data = (await response.json()) as RoomResponse;
    if (!response.ok || !data.room) {
      setError(data.error ?? "Не вдалося зробити хід.");
      setBusyCardId(null);
      return;
    }

    setRoom(data.room);
    setBusyCardId(null);
  };

  const handleReset = async () => {
    const response = await fetch(`/api/rooms/${code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reset",
      }),
    });

    const data = (await response.json()) as RoomResponse;
    if (!response.ok || !data.room) {
      setError(data.error ?? "Не вдалося почати нову партію.");
      return;
    }

    setRoom(data.room);
  };

  const handleCopyRoomLink = async () => {
    if (!room) {
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
  };

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-100 shadow-glow backdrop-blur">
        Завантажуємо кімнату...
      </section>
    );
  }

  if (!room) {
    return (
      <section className="rounded-[2rem] border border-rose-300/20 bg-rose-400/10 p-8 text-rose-50 shadow-glow backdrop-blur">
        {error || "Кімнату не знайдено."}
      </section>
    );
  }

  if (!currentPlayer) {
    return (
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur">
        <h1 className="font-display text-4xl text-stone-50">
          Сідаємо за стіл?
        </h1>
        <div className="mt-2 text-xs uppercase tracking-[0.25em] text-stone-400">
          Кімната {room.id}
        </div>
        <p className="mt-4 max-w-xl text-base leading-7 text-stone-200/85">
          Введи ім&apos;я, щоб киданути партію Миколкиної гри.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Ваше ім'я"
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-50 outline-none transition-colors focus:border-amber-300/40"
          />
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={!canSubmitJoin || joining}
            className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {joining ? "Заходимо..." : "Увійти"}
          </button>
        </div>

        {reconnecting ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
            Відновлюємо попереднє підключення...
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>
    );
  }

  if (room.status === "lobby" && room.players.length < 2) {
    return (
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/20">
              <Image
                src="/assets/logo-mykolka.png"
                alt="Логотип Миколкиної гри"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div>
            <h1 className="font-display text-4xl text-stone-50">Сідаємо за стіл?</h1>
            <div className="mt-2 text-xs uppercase tracking-[0.25em] text-stone-400">
              Кімната {room.id}
            </div>
          </div>
          </div>
          <button
            type="button"
            onClick={handleCopyRoomLink}
            className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-50 transition-colors hover:bg-emerald-300/15"
          >
            Запросити за посиланням
          </button>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 px-5 py-5">
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-emerald-100/70">
            <span>Граємо до: {room.penaltyLimit}</span>
            <span className="h-1 w-1 rounded-full bg-emerald-100/45" />
            <span>Перший гравець: {activePlayer?.name ?? "ще визначається"}</span>
          </div>

          <div className="mt-4 text-xl font-semibold leading-8 text-stone-50">
            Треба ще одного гравця, аби почати
          </div>

          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/70">
            Коли другий гравець долучиться, стіл відкриється автоматично.
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-6 shadow-glow backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/20">
            <Image
              src="/assets/logo-mykolka.png"
              alt="Логотип Миколкиної гри"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200/70">
              Кімната {room.id}
            </p>
            <h1 className="mt-2 font-display text-3xl text-stone-50">Миколкина гра</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {room.status === "lobby" ? (
            <button
              type="button"
              onClick={handleCopyRoomLink}
              className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-50 transition-colors hover:bg-emerald-300/15"
            >
              Запросити за посиланням
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <PlayersPanel
          activePlayerId={room.activePlayerId}
          battleMessage={battleMessage}
          currentPlayerId={currentPlayer.id}
          penaltyLimit={room.penaltyLimit}
          players={room.players}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <RoundNotice
            actionLabel={room.status === "game_over" ? "Нова партія" : undefined}
            loserName={room.status === "game_over" ? null : roundLoser?.name ?? null}
            message={
              room.status === "game_over"
                ? `${losingPlayer?.name ?? "Один із гравців"} програв партію.`
                : room.status === "battle"
                ? null
                : room.lastRoundSummary?.message ?? null
            }
            onAction={room.status === "game_over" ? handleReset : null}
            title={room.status === "game_over" ? "Підсумок гри" : undefined}
            tone={room.status === "game_over" ? "game" : "round"}
          />

          {error ? (
            <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {room.tableCards.map((card) => {
              const selectedBy = card.revealedByPlayerId
                ? room.players.find((player) => player.id === card.revealedByPlayerId)?.name ?? null
                : null;
              const canPlay =
                currentPlayer?.id === room.activePlayerId &&
                canStartGame &&
                room.status !== "round_end" &&
                room.status !== "game_over";

              return (
                <CardPreview
                  key={card.id}
                  label={card.rank}
                  suit={getCardSuitSymbol(card.suit)}
                  revealed={Boolean(card.revealedByPlayerId)}
                  disabled={Boolean(card.revealedByPlayerId) || !canPlay || busyCardId === card.id}
                  onClick={() => handleReveal(card.id)}
                  selectedBy={selectedBy}
                />
              );
            })}
          </div>
        </section>
      </section>

      <details className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-stone-400 backdrop-blur">
        <summary className="cursor-pointer list-none text-xs uppercase tracking-[0.22em] text-stone-500">
          Деталі партії
        </summary>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Технічний блок для перевірки попередніх кіл і відбою.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RoundHistory items={room.roundHistory} players={room.players} />
          <DiscardPile cards={room.discardPile} />
        </div>
      </details>
    </div>
  );
}
