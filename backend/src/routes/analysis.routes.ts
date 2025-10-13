import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { summarizeCase } from "../controllers/analysis.controller.js";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

const upload = multer({ dest: uploadsDir });

router.post("/summary", upload.single("file"), summarizeCase);

export default router;


