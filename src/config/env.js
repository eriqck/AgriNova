import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "smart_agriculture",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL || "",
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co"
};
