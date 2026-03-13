import { NextResponse } from "next/server";
import { createRoom } from "@/server/room-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    creatorName?: string;
    penaltyLimit?: number;
  };

  const creatorName = body.creatorName?.trim();
  const penaltyLimit = Number(body.penaltyLimit ?? 3);

  if (!creatorName) {
    return NextResponse.json({ error: "Введіть ім'я творця кімнати." }, { status: 400 });
  }

  const result = await createRoom({
    creatorName,
    penaltyLimit: Number.isFinite(penaltyLimit) ? penaltyLimit : 3,
  });

  return NextResponse.json(result);
}
