import * as chatsRepo from "../mongo/chats.mongo.js";
import { insertMessage } from "../mongo/messages.mongo.js";
import { findChatParties, isParty } from "./parties.js";
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
      const senderId = socket.data.user?.user_id;
      if (!senderId) {
        console.error("[registerMessageFlow]: unauthenticated socket");
        return ack?.({ ok: false });
      }

      // Step 3 — Emit: a client message arrived. Resolve both sides of the
      // booking before touching anything: it authorizes the sender and supplies
      // the ids the chat document needs.
      const parties = await findChatParties(payload.chat_id);
      if (!parties) {
        console.error(
          "[registerMessageFlow]: no booking matches chat",
          payload.chat_id,
        );
        return ack?.({ ok: false });
      }

      // Joining the room was authorized, but nothing stops a socket from
      // emitting for a room it never joined — so the sender is checked here too.
      if (!isParty(parties, senderId)) {
        console.error(
          "[registerMessageFlow]: sender is not a party to",
          payload.chat_id,
        );
        return ack?.({ ok: false });
      }

      // The chat document is born with the first message, not with the booking:
      // a pending booking can carry questions before the host confirms it. Both
      // party ids come from `parties`, so it doesn't matter which side speaks
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
