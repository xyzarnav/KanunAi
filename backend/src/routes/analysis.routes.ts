import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { summarizeCase, initQA, chatQA, analyzeTimeline, refactorTimeline } from "../controllers/analysis.controller.js";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

const upload = multer({ dest: uploadsDir });

// Single route for all summary requests
router.post("/summary", upload.single("file"), summarizeCase);

// Initialize QA/vector store (optional file or text or session)
// Use conditional middleware - if Content-Type is application/json, skip multer
router.post("/init-qa", (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    // Skip multer for JSON requests
    next();
  } else {
    // Use multer for form data requests
    upload.single("file")(req, res, next);
  }
}, initQA);

// Chat endpoint
router.post("/chat", chatQA);

// Timeline analysis endpoint
router.post("/timeline", upload.single("file"), analyzeTimeline);

// Refactor timeline context endpoint
router.post("/refactor-timeline", refactorTimeline);

export default router;


