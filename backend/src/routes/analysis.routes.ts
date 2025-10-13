import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { summarizeCase, summarizeCaseDirect } from "../controllers/analysis.controller.js";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

const upload = multer({ dest: uploadsDir });

// Route for direct API calls (from Next.js)
router.post("/summary", summarizeCaseDirect);

// Route for direct file uploads (if needed)
router.post("/summary-upload", upload.single("file"), summarizeCase);

export default router;


