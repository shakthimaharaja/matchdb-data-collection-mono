import app from "./app.js";
import { connectDB } from "./config/mongoose.js";
import { env } from "./config/env.js";

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`✓ Data Collection API → http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
