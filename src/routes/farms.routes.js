import { Router } from "express";
import { createFarm, listFarms } from "../controllers/farms.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, requireRoles("FARMER", "BUYER", "ADMIN"), asyncHandler(createFarm));
router.get("/", asyncHandler(listFarms));

export default router;
