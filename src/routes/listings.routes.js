import { Router } from "express";
import { createListing, getListingById, listListings } from "../controllers/listings.controller.js";
import { uploadListingImages } from "../middleware/upload.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRoles("FARMER", "BUYER", "ADMIN"),
  uploadListingImages,
  asyncHandler(createListing)
);
router.get("/", asyncHandler(listListings));
router.get("/:id", asyncHandler(getListingById));

export default router;
