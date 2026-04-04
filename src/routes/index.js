import { Router } from "express";
import deliveriesRoutes from "./deliveries.routes.js";
import farmsRoutes from "./farms.routes.js";
import healthRoutes from "./health.routes.js";
import listingsRoutes from "./listings.routes.js";
import membershipPlansRoutes from "./membership-plans.routes.js";
import membershipsRoutes from "./memberships.routes.js";
import ordersRoutes from "./orders.routes.js";
import paymentsRoutes from "./payments.routes.js";
import productsRoutes from "./products.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", usersRoutes);
router.use("/membership-plans", membershipPlansRoutes);
router.use("/memberships", membershipsRoutes);
router.use("/farms", farmsRoutes);
router.use("/products", productsRoutes);
router.use("/listings", listingsRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/deliveries", deliveriesRoutes);

export default router;
