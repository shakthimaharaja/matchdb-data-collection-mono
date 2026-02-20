import { Router } from "express";
import multer from "multer";
import {
  createCandidate,
  createBulkCandidates,
  listCandidates,
  deleteCandidate,
  getStats,
  uploadExcel,
} from "../controllers/candidates.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth, requireRole("candidate_uploader"));

router.get("/", listCandidates);
router.get("/stats", getStats);
router.post("/", createCandidate);
router.post("/bulk", createBulkCandidates);
router.post("/upload", upload.single("file"), uploadExcel);
router.delete("/:id", deleteCandidate);

export default router;
