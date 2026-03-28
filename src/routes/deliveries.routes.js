import { Router } from "express";
import { createDelivery, updateDeliveryStatus } from "../controllers/deliveries.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, requireRoles("ADMIN", "TRANSPORTER"), asyncHandler(createDelivery));
router.patch("/:id/status", authenticate, requireRoles("ADMIN", "TRANSPORTER"), asyncHandler(updateDeliveryStatus));

export default router;
