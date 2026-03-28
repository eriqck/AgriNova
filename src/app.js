import path from "node:path";
import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const jsonParser = express.json();
const rawParser = express.raw({ type: "application/json" });

app.use(cors());
app.use((req, res, next) => {
  if (req.path.startsWith("/api/v1/payments/webhook/paystack")) {
    return rawParser(req, res, next);
  }

  return jsonParser(req, res, next);
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/v1", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
