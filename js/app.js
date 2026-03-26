// ===== APP BOOTSTRAP =====
// Wires buttons and delegates to module generators

const App = {
    generateExcel: () => {
        try { ExcelGenerator.generate(); }
        catch (e) { console.error(e); Wizard.showToast('Excel error: ' + e.message, 'error'); }
    },
    generatePPT: () => {
        try { generatePPT(); }
        catch (e) { console.error(e); Wizard.showToast('PPT error: ' + e.message, 'error'); }
    },
    generatePDF: () => {
        try { generatePDF(); }
        catch (e) { console.error(e); Wizard.showToast('PDF error: ' + e.message, 'error'); }
    },
    downloadBlob: (blob, fileName) => Wizard.downloadBlob(blob, fileName),
};

// Global aliases that generators and steps.js might call
const showToast = (m, t) => Wizard.showToast(m, t);
const showSpinner = (m) => Wizard.showSpinner(m);
const hideSpinner = () => Wizard.hideSpinner();
const safeFileName = (n) => Wizard.safeFileName(n);
const today = () => Wizard.today();
const downloadBlob = (b, f) => Wizard.downloadBlob(b, f);
// saveStep is no longer needed by generators (ExcelGenerator is self-contained)

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Database
    const dbActive = DB.init();
    
    // Initialize Dashboard
    Wizard.showStep(0);
    
    // Check for draft and notify if exists
    if (Wizard.loadDraft()) {
        setTimeout(() => {
            Wizard.showToast('Existing draft restored ✓');
        }, 600);
    }

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Header buttons
    document.getElementById('btnLoadSample')?.addEventListener('click', (e) => {
        e.preventDefault();
        Wizard.loadSample();
        Wizard.goTo(1); // Jump to start
    });
    document.getElementById('btnClearAll')?.addEventListener('click', Wizard.clearAll);
    
    // Theme toggle button
    document.getElementById('btnThemeToggle')?.addEventListener('click', toggleTheme);

    // Navigation
    document.getElementById('btnNext')?.addEventListener('click', Wizard.next);
    document.getElementById('btnBack')?.addEventListener('click', Wizard.back);
    document.getElementById('btnSaveDraft')?.addEventListener('click', Wizard.saveDraft);
});

// Theme toggle functionality
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    Wizard.showToast(`Switched to ${newTheme} theme`);
}

function updateThemeIcon(theme) {
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    
    if (theme === 'light') {
        lightIcon.style.display = 'inline';
        darkIcon.style.display = 'none';
    } else {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline';
    }
}
