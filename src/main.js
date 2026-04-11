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
      inherent_risk_total: 0,
      residual_risk_total: 0,
      high_risk_steps_count: 0,
      oversight_gaps_count: 0,
      ai_dependency_percentage: 0,
      critical_path_alerts: [],
      reflection_notes: '',
      ignoredFieldsDetected: false
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
      ai_dependency_percentage: 0,
      reflection_notes: '',
      ignoredFieldsDetected: false
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
  
  stepDiv.innerHTML = `
    <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
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
      <button class="btn btn-outline remove-step" style="margin-top: 1.8rem;">×</button>
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

    // Recalculate all scores independently - Clear existing scores from input
    startNewAssessment();
    stepsContainer().innerHTML = '';
    steps.forEach(s => addStepRow({
      step_id: s.id || s.step_id || `step-${Math.random().toString(36).substr(2, 9)}`,
      step_name: s.name || s.label || s.step_name || 'Untitled Step',
      ai_involved: s.ai_involved !== undefined ? s.ai_involved : true
    }));
    
    // Explicitly ignore design_time_metrics if present
    if (rawData.design_time_metrics) {
      console.log("Scanner: Detected design-time metrics. These will be ignored for authoritative scoring.");
      appState.assessment.summary.ignoredFieldsDetected = true;
    }

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
    mitigation: { 
      controls: '', 
      safeguards: '', 
      monitoring: '', 
      effectiveness: 1, // Default to 1 (None)
      residual_risk: 0 
    }
  }));

  renderAssessmentForm();
  switchView('view-assessment');
}

function renderAssessmentForm() {
  const container = document.getElementById('assessment-content');
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
      <div>
        <span class="subtitle">Operational Audit</span>
        <h2>2. Risk & Governance Assessment</h2>
      </div>
      <button id="final-generate-report" class="btn btn-primary">Generate Final Report</button>
    </div>
  `;
  
  appState.assessment.steps.forEach((step, index) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'card';
    stepCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
        <h3>Step ${index + 1}: ${step.step_name}</h3>
        <span class="risk-tag">${step.ai_involved ? 'AI SUPPORTED' : 'MANUAL'}</span>
      </div>

      <div class="audit-grid">
        <!-- Risk Dimensions -->
        <div style="grid-column: span 2;">
          <h4>Risk Dimensions</h4>
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Severity</th>
                <th>Likelihood</th>
                <th>Analysis / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${['bias_risk', 'operational_risk', 'ethical_risk', 'governance_risk', 'privacy_risk'].map(riskKey => `
                <tr>
                  <td style="font-weight: 600; color: var(--text-secondary);">
                    ${riskKey.replace('_', ' ').toUpperCase()}
                    <span class="audit-info" title="Evaluate potential ${riskKey.replace('_', ' ')} for this step.">ⓘ</span>
                  </td>
                  <td>
                    <select class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="severity">
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </td>
                  <td>
                    <select class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="likelihood">
                      <option>Unlikely</option><option>Possible</option><option>Likely</option><option>Almost Certain</option>
                    </select>
                  </td>
                  <td>
                    <input type="text" class="risk-input" data-step="${index}" data-risk="${riskKey}" data-field="notes" placeholder="Notes">
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Oversight & Governance -->
        <div>
          <h4>Governance Controls</h4>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
            <input type="checkbox" class="gov-input" data-step="${index}" data-field="human_review_present" id="hr-${index}">
            <label for="hr-${index}" style="margin-bottom: 0;">Human Review Present</label>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" class="gov-input" data-step="${index}" data-field="accountability_defined" id="ad-${index}">
            <label for="ad-${index}" style="margin-bottom: 0;">Accountability Defined</label>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" class="gov-input" data-step="${index}" data-field="escalation_defined" id="ed-${index}">
            <label for="ed-${index}" style="margin-bottom: 0;">Escalation Defined</label>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label>Oversight Notes</label>
            <textarea class="gov-input" data-step="${index}" data-field="oversight_notes" style="height: 80px;"></textarea>
          </div>
        </div>

        <!-- Failure Modes -->
        <div>
          <h4>Failure Analysis</h4>
          <div class="form-group" style="margin-top: 1rem;">
            <label>Failure Mode Description</label>
            <input type="text" class="fail-input" data-step="${index}" data-field="description" placeholder="e.g. model drift">
          </div>
          <div class="form-group">
            <label>Impact & Cascading Effects</label>
            <textarea class="fail-input" data-step="${index}" data-field="impact" style="height: 100px;"></textarea>
          </div>
        </div>

        <!-- Mitigation Planning -->
        <div style="grid-column: span 2;">
          <h4>Mitigation & Controls</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
            <div class="form-group">
              <label>Technical Controls</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="controls" value="${step.mitigation.controls}" placeholder="e.g. guardrails">
            </div>
            <div class="form-group">
              <label>Governance Safeguards</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="safeguards" value="${step.mitigation.safeguards}" placeholder="e.g. peer review">
            </div>
            <div class="form-group">
              <label>Monitoring Requirements</label>
              <input type="text" class="mit-input" data-step="${index}" data-field="monitoring" value="${step.mitigation.monitoring}" placeholder="e.g. audit logs">
            </div>
          </div>
          <div style="display: flex; gap: 2rem; align-items: center; margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 4px; border: 1px solid var(--border-light);">
            <div class="form-group" style="margin-bottom: 0; flex-grow: 1;">
              <label style="margin-bottom: 0.5rem; display: block;">Mitigation Effectiveness (Strength of Controls)</label>
              <select class="mit-input mit-effect-input" data-step="${index}" data-field="effectiveness">
                <option value="1" ${step.mitigation.effectiveness == 1 ? 'selected' : ''}>1: None (No reduction)</option>
                <option value="2" ${step.mitigation.effectiveness == 2 ? 'selected' : ''}>2: Weak (Subtle reduction)</option>
                <option value="3" ${step.mitigation.effectiveness == 3 ? 'selected' : ''}>3: Partial (Moderate reduction)</option>
                <option value="4" ${step.mitigation.effectiveness == 4 ? 'selected' : ''}>4: Strong (Significant reduction)</option>
                <option value="5" ${step.mitigation.effectiveness == 5 ? 'selected' : ''}>5: Robust (Minimal residual risk)</option>
              </select>
            </div>
            <div style="text-align: right; min-width: 150px;">
              <span class="subtitle">Indicative Residual Risk <span class="audit-info" title="Indicative weight (not an absolute score)">ⓘ</span></span>
              <div class="residual-risk-badge" id="residual-badge-${index}" style="font-size: 1.5rem; font-weight: 700;">-</div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(stepCard);
    updateResidualDisplay(index);
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
      const val = e.target.value;
      appState.assessment.steps[step].mitigation[field] = field === 'effectiveness' ? parseInt(val) : val;
      if (field === 'effectiveness') {
        updateResidualDisplay(step);
      }
    });
  });
}

function updateResidualDisplay(stepIdx) {
  const step = appState.assessment.steps[stepIdx];
  const severityValues = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
  const likelihoodValues = { 'Unlikely': 1, 'Possible': 2, 'Likely': 3, 'Almost Certain': 4 };
  const mitigationMultipliers = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2 };
  
  let maxInherent = 0;
  Object.values(step.risks).forEach(r => {
    const s = severityValues[r.severity] * likelihoodValues[r.likelihood];
    if (s > maxInherent) maxInherent = s;
  });
  
  const residual = Math.round(maxInherent * mitigationMultipliers[step.mitigation.effectiveness]);
  const badge = document.getElementById(`residual-badge-${stepIdx}`);
  if (badge) {
    badge.textContent = residual;
    let color = '#059669'; // Low
    if (residual >= 4) color = '#D97706'; // Moderate
    if (residual >= 9) color = '#DC2626'; // High
    if (residual >= 16) color = '#111111'; // Critical
    badge.style.color = color;
  }
}

// --- Report Generation & Export ---
function generateFinalReport() {
  calculateScores();
  renderReport();
  switchView('view-report');
}

function calculateScores() {
  let inherentTotal = 0;
  let residualTotal = 0;
  let highRiskCount = 0;
  let gapCount = 0;
  let aiSteps = 0;
  
  const severityValues = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
  const likelihoodValues = { 'Unlikely': 1, 'Possible': 2, 'Likely': 3, 'Almost Certain': 4 };
  const mitigationMultipliers = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.4, 5: 0.2 };

  appState.assessment.steps.forEach(step => {
    if (step.ai_involved) aiSteps++;
    
    let stepMaxInherent = 0;
    Object.values(step.risks).forEach(r => {
      const score = severityValues[r.severity] * likelihoodValues[r.likelihood];
      if (score > stepMaxInherent) stepMaxInherent = score;
    });
    
    step.inherent_risk = stepMaxInherent;
    step.residual_risk = Math.round(stepMaxInherent * mitigationMultipliers[step.mitigation.effectiveness]);
    
    inherentTotal += step.inherent_risk;
    residualTotal += step.residual_risk;
    
    if (step.residual_risk >= 9) highRiskCount++; // Authoritative High Risk threshold
    
    if (step.ai_involved && !step.oversight.human_review_present) gapCount++;
    if (!step.oversight.accountability_defined || !step.oversight.escalation_defined) gapCount++;
  });

  const avgResidual = Math.round(residualTotal / (appState.assessment.steps.length || 1));
  appState.assessment.summary.overall_risk_score = avgResidual;
  appState.assessment.summary.inherent_risk_total = inherentTotal;
  appState.assessment.summary.residual_risk_total = residualTotal;
  appState.assessment.summary.high_risk_steps_count = highRiskCount;
  appState.assessment.summary.oversight_gaps_count = gapCount;
  appState.assessment.summary.ai_dependency_percentage = Math.round((aiSteps / (appState.assessment.steps.length || 1)) * 100);
  
  // Critical Path Analysis
  appState.assessment.summary.critical_path_alerts = [];
  const steps = appState.assessment.steps;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Rule: Critical residual risk + lacks accountability or escalation
    if (step.residual_risk >= 16 && (!step.oversight.accountability_defined || !step.oversight.escalation_defined)) {
      appState.assessment.summary.critical_path_alerts.push(`Critical Sensitivity Node: ${step.step_name} (High risk with zero accountability)`);
    }

    // Rule: Two consecutive steps have high residual risk (>=9)
    if (i < steps.length - 1) {
      if (step.residual_risk >= 9 && steps[i+1].residual_risk >= 9) {
        appState.assessment.summary.critical_path_alerts.push(`Cascading Risk Failure: Consecutive high-risk steps detected at "${step.step_name}" and "${steps[i+1].step_name}"`);
      }
    }

    // Rule: Three adjacent steps each have at least moderate residual risk (>=4)
    if (i < steps.length - 2) {
      if (step.residual_risk >= 4 && steps[i+1].residual_risk >= 4 && steps[i+2].residual_risk >= 4) {
        appState.assessment.summary.critical_path_alerts.push(`Systemic Fragility: Sequence of moderate risks detected around "${step.step_name}"`);
      }
    }
  }
}

function renderReport() {
  const container = document.getElementById('report-content');
  const summary = appState.assessment.summary;
  
  let riskLevel = 'Low';
  if (summary.overall_risk_score > 4) { riskLevel = 'Moderate'; }
  if (summary.overall_risk_score > 8) { riskLevel = 'High'; }
  if (summary.overall_risk_score > 12) { riskLevel = 'Critical'; }

  container.innerHTML = `
    <div class="card" style="border-top: 4px solid var(--border-strong);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
        <div>
          <span class="subtitle">Governance Risk Report</span>
          <h2>Assessment Summary</h2>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">
          <div>Date: ${new Date(appState.assessment.workflow_metadata.date_created).toLocaleDateString()}</div>
          <div>ID: ${appState.assessment.workflow_metadata.assessment_id}</div>
        </div>
      </div>

      <div class="disclosure-banner" style="display: flex; justify-content: space-between; align-items: center;">
        <span><strong>Audit Independence</strong>: Audit scored independently. Design-time metrics are not used.</span>
        <span class="audit-info" title="Purpose: Ensures independent re-audit and avoids bias from upstream design data.">ⓘ</span>
      </div>

      ${summary.ignoredFieldsDetected ? `
        <div style="margin-bottom: 2rem; font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">
          Note: Some input fields (e.g. design-time metrics) were detected in the source data and have been ignored in this audit calculation.
        </div>
      ` : ''}

      <div class="audit-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div style="text-align: left; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius);">
          <span class="subtitle">Overall Risk Score</span>
          <div style="font-size: 1.25rem; font-weight: 700;">${summary.overall_risk_score} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">(${riskLevel})</span></div>
        </div>
        <div style="text-align: left; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius);">
          <span class="subtitle">Authoritative Profile</span>
          <div style="font-size: 1.25rem; font-weight: 700;">${summary.residual_risk_total} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">Residual</span></div>
        </div>
        <div style="text-align: left; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius);">
          <span class="subtitle">Critical Gaps</span>
          <div style="font-size: 1.25rem; font-weight: 700;">${summary.oversight_gaps_count} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">Alerts</span></div>
        </div>
        <div style="text-align: left; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius);">
          <span class="subtitle">AI dependency</span>
          <div style="font-size: 1.25rem; font-weight: 700;">${summary.ai_dependency_percentage}%</div>
        </div>
      </div>

      ${summary.critical_path_alerts.length > 0 ? `
        <div style="margin-top: 2rem; padding: 1.5rem; background: #FFF1F2; border: 1px solid #FECACA; border-radius: var(--radius);">
          <h4 style="color: #991B1B; margin-bottom: 1rem;">Critical Path Analysis (Structural Risks)</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${summary.critical_path_alerts.map(a => `
              <li style="color: #B91C1C; font-size: 0.875rem; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                <span style="font-weight: 700;">❗</span> ${a}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="margin-top: 3rem;">
        <h4>Operational Risk Heatmap (Residual Risk)</h4>
        <div style="display: flex; gap: 4px; height: 12px; margin-top: 1rem;">
          ${appState.assessment.steps.map(step => {
            const res = step.residual_risk;
            // Monochrome scale based on residual risk
            let color = '#f3f4f6'; // Low (<4)
            if (res >= 4) color = '#d1d5db'; // Moderate
            if (res >= 9) color = '#4b5563'; // High
            if (res >= 16) color = '#111111'; // Critical
            return `<div title="${step.step_name}: Residual Score ${res}" style="flex-grow: 1; background: ${color}; border-radius: 1px;"></div>`;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); margin-top: 8px; font-family: var(--font-mono);">
          <span>START</span>
          <span>END</span>
        </div>
      </div>

      <details style="margin-top: 2rem; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius);">
        <summary style="font-weight: 600; cursor: pointer; color: var(--text-secondary); font-size: 0.875rem;">Scoring Methodology & Rules</summary>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
          <ul style="padding-left: 1.2rem;">
            <li><strong>Inherent Risk</strong>: Derived from Severity (1-4) × Likelihood (1-4) per dimension.</li>
            <li><strong>Mitigation Strength</strong>: Controls reduce inherent score by 0% to 80%.</li>
            <li><strong>Contribution Weight</strong>: Individual risk scores represent indicative weights, not absolute values.</li>
            <li><strong>Overall Score</strong>: Calculated as the average residual risk across all workflow steps.</li>
          </ul>
        </div>
      </details>
    </div>

    <h3 style="margin-top: 4rem; margin-bottom: 2rem;">Detailed Step Analysis</h3>
    ${appState.assessment.steps.map(step => {
      const isFragile = step.ai_involved && (!step.oversight.human_review_present || !step.oversight.escalation_defined);
      return `
      <div class="card" style="position: relative;">
        ${isFragile ? '<span style="position: absolute; top: 1.5rem; right: 1.5rem; font-size: 0.6rem; color: #111111; font-weight: 700; text-transform: uppercase; border: 1px solid #111111; padding: 2px 6px; border-radius: 2px;">Fragility Node</span>' : ''}
        <h3>${step.step_name}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 2rem;">
          <div>
            <h4>Governance Status</h4>
            <ul style="font-size: 0.875rem; list-style: none; margin-top: 1rem; padding: 0;">
              <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light);">Human Review <span>${step.oversight.human_review_present ? '✓' : '—'}</span></li>
              <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light);">Accountability <span>${step.oversight.accountability_defined ? '✓' : '—'}</span></li>
              <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light);">Escalation Path <span>${step.oversight.escalation_defined ? '✓' : '—'}</span></li>
              <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-weight: 600; color: var(--text-main);">
                Contribution Weight 
                <span class="audit-info" title="Indicative weight (not an absolute score)">ⓘ</span>
                <span>${step.residual_risk}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4>Primary Fragility</h4>
            <p style="font-size: 0.875rem; margin-top: 1rem; color: var(--text-secondary);">${step.failure_modes[0].description || 'Analysis not provided.'}</p>
          </div>
        </div>
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-light);">
          <h4>Mitigation Strategy</h4>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">
            ${step.mitigation.controls || 'N/A'} · 
            ${step.mitigation.safeguards || 'N/A'}
          </p>
        </div>
      </div>
    `;
    }).join('')}

    <div class="card" style="background: #fafafa;">
      <h3 style="margin-bottom: 1.5rem;">Governance Alerts</h3>
      <ul style="padding-left: 1.2rem; font-size: 0.875rem;">
        ${appState.assessment.steps.filter(s => s.ai_involved && !s.oversight.human_review_present).map(s => `
          <li style="margin-bottom: 0.75rem;"><strong>Oversight Gap</strong>: Step "${s.step_name}" uses AI but lacks clinician/human review.</li>
        `).join('')}
        ${appState.assessment.steps.filter(s => !s.oversight.accountability_defined).map(s => `
          <li style="margin-bottom: 0.75rem;"><strong>Accountability Gap</strong>: No clear owner defined for "${s.step_name}".</li>
        `).join('')}
        ${appState.assessment.steps.filter(s => s.ai_involved && !s.oversight.escalation_defined).map(s => `
          <li style="margin-bottom: 0.75rem;"><strong>Fragility Alert</strong>: No escalation path for AI failure in "${s.step_name}".</li>
        `).join('')}
        ${appState.assessment.summary.oversight_gaps_count === 0 ? '<li>No major governance gaps detected.</li>' : ''}
      </ul>
    </div>

    <div class="card no-print">
      <h3>Governance Reflection</h3>
      <p style="margin-bottom: 2rem; font-size: 0.875rem; color: var(--text-muted);">Active reflection on assumptions and systemic risks is a core governance requirement.</p>
      
      <div class="form-group">
        <label>Underestimated Risks</label>
        <textarea id="ref-underestimated" class="ref-input" style="height: 80px;">${appState.assessment.summary.reflection_notes || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Systemic Failure Scenarios</label>
        <textarea id="ref-failure" class="ref-input" style="height: 80px;"></textarea>
      </div>
      <div class="form-group">
        <label>Immediate Human Interventions</label>
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
  let md = `# Governance Risk Audit Report\n\n`;
  md += `**Workflow ID**: ${appState.assessment.workflow_metadata.workflow_id}\n`;
  md += `**Assessment ID**: ${appState.assessment.workflow_metadata.assessment_id}\n`;
  md += `**Audit Date**: ${new Date(appState.assessment.workflow_metadata.date_created).toLocaleDateString()}\n`;
  md += `**Assessor**: ${appState.assessment.workflow_metadata.assessor_name}\n\n`;
  
  md += `## 1. Executive Summary\n`;
  md += `- **Overall Residual Risk Score**: ${appState.assessment.summary.overall_risk_score}\n`;
  md += `- **Total Inherent Risk**: ${appState.assessment.summary.inherent_risk_total}\n`;
  md += `- **Total Residual Risk**: ${appState.assessment.summary.residual_risk_total}\n`;
  md += `- **Critical Governance Gaps**: ${appState.assessment.summary.oversight_gaps_count}\n`;
  md += `- **AI Dependency**: ${appState.assessment.summary.ai_dependency_percentage}%\n\n`;

  if (appState.assessment.summary.critical_path_alerts.length > 0) {
    md += `## 2. Critical Path Analysis (Structural Risks)\n`;
    appState.assessment.summary.critical_path_alerts.forEach(a => {
      md += `- ❗ **ALERT**: ${a}\n`;
    });
    md += `\n`;
  }
 
  md += `## 3. Detailed Step Audit\n`;
  appState.assessment.steps.forEach(step => {
    md += `### Step: ${step.step_name}\n`;
    md += `| Category | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **AI Involved** | ${step.ai_involved ? 'Yes' : 'No'} |\n`;
    md += `| **Inherent Risk** | ${step.inherent_risk} |\n`;
    md += `| **Mitigation Strength** | ${step.mitigation.effectiveness} / 5 |\n`;
    md += `| **Residual Risk** | ${step.residual_risk} |\n`;
    md += `| **Human Review** | ${step.oversight.human_review_present ? 'Identified' : 'MISSING'} |\n`;
    
    md += `\n**Failure Mode**: ${step.failure_modes[0].description || 'N/A'}\n`;
    md += `**Control Strategy**: ${step.mitigation.controls || 'N/A'}\n\n`;
    md += `---\n\n`;
  });

  md += `## 4. Governance Reflection\n`;
  md += `${appState.assessment.summary.reflection_notes || 'No reflection notes provided.'}\n\n`;

  md += `> [!NOTE]\n`;
  md += `> This report provides an authoritative operational audit of the workflow. All scores are calculated independently of design-time indicators.\n`;

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
      mitigation: { 
        controls: "Deterministic rules layer", 
        safeguards: "Clinician override mandatory", 
        monitoring: "Daily accuracy audits",
        effectiveness: 3 
      }
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
      mitigation: { 
        controls: "Second opinion policy", 
        safeguards: "Board certification", 
        monitoring: "Peer review",
        effectiveness: 5
      }
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
      mitigation: { 
        controls: "Drug lookup API", 
        safeguards: "Pharmacist final check", 
        monitoring: "Incident log",
        effectiveness: 3
      }
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
