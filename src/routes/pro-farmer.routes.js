import { Router } from "express";
import {
  downloadReport,
  exportFieldData,
  exportSampleData,
  exportSummaryReport,
  getProFarmerDashboard,
  printReport,
  scheduleRecommendation
} from "../controllers/pro-farmer.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { requireProFarmer } from "../middleware/pro-membership.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRoles("FARMER", "ADMIN"), asyncHandler(requireProFarmer));

router.get("/dashboard", asyncHandler(getProFarmerDashboard));
router.post("/recommendations/:id/schedule", asyncHandler(scheduleRecommendation));
router.get("/exports/fields.csv", asyncHandler(exportFieldData));
router.get("/exports/samples.csv", asyncHandler(exportSampleData));
router.get("/reports/summary/download", asyncHandler(exportSummaryReport));
router.get("/reports/print", asyncHandler(printReport));
router.get("/reports/:id/download", asyncHandler(downloadReport));

export default router;
