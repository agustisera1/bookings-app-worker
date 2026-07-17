import { Job } from "bullmq";
import { NotificationJobPayload } from "../events.js";
import { findListingById, insertNotification } from "../mongo/repository.js";
import { findUserById } from "../pg/repository.js";
import { channels, publish } from "../redis/client.js";
import { buildNotification } from "../notifications/build-notification.js";
import { createProcessor } from "./dispatch.js";

async function sendNotification(job: Job) {
  const payload = job.data as NotificationJobPayload;
  const [user, listing] = await Promise.all([
    findUserById(payload.userId),
    findListingById(payload.listingId),
  ]);
  if (!user || !listing) {
    throw new Error(
      "[sendNotification]: Could not retrieve user or listing for the specified notification params",
    );
  }

  const notification = buildNotification(payload, listing);

  // Persist first (Mongo is the source of truth), then fan out. If the insert
  // fails we never publish, so a live client can't receive an event the DB
  // lacks — on refetch it would just vanish.
  const inserted = await insertNotification(notification);
  if (!inserted) {
    throw new Error("[sendNotification]: Failed to persist notification");
  }

  await publish(
    channels.notifications(notification.target_id),
    JSON.stringify(notification),
  );
}

// Consumes the "notifications" queue. Only notification jobs are registered here.
export const notificationsProcessor = createProcessor("notificationsProcessor", {
  "send-notification": sendNotification,
});
