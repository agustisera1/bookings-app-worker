import { describe, expect, it } from "vitest";
import { notificationContent } from "./content.js";

describe("notificationContent", () => {
  it("provides confirmed copy for a booking update (unread)", () => {
    const c = notificationContent.notify_booking_update;
    expect(c.title).toBe("Booking confirmed");
    expect(c.isRead).toBe(false);
    expect(c.body("Cabaña")).toBe('There\'s an update on your booking for "Cabaña".');
  });

  it("marks the read-receipt copy as already read", () => {
    const c = notificationContent.mark_as_read;
    expect(c.title).toBe("Notification read");
    expect(c.isRead).toBe(true);
    expect(c.body("Cabaña")).toBe('Your notification for "Cabaña" was marked as read.');
  });

  it("provides generic copy for a plain user notification", () => {
    const c = notificationContent.notify_user;
    expect(c.title).toBe("New notification");
    expect(c.isRead).toBe(false);
    expect(c.body("Cabaña")).toBe('You have a new update related to "Cabaña".');
  });
});
