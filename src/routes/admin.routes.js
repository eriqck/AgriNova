import { Router } from "express";
import {
  getAdminOverview,
  listUsersForAdmin,
  updateUserForAdmin
} from "../controllers/admin.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRoles("ADMIN"));

router.get("/overview", asyncHandler(getAdminOverview));
router.get("/users", asyncHandler(listUsersForAdmin));
router.patch("/users/:id", asyncHandler(updateUserForAdmin));

export default router;
