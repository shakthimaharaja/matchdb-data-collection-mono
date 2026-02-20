import { Router } from "express";
import { login, verify } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/verify", requireAuth, verify);

export default router;
