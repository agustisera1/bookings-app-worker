import { Redis } from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { authenticateHandshake, authorizeRoom } from "../chat/auth.js";
import { registerMessageFlow } from "../chat/message-flow.js";
import { SocketData } from "../chat/types.js";

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

// Step 1 — Handshake: Authenticate. Gate every connection before it's accepted.
io.use(authenticateHandshake);

io.on("connection", async (socket) => {
  // Step 2 — Join Room: Authorize. A booking's id is its chat room id; the
  // client sends it on the handshake auth payload.
  const chatId = socket.handshake.auth.chatId as string | undefined;
  const user = socket.data.user;
  if (chatId && user && (await authorizeRoom(user, chatId))) {
    socket.join(chatId);
  }

  // Steps 3–5: emit → persist → deliver.
  registerMessageFlow(socket);

  console.info("[connection]: new socket connection", socket.id);
});
