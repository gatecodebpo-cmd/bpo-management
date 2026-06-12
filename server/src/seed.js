import mongoose from "mongoose";
import { Order } from "./models/Order.js";
import { ReturnRequest } from "./models/ReturnRequest.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/dashboard_db";

const firstNames = ["Rahul", "Amit", "Vikram", "Suresh", "Deepak", "Ajay", "Manish", "Ravi", "Nitin", "Pankaj", "Sanjay", "Vijay", "Ankit", "Arun", "Karan", "Rohit", "Mohan", "Gaurav", "Harsh", "Yash", "Priya", "Neha", "Pooja", "Anita", "Sunita", "Kavita", "Seema", "Ritu", "Shweta", "Meena", "Rekha", "Asha", "Geeta", "Sarita", "Suman", "Lata", "Usha", "Komal", "Divya", "Shalini"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Yadav", "Jain", "Mishra", "Agarwal", "Saxena", "Chopra", "Malhotra", "Bhatia", "Mehta", "Kapoor", "Sethi", "Bajaj", "Sood", "Arora"];

const productTypes = ["GPS", "Vending Machine", "Disposal", "Other"];
const orderStatuses = ["Pending", "Approved", "Processing", "Delivered", "Cancelled"];
const returnReasons = ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"];
const returnStatuses = ["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMobile = () =>
  `${randInt(6, 9)}${Array.from({ length: 9 }, () => randInt(0, 9)).join("")}`;

const generatePincode = () =>
  `${randInt(1, 9)}${Array.from({ length: 5 }, () => randInt(0, 9)).join("")}`;

const generateDate = (startDaysAgo, endDaysAgo) => {
  const now = Date.now();
  const daysAgo = randInt(startDaysAgo, endDaysAgo);
  return new Date(now - daysAgo * 86400000 - randInt(0, 86400000));
};

const orderDataGen = (i) => {
  const units = randInt(1, 50);
  const perUnitAmount = randInt(500, 15000);
  const totalAmount = units * perUnitAmount;
  const advanceAmount = Math.round(totalAmount * (randInt(10, 100) / 100));
  const productType = rand(productTypes);
  const status = rand(orderStatuses);
  const createdAt = generateDate(0, 180);

  return {
    customerName: `${rand(firstNames)} ${rand(lastNames)}`,
    mobileNumber: generateMobile(),
    fullAddress: `${randInt(1, 999)}, ${rand(["MG Road", "Park Street", "Linking Road", "Sector " + randInt(1, 50), "Gandhi Nagar", "Lake View", "Green Park", "Civil Lines", "Sadar Bazar", "Model Town"])}, ${rand(["Delhi", "Mumbai", "Bangalore", "Pune", "Kolkata", "Chennai", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow"])}`,
    pincode: generatePincode(),
    productType,
    customProductName: productType === "Other" ? `Custom ${rand(["Device", "Equipment", "Part", "Accessory"])} ${randInt(1, 999)}` : "",
    numberOfUnits: units,
    amount: perUnitAmount,
    totalAmount,
    advanceAmount,
    paymentScreenshot: "",
    dateOfOrder: generateDate(1, 90),
    orderStatus: status,
    createdAt,
    updatedAt: createdAt,
  };
};

const returnDataGen = (i) => {
  const productType = rand(productTypes);
  const reason = rand(returnReasons);
  const status = rand(returnStatuses);
  const createdAt = generateDate(0, 120);

  return {
    customerName: `${rand(firstNames)} ${rand(lastNames)}`,
    mobileNumber: generateMobile(),
    pincode: generatePincode(),
    productType,
    numberOfUnitsReturning: randInt(1, 10),
    returnReason: reason,
    customReason: reason === "Other" ? `Custom reason #${randInt(1, 100)}` : "",
    additionalDescription: Math.random() > 0.5 ? `Issue with ${productType.toLowerCase()} — needs replacement` : "",
    returnDate: generateDate(1, 60),
    returnStatus: status,
    createdAt,
    updatedAt: createdAt,
  };
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Order.deleteMany({});
    await ReturnRequest.deleteMany({});

    const orders = Array.from({ length: 1000 }, (_, i) => orderDataGen(i));
    const returns = Array.from({ length: 200 }, (_, i) => returnDataGen(i));

    await Order.insertMany(orders);
    console.log(`Inserted ${orders.length} orders`);

    await ReturnRequest.insertMany(returns);
    console.log(`Inserted ${returns.length} return requests`);

    console.log("Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seed();
