import { Router } from "express";
import {
  handlePaystackWebhook,
  initializePayment,
  verifyPaystackPayment,
  updatePaymentStatus
} from "../controllers/payments.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/initialize", authenticate, requireRoles("BUYER", "ADMIN"), asyncHandler(initializePayment));
router.get("/verify/:reference", authenticate, asyncHandler(verifyPaystackPayment));
router.patch("/:id/status", authenticate, requireRoles("ADMIN"), asyncHandler(updatePaymentStatus));
router.post("/webhook/paystack", asyncHandler(handlePaystackWebhook));

export default router;
