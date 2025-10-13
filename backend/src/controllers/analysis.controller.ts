import type { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

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

    // Load ai-service .env so GEMINI_API_KEY is available
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const args: string[] = [cliPath];
    if (text) {
      args.push("--text", text, "--quick");
    } else if (file) {
      args.push("--pdf", file.path, "--quick");
    }

    const pythonBin = getPythonExecutable();
    console.log("[summarizer] python=", pythonBin);
    console.log("[summarizer] args=", args.join(" "));

    const child = spawn(pythonBin, args, {
      cwd: aiServiceDir,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      console.error("[summarizer:spawn_error]", err);
      return res.status(500).json({ message: "Failed to start Python process", error: err?.message || String(err) });
    });

    const timeoutMs = Number(process.env.SUMMARY_TIMEOUT_MS || 120000);
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (file) {
        // cleanup temp file
        try { fs.unlinkSync(file.path); } catch {}
      }
      if (code !== 0) {
        let detail: any = stderr || stdout;
        if (stderr) console.error("[summarizer:stderr]", stderr);
        if (stdout) console.error("[summarizer:stdout]", stdout);
        try {
          detail = JSON.parse(String(detail));
        } catch {}
        return res.status(500).json({ message: "Summarizer failed", detail });
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        return res.json({ summary: parsed.executive_summary ?? "" });
      } catch (e) {
        console.error("[summarizer:parse_error]", e);
        console.error("[summarizer:stdout]", stdout);
        console.error("[summarizer:stderr]", stderr);
        return res.status(500).json({ message: "Invalid summarizer output", raw: stdout, stderr: stderr });
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}


