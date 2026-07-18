import type { PgUser } from "../pg/index.js";
import type { AppSocket } from "./types.js";
import { findChatParties, isParty } from "./parties.js";
import { Cookies, parseCookie } from "cookie";
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
    const cookies: Cookies = parseCookie(socket.handshake.headers.cookie ?? "");
    const token = cookies["token"];
    if (!token) return next(new Error("Token not provided"));
    const user = verifyToken(token);
    socket.data.user = user as CurrentUser;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}

// Step 2 — Join Room: Authorize.
// A booking's id doubles as its chat room id. Decide whether `user` is a party
// to booking `chatId` and may join its room. Pure check — no side effects; the
// caller runs socket.join on success.
export async function authorizeRoom(
  chatId: string,
  user?: CurrentUser,
): Promise<boolean> {
  if (!user) {
    console.error("[authorizeRoom]: no user provided");
    return false;
  }

  const parties = await findChatParties(chatId);
  if (!parties) {
    console.error("[authorizeRoom]: no booking matches chat", chatId);
    return false;
  }

  // Note it checks *this* booking's parties — being a host grants nothing on
  // bookings that aren't yours.
  return isParty(parties, user.user_id);
}
