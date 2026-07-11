import { Job } from "bullmq";
import { resend } from "./resend.js";
import { BookingPayload, NotificationType, bookingEmailHtml } from "./lib.js";

// Mailing processors
type JobKey = "greet-user" | "notify-booking";
type Processor = typeof greetUser | typeof notifyBooking;

async function greetUser(job: Job) {}

const devMode = Number(process.env.DEV_MODE) === 1;

const subjects: Record<NotificationType, string> = {
  approved: "Reservation approved",
  pending: "Reservation pending",
  rejected: "Reservation rejected",
  updated: "Reservation updated",
};

function getNotificationPayload(
  data: BookingPayload,
  type: NotificationType = "updated",
) {
  return {
    subject: `${subjects[type]}: ${data.listing.title}`,
    html: bookingEmailHtml(data, type),
  };
}

async function notifyBooking(job: Job) {
  const payload = job.data as BookingPayload;

  const { data, error } = await resend.emails.send({
    ...(devMode
      ? { from: "onboarding@resend.dev", to: "agustisera1@gmail.com" }
      : { from: "onboarding@resend.dev", to: [payload.guest.email] }),
    to: "agustisera1@gmail.com", // Use dev
    ...getNotificationPayload(payload, payload.type),
  });

  if (data) console.info("[notifyBooking]: booking notification sent");
  if (error) {
    console.error("[notifyBooking]: could not send booking notification");
    console.error(error);
  }
}

const processors: Record<JobKey, Processor> = {
  "greet-user": greetUser,
  "notify-booking": notifyBooking,
};

export async function emailsProcessor(job: Job) {
  try {
    const processor = processors[job.data.processorKey as JobKey];
    if (!processor) {
      throw new Error("[emailsProcessor]: Invalid job processor");
    }
    await processor(job);
  } catch (error) {
    console.error("[emailsProcessor]:", job.name, "failed with error", error);
  }
}

// Messaging processors
// ...
