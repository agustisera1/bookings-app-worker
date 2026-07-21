import type { PgUser } from "../pg/index.js";
import type { BookingParty } from "../events.js";
import type { AppSocket } from "./types.js";
import jwt from "jsonwebtoken";

export type Role = "guest" | "host";
// Claims the app signs into the access token (see `createAccessToken` in
// bookings_app/lib/services/auth.ts). Careful: the user id travels as
// `user_id`, not `id` — this is the wire contract, not the `users` row.
export type CurrentUser = Pick<PgUser, "email" | "name" | "is_host"> & {
  user_id: string;
  permissions: string[];
  roles: Role[];
};

// Both party ids of a booking's chat plus which side the ticket holder is. The
// app signs this whole object into the join ticket. Mirrors ChatParties in
// bookings_app/lib/types/booking.ts — replicated by hand, same as the payloads.
export type ChatParties = {
  chat_id: string;
  host_id: string;
  guest_id: string;
  current_party: BookingParty | null;
};

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

// Step 1 — Handshake: Authenticate.
// Socket.io middleware; runs once per connection, before any event is handled.
// Reads the token off the handshake, verifies it, and attaches the user to
// socket.data so later steps know who is connected. Reject with next(error).
export async function authenticateHandshake(
  socket: AppSocket,
  next: (err?: Error) => void,
) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Token not provided"));
    const user = verifyToken(token);
    socket.data.user = user as CurrentUser;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}

// Step 2 — Join Room: Authorize. The ticket is a signed ChatParties the app
// minted after running the rule; the worker only verifies its signature and
// that it names a party — no PG, no Mongo, no rule. The room to join is the
// ticket's own chat_id. Returns the parties to store, or null to refuse.
export function authorizeRoom(ticket?: string): ChatParties | null {
  if (!ticket) {
    console.error("[authorizeRoom]: no ticket provided");
    return null;
  }

  let parties: ChatParties;
  try {
    parties = verifyToken(ticket) as ChatParties;
  } catch {
    console.error("[authorizeRoom]: invalid or expired ticket");
    return null;
  }

  if (!parties.current_party) {
    console.error("[authorizeRoom]: ticket names no party", parties.chat_id);
    return null;
  }

  return parties;
}
