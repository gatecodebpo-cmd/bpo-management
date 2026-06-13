import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(['1.1.1.1']);

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

const sanitizeMongoUri = (uri) => {
  try {
    const url = new URL(uri.replace("mongodb+srv://", "mongodb://"));
    const dbName = url.pathname.replace(/^\//, "");
    if (dbName && /\s/.test(decodeURIComponent(dbName))) {
      const cleanDbName = decodeURIComponent(dbName).replace(/\s+/g, "_");
      return uri.replace(/\/[^/]+$/, `/${cleanDbName}`);
    }
  } catch {}
  return uri;
};

export const connectDB = async () => {
  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }
  const mongoUri = sanitizeMongoUri(rawUri);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected");
};
