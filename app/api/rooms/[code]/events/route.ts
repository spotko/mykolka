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
      const sendRoom = (nextRoom = room) => {
        controller.enqueue(
          encoder.encode(`event: room\ndata: ${JSON.stringify({ room: nextRoom })}\n\n`),
        );
      };

      sendRoom(room);
      await registerPresence({ code, playerId, playerName });

      const unsubscribe = subscribeToRoom(code, (nextRoom) => {
        sendRoom(nextRoom);
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      const cleanup = async () => {
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
