import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getEmployeePerformance,
  getEmployeeHistory
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/employee-performance", protect, adminOnly, getEmployeePerformance);
router.get("/employee-history", protect, adminOnly, getEmployeeHistory);

export default router;
