import { Router } from "express";
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus
} from "../controllers/orders.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, asyncHandler(listOrders));
router.post("/", authenticate, requireRoles("BUYER", "FARMER", "ADMIN"), asyncHandler(createOrder));
router.get("/:id", authenticate, asyncHandler(getOrderById));
router.patch("/:id/status", authenticate, asyncHandler(updateOrderStatus));

export default router;
