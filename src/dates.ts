// Date formatters shared across the email templates. Kept here (not inlined in a
// template) so the "en-US" formatting lives in one place.

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
