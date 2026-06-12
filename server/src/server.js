import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureFixedAdminUser } from "./config/seedAdmin.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await ensureFixedAdminUser();
  } catch (error) {
    console.error("MongoDB unavailable. Starting API without database:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
