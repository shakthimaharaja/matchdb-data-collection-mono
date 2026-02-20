import { Router } from "express";
import { aiParseJob } from "../controllers/ai-parse.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, aiParseJob);

export default router;
