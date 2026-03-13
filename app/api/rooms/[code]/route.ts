import { NextResponse } from "next/server";
import {
  continueAfterPause,
  getRoom,
  joinRoom,
  reconnectRoom,
  resetRoom,
  revealForPlayer,
} from "@/server/room-store";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { code } = await context.params;
  const room = await getRoom(code);

  if (!room) {
    return NextResponse.json({ error: "Кімнату не знайдено." }, { status: 404 });
  }

  return NextResponse.json({ room });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const body = (await request.json()) as {
    action?: "join" | "reconnect" | "reset" | "reveal" | "continue";
    playerName?: string;
    playerId?: string;
    cardId?: string;
  };

  if (body.action === "join") {
    const playerName = body.playerName?.trim();
    if (!playerName) {
      return NextResponse.json({ error: "Введіть ім'я гравця." }, { status: 400 });
    }

    const result = await joinRoom({
      code,
      playerName,
    });

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  }

  if (body.action === "reconnect") {
    const result = await reconnectRoom({
      code,
      playerId: body.playerId,
      playerName: body.playerName,
    });

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  }

  if (body.action === "reset") {
    const result = await resetRoom(code);
    if ("error" in result) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  }

  if (body.action === "reveal") {
    if (!body.playerId || !body.cardId) {
      return NextResponse.json(
        { error: "Потрібні playerId і cardId." },
        { status: 400 },
      );
    }

    const result = await revealForPlayer({
      code,
      playerId: body.playerId,
      cardId: body.cardId,
    });

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  }

  if (body.action === "continue") {
    const result = await continueAfterPause(code);

    if ("error" in result) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Невідома дія." }, { status: 400 });
}
