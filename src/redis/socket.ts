import { Redis } from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { authenticateHandshake, authorizeRoom } from "../chat/auth.js";
import { EVENTS, JoinAck, SocketData } from "../chat/types.js";
import { registerMessageFlow } from "../chat/message-flow.js";

const url = process.env.REDIS_URL;
if (!url) throw new Error("[redis]: Missing REDIS_URL");

// ioredis (not node-redis) for the adapter: node-redis has reconnection issues
// with it. See https://socket.io/docs/v4/redis-adapter/#with-the-redis-package
// Same REDIS_URL the rest of the worker uses — one source of connection config.
const pubClient = new Redis(url);
const subClient = pubClient.duplicate();

// Origin of the web client allowed through CORS. Environment-specific, so it
// comes from env; falls back to the local dev front.
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

export const io = new Server<any, any, any, SocketData>({
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Step 1 — Leverage io.use to provide a middleware and authenticate. Gate every connection before it's accepted.
io.use(authenticateHandshake);

io.on("connection", (socket) => {
  // Step 2 — Join Room: Authorize. A booking's id doubles as its chat room id.
  // It can't ride the handshake: the socket connects once, while the client
  // learns (and changes) which booking it shows afterwards. So the join is its
  // own event — the handshake authenticates *who*, this authorizes *what*.
  // The reply goes through `ack`, the callback the client passes last on emit;
  // returning a value from the handler is not an ack and reaches no one.
  socket.on(
    EVENTS.JOIN_CHAT,
    async (chatId: string, ack?: (res: JoinAck) => void) => {
      const user = socket.data.user;
      const authorized = await authorizeRoom(chatId, user);
      if (!authorized) return ack?.({ ok: false });
      socket.join(chatId);
      ack?.({ ok: true });
    },
  );

  socket.on(EVENTS.LEAVE_CHAT, (chatId: string) => {
    socket.leave(chatId);
  });

  // Steps 3–5: emit → persist → deliver.
  registerMessageFlow(socket);
});
