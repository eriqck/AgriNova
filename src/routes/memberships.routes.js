import { Router } from "express";
import {
  createMembership,
  getMyMemberships,
  handleMembershipPaystackWebhook,
  initializeMembershipPayment,
  verifyMembershipPayment
} from "../controllers/memberships.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", authenticate, asyncHandler(getMyMemberships));
router.post("/", authenticate, requireRoles("FARMER", "BUYER", "ADMIN"), asyncHandler(createMembership));
router.post("/:id/initialize-payment", authenticate, requireRoles("FARMER", "BUYER", "ADMIN"), asyncHandler(initializeMembershipPayment));
router.get("/payments/verify/:reference", authenticate, asyncHandler(verifyMembershipPayment));
router.post("/webhook/paystack", asyncHandler(handleMembershipPaystackWebhook));

export default router;
