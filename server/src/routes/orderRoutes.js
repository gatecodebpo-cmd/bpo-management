import express from "express";
import { createOrder, getOrders, updateOrder, updateOrderStatus } from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadPaymentScreenshot } from "../middleware/uploadMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";
import { createOrderValidator, updateOrderStatusValidator } from "../validators/orderValidators.js";

const router = express.Router();

router.post("/", protect, uploadPaymentScreenshot, createOrderValidator, validateRequest, createOrder);
router.get("/", protect, adminOnly, getOrders);
router.put("/:id", protect, adminOnly, updateOrder);
router.patch("/:id/status", protect, adminOnly, updateOrderStatusValidator, validateRequest, updateOrderStatus);

export default router;
