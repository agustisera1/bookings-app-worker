import { createClient } from "redis";
import "dotenv/config";

const client = createClient({
  // Provide the worker username secret
  url: process.env.REDIS_URL,
});

client.on("error", (error) => {
  console.error("Client error", error);
});

client.on("connect", () => {
  console.info("Client listening");
});

await client.connect();
