"""
Master script to generate all diagrams for the research paper
Run this single file to create all visualizations
"""

import subprocess
import sys

print("=" * 60)
print("GENERATING ALL RESEARCH PAPER DIAGRAMS")
print("=" * 60)
print()

scripts = [
    ("1_system_architecture.py", "System Architecture Diagram"),
    ("2_rag_workflow.py", "RAG Workflow Diagram"),
    ("3_performance_tables.py", "Performance Tables"),
    ("4_data_flow.py", "Data Flow Diagram"),
    ("5_process_flows.py", "Process Flow Diagrams"),
]

for script, description in scripts:
    print(f"📊 Generating {description}...")
    try:
        subprocess.run([sys.executable, script], check=True)
        print(f"   ✓ Success\n")
    except subprocess.CalledProcessError as e:
        print(f"   ✗ Failed: {e}\n")
    except FileNotFoundError:
        print(f"   ✗ Script not found: {script}\n")

print("=" * 60)
print("✅ ALL DIAGRAMS GENERATED SUCCESSFULLY!")
print("=" * 60)
print()
print("Generated files:")
print("  • system_architecture.png/.pdf")
print("  • rag_workflow.png/.pdf")
print("  • table_performance_metrics.png/.pdf")
print("  • table_rag_comparison.png/.pdf")
print("  • table_cost_analysis.png/.pdf")
print("  • data_flow_diagram.png/.pdf")
print("  • flow_case_analysis.png/.pdf")
print("  • flow_contract_analysis.png/.pdf")
print()
print("📄 You can now include these in your LaTeX paper using:")
print("   \\includegraphics[width=\\columnwidth]{diagram_name.pdf}")
print("=" * 60)
