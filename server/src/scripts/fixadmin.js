import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(['1.1.1.1']);
dotenv.config();

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error("MONGO_URI missing"); process.exit(1); }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const adminEmail = process.env.ADMIN_EMAIL || "uttam306115@gmail.com";

  const existing = await db.collection("users").findOne({ email: adminEmail });
  if (existing) {
    console.log("Found user:", existing.email, "current role:", existing.role);
    await db.collection("users").updateOne(
      { email: adminEmail },
      { $set: { role: "admin" } }
    );
    console.log("Updated role to admin");
  } else {
    console.log("Admin user not found in DB — creating it");
    const bcrypt = await import("bcryptjs");
    const password = process.env.ADMIN_PASSWORD || "uttam@2004";
    const hashed = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      name: process.env.ADMIN_NAME || "Uttam Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
      phoneNumber: "",
      username: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Created admin user with role: admin");
  }

  console.log("--- Checking employees and records ---");
  const employees = await db.collection("users").find({ role: "employee" }).toArray();
  console.log("Employees found:", employees.length);
  employees.forEach(e => console.log("  -", e.name, e.email, "| id:", e._id));

  const empRecords = await db.collection("employeerecords").find({}).toArray();
  console.log("EmployeeRecords found:", empRecords.length);
  empRecords.forEach(r => console.log("  -", r.employeeName, r.type, r.description));

  await mongoose.disconnect();
  console.log("Done");
};

run().catch(e => { console.error(e); process.exit(1); });
