# CloudPedagogy AI Governance Risk Scanner

A governance-first analysis tool for identifying risk, fragility, and oversight gaps in AI-supported workflows and decision systems.

---

## 🚀 Overview

The **CloudPedagogy AI Governance Risk Scanner** is a static, browser-based application designed to analyse AI-supported workflows and decisions through a governance lens.

It helps organisations:

- identify hidden risks and failure points  
- detect missing oversight and accountability structures  
- understand AI dependency and system fragility  
- generate structured, governance-ready risk reports  

The tool is built using **Capability-Driven Development (CDD)**, ensuring that risk awareness, accountability, traceability, and reviewability are embedded directly into the design.

---

## 🧭 Position within CloudPedagogy

This tool is part of the **Human–AI Governance Engineering suite**.

It operates at the **workflow and system level**, complementing:

- **Human–AI Decision Record Tool** → documents individual decisions  
- **AI Workflow Governance Designer** → designs AI-supported workflows  
- **AI Governance Risk Scanner (this tool)** → analyses risk, fragility, and oversight gaps  

Together, these tools support a structured governance stack:

Decision → Workflow → Risk → Capability

---

## 🧩 Key Features

- **Flexible Input Mode**  
  Define workflows manually or import structured JSON from related CloudPedagogy tools  

- **Risk Assessment Engine**  
  Evaluate Bias, Operational, Ethical, Governance, and Privacy risks across workflow steps  

- **Failure Mode Analysis**  
  Identify breakdown points, cascading impacts, and system fragility  

- **Oversight Gap Detection**  
  Flag missing human review, unclear accountability, and weak governance structures  

- **AI Dependency Analysis**  
  Assess the level and concentration of AI reliance across the workflow  

- **Risk Scoring System**  
  Generate overall and step-level governance risk profiles to support review and audit  

- **Governance-Ready Exports**  
  Export structured outputs as JSON, Markdown, or print-ready PDF for institutional use  

---

## 🌐 Live Application

Access the live tool:

http://cloudpedagogy-ai-governance-risk-scanner.s3-website.eu-west-2.amazonaws.com/

---

## 🏗️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript  
- **Build Tool**: Vite  
- **Deployment**: Static site (AWS S3, GitHub Pages, or local hosting)  

---

## 🛠️ Getting Started

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run locally**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

The production build will be generated in the `dist/` directory and can be deployed to any static hosting service.

---

## 🔐 Privacy & Security

- **Fully local**: All data remains in the user's browser  
- **No backend**: No external API calls or database storage  
- **Privacy-preserving**: No tracking or data exfiltration  
- Suitable for use in sensitive organisational and governance contexts  

---

## ⚙️ Capability-Driven Development (CDD)

This application is designed using **Capability-Driven Development (CDD)**.

CDD ensures that governance requirements shape the system from the outset, rather than being added retrospectively.

In this tool, CDD is reflected through:

- explicit risk categorisation across multiple domains  
- structured oversight and accountability checks  
- failure mode and fragility analysis  
- traceability through structured outputs  
- support for review, audit, and reflective improvement  

---

## 📄 License

Part of the CloudPedagogy ecosystem. Open-source under the MIT License.
