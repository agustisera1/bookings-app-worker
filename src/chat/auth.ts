import type { PgUser } from "../pg/index.js";
import type { AppSocket } from "./types.js";

// Step 1 — Handshake: Authenticate.
// Socket.io middleware; runs once per connection, before any event is handled.
// Reads the token off the handshake, verifies it, and attaches the user to
// socket.data so later steps know who is connected. Reject with next(error).
export async function authenticateHandshake(
  socket: AppSocket,
  next: (err?: Error) => void,
) {
  try {
    // TODO: verify the JWT from the handshake and load the user.
    // const token =
    //   socket.handshake.auth.token ?? socket.handshake.headers.authorization;
    // const claims = verifyJwt(token);
    // const user = await findUserById(claims.userId);
    // if (!user) return next(new Error("Unauthorized"));
    // socket.data.user = user;
    void socket;
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
  user: PgUser,
  chatId: string,
): Promise<boolean> {
  // TODO: confirm `user` is the guest or host on booking `chatId`.
  // return isBookingParticipant(user.id, chatId);
  void user;
  void chatId;
  return false;
}
