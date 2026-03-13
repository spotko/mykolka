import {
  getRoom,
  registerPresence,
  subscribeToRoom,
  unregisterPresence,
} from "@/server/room-store";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId") ?? undefined;
  const playerName = url.searchParams.get("playerName") ?? undefined;
  const room = await getRoom(code);

  if (!room) {
    return new Response("Кімнату не знайдено.", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = "";

      const sendRoom = (nextRoom = room) => {
        const payload = JSON.stringify({ room: nextRoom });
        if (payload === lastPayload) {
          return;
        }

        lastPayload = payload;
        controller.enqueue(
          encoder.encode(`event: room\ndata: ${payload}\n\n`),
        );
      };

      sendRoom(room);
      await registerPresence({ code, playerId, playerName });
      const roomAfterPresence = await getRoom(code);
      if (roomAfterPresence) {
        sendRoom(roomAfterPresence);
      }

      const unsubscribe = subscribeToRoom(code, (nextRoom) => {
        sendRoom(nextRoom);
      });

      const refreshFromStorage = setInterval(async () => {
        try {
          const latestRoom = await getRoom(code);
          if (latestRoom) {
            sendRoom(latestRoom);
          }
        } catch {
          // If a transient read fails, keep the stream alive and retry on the next tick.
        }
      }, 1000);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      const cleanup = async () => {
        clearInterval(refreshFromStorage);
        clearInterval(keepAlive);
        unsubscribe();
        await unregisterPresence({ code, playerId, playerName });
        try {
          controller.close();
        } catch {
          // Stream may already be closed if the client disconnected first.
        }
      };

      request.signal.addEventListener("abort", () => {
        void cleanup();
      });
    },
    cancel() {
      return;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
