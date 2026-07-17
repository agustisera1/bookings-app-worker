import { ObjectId } from "mongodb";
import { WithId } from "mongodb";
import mongo from "./index.js";

export type NotificationDocument = WithId<NotificationDocumentPayload>;
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

type Attributes = Partial<ListingAttributes>;
export type ListingDocument = {
  type: string;
  host_id: string;
  title: string;
  description: string;
  price: number;
  location: ListingLocation;
  attributes?: Attributes;
  photos: string[];
  rating_avg?: number;
};

type ListingAttributes = {
  beds: number;
  bathrooms: number;
  max_guests: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string[];
  minimum_nights: number;
  property_type: string;
};

type ListingLocation = {
  type?: string;
  coordinates?: [number, number];
  city: string;
  country: string;
  address: string;
};

export async function findListingById(listingId: string) {
  const collection = (await mongo)
    .db("listingsdb")
    .collection<ListingDocument>("listings");
  const doc = await collection.findOne({
    _id: new ObjectId(listingId),
  });

  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export async function insertNotification(
  notification: NotificationDocumentPayload,
) {
  const client = await mongo;
  const document = await client
    .db("notificationsdb")
    .collection("notifications")
    .insertOne(notification);

  if (!document.insertedId) return null;
  return document;
}

// Chat message as persisted (app-generated `_id`) and delivered to clients. The
// booking's id doubles as `chat_id`.
export type MessageDocument = {
  _id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  timestamp: string; // ISO string
};

// Persist a chat message. Mongo is the source of truth for the thread, so the
// socket flow stores here before delivering. TODO: write to the messages
// collection and return the insert result (null on failure).
export async function insertMessage(message: MessageDocument) {
  // const client = await mongo;
  // const document = await client
  //   .db("chatdb")
  //   .collection("messages")
  //   .insertOne(message);
  // if (!document.insertedId) return null;
  // return document;
  console.info("[insertMessage]: TODO persist message", message._id);
  return message; // stub: pretend the write succeeded so the flow proceeds
}
