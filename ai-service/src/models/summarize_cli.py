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
from contextlib import redirect_stdout
import argparse
from pathlib import Path
import hashlib
import os

# Ensure local imports work when invoked from other cwd
CURRENT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = CURRENT_DIR.parent.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from case_analysis import LegalDocSummarizer  # type: ignore
from langchain.docstore.document import Document  # type: ignore
from langchain_community.document_loaders import PyPDFLoader  # type: ignore


def main():
    parser = argparse.ArgumentParser(description="Summarize text or a PDF using LegalDocSummarizer")
    parser.add_argument("--text", type=str, help="Raw text to summarize", default=None)
    parser.add_argument("--pdf", type=str, help="Path to PDF to summarize", default=None)
    parser.add_argument("--chunk_size", type=int, default=25)
    parser.add_argument("--quick", action="store_true", help="Skip heavy executive summary API call and return fast summary")
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY")
    fallback_local_only = False
    if not api_key:
        # Fallback to a naive local summarizer so the UI keeps working
        fallback_local_only = True

    try:
        # Redirect all progress prints from the library to stderr so stdout stays JSON-only
        # Build a per-input cache directory so different inputs don't reuse old summaries
        cache_base = PROJECT_ROOT / "cache"
        if args.pdf:
            try:
                st = os.stat(args.pdf)
                # Add FORCE_CACHE_BUST=timestamp to force new summaries for testing
                cache_bust = os.environ.get("FORCE_CACHE_BUST", "")
                cache_key_src = f"pdf:{args.pdf}:{st.st_mtime_ns}:{st.st_size}:{cache_bust}"
            except Exception:
                cache_key_src = f"pdf:{args.pdf}"
        else:
            cache_bust = os.environ.get("FORCE_CACHE_BUST", "")
            cache_key_src = f"text:{args.text or ''}:{cache_bust}"
        cache_key = hashlib.sha1(cache_key_src.encode("utf-8", errors="ignore")).hexdigest()
        cache_dir = str(cache_base / cache_key)

        if not fallback_local_only:
            with redirect_stdout(sys.stderr):
                summarizer = LegalDocSummarizer(api_key=api_key, cache_dir=cache_dir)

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
                # Ensure we don't reuse any previous summaries cache inside this cache dir
                try:
                    summaries_cache = Path(cache_dir) / "summaries.pkl"
                    if summaries_cache.exists():
                        summaries_cache.unlink()
                except Exception:
                    pass

                if args.quick:
                    summaries = summarizer.summarize_hierarchical(chunk_summaries_only=True)
                    # Build a proper executive summary from chunk summaries
                    chunks = summaries.get("chunk_summaries", [])
                    if chunks:
                        exec_summary = summarizer.generate_executive_summary_from_chunks(chunks)
                    else:
                        exec_summary = "No summary could be generated."
                else:
                    summaries = summarizer.summarize_hierarchical(chunk_summaries_only=False)
                    exec_summary = summaries.get("executive_summary", "")

                # Build and cache vector store for chat/QA (LOCAL embeddings only)
                try:
                    summarizer.create_vector_store()
                except Exception as ve:
                    # Don't fail the summary if vector store fails; chat can attempt init later
                    print(f"[warn] vectorstore creation failed: {ve}", file=sys.stderr)
        else:
            # Naive local fallback: extract text and truncate
            text_data = ""
            if args.pdf:
                try:
                    # Check file type and load accordingly
                    file_path = Path(args.pdf)
                    if file_path.suffix.lower() == '.pdf':
                        # Load PDF content
                        loader = PyPDFLoader(args.pdf)
                        docs = loader.load()
                        text_data = "\n\n".join(d.page_content for d in docs)
                    else:
                        # Load as text file
                        with open(args.pdf, 'r', encoding='utf-8') as f:
                            text_data = f.read()
                except Exception as e:
                    print(json.dumps({"error": f"File load error: {e}"}))
                    return 1
            elif args.text:
                text_data = args.text
            else:
                print(json.dumps({"error": "Provide either --text or --pdf"}))
                return 1

            snippet = text_data.strip()
            if len(snippet) > 2000:
                snippet = snippet[:2000] + "..."
            exec_summary = (
                "[Local fallback summary]\n\n" +
                "This is a quick extract of the beginning of the provided content. "
                "Add GEMINI_API_KEY in ai-service/.env to enable full AI summarization.\n\n" +
                snippet
            )

        # Print pure JSON to stdout, include session key for follow-up QA/chat initialization
        print(json.dumps({"executive_summary": exec_summary, "session": cache_key}))
        return 0
    except Exception as e:
        # Print JSON error on stdout; logs went to stderr inside redirect_stdout scope
        print(json.dumps({"error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())


