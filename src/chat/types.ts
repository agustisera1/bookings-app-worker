import type { Socket } from "socket.io";
import type { PgUser } from "../pg/index.js";
import type { MessageDocument } from "../mongo/repository.js";

// The persisted + delivered message shape lives with the Mongo repository (the
// storage owner), same as NotificationDocumentPayload. Re-exported here so the
// chat feature has a single types entry point.
export type { MessageDocument };

// What a client sends on `events.clientMessage`: only the room and the body.
// The server stamps _id, sender_id (from the authenticated socket) and
// timestamp before persisting — clients don't get to set those.
export type ClientMessage = {
  chat_id: string;
  body: string;
};

// Attached to socket.data by the handshake auth middleware (step 1); undefined
// until a socket has authenticated.
export type SocketData = { user?: PgUser };

// A socket carrying our authenticated-user data. `any` on the event maps keeps
// the focus on socket.data without enumerating every client/server event.
export type AppSocket = Socket<any, any, any, SocketData>;

// Socket.io event names, in one place so client and server stay in agreement.
export const events = {
  clientMessage: "client-message",
  serverMessage: "server-message",
} as const;
