// Shared types, formatters and email templates.

// Currency the totals are priced in. Not part of the queue payload, so it lives
// here as a single source of truth until the schema carries it.
const DEFAULT_CURRENCY = "USD";

export type ListingLocation = {
  address?: string;
  city?: string;
  country?: string;
};

type Booking = {
  id: string;
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  guests: number;
  totalPrice: number;
};

// The lifecycle stage the notification is announcing. Drives both the subject
// line and the copy variations in the email template.
export type NotificationType = "pending" | "approved" | "rejected" | "updated";

// Mirrors BookingEmailPayload enqueued by the API: only the fields the email
// template renders, not the full domain entities.
export type BookingPayload = {
  processorKey: "notify-booking";
  type?: NotificationType;
  guest: { email: string };
  booking: Booking;
  host: { name: string };
  listing: { title: string; location: ListingLocation };
};

// Per-type copy. Kept intentionally simple: only the header, status pill and
// intro paragraph change; the booking detail grid is shared across all types.
const notificationCopy: Record<
  NotificationType,
  { heading: string; status: string; intro: (host: string) => string }
> = {
  pending: {
    heading: "Booking Received",
    status: "Status: Pending confirmation",
    intro: (host) =>
      `Your reservation is being processed. We'll notify you as soon as <strong>${host}</strong> verifies the payment and details to confirm your stay.`,
  },
  approved: {
    heading: "Booking Confirmed",
    status: "Status: Approved",
    intro: (host) =>
      `Great news — <strong>${host}</strong> has confirmed your reservation. Your stay is all set.`,
  },
  rejected: {
    heading: "Booking Declined",
    status: "Status: Rejected",
    intro: (host) =>
      `Unfortunately, <strong>${host}</strong> could not confirm your reservation. Any payment made will be refunded.`,
  },
  updated: {
    heading: "Booking Updated",
    status: "Status: Updated",
    intro: (host) =>
      `Your reservation details have been updated by <strong>${host}</strong>. Please review the information below.`,
  },
};

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function nightsBetween(checkIn: Date | string, checkOut: Date | string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatAddress(location: ListingLocation) {
  return [location.address, location.city, location.country]
    .filter(Boolean)
    .join(", ");
}

export function bookingEmailHtml(
  { guest, booking, host, listing }: BookingPayload,
  type: NotificationType = "updated",
) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(booking.totalPrice);

  const guestName = guest.email.split("@")[0];
  const propertyAddress = formatAddress(listing.location);
  const copy = notificationCopy[type];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${copy.heading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border:1px solid #111111;">
            <!-- Header -->
            <tr>
              <td style="background-color:#111111;padding:28px 40px;">
                <h1 style="margin:0;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;font-weight:600;">${copy.heading}</h1>
              </td>
            </tr>

            <!-- Intro -->
            <tr>
              <td style="padding:40px 40px 24px 40px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Hi ${guestName},</p>
                <p style="margin:0;font-size:16px;line-height:1.6;color:#333333;">
                  ${copy.intro(host.name)}
                </p>
              </td>
            </tr>

            <!-- Status pill -->
            <tr>
              <td style="padding:0 40px 32px 40px;">
                <span style="display:inline-block;padding:8px 16px;border:1px solid #111111;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#111111;">${copy.status}</span>
              </td>
            </tr>

            <!-- Property -->
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dddddd;border-bottom:1px solid #dddddd;">
                  <tr>
                    <td style="padding:24px 0;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888888;">Property</p>
                      <p style="margin:0;font-size:18px;font-weight:600;color:#111111;">${listing.title}</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#555555;">${propertyAddress}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Dates grid -->
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding:24px 16px 24px 0;border-bottom:1px solid #dddddd;vertical-align:top;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888888;">Check-in</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${formatDate(booking.checkIn)}</p>
                    </td>
                    <td width="50%" style="padding:24px 0 24px 16px;border-bottom:1px solid #dddddd;border-left:1px solid #dddddd;vertical-align:top;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888888;">Check-out</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${formatDate(booking.checkOut)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="50%" style="padding:24px 16px 24px 0;border-bottom:1px solid #dddddd;vertical-align:top;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888888;">Nights</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${nights}</p>
                    </td>
                    <td width="50%" style="padding:24px 0 24px 16px;border-bottom:1px solid #dddddd;border-left:1px solid #dddddd;vertical-align:top;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888888;">Guests</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${booking.guests}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Total -->
            <tr>
              <td style="padding:32px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#aaaaaa;">Total</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">${total}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Reference -->
            <tr>
              <td style="padding:0 40px 40px 40px;">
                <p style="margin:0;font-size:13px;color:#888888;">
                  Booking reference: <span style="color:#111111;font-family:'Courier New',monospace;letter-spacing:1px;">${booking.id}</span>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f4f4f4;padding:24px 40px;border-top:1px solid #dddddd;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#999999;">
                  This is an automated message. Please do not reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
