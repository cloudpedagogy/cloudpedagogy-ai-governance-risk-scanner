# PROJECT_SCOPE.md: CloudPedagogy AI Governance Risk Scanner

## Core Objective
To provide a structured, governance-first analytical tool for identifying risks and failure modes in AI-supported workflows.

## Strategic Positioning
- **Layer**: Human–AI Governance Engineering
- **Methodology**: Capability-Driven Development (CDD)
- **Role**: Risk and failure analysis (complementary to design and documentation tools)

## Target Users
- Governance Officers
- AI Engineers / Architects
- Compliance Auditors
- Project Managers

## In-Scope Features (v1)
- Manual and JSON input of workflows.
- Risk assessment across 5 key dimensions (Bias, Operational, Ethical, Governance, Privacy).
- Failure mode and cascading impact analysis.
- Oversight gap detection (AI without Human-in-the-loop).
- AI dependency and concentration scoring.
- Comprehensive Governance Risk Report generation.
- JSON, Markdown, and PDF export.

## Out-of-Scope (v1)
- User authentication and accounts.
- Persistent database storage (local-first storage only).
- Live AI monitoring (this is a static assessment tool).
- Integration with external 3rd party risk management platforms.

## Technical Constraints
- Static site only.
- No server-side processing.
- Cross-browser compatibility (Modern browsers).
- Printable output via CSS `@media print`.
