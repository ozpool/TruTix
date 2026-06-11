import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | undefined;

/// Start an in-memory MongoDB and connect Mongoose to it (for tests).
export async function setupDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

/// Disconnect and stop the in-memory MongoDB.
export async function teardownDb(): Promise<void> {
  await mongoose.disconnect();
  await mongod?.stop();
}
