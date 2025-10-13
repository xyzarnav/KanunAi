import { Router } from "express";
import multer from "multer";
import { summarizeCase } from "../controllers/analysis.controller.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/summary", upload.single("file"), summarizeCase);

export default router;


