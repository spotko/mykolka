"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CardPreview } from "@/components/card-preview";
import { DiscardPile } from "@/components/discard-pile";
import { PlayersPanel } from "@/components/players-panel";
import { RoundHistory } from "@/components/round-history";
import { RoundNotice } from "@/components/round-notice";
import { resetRoomForNewGame } from "@/lib/game/setup";
import {
  advanceAfterRoundPause,
  getCardSuitSymbol,
  getCurrentPhaseLabel,
  revealCardForActivePlayer,
} from "@/lib/game/round";
import type { GameRoom } from "@/lib/game/types";

type DemoRoomClientProps = {
  initialRoom: GameRoom;
};

export function DemoRoomClient({ initialRoom }: DemoRoomClientProps) {
  const [room, setRoom] = useState(initialRoom);
  const [pauseSecondsLeft, setPauseSecondsLeft] = useState<number | null>(null);

  const activePlayer = room.players.find((player) => player.id === room.activePlayerId) ?? null;
  const activePlayerName = activePlayer?.name ?? "Немає активного гравця";
  const phaseLabel = getCurrentPhaseLabel(room);
  const canStartGame = room.players.length >= 2;
  const isGameOver = room.players.some(
    (player) => player.penaltyPoints >= room.penaltyLimit,
  );

  const winnerLoser = room.lastRoundSummary?.loserPlayerId
    ? room.players.find((player) => player.id === room.lastRoundSummary?.loserPlayerId)
    : null;
  const losingPlayer = room.players.find(
    (player) => player.penaltyPoints >= room.penaltyLimit,
  );

  useEffect(() => {
    if (room.status !== "round_end") {
      setPauseSecondsLeft(null);
      return;
    }

    setPauseSecondsLeft(2.5);

    const tickInterval = window.setInterval(() => {
      setPauseSecondsLeft((currentValue) => {
        if (currentValue === null) {
          return currentValue;
        }

        const nextValue = Number(Math.max(currentValue - 0.5, 0).toFixed(1));
        return nextValue;
      });
    }, 500);

    const roundTimeout = window.setTimeout(() => {
      setRoom((currentRoom) => advanceAfterRoundPause(currentRoom));
    }, 2500);

    return () => {
      window.clearInterval(tickInterval);
      window.clearTimeout(roundTimeout);
    };
  }, [room.status]);

  const handleCardClick = (cardId: string) => {
    if (isGameOver || room.status === "round_end") {
      return;
    }

    setRoom((currentRoom) => {
      if (currentRoom.players.length < 2) {
        return {
          ...currentRoom,
          lastRoundSummary: {
            loserPlayerId: null,
            lowestRank: null,
            battlePlayerIds: [],
            message: "Для старту гри потрібно щонайменше 2 гравці.",
          },
        };
      }

      const nextRoom = revealCardForActivePlayer(currentRoom, cardId);
      const finishedPlayer = nextRoom.players.find(
        (player) => player.penaltyPoints >= nextRoom.penaltyLimit,
      );

      if (finishedPlayer) {
        return {
          ...nextRoom,
          status: "game_over",
          activePlayerId: null,
          lastRoundSummary: {
            loserPlayerId: finishedPlayer.id,
            lowestRank: nextRoom.lastRoundSummary?.lowestRank ?? null,
            battlePlayerIds: [],
            message: `${finishedPlayer.name} набрав ${nextRoom.penaltyLimit} штрафні бали і програв партію.`,
          },
        };
      }

      return nextRoom;
    });
  };

  const handleNewGameClick = () => {
    setRoom((currentRoom) => resetRoomForNewGame(currentRoom));
    setPauseSecondsLeft(null);
  };

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <PlayersPanel
          activePlayerId={room.activePlayerId}
          players={room.players}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/20">
                <Image
                  src="/assets/logo-mykolka.png"
                  alt="Логотип Миколкиної гри"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-amber-200/70">
                  {phaseLabel} · Раунд {room.roundNumber}
                </p>
                <h2 className="font-display text-2xl">Демо ігрового столу</h2>
              </div>
            </div>
            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
              👉 Зараз хід: {activePlayerName}
            </div>
          </div>

          <RoundNotice
            actionLabel={room.status === "game_over" ? "Нова партія" : undefined}
            loserName={room.status === "game_over" ? null : winnerLoser?.name ?? null}
            message={
              room.status === "game_over"
                ? `${losingPlayer?.name ?? "Один із гравців"} набрав ${room.penaltyLimit} штрафні бали. Партія завершена.`
                : room.lastRoundSummary?.message ?? null
            }
            onAction={room.status === "game_over" ? handleNewGameClick : null}
            title={room.status === "game_over" ? "Підсумок гри" : undefined}
            tone={room.status === "game_over" ? "game" : "round"}
          />

          <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-200/85">
            {room.status === "round_end"
              ? `Раунд завершено. Пауза 2.5 секунди перед наступним ходом${
                  pauseSecondsLeft !== null ? ` (${pauseSecondsLeft.toFixed(1)} с)` : "."
                }`
              : room.status === "lobby" && !canStartGame
              ? "Для старту цієї демо-гри потрібно щонайменше 2 гравці."
              : room.status === "lobby"
              ? "Кімната відкрита. Перший клік по карті запускає партію."
              : room.status === "battle"
              ? "У батлі карти тягнуть тільки учасники нічиєї, у тому ж порядку ходу."
              : "Натискайте на закриті карти по черзі. Коли кожен гравець відкриє по одній карті, раунд завершиться автоматично."}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {room.tableCards.map((card) => {
              const selectedBy = card.revealedByPlayerId
                ? room.players.find((player) => player.id === card.revealedByPlayerId)?.name ?? null
                : null;

              return (
                <CardPreview
                  key={card.id}
                  label={card.rank}
                  suit={getCardSuitSymbol(card.suit)}
                  revealed={Boolean(card.revealedByPlayerId)}
                  disabled={
                    Boolean(card.revealedByPlayerId) ||
                    !room.activePlayerId ||
                    !canStartGame ||
                    room.status === "round_end" ||
                    room.status === "game_over"
                  }
                  onClick={() => handleCardClick(card.id)}
                  selectedBy={selectedBy}
                />
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100">
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-amber-200/70">
                Відкриті карти
              </div>
              {room.currentRoundReveals.length > 0 || room.battleReveals.length > 0 ? (
                <div className="space-y-2">
                  {room.currentRoundReveals.map((reveal) => {
                    const player = room.players.find((item) => item.id === reveal.playerId);
                    return (
                      <div key={reveal.cardId}>
                        Раунд · {player?.name ?? "Гравець"}: {reveal.rank}
                        {getCardSuitSymbol(reveal.suit)}
                      </div>
                    );
                  })}
                  {room.battleReveals.map((reveal) => {
                    const player = room.players.find((item) => item.id === reveal.playerId);
                    return (
                      <div key={reveal.cardId}>
                        Батл · {player?.name ?? "Гравець"}: {reveal.rank}
                        {getCardSuitSymbol(reveal.suit)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-stone-300">Ще ніхто не відкрив карту.</div>
              )}
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-amber-100/80">
                Підсумок
              </div>
              <div>
                {room.lastRoundSummary?.message ??
                  "Після завершення раунду тут з'явиться результат."}
              </div>
              {room.battleParticipantIds.length > 0 ? (
                <div className="mt-2 text-amber-100/80">
                  У батлі:{" "}
                  {room.players
                    .filter((player) => room.battleParticipantIds.includes(player.id))
                    .map((player) => player.name)
                    .join(", ")}
                </div>
              ) : null}
              {winnerLoser ? (
                <div className="mt-2 text-amber-100/80">
                  Поточний програвший раунду: {winnerLoser.name}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RoundHistory items={room.roundHistory} players={room.players} />
        <DiscardPile cards={room.discardPile} />
      </section>
    </>
  );
}
