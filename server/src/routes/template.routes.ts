import { Router } from "express";
import { downloadTemplate } from "../controllers/template.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Both job_uploader and candidate_uploader can download their template
router.get("/:type", requireAuth, downloadTemplate);

export default router;
