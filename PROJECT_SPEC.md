# PROJECT_SPEC: cloudpedagogy-ai-governance-risk-scanner

## 1. Repo Name
`cloudpedagogy-ai-governance-risk-scanner`

## 2. One-Sentence Purpose
An operational audit tool for scanning human-AI workflows for specific risks, failure modes, and oversight gaps.

## 3. Problem the App Solves
Difficulty in assessing the real-world operational risk of a specific "live" workflow; identifies *where* humans might fail and *what* controls are missing in a complex automated process.

## 4. Primary User / Audience
Data protection officers, operational risk managers, and curriculum auditors.

## 5. Core Role in the CloudPedagogy Ecosystem
The "Operational Audit Layer"; performs deep risk-scanning on workflows designed in tools like `ai-workflow-governance-designer`.

## 6. Main Entities / Data Structures
- **AssessmentState**: Metadata and summary data tracking overall risk scores and oversight gaps.
- **AssessmentStep**: The granular unit of audit, tracking AI involvement, multi-dimensional risk severities, failure modes, and mitigation controls.

## 7. Main User Workflows
1. **Workflow Import**: Ingest a JSON workflow configuration (from Designer tool).
2. **Operational Audit**: Step through each task, assessing AI involvement and risk severities (Bias, Ethical, Privacy, etc.).
3. **Failure Mode Cataloging**: Document specific ways the AI or process could fail and their impact.
4. **Mitigation Definition**: Establish safeguards and monitoring for high-risk steps.
5. **Score Generation**: Generate a comprehensive risk summary and oversight gap report.

## 8. Current Features
- Vanilla JS execution.
- Detailed risk logic covering 5 categories of severity and likelihood.
- Oversight gap detection system.
- Failure mode and "Cascade Effect" tracking.
- Mitigation and control inventory.
- Full JSON import/export.

## 9. Stubbed / Partial / Incomplete Features
- Not explicitly defined in documentation.

## 10. Import / Export and Storage Model
- **Storage**: Stateless by design (no default persistence found); relies on JSON configurations for persistence.
- **Import/Export**: Robust JSON import/export logic for cross-tool interoperability.

## 11. Relationship to Other CloudPedagogy Apps
Designed to parse and audit the outputs of the `ai-workflow-governance-designer` for deep risk scanning.

## 12. Potential Overlap or Duplication Risks
Complements `gaps-risk` by providing *Step-by-Step* operational analysis versus *Domain-by-Domain* institutional assessment.

## 13. Distinctive Value of This App
The only tool in the ecosystem that explicitly tracks "Failure Modes" and "Cascade Effects" of AI-related operational errors.

## 14. Recommended Future Enhancements
(Inferred) Built-in library of common AI failure modes per sector; automated mitigation drafting based on detected oversight gaps.

## 15. Anything Unclear or Inferred from Repo Contents
"Oversight" patterns are inferred to match the standard CloudPedagogy governance maturity definitions.
