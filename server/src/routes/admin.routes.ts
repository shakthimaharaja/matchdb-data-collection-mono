import { Router } from "express";
import { listUsers, adminStats } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/users", listUsers);
router.get("/stats", adminStats);

export default router;
