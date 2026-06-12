import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getEmployeeDashboard,
  getEmployeeOrdersHistory,
  getEmployeeReturnsHistory,
  getEmployeeCallingRecords,
  createEmployeeCallingRecord,
  updateEmployeeCallingRecord
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/dashboard", protect, getEmployeeDashboard);
router.get("/orders", protect, getEmployeeOrdersHistory);
router.get("/returns", protect, getEmployeeReturnsHistory);
router.get("/calling-records", protect, getEmployeeCallingRecords);
router.post("/calling-records", protect, createEmployeeCallingRecord);
router.put("/calling-records/:id", protect, updateEmployeeCallingRecord);

export default router;
