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
    const file = (req as any).file as { path: string } | undefined;
    const analysisType: string | undefined = req.body?.analysisType; // 'case' or 'contract'

    if (!text && !file) {
      return res.status(400).json({ message: "Provide text or upload a file" });
    }

    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    
    // Determine which CLI to use based on analysisType
    const isContractAnalysis = analysisType === 'contract';
    const cliPath = isContractAnalysis 
      ? path.join(aiServiceDir, "contract_analysis_cli.py")
      : path.join(aiServiceDir, "summarize_cli.py");

    // Load ai-service .env so GEMINI_API_KEY is available
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const args: string[] = [cliPath];
    if (text) {
      args.push("--text", text, "--quick");
    } else if (file) {
      args.push("--pdf", file.path, "--quick");
    }

    const pythonBin = getPythonExecutable();
    const logPrefix = isContractAnalysis ? "[contract-analyzer]" : "[summarizer]";
    console.log(`${logPrefix} python=`, pythonBin);
    console.log(`${logPrefix} args=`, args.join(" "));

    const child = spawn(pythonBin, args, {
      cwd: aiServiceDir,
      // Force Python to use UTF-8 for stdout/stderr on Windows (avoids chcp/cp1252 UnicodeEncodeError)
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      console.error(`${logPrefix}:spawn_error`, err);
      return res.status(500).json({ message: "Failed to start Python process", error: err?.message || String(err) });
    });

    const timeoutMs = Number(process.env.SUMMARY_TIMEOUT_MS || 300000); // Increased timeout for contract analysis
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (file) {
        // cleanup temp file
        try { fs.unlinkSync(file.path); } catch {}
      }
      
      // Exit code can be null if process was killed; treat as failure
      const exitCode = code ?? 1;
      
      if (exitCode !== 0) {
        console.error(`${logPrefix}:FAILED Python exited with code`, exitCode);
        if (stderr) console.error(`${logPrefix}:stderr`, stderr);
        if (stdout) console.error(`${logPrefix}:stdout`, stdout);
        // Return both stderr and stdout for debugging
        return res.status(500).json({
          message: "Analysis failed",
          code: exitCode,
          stderr,
          stdout
        });
      }
      
      // Skip empty response
      if (!stdout || stdout.trim() === "") {
        console.error(`${logPrefix}:FAILED No output from Python process`);
        return res.status(500).json({
          message: "Analysis failed - no output",
          code: exitCode,
          stderr,
          stdout: "(empty)"
        });
      }
      
      try {
        const parsed = JSON.parse(stdout.trim());
        
        if (isContractAnalysis) {
          // Contract analysis returns report and summary
          return res.json({
            report: parsed.comprehensive_report ?? "",
            summary: parsed.executive_summary ?? "",
            session: parsed.session
          });
        } else {
          // Case analysis returns summary
          return res.json({ 
            summary: parsed.executive_summary ?? "", 
            session: parsed.session 
          });
        }
      } catch (e) {
        console.error(`${logPrefix}:parse_error`, e);
        console.error(`${logPrefix}:stdout`, stdout);
        console.error(`${logPrefix}:stderr`, stderr);
        return res.status(500).json({ message: "Invalid analysis output", raw: stdout, stderr: stderr });
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}

export async function initQA(req: Request, res: Response) {
  try {
    const { session, text } = req.body || {};
    const pdfPath: string | undefined = (req as any).file?.path;
    if (!session && !text && !pdfPath) {
      return res.status(400).json({ message: "Provide session or text/pdf to initialize" });
    }
    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const cliPath = path.join(aiServiceDir, "qa_cli.py");
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const args: string[] = [cliPath, "--init"]; 
    if (session) args.push("--session", session);
    if (text) args.push("--text", text);
    if (pdfPath) args.push("--pdf", pdfPath);

    const pythonBin = getPythonExecutable();
  const child = spawn(pythonBin, args, { cwd: aiServiceDir, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }, stdio: ["ignore", "pipe", "pipe"] });

    let stdout = ""; let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (pdfPath) { try { fs.unlinkSync(pdfPath); } catch {} }
      if (code !== 0) return res.status(500).json({ message: "Init failed", error: stderr || stdout });
      try { const parsed = JSON.parse(stdout.trim()); return res.json(parsed); }
      catch { return res.status(500).json({ message: "Invalid init output", raw: stdout }); }
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}

export async function chatQA(req: Request, res: Response) {
  try {
    const { session, question, text } = req.body || {};
    const pdfPath: string | undefined = (req as any).file?.path;
    if (!session || !question) {
      return res.status(400).json({ message: "Provide session and question" });
    }
    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const cliPath = path.join(aiServiceDir, "qa_cli.py");
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const args: string[] = [cliPath, "--ask", question, "--session", session];
    if (text) args.push("--text", text);
    if (pdfPath) args.push("--pdf", pdfPath);
    const pythonBin = getPythonExecutable();
  const child = spawn(pythonBin, args, { cwd: aiServiceDir, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (pdfPath) { try { fs.unlinkSync(pdfPath); } catch {} }
      if (code !== 0) return res.status(500).json({ message: "Chat failed", error: stderr || stdout });
      try { const parsed = JSON.parse(stdout.trim()); return res.json(parsed); }
      catch { return res.status(500).json({ message: "Invalid chat output", raw: stdout }); }
    });
  } catch (err: any) {
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}


