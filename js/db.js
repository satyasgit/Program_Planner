// ===== FRONTEND DATABASE SERVICE (NODE API PROXY) =====
// Handles communication with our local Node.js backend

const DB = (() => {
    const API_BASE = 'http://localhost:3000/api';

    // ── Save Mutex ──────────────────────────────────────────────
    // Prevents concurrent save calls from creating duplicate records.
    // If a save is already in-flight, subsequent calls queue behind it.
    // When the first save resolves and sets dbId, the queued save
    // will use that dbId (→ UPDATE instead of INSERT).
    let _savePromise = Promise.resolve();

    function init() {
        console.log('Database Service initialized (via Node API) ✓');
        return true;
    }

    // --- Save Program (Upsert) — with mutex ---
    function saveProgram(data) {
        // Chain onto the previous save promise so they execute sequentially
        _savePromise = _savePromise
            .catch(() => {}) // swallow previous errors so the chain continues
            .then(() => _doSave(data));
        return _savePromise;
    }

    // The actual save implementation
    async function _doSave(data) {
        try {
            const response = await fetch(`${API_BASE}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save program');
            }

            const result = await response.json();
            
            // CRITICAL: Update local dbId so the next save is an UPDATE, not INSERT
            if (result.data && result.data.id) {
                data.dbId = result.data.id;
            }

            return { data: result.data };
        } catch (error) {
            console.error('Error saving program via API:', error);
            return { error };
        }
    }

    // --- Search Programs ---
    async function searchPrograms(query = '', page = 1, pageSize = 6) {
        try {
            const params = new URLSearchParams({
                query: query,
                page: page,
                pageSize: pageSize
            });

            const response = await fetch(`${API_BASE}/programs?${params}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to search programs');
            }

            const result = await response.json();
            return { data: result.data || [], count: result.count || 0 };
        } catch (error) {
            console.error('Error searching programs via API:', error);
            return { data: [], count: 0 };
        }
    }

    // --- Load Single Program ---
    async function loadProgram(id) {
        try {
            const response = await fetch(`${API_BASE}/programs/${id}`);
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to load program');
            }

            const fullData = await response.json();
            
            // Re-hydrate dates
            if (fullData.startDate) fullData.startDate = new Date(fullData.startDate);
            if (fullData.endDate) fullData.endDate = new Date(fullData.endDate);
            if (fullData.phases) {
                fullData.phases.forEach(p => {
                    if (p.startDate) p.startDate = new Date(p.startDate);
                    if (p.endDate) p.endDate = new Date(p.endDate);
                });
            }
            if (fullData.risks) fullData.risks.forEach(r => { if(r.targetDate) r.targetDate = new Date(r.targetDate); });
            if (fullData.issues) fullData.issues.forEach(i => { if(i.targetDate) i.targetDate = new Date(i.targetDate); });
            if (fullData.dependencies) fullData.dependencies.forEach(d => { if(d.targetDate) d.targetDate = new Date(d.targetDate); });
            if (fullData.tasks) fullData.tasks.forEach(t => { 
                if(t.startDate) t.startDate = new Date(t.startDate); 
                if(t.dueDate) t.dueDate = new Date(t.dueDate);
            });

            return fullData;
        } catch (error) {
            console.error('Error loading program via API:', error);
            return null;
        }
    }

    return {
        init,
        saveProgram,
        searchPrograms,
        loadProgram
    };
})();
