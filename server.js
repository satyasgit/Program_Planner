require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { generateExcel, generatePPT, generatePDF } = require('./server/generators');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase Admin Client
// Using the Service Role Key allows the backend to bypass RLS and perform all DB operations securely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Program Planner API is running' });
});

// Get Programs List
app.get('/api/programs', async (req, res) => {
    try {
        const { query = '', page = 1, pageSize = 6 } = req.query;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let q = supabase
            .from('programs')
            .select('*, phases(count)', { count: 'exact' });

        if (query) {
            q = q.or(`name.ilike.%${query}%,business_unit.ilike.%${query}%,portfolio.ilike.%${query}%`);
        }

        const { data, count, error } = await q
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        res.json({ data, count });
    } catch (err) {
        console.error('Error fetching programs:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Single Program Full Details
app.get('/api/programs/:id', async (req, res) => {
    try {
        const programId = req.params.id;

        const [pRes, phRes, wRes, rRes, tRes] = await Promise.all([
            supabase.from('programs').select('*').eq('id', programId).single(),
            supabase.from('phases').select('*').eq('program_id', programId).order('order_index', { ascending: true }),
            supabase.from('workstreams').select('*').eq('program_id', programId),
            supabase.from('raid_items').select('*').eq('program_id', programId),
            supabase.from('tasks').select('*').eq('program_id', programId)
        ]);

        if (pRes.error) throw pRes.error;

        // Reconstruct AppData shape
        const p = pRes.data;
        const fullData = {
            id: p.id,
            programName: p.name,
            businessUnit: p.business_unit,
            portfolio: p.portfolio,
            sponsor: p.sponsor,
            pmName: p.pm,
            startDate: p.start_date,
            endDate: p.end_date,
            currency: p.currency,
            fiscalYearStart: p.fiscal_year_start,
            description: p.description,
            objectives: p.objectives,
            successMetrics: p.success_metrics,
            strategicThemes: p.strategic_themes,
            constraints: p.constraints,
            regulatoryDrivers: p.regulatory_drivers,
            branding: p.branding,
            source_system: p.source_system,
            external_project_key: p.external_project_key,

            phases: (phRes.data || []).map(x => ({
                id: x.id, name: x.name, type: x.type, startDate: x.start_date, endDate: x.end_date,
                color: x.color, description: x.description, entryCriteria: x.entry_criteria, exitCriteria: x.exit_criteria
            })),
            workstreams: (wRes.data || []).map(x => ({
                id: x.id, name: x.name, owner: x.owner, department: x.department, criticality: x.criticality,
                status: x.status, deliverables: x.deliverables, milestones: x.milestones, dependencies: x.dependencies
            })),
            risks: (rRes.data || []).filter(r => r.category === 'Risk').map(r => ({
                id: r.id, description: r.description, category_string: r.sub_category, owner: r.owner,
                probability: r.probability, impact: r.impact, status: r.status, targetDate: r.target_date, mitigation: r.mitigation,
                external_id: r.external_id, external_url: r.external_url
            })),
            issues: (rRes.data || []).filter(r => r.category === 'Issue').map(i => ({
                id: i.id, description: i.description, category_string: i.sub_category, owner: i.owner,
                impact: i.impact, status: i.status, targetDate: i.target_date, mitigation: i.mitigation,
                external_id: i.external_id, external_url: i.external_url
            })),
            assumptions: (rRes.data || []).filter(r => r.category === 'Assumption').map(a => ({
                id: a.id, description: a.description, owner: a.owner, status: a.status,
                external_id: a.external_id, external_url: a.external_url
            })),
            dependencies: (rRes.data || []).filter(r => r.category === 'Dependency').map(d => ({
                id: d.id, description: d.description, owner: d.owner, status: d.status, targetDate: d.target_date,
                external_id: d.external_id, external_url: d.external_url
            })),
            tasks: (tRes.data || []).map(t => ({
                id: t.id, title: t.title, description: t.description, phase: t.phase_id, workstream: t.workstream_id,
                type: t.type, priority: t.priority, status: t.status, assignee: t.assignee, estimate: t.estimate,
                startDate: t.start_date, dueDate: t.due_date, external_id: t.external_id, external_url: t.external_url
            }))
        };

        res.json(fullData);
    } catch (err) {
        console.error('Error fetching program details:', err);
        res.status(500).json({ error: err.message });
    }
});

// Save Program (Upsert)
app.post('/api/programs', async (req, res) => {
    try {
        const data = req.body;
        
        const programPayload = {
            id: data.dbId || data.id || undefined,
            name: data.programName,
            business_unit: data.businessUnit,
            portfolio: data.portfolio,
            sponsor: data.sponsor,
            pm: data.pmName,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
            currency: data.currency,
            fiscal_year_start: parseInt(data.fiscalYearStart) || null,
            description: data.description,
            objectives: data.objectives,
            success_metrics: data.successMetrics,
            strategic_themes: data.strategicThemes,
            constraints: data.constraints,
            regulatory_drivers: data.regulatoryDrivers,
            branding: data.branding,
            source_system: data.source_system || 'Manual',
            external_project_key: data.external_project_key || null,
            updated_at: new Date()
        };

        const { data: saved, error } = await supabase
            .from('programs')
            .upsert(programPayload)
            .select()
            .single();

        if (error) throw error;
        
        await syncRelationalData(saved.id, data);
        res.json({ data: saved });
    } catch (err) {
        console.error('Error saving program:', err);
        res.status(500).json({ error: err.message });
    }
});

// Helper for saving nested data
async function syncRelationalData(programId, data) {
    // 1. Phases
    await supabase.from('phases').delete().eq('program_id', programId);
    if (data.phases && data.phases.length > 0) {
        const phases = data.phases.map((p, i) => ({
            program_id: programId, name: p.name, type: p.type, start_date: p.startDate || null,
            end_date: p.endDate || null, color: p.color, description: p.description,
            entry_criteria: p.entryCriteria, exit_criteria: p.exitCriteria, order_index: i
        }));
        await supabase.from('phases').insert(phases);
    }

    // 2. Workstreams
    await supabase.from('workstreams').delete().eq('program_id', programId);
    if (data.workstreams && data.workstreams.length > 0) {
        const ws = data.workstreams.map(w => ({
            program_id: programId, name: w.name, owner: w.owner, department: w.department,
            criticality: w.criticality, status: w.status, deliverables: w.deliverables,
            milestones: w.milestones, dependencies: w.dependencies
        }));
        await supabase.from('workstreams').insert(ws);
    }

    // 3. RAID
    await supabase.from('raid_items').delete().eq('program_id', programId);
    const raid = [
        ...(data.risks || []).map(r => ({ ...r, category: 'Risk' })),
        ...(data.issues || []).map(i => ({ ...i, category: 'Issue' })),
        ...(data.assumptions || []).map(a => ({ ...a, category: 'Assumption' })),
        ...(data.dependencies || []).map(d => ({ ...d, category: 'Dependency' }))
    ].map(item => ({
        program_id: programId, category: item.category, description: item.description,
        sub_category: item.category_string || '', owner: item.owner, probability: item.probability,
        impact: item.impact, status: item.status, target_date: item.targetDate || null,
        mitigation: item.mitigation, external_id: item.external_id || null, external_url: item.external_url || null
    }));
    if (raid.length > 0) await supabase.from('raid_items').insert(raid);

    // 4. Tasks
    await supabase.from('tasks').delete().eq('program_id', programId);
    if (data.tasks && data.tasks.length > 0) {
        const tasks = data.tasks.map(t => ({
            program_id: programId, phase_id: t.phase || null, workstream_id: t.workstream || null,
            title: t.title, description: t.description, type: t.type, priority: t.priority,
            status: t.status, assignee: t.assignee, estimate: t.estimate, start_date: t.startDate || null,
            due_date: t.dueDate || null, external_id: t.external_id || null, external_url: t.external_url || null
        }));
        await supabase.from('tasks').insert(tasks);
    }
}
// --- DOCUMENT EXPORT ROUTES ---

app.post('/api/export/excel', async (req, res) => {
    try {
        const buffer = await generateExcel(req.body);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ProgramPlan.xlsx"`);
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('Excel generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/export/ppt', async (req, res) => {
    try {
        const buffer = await generatePPT(req.body);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="ProgramPlan.pptx"`);
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('PPT generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/export/pdf', async (req, res) => {
    try {
        const buffer = await generatePDF(req.body);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ProgramPlan.pdf"`);
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- JIRA INTEGRATION ROUTES ---

// Jira API Proxy (Solves CORS — credentials never leave the server)
app.post('/api/jira/fetch', async (req, res) => {
    try {
        const { url, email, token, jql } = req.body;

        if (!url || !email || !token) {
            return res.status(400).json({ error: 'Missing Jira credentials (url, email, token).' });
        }

        const auth = Buffer.from(`${email}:${token}`).toString('base64');
        const jiraEndpoint = `${url}/rest/api/3/search?jql=${encodeURIComponent(jql || 'ORDER BY created DESC')}&maxResults=100`;

        const response = await fetch(jiraEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Jira responded with ${response.status}: ${text.substring(0, 200)}`);
        }

        const data = await response.json();
        res.json({ issues: data.issues || [], total: data.total || 0 });
    } catch (err) {
        console.error('Jira API proxy error:', err.message);
        res.status(502).json({ error: err.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Program Planner Backend running on http://localhost:${port}`);
});
