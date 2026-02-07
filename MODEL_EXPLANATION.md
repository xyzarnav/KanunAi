# 🤖 **Model Architecture Explanation**

## **Which Model Are You Using?**

### **Embedding Model (Vector Creation)**
**Model Name:** `sentence-transformers/all-MiniLM-L6-v2`

**Details:**
- **Type:** Local transformer model (runs on your CPU)
- **Provider:** HuggingFace / Sentence Transformers
- **Size:** ~80MB (lightweight)
- **Dimensions:** 384-dimensional vectors
- **Purpose:** Converts text into numerical vectors (embeddings)
- **Cost:** FREE - runs locally, no API calls!

### **LLM Model (Text Generation)**
**Model Name:** `gemini-2.5-flash` (Google Gemini)

**Details:**
- **Type:** Large Language Model (cloud-based API)
- **Provider:** Google Generative AI
- **Purpose:** Generates summaries and answers questions
- **Cost:** Paid API (but we minimize usage with smart caching)

---

## **How Vectors Work**

### **What is an Embedding/Vector?**

An embedding is a numerical representation of text that captures semantic meaning.

**Example:**
```
Original Text: "The Supreme Court ordered payment of maintenance"
↓
Embedding Model Processes
↓
Vector: [0.23, -0.45, 0.67, 0.12, ..., 0.89]  (384 numbers)
```

### **Why Vectors?**

Similar texts produce similar vectors, allowing:
- **Semantic Search** - Find relevant content even if exact words don't match
- **Similarity Measurement** - Calculate how similar two texts are
- **Fast Retrieval** - Search through millions of documents quickly

**Example:**
```
Text 1: "Court ordered maintenance payment"
Text 2: "Judge directed financial support"
Text 3: "Weather forecast for tomorrow"

Text 1 and Text 2 → Similar vectors (similar meaning)
Text 1 and Text 3 → Different vectors (different topics)
```

---

## **Complete Process Flow**

### **Step 1: Document Loading**
```python
# File: case_analysis.py → load_document()
PDF → PyPDFLoader → List of Document objects (one per page)
```

**Cache Storage:**
- **File:** `{filename}_docs.pkl`
- **Contains:** List of Document objects with page content
- **Format:** Pickle (binary Python object serialization)

### **Step 2: Chunking**
```python
# File: case_analysis.py → chunk_document()
Pages → Group into chunks (25 pages each) → List of Chunk Documents
```

**What's in a chunk:**
- Combined text from 25 pages
- Metadata: `{pages: "1-25", chunk: 1}`

**Cache Storage:**
- **File:** `chunks.pkl`
- **Contains:** List of chunk Document objects
- **Format:** Pickle

### **Step 3: Creating Embeddings (Vectorization)**

```python
# File: case_analysis.py → create_vector_store()
Chunks → Embedding Model → Vectors → FAISS Index
```

**Process:**
1. Takes each chunk of text
2. Passes it through `all-MiniLM-L6-v2` model
3. Model converts text to 384-dimensional vector
4. Stores vector + original text in FAISS database

**Example:**
```
Chunk 1: "The case involved maintenance..." 
  → Vector: [0.12, -0.34, 0.56, ..., 0.78]
  → Stored with original text

Chunk 2: "The court held that..."
  → Vector: [0.23, -0.45, 0.67, ..., 0.89]
  → Stored with original text
```

**Cache Storage:**
- **Directory:** `vectorstore/`
- **Contains:**
  - `index.faiss` - Vector index (fast search structure)
  - `index.pkl` - Metadata mapping (text + page numbers)
- **Format:** FAISS binary format (Facebook AI Similarity Search)

### **Step 4: Summarization**

```python
# File: case_analysis.py → summarize_hierarchical()
Chunks → Gemini API (per chunk) → Chunk Summaries → Executive Summary
```

**Process:**
1. Each chunk sent to Gemini API for summarization
2. Chunk summaries combined and grouped
3. Final executive summary generated
4. Cached for reuse

**Cache Storage:**
- **File:** `summaries.pkl`
- **Contains:** Dictionary with chunk summaries and executive summary
- **Format:** Pickle

---

## **How Retrieval Works (Chatbot/QA)**

### **When User Asks a Question:**

```python
# File: case_analysis.py → ask(question)
```

**Step-by-Step:**

1. **Convert Question to Vector:**
   ```
   User Question: "What did the court decide about maintenance?"
   ↓
   Embedding Model
   ↓
   Question Vector: [0.15, -0.32, 0.48, ..., 0.71]
   ```

2. **Similarity Search in FAISS:**
   ```
   Question Vector → Compare with all stored vectors
   ↓
   Calculate Cosine Similarity (angle between vectors)
   ↓
   Find top 3 most similar chunks
   ```

3. **Retrieve Relevant Context:**
   ```python
   retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
   docs = retriever.get_relevant_documents(question)
   # Returns: Top 3 chunks most similar to question
   ```

4. **Generate Answer:**
   ```
   Context (top 3 chunks) + Question → Gemini API → Answer
   ```

### **Why This Works:**

- **Semantic Understanding:** Doesn't just match keywords
- **Context Retrieval:** Finds relevant sections even with different wording
- **Accuracy:** Uses actual document content, not just model knowledge

**Example:**
```
Question: "What maintenance amount was ordered?"
↓
Vector similarity search finds:
  - Chunk mentioning "Rs. 15,000 per month"
  - Chunk mentioning "maintenance order"
  - Chunk mentioning "payment directed"
↓
Gemini generates answer using these chunks
```

---

## **Cache Structure**

### **Directory Layout:**
```
ai-service/cache/{session_hash}/
├── {filename}_docs.pkl          # Original pages
├── chunks.pkl                    # Document chunks (25 pages each)
├── vectorstore/                  # FAISS vector database
│   ├── index.faiss              # Vector index (for fast search)
│   └── index.pkl                # Metadata (text + page numbers)
└── summaries.pkl                 # Generated summaries
```

### **What Each Cache File Contains:**

1. **`{filename}_docs.pkl`**
   - **Content:** List of Document objects (one per page)
   - **Used for:** Quick reloading of PDF pages
   - **Size:** ~1-5MB per 100 pages

2. **`chunks.pkl`**
   - **Content:** List of chunk Document objects
   - **Used for:** Regenerating vector store or summaries
   - **Size:** Similar to docs (slightly larger due to metadata)

3. **`vectorstore/` directory**
   - **`index.faiss`:** Binary FAISS index
     - Contains: All 384-dim vectors for each chunk
     - Purpose: Fast similarity search
     - Size: ~500KB - 2MB (depends on document size)
   - **`index.pkl`:** Metadata mapping
     - Contains: Links vectors to original text chunks
     - Purpose: Retrieve actual text after vector search
     - Size: ~1-5MB

4. **`summaries.pkl`**
   - **Content:** Dictionary with summaries
     ```python
     {
       "chunk_summaries": ["Summary 1", "Summary 2", ...],
       "group_summaries": [...],
       "executive_summary": "Final summary..."
     }
     ```
   - **Used for:** Quick display without regeneration
   - **Size:** ~10-50KB

---

## **Vector Similarity Explained**

### **How Similarity is Calculated:**

**Cosine Similarity Formula:**
```
similarity = (Vector1 · Vector2) / (|Vector1| × |Vector2|)
```

**Example:**
```
Question Vector: [0.5, 0.3, 0.8, ...]
Chunk Vector:   [0.4, 0.35, 0.75, ...]

Cosine Similarity = 0.92 (92% similar)

→ This chunk is highly relevant!
```

**Distance-Based Search:**
- FAISS uses efficient algorithms (like IVF, HNSW)
- Finds nearest neighbors in high-dimensional space
- Returns top K most similar chunks

---

## **Key Design Decisions**

### **1. Why Local Embeddings?**
- **Cost:** FREE (no API costs)
- **Speed:** Instant (no network latency)
- **Privacy:** Data stays local
- **Scalability:** Can process unlimited documents

### **2. Why FAISS?**
- **Fast:** Optimized for similarity search
- **Efficient:** Handles millions of vectors
- **Memory-friendly:** Indexed structure
- **Industry standard:** Used by Facebook, Google, etc.

### **3. Why Chunking?**
- **Context Limits:** LLMs have token limits
- **Focused Summaries:** Better summaries per section
- **Retrieval:** Easier to find specific topics
- **Performance:** Smaller chunks = faster processing

### **4. Why Caching?**
- **Speed:** Avoids reprocessing same documents
- **Cost:** Avoids unnecessary API calls
- **Consistency:** Same document = same results
- **User Experience:** Instant responses on repeat queries

---

## **Performance Characteristics**

### **Embedding Generation:**
- **Speed:** ~0.1-0.5 seconds per chunk (CPU)
- **Memory:** ~200MB RAM
- **Storage:** ~500KB per 100 chunks in FAISS

### **Vector Search:**
- **Speed:** <10ms for top-3 search (even with 1000s of chunks)
- **Algorithm:** Approximate Nearest Neighbor (ANN)
- **Accuracy:** ~95% of exact search speed

### **Caching Benefits:**
- **First Load:** 30-60 seconds (embedding + summarization)
- **Subsequent Loads:** <1 second (from cache)
- **Chatbot Queries:** 2-5 seconds (retrieval + generation)

---

## **Technical Stack Summary**

| Component | Technology | Purpose | Cost |
|-----------|-----------|---------|------|
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 | Text → Vectors | FREE (local) |
| **Vector Store** | FAISS (Facebook) | Store & Search Vectors | FREE |
| **LLM** | Gemini 2.5 Flash | Generate Text | Paid API |
| **Caching** | Pickle + FAISS files | Speed Optimization | FREE |
| **PDF Processing** | PyPDF | Extract Text | FREE |

---

## **Real-World Example**

**Input:** 100-page Supreme Court judgment PDF

**Processing:**
1. Load → 100 Document objects (1 per page)
2. Chunk → 4 chunks (25 pages each)
3. Embed → 4 vectors (384-dim each)
4. Store → FAISS index with 4 entries
5. Summarize → 4 chunk summaries → 1 executive summary

**Storage:**
- Documents: ~2MB (pickle)
- Chunks: ~2MB (pickle)
- Vector Store: ~50KB (FAISS index)
- Summaries: ~20KB (pickle)
- **Total:** ~4MB cached

**Query Time:**
- Question → Embed (0.1s) → Search (0.01s) → Generate (2-5s)
- **Total:** ~2-5 seconds

---

This architecture provides **fast, accurate, cost-effective** document analysis! 🚀

