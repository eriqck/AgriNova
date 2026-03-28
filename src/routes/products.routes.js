import { Router } from "express";
import { createProduct, listProducts } from "../controllers/products.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, requireRoles("ADMIN"), asyncHandler(createProduct));
router.get("/", asyncHandler(listProducts));

export default router;
