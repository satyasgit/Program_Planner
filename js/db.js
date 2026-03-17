// ===== SUPABASE DATABASE SERVICE =====
// Handles all relational storage logic

const DB = (() => {
    let supabase = null;

    // Initialize Supabase Client
    function init() {
        if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || !SUPABASE_CONFIG.url) {
            console.warn('Supabase URL not configured. Database features will be disabled.');
            return false;
        }
        try {
            supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('Supabase initialized ✓');
            return true;
        } catch (e) {
            console.error('Supabase init error:', e);
            return false;
        }
    }

    // --- Save Program (Upsert) ---
    async function saveProgram(data) {
        if (!supabase) return { error: { message: 'Database not initialized. Please configure Supabase in data.js.' } };

        const programData = {
            id: data.dbId || undefined,
            name: data.programName,
            business_unit: data.businessUnit,
            portfolio: data.portfolio,
            sponsor: data.sponsor,
            pm: data.programManager,
            start_date: data.startDate || null,
            end_date: data.endDate || null,
            currency: data.currency,
            fiscal_year_start: parseInt(data.fiscalYearStart),
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
            .upsert(programData)
            .select()
            .single();

        if (error) return { error };

        // Update local dbId
        data.dbId = saved.id;

        // Perform sub-table syncs (simplified: clear and re-insert)
        // In a real production app, you'd do diffing, but for this automation suite,
        // clear-and-reinsert ensures consistency for high-level planning.
        await syncRelationalData(saved.id, data);

        return { data: saved };
    }

    async function syncRelationalData(programId, data) {
        // 1. Phases
        await supabase.from('phases').delete().eq('program_id', programId);
        if (data.phases.length > 0) {
            const phases = data.phases.map((p, i) => ({
                program_id: programId,
                name: p.name,
                type: p.type,
                start_date: p.startDate || null,
                end_date: p.endDate || null,
                color: p.color,
                description: p.description,
                entry_criteria: p.entryCriteria,
                exit_criteria: p.exitCriteria,
                order_index: i
            }));
            await supabase.from('phases').insert(phases);
        }

        // 2. Workstreams
        await supabase.from('workstreams').delete().eq('program_id', programId);
        if (data.workstreams.length > 0) {
            const ws = data.workstreams.map(w => ({
                program_id: programId,
                name: w.name,
                owner: w.owner,
                department: w.department,
                criticality: w.criticality,
                status: w.status,
                deliverables: w.deliverables,
                milestones: w.milestones,
                dependencies: w.dependencies
            }));
            await supabase.from('workstreams').insert(ws);
        }

        // 3. RAID Items
        await supabase.from('raid_items').delete().eq('program_id', programId);
        const raid = [
            ...data.risks.map(r => ({ ...r, category: 'Risk' })),
            ...data.issues.map(i => ({ ...i, category: 'Issue' })),
            ...data.assumptions.map(a => ({ ...a, category: 'Assumption' })),
            ...data.dependencies.map(d => ({ ...d, category: 'Dependency' }))
        ].map(item => ({
            program_id: programId,
            category: item.category,
            description: item.description,
            sub_category: item.category_string || '', // 'category' in RAID objects is text subcat
            owner: item.owner,
            probability: item.probability,
            impact: item.impact,
            status: item.status,
            target_date: item.targetDate || null,
            mitigation: item.mitigation,
            external_id: item.external_id || null,
            external_url: item.external_url || null
        }));
        if (raid.length > 0) await supabase.from('raid_items').insert(raid);

        // 4. Tasks
        await supabase.from('tasks').delete().eq('program_id', programId);
        if (data.tasks && data.tasks.length > 0) {
            const tasks = data.tasks.map(t => ({
                program_id: programId,
                phase_id: t.phase || null,
                workstream_id: t.workstream || null,
                title: t.title,
                description: t.description,
                type: t.type,
                priority: t.priority,
                status: t.status,
                assignee: t.assignee,
                estimate: t.estimate,
                start_date: t.startDate || null,
                due_date: t.dueDate || null,
                external_id: t.external_id || null,
                external_url: t.external_url || null
            }));
            await supabase.from('tasks').insert(tasks);
        }
    }

    // --- Search Programs ---
    async function searchPrograms(query = '', page = 1, pageSize = 6) {
        if (!supabase) return { data: [], count: 0 };

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

        if (error) { console.error(error); return { data: [], count: 0 }; }
        return { data, count };
    }

    // --- Load Full Program ---
    async function loadProgram(id) {
        if (!supabase) return null;

        const { data: p, error } = await supabase
            .from('programs')
            .select(`
                *,
                phases(*),
                workstreams(*),
                raid_items(*),
                tasks(*)
            `)
            .eq('id', id)
            .single();

        if (error) { console.error(error); return null; }

        // Map relational data back to AppData structure
        return {
            dbId: p.id,
            programName: p.name,
            businessUnit: p.business_unit,
            portfolio: p.portfolio,
            sponsor: p.sponsor,
            programManager: p.pm,
            startDate: p.start_date,
            endDate: p.end_date,
            currency: p.currency,
            fiscalYearStart: p.fiscal_year_start.toString(),
            description: p.description,
            objectives: p.objectives,
            successMetrics: p.success_metrics,
            strategicThemes: p.strategic_themes,
            constraints: p.constraints,
            regulatoryDrivers: p.regulatory_drivers,
            branding: p.branding,
            // Sub-collections
            phases: p.phases.sort((a, b) => a.order_index - b.order_index).map(f => ({
                id: f.id, name: f.name, type: f.type, startDate: f.start_date, endDate: f.end_date, color: f.color, description: f.description, entryCriteria: f.entry_criteria, exitCriteria: f.exit_criteria
            })),
            workstreams: p.workstreams.map(w => ({
                id: w.id, name: w.name, owner: w.owner, department: w.department, criticality: w.criticality, status: w.status, deliverables: w.deliverables, milestones: w.milestones, dependencies: w.dependencies
            })),
            risks: p.raid_items.filter(r => r.category === 'Risk').map(mapRaid),
            issues: p.raid_items.filter(r => r.category === 'Issue').map(mapRaid),
            assumptions: p.raid_items.filter(r => r.category === 'Assumption').map(mapRaid),
            dependencies: p.raid_items.filter(r => r.category === 'Dependency').map(mapRaid),
            tasks: p.tasks.map(t => ({
                id: t.id, title: t.title, type: t.type, priority: t.priority, status: t.status, estimate: t.estimate, phase: t.phase_id, workstream: t.workstream_id, assignee: t.assignee, description: t.description, startDate: t.start_date, dueDate: t.due_date
            })),
            outputs: { excel: true, ppt: true, pdf: true }
        };
    }

    function mapRaid(r) {
        return {
            id: r.id,
            category: r.sub_category,
            description: r.description,
            probability: r.probability,
            impact: r.impact,
            owner: r.owner,
            targetDate: r.target_date,
            status: r.status,
            mitigation: r.mitigation
        };
    }

    return { init, saveProgram, searchPrograms, loadProgram };
})();
