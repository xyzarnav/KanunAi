"""
CLI wrapper to use LegalDocSummarizer for quick summaries.
Usage examples:
  python summarize_cli.py --text "some text"
  python summarize_cli.py --pdf path/to/file.pdf
Outputs JSON to stdout: { "executive_summary": "..." }
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Ensure local imports work when invoked from other cwd
CURRENT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = CURRENT_DIR.parent.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from case_analysis import LegalDocSummarizer  # type: ignore
from langchain.docstore.document import Document  # type: ignore


def main():
    parser = argparse.ArgumentParser(description="Summarize text or a PDF using LegalDocSummarizer")
    parser.add_argument("--text", type=str, help="Raw text to summarize", default=None)
    parser.add_argument("--pdf", type=str, help="Path to PDF to summarize", default=None)
    parser.add_argument("--chunk_size", type=int, default=25)
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "Missing GEMINI_API_KEY env var"}))
        return 1

    summarizer = LegalDocSummarizer(api_key=api_key, cache_dir=str(PROJECT_ROOT / "cache"))

    try:
        if args.pdf:
            pdf_path = args.pdf
            summarizer.load_document(pdf_path)
            summarizer.chunk_document(pages_per_chunk=args.chunk_size)
        elif args.text:
            # Build a single in-memory document and chunk minimally
            summarizer.documents = [Document(page_content=args.text, metadata={"pages": "1", "chunk": 1})]
            summarizer.chunks = summarizer.documents[:]  # single chunk
        else:
            print(json.dumps({"error": "Provide either --text or --pdf"}))
            return 1

        # Only need summaries; skip vector store and QA
        summaries = summarizer.summarize_hierarchical(chunk_summaries_only=False)
        exec_summary = summaries.get("executive_summary", "")
        print(json.dumps({"executive_summary": exec_summary}))
        return 0
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())


