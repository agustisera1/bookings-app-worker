import { MongoClient, ServerApiVersion } from "mongodb";

type Attributes = Partial<ListingAttributes>;
export type ListingDocumentValues = {
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

const client = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const clientPromise = client.connect();
export default clientPromise;
