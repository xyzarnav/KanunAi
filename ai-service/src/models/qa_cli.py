"""
QA CLI for LegalDocSummarizer chat.

Usage:
  # Initialize QA/vector store for a session (returns {ready:true, session})
  python qa_cli.py --init --session <cache_key>

  # Alternatively compute session from inputs and init
  python qa_cli.py --init --pdf path/to/file.pdf
  python qa_cli.py --init --text "some content"

  # Ask a question using an existing session
  python qa_cli.py --ask "What are the key holdings?" --session <cache_key>

Stdout returns JSON only.
"""

import os
import sys
import json
import argparse
import hashlib
from pathlib import Path

CURRENT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = CURRENT_DIR.parent.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from case_analysis import LegalDocSummarizer  # type: ignore
from langchain.docstore.document import Document  # type: ignore
from langchain_community.document_loaders import PyPDFLoader  # type: ignore


def compute_session_key(pdf: str | None, text: str | None) -> str:
    cache_base = PROJECT_ROOT / "cache"
    if pdf:
        try:
            st = os.stat(pdf)
            cache_key_src = f"pdf:{pdf}:{st.st_mtime_ns}:{st.st_size}"
        except Exception:
            cache_key_src = f"pdf:{pdf}"
    else:
        cache_key_src = f"text:{text or ''}"
    return hashlib.sha1(cache_key_src.encode("utf-8", errors="ignore")).hexdigest()


def ensure_vectorstore(session: str, api_key: str, pdf: str | None, text: str | None) -> bool:
    cache_dir = str(PROJECT_ROOT / "cache" / session)
    # If FAISS index exists, assume ready
    vs_dir = Path(cache_dir) / "vectorstore"
    if vs_dir.exists():
        return True
    # Build from available inputs
    summarizer = LegalDocSummarizer(api_key=api_key, cache_dir=cache_dir)
    if pdf:
        summarizer.load_document(pdf)
        summarizer.chunk_document(pages_per_chunk=25)
    elif text:
        summarizer.documents = [Document(page_content=text, metadata={"pages": "1", "chunk": 1})]
        summarizer.chunks = summarizer.documents[:]
    else:
        # Try to load pre-cached chunks
        chunks_cache = Path(cache_dir) / "chunks.pkl"
        docs_cache = Path(cache_dir) / f"{Path(pdf or 'input').stem}_docs.pkl"
        try:
            import pickle
            if chunks_cache.exists():
                with open(chunks_cache, 'rb') as f:
                    summarizer.chunks = pickle.load(f)
            elif docs_cache.exists():
                with open(docs_cache, 'rb') as f:
                    summarizer.documents = pickle.load(f)
                summarizer.chunks = summarizer.documents[:]
        except Exception:
            pass
    if not summarizer.chunks and not summarizer.documents:
        return False
    try:
        summarizer.create_vector_store()
        summarizer.setup_qa_chain()
        return True
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="QA helper for LegalDocSummarizer")
    parser.add_argument("--init", action="store_true", help="Initialize vector store and QA chain")
    parser.add_argument("--ask", type=str, default=None, help="Question to ask")
    parser.add_argument("--session", type=str, default=None, help="Session/cache key")
    parser.add_argument("--pdf", type=str, default=None, help="Path to PDF")
    parser.add_argument("--text", type=str, default=None, help="Raw text")
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY", "")
    session = args.session or compute_session_key(args.pdf, args.text)

    if args.init:
        print("[qa_cli] Initializing vectorstore...", file=sys.stderr)
        ready = ensure_vectorstore(session=session, api_key=api_key, pdf=args.pdf, text=args.text)
        print(json.dumps({"ready": bool(ready), "session": session}))
        return 0 if ready else 1

    if args.ask:
        print(f"[qa_cli] QA for session: {session}", file=sys.stderr)
        cache_dir = str(PROJECT_ROOT / "cache" / session)
        summarizer = LegalDocSummarizer(api_key=api_key, cache_dir=cache_dir)
        # Try loading an existing vectorstore; if not present, attempt to create from caches
        vs_dir = Path(cache_dir) / "vectorstore"
        if vs_dir.exists():
            print("[qa_cli] Loading FAISS vectorstore...", file=sys.stderr)
            from langchain_community.vectorstores import FAISS  # type: ignore
            try:
                summarizer.vectorstore = FAISS.load_local(str(vs_dir), summarizer.embeddings, allow_dangerous_deserialization=True)
            except Exception as e:
                print(f"[qa_cli] Failed to load FAISS: {e}", file=sys.stderr)
        if not summarizer.vectorstore:
            print("[qa_cli] Building vectorstore from cache...", file=sys.stderr)
            ensure_vectorstore(session=session, api_key=api_key, pdf=args.pdf, text=args.text)

        summarizer.setup_qa_chain()
        result = summarizer.ask(args.ask)
        print(json.dumps(result))
        return 0

    print(json.dumps({"error": "Provide --init or --ask"}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
