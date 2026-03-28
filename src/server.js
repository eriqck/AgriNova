import app from "./app.js";
import { pool } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
  try {
    const connection = await pool.getConnection();
    connection.release();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();
