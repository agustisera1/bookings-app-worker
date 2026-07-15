import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const clientPromise = client.connect();
export default clientPromise;
