import "dotenv/config";
import { createClient } from "redis";
import { Worker, createNodeRedisClient } from "bullmq";
import { emailsProcessor } from "./processors.js";

export const client = createClient({
  // Provide the worker username secret
  url: process.env.REDIS_URL,
});

client.on("error", (error) => {
  console.error("[redis-client]:", error);
});

client.on("connect", () => {
  console.info("[redis-client]: client connected");
});

// Ensure queue name matching with .env variables
export const worker = new Worker("emails", emailsProcessor, {
  connection: createNodeRedisClient(client),
});
