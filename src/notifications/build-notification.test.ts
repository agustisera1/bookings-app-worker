import { describe, expect, it } from "vitest";
import type { NotificationJobPayload } from "../events.js";
import { buildNotification } from "./build-notification.js";
import { notificationContent } from "./content.js";

type Listing = Parameters<typeof buildNotification>[1];

function listing(
  overrides: Partial<{ _id: string; host_id: string; title: string }> = {},
): Listing {
  return {
    _id: "L-mongo",
    host_id: "H1",
    title: "Cabaña del Lago",
    ...overrides,
  } as unknown as Listing;
}

describe("buildNotification", () => {
  it("maps the payload and resolved listing into a notification document", () => {
    const payload: NotificationJobPayload = {
      processorKey: "send-notification",
      type: "notify_booking_update",
      listingId: "L1",
      bookingId: "B1",
      userId: "U1",
    };
    const content = notificationContent.notify_booking_update;

    expect(buildNotification(payload, listing())).toEqual({
      listing_id: "L-mongo",
      host_id: "H1",
      guest_id: "U1",
      booking_id: "B1",
      target_id: "U1",
      title: content.title,
      body: content.body("Cabaña del Lago"),
      is_read: content.isRead,
    });
  });

  it("carries the already-read flag through from the copy", () => {
    const payload: NotificationJobPayload = {
      processorKey: "send-notification",
      type: "mark_as_read",
      listingId: "L1",
      bookingId: "B1",
      userId: "U1",
    };
    expect(buildNotification(payload, listing()).is_read).toBe(true);
  });
});
