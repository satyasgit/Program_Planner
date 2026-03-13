// ===== EXCEL GENERATOR (Enhanced with ExcelJS) =====
// Uses ExcelJS loaded via CDN

const ExcelGenerator = (() => {
    // ---- Styling Constants ----
    const PRIMARY_BLUE = 'FF4F46E5'; // Excel hex is ARGB
    const WHITE = 'FFFFFFFF';
    const LIGHT_GRAY = 'FFF3F4F6';
    const BORDER_COLOR = 'FFD1D5DB';

    async function generate() {
        Steps.save(Wizard.currentStep());
        const d = AppData;

        showSpinner('Generating polished Excel workbook...');

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ProgramPlanner';
            workbook.lastModifiedBy = 'ProgramPlanner';
            workbook.created = new Date();

            // Build all sheets
            buildRoadmapSheet(workbook, d);
            buildDetailedPlanSheet(workbook, d);
            buildWorkstreamsSheet(workbook, d);
            buildRAIDSheet(workbook, d);
            buildStakeholdersSheet(workbook, d);
            buildGanttSheet(workbook, d);

            // Export
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const urlName = `${safeFileName(d.programName)}_ProgramPlan.xlsx`;
            Wizard.downloadBlob(blob, urlName);

            hideSpinner();
            showToast('Excel downloaded ✓', 'success');
        } catch (e) {
            console.error('Excel generation error:', e);
            hideSpinner();
            showToast('Excel generation failed: ' + e.message, 'error');
        }
    }

    // ---- Helper: Styled Header ----
    function applyHeaderStyle(row, color = PRIMARY_BLUE) {
        row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.replace('#', 'FF') } };
            cell.font = { color: { argb: WHITE }, bold: true, size: 11, name: 'Calibri' };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        row.height = 30;
    }

    // ---- Helper: Data Cells ----
    function applyDataStyle(row, rowIndex) {
        row.eachCell((cell) => {
            cell.font = { size: 10, name: 'Calibri' };
            cell.alignment = { vertical: 'top', wrapText: true };
            if (rowIndex % 2 === 0) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Very light gray
            }
            cell.border = {
                top: { style: 'thin', color: { argb: BORDER_COLOR } },
                left: { style: 'thin', color: { argb: BORDER_COLOR } },
                bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
                right: { style: 'thin', color: { argb: BORDER_COLOR } }
            };
        });
    }

    // ---- Sheet 1: Roadmap ----
    function buildRoadmapSheet(workbook, d) {
        const ws = workbook.addWorksheet('1. Roadmap');
        const headers = ['#', 'Phase', 'Type', 'Start Date', 'End Date', 'Duration', 'Owner', 'Status', 'Description'];
        ws.addRow(headers);
        applyHeaderStyle(ws.getRow(1), d.branding.primaryColor);

        d.phases.forEach((p, i) => {
            const start = p.startDate ? new Date(p.startDate) : null;
            const end = p.endDate ? new Date(p.endDate) : null;
            let dur = '';
            if (start && end) {
                const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
                dur = `${diff}w`;
            }
            const row = ws.addRow([i + 1, p.name, p.type, p.startDate, p.endDate, dur, d.programManager, 'Planned', p.description]);
            applyDataStyle(row, i + 1);
        });

        ws.columns = [
            { width: 5 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 25 }, { width: 15 }, { width: 50 }
        ];

        // Summary Block below
        ws.addRow([]); ws.addRow([]);
        const summaryStart = ws.rowCount + 1;
        const info = [
            ['Programme:', d.programName],
            ['Business Unit:', d.businessUnit],
            ['Portfolio:', d.portfolio],
            ['Executive Sponsor:', d.sponsor],
            ['Start Date:', d.startDate],
            ['Target End Date:', d.endDate],
            ['Objectives:', d.objectives],
        ];
        info.forEach((pair, idx) => {
            const r = ws.addRow(pair);
            r.getCell(1).font = { bold: true };
        });
    }

    // ---- Sheet 2: Detailed Plan ----
    function buildDetailedPlanSheet(workbook, d) {
        const ws = workbook.addWorksheet('2. Detailed Plan');
        const headers = ['ID', 'Task Title', 'Type', 'Phase', 'Workstream', 'Priority', 'Status', 'Assignee', 'Start Date', 'Due Date'];
        ws.addRow(headers);
        applyHeaderStyle(ws.getRow(1), d.branding.primaryColor);

        const phaseMap = Object.fromEntries(d.phases.map(p => [p.id, p.name]));
        const wsMap = Object.fromEntries(d.workstreams.map(w => [w.id, w.name]));

        d.tasks.forEach((t, i) => {
            const row = ws.addRow([
                t.id, t.title, t.type, phaseMap[t.phase] || t.phase,
                wsMap[t.workstream] || t.workstream, t.priority, t.status,
                t.assignee, t.startDate, t.dueDate
            ]);
            applyDataStyle(row, i + 1);
        });

        ws.columns = [
            { width: 10 }, { width: 40 }, { width: 12 }, { width: 20 }, { width: 20 },
            { width: 12 }, { width: 15 }, { width: 20 }, { width: 15 }, { width: 15 }
        ];
    }

    // ---- Sheet 3: Workstreams ----
    function buildWorkstreamsSheet(workbook, d) {
        const ws = workbook.addWorksheet('3. Workstreams');
        ws.addRow(['#', 'Workstream', 'Owner', 'Criticality', 'Status', 'Deliverables', 'Dependencies']);
        applyHeaderStyle(ws.getRow(1), d.branding.primaryColor);

        d.workstreams.forEach((w, i) => {
            const row = ws.addRow([i + 1, w.name, w.owner, w.criticality, w.status, w.deliverables, w.dependencies]);
            applyDataStyle(row, i + 1);
        });

        ws.columns = [
            { width: 5 }, { width: 30 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 40 }, { width: 40 }
        ];
    }

    // ---- Sheet 4: RAID Log ----
    function buildRAIDSheet(workbook, d) {
        const ws = workbook.addWorksheet('4. RAID Log');
        ws.addRow(['ID', 'Type', 'Category', 'Description', 'Impact', 'Mitigation / Strategy', 'Owner', 'Status']);
        applyHeaderStyle(ws.getRow(1), d.branding.primaryColor);

        const all = [
            ...d.risks.map(r => [r.id, 'Risk', r.category, r.description, r.impact, r.mitigation, r.owner, r.status]),
            ...d.issues.map(i => [i.id, 'Issue', i.category, i.description, i.impact, i.mitigation, i.owner, i.status]),
            ...d.assumptions.map(a => [a.id, 'Assumption', a.category, a.description, 'N/A', a.mitigation, a.owner, a.status]),
            ...d.dependencies.map(dp => [dp.id, 'Dependency', dp.category, dp.description, 'N/A', dp.mitigation, dp.owner, dp.status])
        ];

        all.forEach((item, i) => {
            const row = ws.addRow(item);
            applyDataStyle(row, i + 1);
        });

        ws.columns = [
            { width: 10 }, { width: 12 }, { width: 20 }, { width: 50 }, { width: 12 }, { width: 50 }, { width: 20 }, { width: 15 }
        ];
    }

    // ---- Sheet 5: Stakeholders ----
    function buildStakeholdersSheet(workbook, d) {
        const ws = workbook.addWorksheet('5. Stakeholders');
        ws.addRow(['Name', 'Role', 'Influence', 'Interest', 'RACI', 'Notes']);
        applyHeaderStyle(ws.getRow(1), d.branding.primaryColor);

        d.stakeholders.forEach((s, i) => {
            const row = ws.addRow([s.name, s.role, s.influence, s.interest, s.raci, s.notes]);
            applyDataStyle(row, i + 1);
        });

        ws.columns = [
            { width: 25 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 10 }, { width: 60 }
        ];
    }

    // ---- Sheet 6: GANTT CHART (Visual) ----
    function buildGanttSheet(workbook, d) {
        const ws = workbook.addWorksheet('6. Gantt Visual');
        if (d.phases.length === 0) return;

        // Find timeline range
        const dates = d.phases.flatMap(p => [p.startDate, p.endDate]).filter(Boolean).map(s => new Date(s));
        if (dates.length === 0) return;

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Align to week start (Sunday or Monday)
        const startDay = new Date(minDate);
        startDay.setDate(startDay.getDate() - startDay.getDay()); // Sunday

        const endDay = new Date(maxDate);
        endDay.setDate(endDay.getDate() + (14 - endDay.getDay())); // Two weeks buffer

        const diffDays = Math.ceil((endDay - startDay) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.ceil(diffDays / 7);

        // Header Rows
        const row1 = ws.getRow(1);
        const row2 = ws.getRow(2);
        row1.getCell(1).value = 'Phase / Timeline';

        // Column Setup
        ws.getColumn(1).width = 30;
        for (let i = 0; i < totalWeeks; i++) {
            const colIdx = i + 2;
            const weekDate = new Date(startDay);
            weekDate.setDate(weekDate.getDate() + (i * 7));

            row1.getCell(colIdx).value = `W${i + 1}`;
            row2.getCell(colIdx).value = weekDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
            ws.getColumn(colIdx).width = 5;
        }
        applyHeaderStyle(row1, d.branding.primaryColor);
        applyHeaderStyle(row2, d.branding.secondaryColor || '#7c3aed');

        // Draw Phases
        d.phases.forEach((p, pIdx) => {
            const rowIndex = pIdx + 3;
            const r = ws.getRow(rowIndex);
            r.getCell(1).value = p.name;
            r.getCell(1).font = { bold: true };
            r.getCell(1).border = { right: { style: 'medium' } };

            if (p.startDate && p.endDate) {
                const ps = new Date(p.startDate);
                const pe = new Date(p.endDate);

                for (let i = 0; i < totalWeeks; i++) {
                    const colIdx = i + 2;
                    const wsInWeek = new Date(startDay);
                    wsInWeek.setDate(wsInWeek.getDate() + (i * 7));
                    const weInWeek = new Date(wsInWeek);
                    weInWeek.setDate(wsInWeek.getDate() + 7);

                    // Check if phase overlaps this week
                    if (pe >= wsInWeek && ps <= weInWeek) {
                        const cell = r.getCell(colIdx);
                        const phaseColor = (p.color || d.branding.primaryColor).replace('#', 'FF');
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: phaseColor } };
                        // Tooltip-like value
                        cell.note = `${p.name}\n${p.startDate} to ${p.endDate}`;
                    }
                }
            }
            r.height = 20;
        });

        // Legend / Key
        ws.addRow([]);
        const legendRow = ws.addRow(['KEY / LEGEND']);
        legendRow.getCell(1).font = { bold: true, size: 12 };
    }

    return { generate };
})();
