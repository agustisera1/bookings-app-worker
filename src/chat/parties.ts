import * as bookingsRepo from "../pg/bookings.pg.js";
import * as listingsRepo from "../mongo/listings.mongo.js";

// The two sides of a booking's conversation. Guest comes off the booking row;
// host comes off the listing the booking points at, because ownership lives in
// Mongo. Kept in one place because both the join authorization and the message
// flow need the same answer — asking it twice is how the two drift.
export type ChatParties = { guest_id: string; host_id: string };

export async function findChatParties(
  bookingId: string,
): Promise<ChatParties | null> {
  const booking = await bookingsRepo.findBookingById(bookingId);
  if (!booking) return null;

  const listing = await listingsRepo.findListingById(booking.listing_id);
  if (!listing) return null;

  return { guest_id: booking.guest_id, host_id: listing.host_id };
}

/** Whether `userId` is one of the two parties to this booking. */
export function isParty(parties: ChatParties, userId: string): boolean {
  return parties.guest_id === userId || parties.host_id === userId;
}
