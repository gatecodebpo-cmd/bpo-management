import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", protect, getCustomers);
router.post("/", protect, createCustomer);
router.put("/:id", protect, updateCustomer);
router.delete("/:id", protect, deleteCustomer);

export default router;
