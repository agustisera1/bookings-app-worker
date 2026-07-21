import * as chatsRepo from "../mongo/chats.mongo.js";
import { insertMessage } from "../mongo/messages.mongo.js";
import {
  AppSocket,
  ClientMessage,
  DeliveredMessage,
  EVENTS,
  MessageAck,
  MessageDocument,
} from "./types.js";

/**
 * Steps 3–5 of the chat flow: emit → persist → deliver.
 *
 * The sender is deliberately excluded from the broadcast (`socket.to`), because
 * the client paints its own message immediately. What comes back to the sender
 * instead is the `ack`, carrying the id Mongo minted so the client can replace
 * the temporary one it used — or, on failure, mark the bubble as not sent.
 */
export function registerMessageFlow(socket: AppSocket) {
  socket.on(
    EVENTS.CLIENT_MESSAGE,
    async (payload: ClientMessage, ack?: (res: MessageAck) => void) => {
      // Step 3 — Emit: a client message arrived. The parties stored at join are
      // the authorization: no entry for this room means the socket never joined
      // it (or its ticket expired), so there's nothing to emit into.
      const parties = socket.data.rooms.get(payload.chat_id);
      if (!parties) {
        console.error(
          "[registerMessageFlow]: no authorized room for",
          payload.chat_id,
        );
        return ack?.({ ok: false });
      }

      // The sender is whichever party the ticket was issued to — the client is
      // never trusted to name it.
      const senderId =
        parties.current_party === "guest" ? parties.guest_id : parties.host_id;

      // The chat document is born with the first message, not with the booking:
      // a pending booking can carry questions before the host confirms it. Both
      // party ids come from the ticket, so it doesn't matter which side speaks
      // first — writing the sender into `guest_id` would be wrong half the time.
      await chatsRepo.upsertChatByBookingId(payload.chat_id, {
        booking_id: payload.chat_id,
        guest_id: parties.guest_id,
        host_id: parties.host_id,
        started_at: new Date().toISOString(),
      });

      // Stamp the fields the client isn't trusted to set.
      const message: MessageDocument = {
        chat_id: payload.chat_id,
        sender_id: senderId,
        body: payload.body,
        timestamp: new Date().toISOString(),
      };

      // Step 4 — Persist: Mongo is the source of truth. Store before delivering
      // so a delivered message always exists on refetch.
      const stored = await insertMessage(message);
      if (!stored) {
        console.error("[registerMessageFlow]: message not persisted, dropping");
        return ack?.({ ok: false });
      }

      // Step 5 — Deliver: broadcast to the rest of the room, then confirm to
      // the sender.
      const delivered: DeliveredMessage = {
        ...message,
        _id: stored.insertedId.toString(),
      };
      socket.to(payload.chat_id).emit(EVENTS.SERVER_MESSAGE, delivered);
      ack?.({ ok: true, message: delivered });
    },
  );
}
