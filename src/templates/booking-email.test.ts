import { describe, expect, it } from "vitest";
import type { Booking, BookingPayload } from "../events.js";
import { bookingEmailHtml } from "./booking-email.js";

const base: BookingPayload = {
  processorKey: "notify-booking",
  type: "updated",
  guest: { email: "jane.doe@example.com" },
  booking: { id: "BK-1", checkIn: "2026-08-01", checkOut: "2026-08-04", guests: 2, totalPrice: 1000 },
  host: { name: "Carlos" },
  listing: { title: "Loft Centro", location: { address: "Av 1", city: "BA", country: "AR" } },
};

function withBooking(extra: Partial<Booking>): BookingPayload {
  return { ...base, booking: { ...base.booking, ...extra } };
}

describe("bookingEmailHtml", () => {
  it("renders the shared booking details", () => {
    const html = bookingEmailHtml(base, "pending");
    expect(html).toContain("Booking Received");
    expect(html).toContain("Hi jane.doe,");
    expect(html).toContain("Carlos");
    expect(html).toContain("Loft Centro");
    expect(html).toContain("Av 1, BA, AR");
    expect(html).toContain(">3</p>"); // nights
    expect(html).toContain("$1,000.00");
    expect(html).toContain("BK-1");
  });

  it("selects the heading and intro per lifecycle type", () => {
    const html = bookingEmailHtml(base, "approved");
    expect(html).toContain("Booking Confirmed");
    expect(html).toContain("confirmed your reservation");
  });

  it("shows a refund block and line when a cancellation refunds", () => {
    const html = bookingEmailHtml(
      withBooking({ refundAmount: 500, cancelledBy: "host" }),
      "cancelled",
    );
    expect(html).toContain("Booking Cancelled");
    expect(html).toContain("has cancelled your reservation");
    expect(html).toContain("A refund of");
    expect(html).toContain("$500.00");
    expect(html).toContain(">Refund</p>");
  });

  it("omits the refund block when there is nothing to refund", () => {
    const html = bookingEmailHtml(
      withBooking({ refundAmount: 0, cancelledBy: "guest" }),
      "cancelled",
    );
    expect(html).toContain("Your cancellation is confirmed");
    expect(html).toContain("not eligible for a refund");
    expect(html).not.toContain(">Refund</p>");
  });

  it("renders a reason block only for types that carry one", () => {
    const approved = bookingEmailHtml(withBooking({ statusReason: "Payment verified" }), "approved");
    expect(approved).toContain("Note from host");
    expect(approved).toContain("Payment verified");

    const pending = bookingEmailHtml(withBooking({ statusReason: "Some reason" }), "pending");
    expect(pending).not.toContain("Some reason");
  });
});
