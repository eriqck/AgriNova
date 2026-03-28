import { Router } from "express";
import { getUserById, loginUser, registerUser } from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));
router.get("/:id", authenticate, asyncHandler(getUserById));

export default router;
