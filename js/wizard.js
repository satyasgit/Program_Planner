// ===== WIZARD ENGINE =====
// Works with the Steps module (steps.js)

const WIZARD_STEPS = [
    { id: 1, label: 'Program Basics' },
    { id: 2, label: 'Phases' },
    { id: 3, label: 'Workstreams' },
    { id: 4, label: 'Task Backlog' },
    { id: 5, label: 'RAID Log' },
    { id: 6, label: 'Stakeholders' },
    { id: 7, label: 'Export' },
];

const Wizard = (() => {
    let currentStep = 1;

    // ── Stepper UI ────────────────────────────────────────────────
    function renderStepper() {
        const el = document.getElementById('stepper');
        el.innerHTML = WIZARD_STEPS.map(s => {
            const state = s.id === currentStep ? 'active' : s.id < currentStep ? 'completed' : '';
            const icon = s.id < currentStep ? '✓' : s.id;
            const isLast = s.id === WIZARD_STEPS.length;
            return `<div class="step-item ${state}" onclick="Wizard.goTo(${s.id})" id="si-${s.id}">
        <div class="step-circle">${icon}</div>
        <span class="step-label">${s.label}</span>
        ${!isLast ? '<div class="step-connector"></div>' : ''}
      </div>`;
        }).join('');
    }

    // ── Show Step ─────────────────────────────────────────────────
    function showStep(step) {
        currentStep = step;
        renderStepper();

        // Hero visible only on very first visit
        const hero = document.getElementById('heroBanner');
        if (hero) hero.style.display = (step === 1 && !AppData.programName) ? 'block' : 'none';

        // Animate in
        const content = document.getElementById('stepContent');
        content.innerHTML = '';
        requestAnimationFrame(() => {
            Steps.render(step);
        });

        // Nav buttons
        const btnBack = document.getElementById('btnBack');
        const btnNext = document.getElementById('btnNext');
        if (btnBack) btnBack.style.display = step === 1 ? 'none' : '';
        if (btnNext) {
            if (step === 7) {
                btnNext.style.display = 'none';
            } else {
                btnNext.style.display = '';
                btnNext.textContent = step === 6 ? 'Review & Export →' : 'Next Step →';
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Navigation ────────────────────────────────────────────────
    function next() {
        if (!Steps.validate(currentStep)) return;
        Steps.save(currentStep);
        if (currentStep < WIZARD_STEPS.length) showStep(currentStep + 1);
    }

    function back() {
        Steps.save(currentStep);
        if (currentStep > 1) showStep(currentStep - 1);
    }

    function goTo(target) {
        if (target > currentStep) {
            if (!Steps.validate(currentStep)) return;
            Steps.save(currentStep);
        }
        showStep(target);
    }

    // ── Toast ─────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = `toast ${type} show`;
        setTimeout(() => t.classList.remove('show'), 3500);
    }

    // ── Spinner ───────────────────────────────────────────────────
    function showSpinner(text = 'Generating…') {
        let ol = document.getElementById('spinnerOverlay');
        if (!ol) {
            ol = document.createElement('div');
            ol.id = 'spinnerOverlay';
            ol.className = 'spinner-overlay';
            document.body.appendChild(ol);
        }
        ol.innerHTML = `<div class="spinner"></div><div class="spinner-text">${text}</div>`;
    }

    function hideSpinner() {
        document.getElementById('spinnerOverlay')?.remove();
    }

    // ── Draft persistence ─────────────────────────────────────────
    function saveDraft() {
        Steps.save(currentStep);
        try {
            localStorage.setItem('pp_draft_v2', JSON.stringify(AppData));
            showToast('Draft saved ✓');
        } catch { showToast('Could not save draft', 'error'); }
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem('pp_draft_v2');
            if (!raw) return false;
            Object.assign(AppData, JSON.parse(raw));
            return true;
        } catch { return false; }
    }

    function loadSample() {
        Object.assign(AppData, JSON.parse(JSON.stringify(SAMPLE_DATA)));
        showStep(currentStep);
        showToast('Sample program loaded ✓');
    }

    function clearAll() {
        if (!confirm('Clear all data? This cannot be undone.')) return;
        const blank = {
            phases: [], workstreams: [], tasks: [], risks: [], issues: [], assumptions: [], dependencies: [], stakeholders: [], communicationPlan: [],
            outputs: { excel: true, ppt: true, pdf: true }, branding: { primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#06b6d4', companyName: '', logoText: '' }
        };
        const strFields = ['programName', 'description', 'businessUnit', 'portfolio', 'sponsor', 'programManager', 'startDate', 'endDate', 'currency', 'fiscalYearStart', 'objectives', 'successMetrics', 'strategicThemes', 'constraints', 'regulatoryDrivers'];
        strFields.forEach(k => { AppData[k] = ''; });
        Object.assign(AppData, blank);
        AppData.currency = 'USD'; AppData.fiscalYearStart = '1';
        localStorage.removeItem('pp_draft_v2');
        showStep(1);
        showToast('All data cleared');
    }

    // ── Utility ───────────────────────────────────────────────────
    function safeFileName(name) {
        return (name || 'Program').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40);
    }
    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function downloadBlob(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 5000);
    }

    return { showStep, next, back, goTo, showToast, showSpinner, hideSpinner, saveDraft, loadDraft, loadSample, clearAll, safeFileName, today, downloadBlob, currentStep: () => currentStep };
})();
