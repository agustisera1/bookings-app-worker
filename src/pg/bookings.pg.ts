import { Booking, query } from "./index.js";

export async function findBookingById(id: string): Promise<Booking | null> {
  const result = await query<Booking>(`SELECT * FROM bookings WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] ?? null;
}
