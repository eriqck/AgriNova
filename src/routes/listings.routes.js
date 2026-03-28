import { Router } from "express";
import { createListing, getListingById, listListings } from "../controllers/listings.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, requireRoles("FARMER", "ADMIN"), asyncHandler(createListing));
router.get("/", asyncHandler(listListings));
router.get("/:id", asyncHandler(getListingById));

export default router;
