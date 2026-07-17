import { ListingLocation } from "./events.js";

// Currency the totals are priced in. Not part of the queue payload, so it lives
// here as a single source of truth until the schema carries it.
const DEFAULT_CURRENCY = "USD";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(amount);
}

export function formatAddress(location: ListingLocation) {
  return [location.address, location.city, location.country]
    .filter(Boolean)
    .join(", ");
}
