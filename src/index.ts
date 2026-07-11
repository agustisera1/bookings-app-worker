import { worker, client } from "./redis.js";

// Don't call client.connect() here: BullMQ's node-redis adapter auto-connects
// the shared client, and a second connect throws "Socket already opened".

// Graceful shutdown. worker.close() stops the worker and closes its own
// (blocking) socket; the shared command client is left open by BullMQ, so we
// close it ourselves to avoid leaking the connection.
async function shutdown() {
  await worker.close();
  await client.close();
  process.exit(0);
}

// SIGINT -> Ctrl+C; SIGTERM -> docker stop / tsx watch reloads.
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
