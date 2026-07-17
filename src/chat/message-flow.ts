import { randomUUID } from "node:crypto";
import { insertMessage } from "../mongo/repository.js";
import { AppSocket, ClientMessage, MessageDocument, events } from "./types.js";

// Steps 3–5 of the chat flow, registered per connected socket: the client emits
// a message, the server persists it (source of truth) and delivers it to the
// rest of the room. No ack and no redis fan-out for now — messages aren't
// notifications, so they don't ride that pipeline.
export function registerMessageFlow(socket: AppSocket) {
  socket.on(events.clientMessage, async (payload: ClientMessage) => {
    // Step 3 — Emit: a client message arrived. Stamp the fields the client
    // isn't trusted to set (id, sender, time) into the stored shape.
    const message: MessageDocument = {
      _id: randomUUID(),
      chat_id: payload.chat_id,
      sender_id: socket.data.user?.id ?? "unknown",
      body: payload.body,
      timestamp: new Date().toISOString(),
    };

    // Step 4 — Persist: Mongo is the source of truth. Store before delivering
    // so a delivered message always exists on refetch.
    const stored = await insertMessage(message);
    if (!stored) {
      console.error("[registerMessageFlow]: message not persisted, dropping");
      return;
    }

    // Step 5 — Deliver: broadcast to everyone else in the room. socket.to(...)
    // excludes the sender, who renders their own message optimistically.
    socket.to(message.chat_id).emit(events.serverMessage, message);
  });
}
