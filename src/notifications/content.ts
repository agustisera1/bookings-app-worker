import { InAppNotificationType } from "../events.js";

// Title/body copy per in-app notification type. The titles carry the keywords
// the in-app list keys its icon off of (see `notificationVisual` in the web
// app's notifications-list.tsx): "confirm" → the confirmation glyph, and so on.
// Types with no natural UI category fall back to the generic bell.
export const notificationContent: Record<
  InAppNotificationType,
  { title: string; body: (listingTitle: string) => string; isRead: boolean }
> = {
  notify_booking_update: {
    title: "Booking confirmed",
    body: (listing) => `There's an update on your booking for "${listing}".`,
    isRead: false,
  },
  notify_user: {
    title: "New notification",
    body: (listing) => `You have a new update related to "${listing}".`,
    isRead: false,
  },
  mark_as_read: {
    title: "Notification read",
    body: (listing) => `Your notification for "${listing}" was marked as read.`,
    isRead: true,
  },
};
