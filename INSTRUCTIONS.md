# AI Governance Risk Scanner — User Instructions

---
### 2. What This Tool Does
This tool acts as an independent auditor for AI workflow designs. It scans proposed workflows to detect systemic fragility, missing oversight, single points of failure, or over-reliance on automated outputs without human verification.

---
### 3. Role in the Ecosystem
- **Phase:** Phase 2 — Governance Pipeline
- **Role:** Independent audit of workflow fragility and governance gaps.
- **Reference:** [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---
### 4. When to Use This Tool
- When a new AI workflow is proposed and requires institutional approval.
- Before launching any high-stakes AI process (e.g., student assessment support).
- To independently verify that the risk controls outlined by a design team are actually robust.

---
### 5. Inputs
- A JSON workflow specification document, strictly produced by the AI Workflow Governance Designer.

---
### 6. How to Use (Step-by-Step)
1. Obtain the exported JSON file from the Workflow Designer.
2. Upload the file into the Risk Scanner interface.
3. The scanner will independently calculate the risk profile, explicitly ignoring self-reported "design-time" risk metrics.
4. Review the generated audit report, paying close attention to critical alerts or vulnerabilities.
5. Review the "Contribution Weights" under each signal to understand why a process was flagged.
6. Use the suggested mitigations to demand improvements from the workflow designers.

---
### 7. Key Outputs
- An independent audit report highlighting missing controls, automation bias risks, and accountability gaps.
- Actionable mitigation recommendations.

---
### 8. How It Connects to Other Tools
- **Upstream:** Strictly consumes output documents from the **AI Workflow Governance Designer**.
- **Downstream:** Findings must be addressed before the process can be deployed and tracked via the **Decision Record**.

---
### 9. Limitations
- Only tests structural design flaws; it cannot verify if humans actually follow the rules outlined in reality.
- Explicitly ignores "self-reported" risk scores from the Designer to ensure independent measurement.

---
### 10. Tips
- Expand the "Scoring Methodology & Rules" section in the report to understand precisely how the scanner calculates its risk thresholds.
