import { ObjectId } from "mongodb";
import mongo from "./index.js";

type Attributes = Partial<ListingAttributes>;

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

async function getCollection() {
  const client = await mongo;
  return client.db("listingsdb").collection<ListingDocument>("listings");
}

export async function findListingById(listingId: string) {
  const collection = await getCollection();
  const document = await collection.findOne({ _id: new ObjectId(listingId) });
  // Project the ObjectId `_id` to a string so callers get a plain shape, never
  // a raw driver document.
  if (!document) return null;
  return { ...document, _id: document._id.toString() };
}
