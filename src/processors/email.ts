import { Job } from "bullmq";
import { resend } from "../resend.js";
import { BookingPayload, GreetingPayload, NotificationType } from "../events.js";
import { bookingEmailHtml } from "../templates/booking-email.js";
import { greetingEmailHtml } from "../templates/greeting-email.js";
import { createProcessor } from "./dispatch.js";

const devMode = Number(process.env.DEV_MODE) === 1;

// Verified sender. dev uses Resend's sandbox address; prod sets a real domain.
const emailFrom = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

// In dev every email is redirected here instead of the real recipient.
const devEmailTo = process.env.DEV_EMAIL_TO ?? "agustisera1@gmail.com";

async function greetUser(job: Job) {
  const payload = job.data as GreetingPayload;
  await resend.emails.send({
    from: emailFrom,
    to: devMode ? devEmailTo : [payload.email], // Just signed up email
    subject: "Welcome to bookings app!",
    html: greetingEmailHtml(payload),
  });
}

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
    from: emailFrom,
    to: devMode ? devEmailTo : [payload.guest.email],
    ...getEmailNotificationPayload(payload),
  });

  if (data) console.info("[notifyBooking]: booking notification sent");
  if (error) {
    console.error("[notifyBooking]: could not send booking notification");
    console.error(error);
  }
}

// Consumes the "emails" queue. Only email jobs are registered here.
export const emailsProcessor = createProcessor("emailsProcessor", {
  "greet-user": greetUser,
  "notify-booking": notifyBooking,
});
