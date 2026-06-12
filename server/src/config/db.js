import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(['1.1.1.1']);

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected");
};
