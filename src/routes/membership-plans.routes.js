import { Router } from "express";
import { listMembershipPlans } from "../controllers/memberships.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listMembershipPlans));

export default router;
