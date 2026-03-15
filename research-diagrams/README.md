# Research Paper Diagrams

This directory contains Python scripts to generate all diagrams, tables, and figures for the research paper **"AI-Powered Virtual Legal Assistant: A Retrieval-Augmented Generation Approach for Legal Document Analysis"**.

## 📋 Contents

### Diagrams Generated

1. **system_architecture.png/.pdf** - Complete 3-tier system architecture
2. **rag_workflow.png/.pdf** - End-to-end RAG pipeline visualization
3. **table_performance_metrics.png/.pdf** - Performance metrics table
4. **table_rag_comparison.png/.pdf** - RAG vs Standalone LLM comparison
5. **table_cost_analysis.png/.pdf** - Cost analysis breakdown
6. **data_flow_diagram.png/.pdf** - Request-response flow with caching
7. **flow_case_analysis.png/.pdf** - Case analysis workflow
8. **flow_contract_analysis.png/.pdf** - Contract analysis workflow

## 🚀 Quick Start

### Installation

```bash
# Install required packages
pip install -r requirements.txt
```

### Generate All Diagrams

**Option 1: Run the master script**
```bash
python generate_all.py
```

**Option 2: Run individual scripts**
```bash
python 1_system_architecture.py
python 2_rag_workflow.py
python 3_performance_tables.py
python 4_data_flow.py
python 5_process_flows.py
```

## 📊 Diagram Details

### 1. System Architecture (`1_system_architecture.py`)
- **Purpose**: Shows the 3-tier architecture (Frontend, Backend, AI Service)
- **Highlights**: Component details, data flow, supported features
- **Format**: 14x10 inches, suitable for full-page or double-column

### 2. RAG Workflow (`2_rag_workflow.py`)
- **Purpose**: Visualizes the complete RAG pipeline
- **Stages**: Document ingestion → Chunking → Embedding → Vector indexing → Query → Retrieval → Generation
- **Format**: 16x10 inches, detailed step-by-step process

### 3. Performance Tables (`3_performance_tables.py`)
Generates three tables:
- **Table I**: System Performance Metrics
- **Table II**: RAG vs Standalone LLM Comparison
- **Table III**: Cost Analysis

### 4. Data Flow Diagram (`4_data_flow.py`)
- **Purpose**: Shows complete request-response cycle
- **Features**: Caching strategy, timing annotations, Q&A flow
- **Format**: 14x11 inches, comprehensive flow

### 5. Process Flow Diagrams (`5_process_flows.py`)
Generates two workflows:
- **Case Analysis**: Hierarchical summarization process
- **Contract Analysis**: Clause-level detailed analysis

## 📝 Using in LaTeX

### For IEEE Conference Papers

```latex
% Add to preamble
\usepackage{graphicx}

% Include in document
\begin{figure}[htbp]
\centerline{\includegraphics[width=\columnwidth]{system_architecture.pdf}}
\caption{System Architecture of AI-Powered Virtual Legal Assistant}
\label{fig:architecture}
\end{figure}

% For tables
\begin{figure}[htbp]
\centerline{\includegraphics[width=\columnwidth]{table_performance_metrics.pdf}}
\caption{System Performance Metrics}
\label{table:performance}
\end{figure}
```

### For Two-Column Layouts

```latex
% Full-width figure spanning both columns
\begin{figure*}[htbp]
\centerline{\includegraphics[width=\textwidth]{rag_workflow.pdf}}
\caption{Complete RAG Workflow Pipeline}
\label{fig:rag_workflow}
\end{figure*}
```

## 🎨 Customization

Each script can be modified to adjust:
- **Colors**: Change the color scheme variables at the top
- **Size**: Modify `figsize=(width, height)` parameter
- **Content**: Edit text, boxes, and annotations
- **DPI**: Change `dpi=300` for higher/lower resolution

Example:
```python
# In any script, modify:
fig, ax = plt.subplots(1, 1, figsize=(14, 10))  # Adjust size
plt.savefig('output.png', dpi=300)  # Adjust DPI
```

## 📦 Output Formats

Each diagram is generated in two formats:
- **PNG**: For presentations, web, and preview (300 DPI)
- **PDF**: For LaTeX inclusion (vector format, scales perfectly)

**Recommendation**: Use PDF files in your LaTeX document for best quality.

## 🔧 Dependencies

- matplotlib >= 3.8.2
- numpy >= 1.26.2
- seaborn >= 0.13.0 (optional, for enhanced styling)
- pandas >= 2.1.4 (for table handling)

## 💡 Tips

1. **File Size**: PDF files are vector-based and scale without quality loss
2. **Colors**: All diagrams use colorblind-friendly palettes
3. **Resolution**: PNG files are 300 DPI, suitable for print
4. **Modification**: Scripts are heavily commented for easy customization

## 📖 Citation in Paper

Example references to figures:
```
As shown in Figure 1, the system follows a three-tier architecture...
The RAG workflow (Figure 2) demonstrates the complete pipeline from...
Table I presents the comprehensive performance metrics...
The data flow diagram (Figure 3) illustrates the caching strategy...
```

## 🐛 Troubleshooting

**Issue: "No module named 'matplotlib'"**
```bash
pip install matplotlib numpy
```

**Issue: Figures appear blurry in PDF**
- Use the PDF output files, not PNG
- Ensure you're using `\includegraphics[width=\columnwidth]{file.pdf}`

**Issue: Fonts look different**
```python
# Add to any script before plotting:
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman']
```

## 📞 Support

For modifications or questions about the diagrams, refer to the inline comments in each script.

---

**Note**: This is a standalone diagram generation project. It does not affect the main KanunAI application codebase.
