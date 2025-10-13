import type { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

function getPythonExecutable(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  // Fallback to ai-service venv python on Windows
  const projectRoot = path.resolve(process.cwd(), "..");
  const winPy = path.join(projectRoot, "ai-service", "venv", "Scripts", "python.exe");
  if (fs.existsSync(winPy)) return winPy;
  // Generic fallback
  return process.platform === "win32" ? "python" : "python3";
}

export async function summarizeCase(req: Request, res: Response) {
  try {
    const text: string | undefined = req.body?.text;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!text && !file) {
      return res.status(400).json({ message: "Provide text or upload a file" });
    }

    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const cliPath = path.join(aiServiceDir, "summarize_cli.py");

    const args: string[] = [cliPath];
    if (text) {
      args.push("--text", text);
    } else if (file) {
      args.push("--pdf", file.path);
    }

    const pythonBin = getPythonExecutable();

    const child = spawn(pythonBin, args, {
      cwd: aiServiceDir,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (code) => {
      if (file) {
        // cleanup temp file
        try { fs.unlinkSync(file.path); } catch {}
      }
      if (code !== 0) {
        return res.status(500).json({ message: "Summarizer failed", error: stderr || stdout });
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        return res.json({ summary: parsed.executive_summary ?? "" });
      } catch (e) {
        return res.status(500).json({ message: "Invalid summarizer output", error: stdout });
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}


