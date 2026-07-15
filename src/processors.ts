import { Job } from "bullmq";
import { resend } from "./resend.js";
import {
  BookingPayload,
  GreetingPayload,
  NotificationJobPayload,
  NotificationType,
  bookingEmailHtml,
  greetingEmailHtml,
  notificationContent,
} from "./lib.js";
import { findListingById, insertNotification } from "./mongo/repository.js";
import { findUserById } from "./pg/repository.js";
import { channels, publish } from "./redis/client.js";

// Mailing processors
type JobKey = "greet-user" | "notify-booking" | "send-notification";
type Processor =
  | typeof greetUser
  | typeof notifyBooking
  | typeof sendNotification;

async function greetUser(job: Job) {
  const payload = job.data as GreetingPayload;
  await resend.emails.send({
    from: devMode ? "onboarding@resend.dev" : "bookings@app.com", // Swap out to a real verified domain in deployed | prod environment
    to: devMode ? "agustisera1@gmail.com" : [payload.email], // Just signed up email
    subject: "Welcome to bookings app!",
    html: greetingEmailHtml(payload),
  });
}

const devMode = Number(process.env.DEV_MODE) === 1;

const subjects: Record<NotificationType, string> = {
  approved: "Reservation approved",
  pending: "Reservation pending",
  rejected: "Reservation rejected",
  updated: "Reservation updated",
  cancelled: "Reservation cancelled",
};

function getEmailNotificationPayload(data: BookingPayload) {
  return {
    subject: `${subjects[data.type]}: ${data.listing.title}`,
    html: bookingEmailHtml(data, data.type),
  };
}

// Every booking email flows through here; `payload.type` selects the lifecycle
// copy (pending / approved / rejected / updated).
async function notifyBooking(job: Job) {
  const payload = job.data as BookingPayload;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: devMode ? "agustisera1@gmail.com" : [payload.guest.email],
    ...getEmailNotificationPayload(payload),
  });

  if (data) console.info("[notifyBooking]: booking notification sent");
  if (error) {
    console.error("[notifyBooking]: could not send booking notification");
    console.error(error);
  }
}

export async function sendNotification(job: Job) {
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

  const content = notificationContent[payload.type];
  const notification = {
    listing_id: listing._id, // The listing linked from listingsDb.listings
    host_id: listing.host_id,
    guest_id: payload.userId, // The user the notification is about
    booking_id: payload.bookingId,
    target_id: payload.userId, // The logged in user that should grab this notification
    title: content.title,
    body: content.body(listing.title),
    is_read: content.isRead,
  };

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

export async function emailsProcessor(job: Job) {
  try {
    const processor = processors[job.data.processorKey as JobKey];
    if (!processor) {
      throw new Error("[emailsProcessor]: Invalid job processor");
    }
    await processor(job);
  } catch (error) {
    console.error("[emailsProcessor]:", job.name, "failed with error", error);
    throw error; // re-throw so BullMQ marks the job failed and retries it
  }
}

export async function notificationsProcessor(job: Job) {
  try {
    const processor = processors[job.data.processorKey as JobKey];
    if (!processor) {
      throw new Error("[notificationsProcessor]: Invalid job processor");
    }
    await processor(job);
  } catch (error) {
    console.error(
      "[notificationsProcessor]:",
      job.name,
      "failed with error",
      error,
    );
    throw error; // re-throw so BullMQ marks the job failed and retries it
  }
}

// Messaging processors
// ...
const processors: Record<JobKey, Processor> = {
  "greet-user": greetUser,
  "notify-booking": notifyBooking,
  "send-notification": sendNotification,
};
