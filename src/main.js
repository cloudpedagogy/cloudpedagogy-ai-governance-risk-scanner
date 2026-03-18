import './style.css';

/**
 * CloudPedagogy AI Governance Risk Scanner
 * Core Application Logic
 */

// Application State
let initialized = false;
let appState = {
  activeView: 'view-home',
  assessment: {
    workflow_metadata: {
      workflow_id: '',
      assessment_id: '',
      date_created: '',
      assessor_name: ''
    },
    steps: [],
    summary: {
      overall_risk_score: 0,
      high_risk_steps_count: 0,
      oversight_gaps_count: 0,
      ai_dependency_percentage: 0,
      reflection_notes: ''
    }
  }
};

// --- DOM Elements (evaluated on use) ---
const getEl = (id) => document.getElementById(id);
const views = () => document.querySelectorAll('.view');
const stepsContainer = () => document.getElementById('steps-container');
const btnAddStep = () => document.getElementById('add-step');
const btnProceedToAssessment = () => document.getElementById('proceed-to-assessment');

// --- View Management ---
function switchView(viewId) {
  views().forEach(v => v.classList.remove('active', 'fade-in'));
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add('active', 'fade-in');
    appState.activeView = viewId;
    window.scrollTo(0, 0);
  }
}

// --- Initialization ---
function init() {
  if (initialized) return;
  initialized = true;

  // Robust Event Delegation for Navigation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .btn, a');
    if (!btn) return;
    
    // Header Buttons / ID-based
    if (btn.id === 'btn-new-assessment') {
      getEl('modal-confirm').style.display = 'grid';
    }

    if (btn.id === 'confirm-proceed') {
      getEl('modal-confirm').style.display = 'none';
      startNewAssessment();
    }

    if (btn.id === 'confirm-cancel') {
      getEl('modal-confirm').style.display = 'none';
    }
    
    if (btn.id === 'btn-import-json' || btn.classList.contains('import-workflow')) {
      getEl('modal-import').style.display = 'grid';
    }
    
    if (btn.id === 'import-cancel') {
      getEl('modal-import').style.display = 'none';
    }
    
    if (btn.classList.contains('start-workflow')) {
      startNewAssessment();
    }
    
    if (btn.classList.contains('back-home')) {
      switchView('view-home');
    }
    
    if (btn.id === 'btn-load-demo') {
      loadDemo();
    }
    
    if (btn.id === 'add-step') {
      addStepRow();
    }
    
    if (btn.id === 'proceed-to-assessment') {
      proceedToAssessment();
    }
    
    if (btn.id === 'import-confirm') {
      handleJsonImport();
    }

    if (btn.id === 'final-generate-report') {
      generateFinalReport();
    }
  });
}

function startNewAssessment() {
  appState.assessment = {
    workflow_metadata: {
      workflow_id: `WF-${Date.now()}`,
      assessment_id: `AS-${Date.now()}`,
      date_created: new Date().toISOString(),
      assessor_name: 'Lead Auditor'
    },
    steps: [],
    summary: {
      overall_risk_score: 0,
      high_risk_steps_count: 0,
      oversight_gaps_count: 0,
      ai_dependency_percentage: 0,
      reflection_notes: ''
    }
  };
  
  const container = stepsContainer();
  if (container) {
    container.innerHTML = '';
    addStepRow(); // Start with one empty step
  }
  switchView('view-input');
}

// --- Step Management ---
function addStepRow(stepData = null) {
  const stepId = stepData ? stepData.step_id : `step-${Date.now()}-${appState.assessment.steps.length}`;
  const stepDiv = document.createElement('div');
  stepDiv.className = 'card step-row';
  stepDiv.dataset.id = stepId;
  stepDiv.style.marginBottom = '1rem';
  stepDiv.style.padding = '1rem';
  stepDiv.style.borderLeft = '4px solid var(--color-primary)';
  
  stepDiv.innerHTML = `
    <div style="display: flex; gap: 1rem; align-items: flex-start;">
      <div style="flex-grow: 1;">
        <label>Step Name</label>
        <input type="text" class="step-name" value="${stepData ? stepData.step_name : ''}" placeholder="e.g., Credit Decision AI model">
      </div>
      <div style="width: 150px;">
        <label>AI Involved?</label>
        <select class="ai-involved">
          <option value="true" ${stepData && stepData.ai_involved ? 'selected' : ''}>Yes</option>
          <option value="false" ${stepData && stepData.ai_involved === false ? 'selected' : ''}>No</option>
        </select>
      </div>
      <button class="btn btn-outline remove-step" style="margin-top: 1.8rem; color: var(--risk-high); border-color: var(--risk-high);">×</button>
    </div>
  `;
  
  stepDiv.querySelector('.remove-step').addEventListener('click', () => {
    stepDiv.remove();
  });
  
  stepsContainer().appendChild(stepDiv);
}

// --- Import Handling ---
function handleJsonImport() {
  const area = getEl('import-area');
  try {
    const rawData = JSON.parse(area.value);
    let steps = [];
    
    // Normalize different input formats (Workflow Designer vs Decision Record)
    if (Array.isArray(rawData)) {
      steps = rawData;
    } else if (rawData.steps && Array.isArray(rawData.steps)) {
      steps = rawData.steps;
    } else if (rawData.nodes && Array.isArray(rawData.nodes)) {
      steps = rawData.nodes.map(node => ({
        step_name: node.label || node.name || 'Untitled Node',
        ai_involved: true // Default for these tools
      }));
    }

    if (steps.length === 0) throw new Error("No steps found in JSON");

    startNewAssessment();
    stepsContainer().innerHTML = '';
    steps.forEach(s => addStepRow({
      step_id: s.id || s.step_id || `step-${Math.random().toString(36).substr(2, 9)}`,
      step_name: s.name || s.label || s.step_name || 'Untitled Step',
      ai_involved: s.ai_involved !== undefined ? s.ai_involved : true
    }));
    
    getEl('modal-import').style.display = 'none';
    getEl('import-area').value = '';
    switchView('view-input');
  } catch (err) {
    alert("Error parsing JSON: " + err.message);
  }
}

// --- Assessment Engine ---
function proceedToAssessment() {
  const stepRows = document.querySelectorAll('.step-row');
  if (stepRows.length === 0) {
    alert("Please add at least one step to your workflow.");
    return;
  }

  appState.assessment.steps = Array.from(stepRows).map(row => ({
    step_id: row.dataset.id,
    step_name: row.querySelector('.step-name').value || 'Untitled Step',
    ai_involved: row.querySelector('.ai-involved').value === 'true',
    risks: {
      bias_risk: { severity: 'Low', likelihood: 'Unlikely', notes: '' },
      operational_risk: { severity: 'Low', likelihood: 'Unlikely', notes: '' },
      ethical_risk: { severity: 'Low', likelihood: 'Unlikely', notes: '' },
      governance_risk: { severity: 'Low', likelihood: 'Unlikely', notes: '' },
      privacy_risk: { severity: 'Low', likelihood: 'Unlikely', notes: '' }
    },
    oversight: {
      human_review_present: false,
      accountability_defined: false,
      escalation_defined: false,
      oversight_notes: ''
    },
    failure_modes: [{ description: '', impact: '', cascade_effects: '' }],
    mitigation: { controls: '', safeguards: '', monitoring: '' }
  }));

  renderAssessmentForm();
  switchView('view-assessment');
}

function renderAssessmentForm() {
  const container = document.getElementById('assessment-content');
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>2. Risk & Governance Assessment</h2>
      <button id="final-generate-report" class="btn btn-primary">Generate Final Report</button>
    </div>
  `;
  
  appState.assessment.steps.forEach((step, index) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'card';
    stepCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
        <h3 style="color: var(--color-primary);">Step ${index + 1}: ${step.step_name}</h3>
        <span class="risk-tag ${step.ai_involved ? 'high' : 'low'}">${step.ai_involved ? 'AI SUPPORTED' : 'MANUAL'}</span>
      </div>

      <div class="audit-grid">
        <!-- Risk Dimensions -->
        <div style="grid-column: span 2;">
          <h4 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">Risk Dimensions</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid var(--border-light);">
                <th style="padding: 0.5rem;">Dimension</th>
                <th style="padding: 0.5rem;">Severity</th>
                <th style="padding: 0.5rem;">Likelihood</th>
                <th style="padding: 0.5rem;">Analysis / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${['bias_risk', 'operational_risk', 'ethical_risk', 'governance_risk', 'privacy_risk'].map(riskKey => `
                <tr style="border-bottom: 1px solid var(--border-light);">
                  <td style="padding: 0.5rem; font-weight: 600;">
                    ${riskKey.replace('_', ' ').toUpperCase()}
                    <span class="audit-info" title="Evaluate potential ${riskKey.replace('_', ' ')} for this step.">ⓘ</span>
                  </td>
                  <td style="padding: 0.5rem;">
                    <select class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="severity">
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </td>
                  <td style="padding: 0.5rem;">
                    <select class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="likelihood">
                      <option>Unlikely</option><option>Possible</option><option>Likely</option><option>Almost Certain</option>
                    </select>
                  </td>
                  <td style="padding: 0.5rem;">
                    <input type="text" class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="notes" placeholder="e.g. training data bias">
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Oversight & Governance -->
        <div>
          <h4 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">Governance Controls</h4>
          <div class="form-group">
            <label><input type="checkbox" class="gov-input" data-step="${index}" data-field="human_review_present"> Human Review Present</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" class="gov-input" data-step="${index}" data-field="accountability_defined"> Accountability Defined</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" class="gov-input" data-step="${index}" data-field="escalation_defined"> Escalation defined</label>
          </div>
          <div class="form-group">
            <label>Oversight Notes</label>
            <textarea class="gov-input" data-step="${index}" data-field="oversight_notes" style="height: 60px;"></textarea>
          </div>
        </div>

        <!-- Failure Modes -->
        <div>
          <h4 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">Failure Analysis</h4>
          <div class="form-group">
            <label>Failure Mode Description</label>
            <input type="text" class="fail-input" data-step="${index}" data-field="description" placeholder="What happens if AI is wrong?">
          </div>
          <div class="form-group">
            <label>Impact & Cascading Effects</label>
            <textarea class="fail-input" data-step="${index}" data-field="impact" style="height: 100px;"></textarea>
          </div>
        </div>

        <!-- Mitigation Planning -->
        <div style="grid-column: span 2;">
          <h4 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted);">Mitigation Planning</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>Technical Controls</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="controls" placeholder="e.g. data validation layer">
            </div>
            <div class="form-group">
              <label>Governance Safeguards</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="safeguards" placeholder="e.g. mandatory peer review">
            </div>
            <div class="form-group">
              <label>Monitoring Requirements</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="monitoring" placeholder="e.g. weekly bias audits">
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(stepCard);
  });

  // Attach listeners for data persistence
  container.querySelectorAll('.risk-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const { step, risk, field } = e.target.dataset;
      appState.assessment.steps[step].risks[risk][field] = e.target.value;
    });
  });

  container.querySelectorAll('.gov-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const { step, field } = e.target.dataset;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      appState.assessment.steps[step].oversight[field] = value;
    });
  });

  container.querySelectorAll('.fail-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const { step, field } = e.target.dataset;
      appState.assessment.steps[step].failure_modes[0][field] = e.target.value;
    });
  });

  container.querySelectorAll('.mit-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const { step, field } = e.target.dataset;
      appState.assessment.steps[step].mitigation[field] = e.target.value;
    });
  });
}

// --- Report Generation & Export ---
function generateFinalReport() {
  calculateScores();
  renderReport();
  switchView('view-report');
}

function calculateScores() {
  let totalScore = 0;
  let highRiskCount = 0;
  let gapCount = 0;
  let aiSteps = 0;
  
  const riskValues = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
  const likelihoodValues = { 'Unlikely': 1, 'Possible': 2, 'Likely': 3, 'Almost Certain': 4 };

  appState.assessment.steps.forEach(step => {
    if (step.ai_involved) aiSteps++;
    
    let stepMaxRisk = 0;
    Object.values(step.risks).forEach(r => {
      const score = riskValues[r.severity] * likelihoodValues[r.likelihood];
      if (score > stepMaxRisk) stepMaxRisk = score;
    });
    
    totalScore += stepMaxRisk;
    if (stepMaxRisk >= 9) highRiskCount++; // High severity + Likely or similar
    
    if (step.ai_involved && !step.oversight.human_review_present) gapCount++;
    if (!step.oversight.accountability_defined || !step.oversight.escalation_defined) gapCount++;
  });

    appState.assessment.summary.overall_risk_score = Math.round(totalScore / (appState.assessment.steps.length || 1));
    appState.assessment.summary.high_risk_steps_count = highRiskCount;
    appState.assessment.summary.oversight_gaps_count = gapCount;
    appState.assessment.summary.ai_dependency_percentage = Math.round((aiSteps / (appState.assessment.steps.length || 1)) * 100);
    
    // Systemic Fragility Logic
    appState.assessment.summary.systemic_fragility = gapCount > (appState.assessment.steps.length * 0.5) || highRiskCount > 0;
}

function renderReport() {
  const container = document.getElementById('report-content');
  const summary = appState.assessment.summary;
  
  let riskLevel = 'Low';
  let riskClass = 'low';
  if (summary.overall_risk_score > 4) { riskLevel = 'Moderate'; riskClass = 'medium'; }
  if (summary.overall_risk_score > 8) { riskLevel = 'High'; riskClass = 'high'; }
  if (summary.overall_risk_score > 12) { riskLevel = 'Critical'; riskClass = 'critical'; }

  container.innerHTML = `
    <div class="card" style="border-top: 10px solid var(--color-primary);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
        <div>
          <span class="subtitle">Governance Risk Report</span>
          <h2>Assessment Summary</h2>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 0.75rem; color: var(--text-muted);">Assessed On: ${new Date(appState.assessment.workflow_metadata.date_created).toLocaleDateString()}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">ID: ${appState.assessment.workflow_metadata.assessment_id}</p>
        </div>
      </div>

      <div class="audit-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div style="text-align: center; padding: 1rem; border: 1px solid var(--border-light); border-radius: 8px;">
          <span class="subtitle" style="font-size: 0.6rem;">Overall Risk Profile</span>
          <div style="font-size: 1.5rem; font-weight: 800;" class="risk-tag ${riskClass}">${riskLevel}</div>
        </div>
        <div style="text-align: center; padding: 1rem; border: 1px solid var(--border-light); border-radius: 8px;">
          <span class="subtitle" style="font-size: 0.6rem;">High Risk Steps</span>
          <div style="font-size: 1.5rem; font-weight: 800;">${summary.high_risk_steps_count}</div>
        </div>
        <div style="text-align: center; padding: 1rem; border: 1px solid var(--border-light); border-radius: 8px;">
          <span class="subtitle" style="font-size: 0.6rem;">Oversight Gaps</span>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--risk-high);">${summary.oversight_gaps_count}</div>
        </div>
        <div style="text-align: center; padding: 1rem; border: 1px solid var(--border-light); border-radius: 8px;">
          <span class="subtitle" style="font-size: 0.6rem;">AI Dependency</span>
          <div style="font-size: 1.5rem; font-weight: 800;">${summary.ai_dependency_percentage}%</div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Systemic Risk Heatmap</h4>
        <div style="display: flex; gap: 4px; height: 30px;">
          ${appState.assessment.steps.map(step => {
            let maxScore = 0;
            const riskValues = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
            const likelihoodValues = { 'Unlikely': 1, 'Possible': 2, 'Likely': 3, 'Almost Certain': 4 };
            Object.values(step.risks).forEach(r => {
              const s = riskValues[r.severity] * likelihoodValues[r.likelihood];
              if (s > maxScore) maxScore = s;
            });
            let color = 'var(--risk-low)';
            if (maxScore > 4) color = 'var(--risk-medium)';
            if (maxScore > 8) color = 'var(--risk-high)';
            if (maxScore > 12) color = 'var(--risk-critical)';
            return `<div title="${step.step_name}: Score ${maxScore}" style="flex-grow: 1; background: ${color}; border-radius: 2px;"></div>`;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
          <span>Step 1</span>
          <span>Step ${appState.assessment.steps.length}</span>
        </div>
      </div>
    </div>

    <h3>Detailed Step Analysis</h3>
    ${appState.assessment.steps.map(step => {
      const isFragile = step.ai_involved && (!step.oversight.human_review_present || !step.oversight.escalation_defined);
      return `
      <div class="card" style="border-left: 5px solid ${step.ai_involved ? 'var(--color-accent)' : 'var(--border-dark)'}; position: relative;">
        ${isFragile ? '<span style="position: absolute; top: 1rem; right: 1rem; font-size: 0.7rem; color: var(--risk-high); font-weight: 700; text-transform: uppercase; border: 1px solid var(--risk-high); padding: 2px 6px; border-radius: 4px;">⚠️ Fragility Node</span>' : ''}
        <h4>${step.step_name}</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem;">
          <div>
            <h5 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Governance Status</h5>
            <ul style="font-size: 0.875rem; list-style: none; margin-top: 0.5rem;">
              <li style="display: flex; justify-content: space-between;">Human Review: <span>${step.oversight.human_review_present ? '✅' : '❌'}</span></li>
              <li style="display: flex; justify-content: space-between;">Accountability: <span>${step.oversight.accountability_defined ? '✅' : '❌'}</span></li>
              <li style="display: flex; justify-content: space-between;">Escalation Path: <span>${step.oversight.escalation_defined ? '✅' : '❌'}</span></li>
            </ul>
          </div>
          <div>
            <h5 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Primary Fragility</h5>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">${step.failure_modes[0].description || 'No failure mode defined.'}</p>
          </div>
        </div>
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border-light);">
          <h5 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Mitigation Strategy</h5>
          <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--color-primary); font-weight: 500;">
            ${step.mitigation.controls || 'No technical controls defined.'} / 
            ${step.mitigation.safeguards || 'No safeguards defined.'}
          </p>
        </div>
      </div>
    `;
    }).join('')}

    <div class="card" style="border-left: 5px solid var(--risk-high);">
      <h3 style="color: var(--risk-high); margin-bottom: 1rem;">Governance Gap Alerts</h3>
      <ul style="padding-left: 1.2rem;">
        ${appState.assessment.steps.filter(s => s.ai_involved && !s.oversight.human_review_present).map(s => `
          <li style="margin-bottom: 0.5rem;"><strong>Critical Oversight Gap</strong>: Step "${s.step_name}" uses AI but lacks human review.</li>
        `).join('')}
        ${appState.assessment.steps.filter(s => !s.oversight.accountability_defined).map(s => `
          <li style="margin-bottom: 0.5rem;"><strong>Accountability Gap</strong>: No clear owner defined for "${s.step_name}".</li>
        `).join('')}
        ${appState.assessment.steps.filter(s => s.ai_involved && !s.oversight.escalation_defined).map(s => `
          <li style="margin-bottom: 0.5rem;"><strong>Fragility Alert</strong>: No escalation path for AI failure in "${s.step_name}".</li>
        `).join('')}
        ${appState.assessment.summary.oversight_gaps_count === 0 ? '<li>No major governance gaps detected in current assessment.</li>' : ''}
      </ul>
    </div>

    <div class="card no-print">
      <h3>3. Governance Reflection</h3>
      <p style="margin-bottom: 1.5rem; font-style: italic; color: var(--text-muted);">Governance requires active reflection on assumptions and systemic risks.</p>
      
      <div class="form-group">
        <label>What risks are underestimated in this assessment?</label>
        <textarea id="ref-underestimated" class="ref-input" style="height: 80px;">${appState.assessment.summary.reflection_notes || ''}</textarea>
      </div>
      <div class="form-group">
        <label>What would cause a total system failure?</label>
        <textarea id="ref-failure" class="ref-input" style="height: 80px;"></textarea>
      </div>
      <div class="form-group">
        <label>What needs immediate human intervention or manual override?</label>
        <textarea id="ref-override" class="ref-input" style="height: 80px;"></textarea>
      </div>
    </div>
  `;
  
  container.querySelectorAll('.ref-input').forEach(input => {
    input.addEventListener('change', (e) => {
      appState.assessment.summary.reflection_notes = e.target.value;
    });
  });
}

// --- Export Logic ---
document.getElementById('export-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(appState.assessment, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `governance-risk-${appState.assessment.workflow_metadata.assessment_id}.json`;
  a.click();
});

document.getElementById('export-markdown').addEventListener('click', () => {
  let md = `# Governance Risk Report\n\n`;
  md += `**Date**: ${new Date(appState.assessment.workflow_metadata.date_created).toLocaleDateString()}\n`;
  md += `**Assessment ID**: ${appState.assessment.workflow_metadata.assessment_id}\n\n`;
  
  md += `## Executive Summary\n`;
  md += `- **AI Dependency**: ${appState.assessment.summary.ai_dependency_percentage}%\n`;
  md += `- **Oversight Gaps Detected**: ${appState.assessment.summary.oversight_gaps_count}\n`;
  md += `- **High Risk Steps**: ${appState.assessment.summary.high_risk_steps_count}\n\n`;

  md += `## Detailed Analysis\n`;
  appState.assessment.steps.forEach(step => {
    md += `### Step: ${step.step_name}\n`;
    md += `- **AI Involved**: ${step.ai_involved ? 'Yes' : 'No'}\n`;
    md += `- **Human Oversight**: ${step.oversight.human_review_present ? 'Yes' : 'No'}\n`;
    md += `- **Primary Failure Mode**: ${step.failure_modes[0].description || 'N/A'}\n`;
    md += `- **Mitigation Strategy**: ${step.mitigation.controls || 'N/A'}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `governance-risk-${appState.assessment.workflow_metadata.assessment_id}.md`;
  a.click();
});

// --- Demo Mode ---
const healthcareDemo = {
  workflow_metadata: {
    workflow_id: "WF-DEMO-HEALTH",
    assessment_id: "AS-DEMO-001",
    date_created: new Date().toISOString(),
    assessor_name: "Senior Governance Lead"
  },
  steps: [
    {
      step_id: "step-1",
      step_name: "AI Symptom Analysis",
      ai_involved: true,
      risks: {
        bias_risk: { severity: "High", likelihood: "Possible", notes: "Historical data reflects under-representation of minority symptoms." },
        operational_risk: { severity: "Medium", likelihood: "Likely", notes: "Potential for false negatives in critical cases." },
        ethical_risk: { severity: "High", likelihood: "Unlikely", notes: "Automation of triage could lead to depersonalization." },
        governance_risk: { severity: "Medium", likelihood: "Possible", notes: "Model updates lack clinical validation cycles." },
        privacy_risk: { severity: "Critical", likelihood: "Unlikely", notes: "Handling of sensitive patient biometric data." }
      },
      oversight: {
        human_review_present: false,
        accountability_defined: true,
        escalation_defined: false,
        oversight_notes: "Critically lacks clinician-in-the-loop before triage recommendation."
      },
      failure_modes: [{ description: "AI misidentifies stroke as migraine", impact: "Delayed emergency intervention", cascade_effects: "Patient mortality risk increases significantly." }],
      mitigation: { controls: "Deterministic rules layer", safeguards: "Clinician override mandatory", monitoring: "Daily accuracy audits" }
    },
    {
      step_id: "step-2",
      step_name: "Clinician Diagnosis Confirmation",
      ai_involved: false,
      risks: {
        bias_risk: { severity: "Low", likelihood: "Unlikely", notes: "" },
        operational_risk: { severity: "Low", likelihood: "Unlikely", notes: "" },
        ethical_risk: { severity: "Low", likelihood: "Unlikely", notes: "" },
        governance_risk: { severity: "Low", likelihood: "Unlikely", notes: "" },
        privacy_risk: { severity: "Low", likelihood: "Unlikely", notes: "" }
      },
      oversight: {
        human_review_present: true,
        accountability_defined: true,
        escalation_defined: true,
        oversight_notes: "Human doctor reviews AI suggestions."
      },
      failure_modes: [{ description: "Human error in review", impact: "Incorrect diagnosis", cascade_effects: "Localized to single patient." }],
      mitigation: { controls: "Second opinion policy", safeguards: "Board certification", monitoring: "Peer review" }
    },
    {
      step_id: "step-3",
      step_name: "Automated Prescription Generation",
      ai_involved: true,
      risks: {
        bias_risk: { severity: "Medium", likelihood: "Possible", notes: "Dosage models focused on male physiological averages." },
        operational_risk: { severity: "High", likelihood: "Possible", notes: "Drug interaction database sync lag." },
        ethical_risk: { severity: "Low", likelihood: "Unlikely", notes: "" },
        governance_risk: { severity: "High", likelihood: "Likely", notes: "Accountability 'black box' for dosage calculation logic." },
        privacy_risk: { severity: "Medium", likelihood: "Possible", notes: "" }
      },
      oversight: {
        human_review_present: false,
        accountability_defined: false,
        escalation_defined: false,
        oversight_notes: "No escalation path defined for drug conflict alerts."
      },
      failure_modes: [{ description: "Lethal drug interaction missed", impact: "Patient injury", cascade_effects: "Legal liability and systemic recall of model version." }],
      mitigation: { controls: "Drug lookup API", safeguards: "Pharmacist final check", monitoring: "Incident log" }
    }
  ],
  summary: {
    overall_risk_score: 0,
    high_risk_steps_count: 0,
    oversight_gaps_count: 0,
    ai_dependency_percentage: 0,
    reflection_notes: "System shows critical fragility in the triage and prescription stages where AI operates without immediate clinical intervention."
  }
};

function loadDemo() {
  appState.assessment = JSON.parse(JSON.stringify(healthcareDemo));
  generateFinalReport();
}

// Run Init
init();
