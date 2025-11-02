import type { Request, Response } from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";
import crypto from "node:crypto";

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
          // Format detailed analysis from chunk_analyses array
          const chunkAnalyses = parsed.detailed_analysis ?? [];
          const formattedDetailedAnalysis = chunkAnalyses
            .map((chunk: any) => `## Section ${chunk.chunk_num} (Pages ${chunk.pages})\n\n${chunk.analysis}`)
            .join('\n\n---\n\n');
          
          return res.json({
            summary: parsed.executive_summary ?? "",
            detailed: formattedDetailedAnalysis,
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

export async function analyzeTimeline(req: Request, res: Response) {
  let responseSent = false;
  let timer: NodeJS.Timeout | null = null;
  let filePath: string | null = null;
  
  const sendResponse = (status: number, data: any) => {
    if (responseSent) {
      console.warn("[timeline-analyzer]: Response already sent, ignoring duplicate response");
      return;
    }
    responseSent = true;
    if (timer) clearTimeout(timer);
    
    // Cleanup file after a short delay to ensure it's not in use
    if (filePath) {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupErr) {
          // Ignore cleanup errors
        }
      }, 1000);
    }
    
    res.status(status).json(data);
  };

  try {
    const file = (req as any).file as { path: string } | undefined;

    if (!file) {
      return sendResponse(400, { message: "Upload a PDF file to analyze timeline" });
    }

    filePath = file.path;

    // Verify file exists and is readable
    try {
      if (!fs.existsSync(filePath)) {
        return sendResponse(400, { message: "Uploaded file not found" });
      }
      // Try to access file to ensure it's readable
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (fileErr: any) {
      console.error("[timeline-analyzer]: File access error", fileErr);
      return sendResponse(400, { message: "Cannot access uploaded file", error: fileErr?.message });
    }

    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const outputDir = path.join(projectRoot, "ai-service", "src", "output");
    
    const cliPath = path.join(aiServiceDir, "timeline_cli.py");

    // Verify CLI script exists
    if (!fs.existsSync(cliPath)) {
      return sendResponse(500, { message: "Timeline analysis service not available", error: "CLI script not found" });
    }

    const args: string[] = [cliPath, "--pdf", filePath, "--output", outputDir];

    const pythonBin = getPythonExecutable();
    const logPrefix = "[timeline-analyzer]";
    console.log(`${logPrefix} python=`, pythonBin);
    console.log(`${logPrefix} args=`, args.join(" "));

    const child = spawn(pythonBin, args, {
      cwd: aiServiceDir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let processEnded = false;

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("error", (err) => {
      if (processEnded) return;
      processEnded = true;
      console.error(`${logPrefix}:spawn_error`, err);
      sendResponse(500, { 
        message: "Failed to start Python process", 
        error: err?.message || String(err) 
      });
    });

    const timeoutMs = Number(process.env.TIMELINE_TIMEOUT_MS || process.env.SUMMARY_TIMEOUT_MS || 180000); // 3 minutes default
    timer = setTimeout(() => {
      if (processEnded) return;
      processEnded = true;
      console.error(`${logPrefix}:TIMEOUT after ${timeoutMs}ms`);
      try { 
        child.kill('SIGKILL'); 
      } catch (killErr) {
        // Ignore kill errors
      }
      
      // Wait a bit for process to die, then send timeout response
      setTimeout(() => {
        sendResponse(500, {
          message: "Timeline analysis timed out",
          error: `Process exceeded ${timeoutMs}ms timeout`,
          stderr: stderr.substring(0, 500),
          stdout: stdout.substring(0, 500)
        });
      }, 100);
    }, timeoutMs);

    child.on("close", (code) => {
      if (processEnded) return;
      processEnded = true;
      
      const exitCode = code ?? 1;
      
      // Try to parse even if exit code is non-zero (sometimes Python exits with non-zero but produces valid output)
      if (!stdout || stdout.trim() === "") {
        console.error(`${logPrefix}:FAILED No output from Python process (exit code: ${exitCode})`);
        if (stderr) console.error(`${logPrefix}:stderr`, stderr);
        sendResponse(500, {
          message: "Timeline analysis failed - no output",
          code: exitCode,
          stderr: stderr.substring(0, 1000),
          stdout: "(empty)"
        });
        return;
      }
      
      try {
        // Try to extract JSON even if there's extra output
        let jsonStr = stdout.trim();
        // Find JSON object in output (in case there's debug output before/after)
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr);
        console.log(`${logPrefix}:parsed_result`, JSON.stringify(parsed, null, 2));
        
        if (!parsed.success) {
          console.error(`${logPrefix}:not_successful`, parsed.error);
          sendResponse(400, {
            message: "No dates found in document",
            error: parsed.error,
            events: []
          });
          return;
        }
        
        const eventCount = parsed.events?.length || 0;
        console.log(`${logPrefix}:returning_events`, eventCount);
        
        if (eventCount === 0) {
          console.warn(`${logPrefix}:no_events_found`);
        }
        
        sendResponse(200, {
          events: parsed.events || [],
          summary: parsed.summary || {}
        });
      } catch (e: any) {
        console.error(`${logPrefix}:parse_error`, e);
        console.error(`${logPrefix}:stdout (first 500 chars)`, stdout.substring(0, 500));
        console.error(`${logPrefix}:stderr (first 500 chars)`, stderr.substring(0, 500));
        
        // If exit code is 0 but we can't parse, it's a parsing issue
        // If exit code is non-zero, it's likely an execution error
        sendResponse(500, { 
          message: exitCode === 0 ? "Invalid timeline output format" : "Timeline analysis failed",
          error: e?.message || String(e),
          raw: stdout.substring(0, 1000),
          stderr: stderr.substring(0, 1000),
          code: exitCode
        });
      }
    });
  } catch (err: any) {
    if (!responseSent) {
      sendResponse(500, { 
        message: "Server error", 
        error: err?.message || String(err) 
      });
    }
  }
}

export async function refactorTimeline(req: Request, res: Response) {
  try {
    const { context, parsed_date, maxLength = 3 } = req.body;

    if (!context) {
      return res.status(400).json({ message: "Context is required" });
    }

    // Simple in-memory cache to avoid repeated identical refactor requests
    // Keyed by sha1(contextJSON) - keeps results for short-lived dev server lifetime
    // Note: persistent cache (redis) is recommended for production
    const refactorCache: Map<string, any> = (global as any).__REFRACTOR_CACHE ||= new Map();

    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const cliPath = path.join(aiServiceDir, "refactor_timeline_cli.py");

    // Load ai-service .env for GEMINI_API_KEY
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const pythonBin = getPythonExecutable();
    const logPrefix = "[refactor-timeline]";

    console.log(`${logPrefix} Refactoring context for date: ${parsed_date}...`);

    // Normalize context into a timeline array. The frontend may send:
    // - a raw array of events
    // - an object { events: [...] }
    // - or a string (already serialized)
    let timeline: any[] = [];
    try {
      if (Array.isArray(context)) {
        timeline = context;
      } else if (typeof context === 'object' && context !== null) {
        if (Array.isArray(context.events)) timeline = context.events;
        else if (Array.isArray((context as any).timeline)) timeline = (context as any).timeline;
        else timeline = [context];
      } else if (typeof context === 'string') {
        // Try to parse JSON string
        const parsedString = JSON.parse(context);
        if (Array.isArray(parsedString)) timeline = parsedString;
        else if (Array.isArray(parsedString.events)) timeline = parsedString.events;
        else if (Array.isArray(parsedString.timeline)) timeline = parsedString.timeline;
        else timeline = [parsedString];
      }
    } catch (e) {
      // Fall back to wrapping raw string as single event
      timeline = [{ summary: String(context) }];
    }

    // If empty timeline, respond early
    if (!timeline || timeline.length === 0) {
      return res.status(400).json({ message: 'No timeline events to refactor', events: [] });
    }

    // Compute cache key
    const cacheKey = crypto.createHash('sha1').update(JSON.stringify({ timeline, parsed_date, maxLength })).digest('hex');
    if (refactorCache.has(cacheKey)) {
      console.log(`${logPrefix} cache hit for key ${cacheKey}`);
      return res.json({ refactored: refactorCache.get(cacheKey), original: context, parsed_date });
    }

    return new Promise((resolve) => {
      const pythonProcess = spawn(pythonBin, [cliPath], {
        cwd: aiServiceDir,
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (exitCode) => {
        if (exitCode !== 0) {
          console.error(`${logPrefix} Python failed with code`, exitCode);
          if (stderr) console.error(`${logPrefix} stderr:`, stderr);
          // If the Python process failed due to rate limiting or external API errors,
          // fall back to returning the original context but do not cache the failure.
          return resolve(res.status(500).json({
            message: "Refactoring failed",
            error: stderr,
            refactored: context // Fallback to original
          }));
        }

        if (!stdout) {
          console.error(`${logPrefix} No output from Python`);
          return resolve(res.status(500).json({
            message: "No output",
            refactored: context // Fallback to original
          }));
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          const refactored = parsed.refactored || parsed.timeline || parsed || context;
          console.log(`${logPrefix} Success, refactored length:`, Array.isArray(refactored) ? refactored.length : (String(refactored).length));

          // Cache successful refactor for short-term reuse
          try { refactorCache.set(cacheKey, refactored); } catch {}

          return resolve(res.json({
            refactored,
            original: context,
            parsed_date: parsed_date  // Echo back date
          }));
        } catch (e) {
          console.error(`${logPrefix} Parse error:`, e);
          // Return original context as fallback
          return resolve(res.json({
            refactored: context, // Fallback
            error: "Parse error"
          }));
        }
      });

      // Write JSON input to Python CLI including parsed_date
      // Pass the normalized timeline array so the Python CLI will process all events in one batch
      pythonProcess.stdin.write(JSON.stringify({
        timeline,
        parsed_date,  // NEW: Pass the parsed date
        maxLength
      }));
      pythonProcess.stdin.end();
    });
  } catch (error) {
    console.error("[refactor-timeline] Error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}

export async function searchPrecedents(req: Request, res: Response) {
  try {
    const { summary } = req.body;
    
    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return res.status(400).json({ message: "Case summary is required" });
    }

    const projectRoot = path.resolve(process.cwd(), "..");
    const aiServiceDir = path.join(projectRoot, "ai-service", "src", "models");
    const cliPath = path.join(aiServiceDir, "precedent_search_cli.py");

    if (!fs.existsSync(cliPath)) {
      return res.status(500).json({ 
        message: "Precedent search service not available",
        precedents: []
      });
    }

    // Load ai-service .env
    dotenv.config({ path: path.join(projectRoot, "ai-service", ".env") });

    const pythonBin = getPythonExecutable();
    const logPrefix = "[precedent-search]";

    return new Promise<void>((resolve) => {
      const pythonProcess = spawn(pythonBin, [cliPath], {
        cwd: aiServiceDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`${logPrefix} stderr:`, data.toString());
      });

      pythonProcess.on('close', (exitCode) => {
        if (exitCode !== 0) {
          console.error(`${logPrefix} Python failed with code`, exitCode);
          return resolve(res.status(500).json({
            message: "Precedent search failed",
            error: stderr,
            precedents: []
          }));
        }

        if (!stdout) {
          console.error(`${logPrefix} No output from Python`);
          return resolve(res.status(500).json({
            message: "No output from precedent search",
            precedents: []
          }));
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          const precedents = parsed.precedents || [];
          
          console.log(`${logPrefix} Found ${precedents.length} precedents`);
          
          return resolve(res.json({
            precedents: precedents.slice(0, 5), // Ensure max 5
            count: precedents.length
          }));
        } catch (e) {
          console.error(`${logPrefix} Parse error:`, e);
          return resolve(res.status(500).json({
            message: "Failed to parse precedent search results",
            error: String(e),
            precedents: []
          }));
        }
      });

      // Write JSON input to Python CLI
      pythonProcess.stdin.write(JSON.stringify({ summary }));
      pythonProcess.stdin.end();
    });
  } catch (error) {
    console.error("[precedent-search] Error:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error),
      precedents: []
    });
  }
}