import { createClient, RedisArgument } from "redis";

export const channels = {
  notifications: (target?: string) =>
    target ? `notifications:${target}` : "notifications:*", // Use wildcard for subscriptions
};

const url = process.env.REDIS_URL;
if (!url) throw new Error("[redis]: Missing REDIS_URL");

// Dedicated redis pub client for pushing SSE notifications (publish only).
export const pubClient = createClient({ url, name: "redis-pub-client" });

export async function publish(channel: RedisArgument, payload: RedisArgument) {
  const delivered = Number(await pubClient.publish(channel, payload));
  return delivered;
}
