import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in the .env file");
}

const options = {};

let client;
let clientPromise: Promise<MongoClient>;

// Check if Mongo URI is provided
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

// Use this if we're in development mode
if (process.env.NODE_ENV === "development") {
  // Create a type-safe globalWithMongo object
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise: Promise<MongoClient>;
  };

  // Check if the global client promise already exists
  if (!globalWithMongo._mongoClientPromise) {
    // If not, create a new MongoClient and store the promise in the global variable
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, just create a new client and connect directly
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export { clientPromise };
