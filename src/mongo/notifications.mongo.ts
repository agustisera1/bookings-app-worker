import { WithId } from "mongodb";
import mongo from "./index.js";

export type NotificationDocumentPayload = {
  listing_id: string;
  host_id: string;
  guest_id: string;
  booking_id: string;
  target_id: string;
  title: string;
  body: string;
  is_read: boolean;
};

export type NotificationDocument = WithId<NotificationDocumentPayload>;

async function getCollection() {
  const client = await mongo;
  return client
    .db("notificationsdb")
    .collection<NotificationDocumentPayload>("notifications");
}

export async function insertNotification(
  notification: NotificationDocumentPayload,
) {
  const collection = await getCollection();
  const result = await collection.insertOne(notification);
  return result.insertedId ? result : null;
}
