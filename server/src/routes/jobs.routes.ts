import { Router } from "express";
import multer from "multer";
import {
  createJob,
  createBulkJobs,
  listJobs,
  deleteJob,
  getStats,
  uploadExcel,
} from "../controllers/jobs.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth, requireRole("job_uploader"));

router.get("/", listJobs);
router.get("/stats", getStats);
router.post("/", createJob);
router.post("/bulk", createBulkJobs);
router.post("/upload", upload.single("file"), uploadExcel);
router.delete("/:id", deleteJob);

export default router;
