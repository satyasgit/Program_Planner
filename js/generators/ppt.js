// ===== POWERPOINT GENERATOR =====
// Uses PptxGenJS loaded via CDN

function generatePPT() {
    Steps.save(Wizard.currentStep());
    const d = AppData;
    if (!d.programName) { showToast('Please fill in Program Basics first (Step 1).', 'error'); return; }

    showSpinner('Generating PowerPoint deck…');
    setTimeout(() => {
        try {
            const prs = new PptxGenJS();
            prs.layout = 'LAYOUT_WIDE';

            const pColor = (d.branding.primaryColor || '#4f46e5').replace('#', '');
            const sColor = (d.branding.secondaryColor || '#7c3aed').replace('#', '');
            const aColor = (d.branding.accentColor || '#0891b2').replace('#', '');
            const DARK = '0F0E17';
            const LIGHT = 'F8F7FF';

            const addHeader = (slide, title, sub) => {
                slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: pColor } });
                slide.addText(title, { x: 0.4, y: 0.12, w: 10, h: 0.6, fontSize: 22, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
                if (sub) slide.addText(sub, { x: 0.4, y: 0.68, w: 10, h: 0.3, fontSize: 11, color: 'DDDDF0', fontFace: 'Calibri' });
                if (d.branding.logoText) {
                    slide.addShape(prs.ShapeType.ellipse, { x: 12.3, y: 0.18, w: 0.7, h: 0.7, fill: { color: sColor } });
                    slide.addText(d.branding.logoText, { x: 12.3, y: 0.18, w: 0.7, h: 0.7, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Calibri' });
                }
            };

            // SLIDE 1: Title
            const s1 = prs.addSlide();
            s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: DARK } });
            s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: '100%', fill: { color: pColor } });
            s1.addShape(prs.ShapeType.rect, { x: 0.25, y: 0, w: 0.08, h: '100%', fill: { color: sColor } });
            if (d.branding.logoText) {
                s1.addShape(prs.ShapeType.ellipse, { x: 1.2, y: 0.6, w: 1.1, h: 1.1, fill: { color: pColor } });
                s1.addText(d.branding.logoText, { x: 1.2, y: 0.6, w: 1.1, h: 1.1, fontSize: 26, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Calibri' });
            }
            if (d.branding.companyName) s1.addText(d.branding.companyName, { x: 1.2, y: 1.85, w: 5, h: 0.4, fontSize: 13, color: 'AAAACC', fontFace: 'Calibri' });
            s1.addText(d.programName || 'Program Name', { x: 1.2, y: 2.4, w: 11, h: 1.2, fontSize: 34, bold: true, color: 'F0EEFF', fontFace: 'Calibri Light', wrap: true });
            s1.addShape(prs.ShapeType.rect, { x: 1.2, y: 3.7, w: 4, h: 0.06, fill: { color: aColor } });
            s1.addText('Program Steering Pack', { x: 1.2, y: 3.85, w: 8, h: 0.4, fontSize: 16, color: 'AAAACC', fontFace: 'Calibri' });
            const meta = [['Sponsor', d.sponsor], ['Prog. Mgr', d.programManager], ['Start', d.startDate], ['End', d.endDate]];
            meta.forEach(([lbl, val], i) => {
                const x = 1.2 + i * 2.9;
                s1.addShape(prs.ShapeType.rect, { x, y: 4.65, w: 2.6, h: 0.95, fill: { color: '1E1C2E' }, line: { color: '333355', width: 1 } });
                s1.addText(lbl, { x: x + 0.12, y: 4.71, w: 2.36, h: 0.28, fontSize: 9, color: '8888AA', fontFace: 'Calibri', bold: true });
                s1.addText(val || '—', { x: x + 0.12, y: 5.0, w: 2.36, h: 0.48, fontSize: 11, color: 'E8E6F0', fontFace: 'Calibri', wrap: true });
            });
            s1.addText(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, { x: 1.2, y: 6.9, w: 6, h: 0.3, fontSize: 9, color: '555570', fontFace: 'Calibri' });

            // SLIDE 2: Program Overview
            const s2 = prs.addSlide();
            s2.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s2, 'Program Overview', d.programName);
            const boxes = [
                { x: 0.4, y: 1.25, w: 5.9, h: 3.1, bg: 'EEEEFF', bc: pColor, lbl: 'OBJECTIVES', lc: pColor, val: d.objectives },
                { x: 6.7, y: 1.25, w: 5.9, h: 3.1, bg: 'E8FFF5', bc: aColor, lbl: 'SUCCESS METRICS / KPIs', lc: aColor, val: d.successMetrics },
                { x: 0.4, y: 4.6, w: 5.9, h: 1.5, bg: 'F3F0FF', bc: sColor, lbl: 'STRATEGIC THEMES', lc: sColor, val: d.strategicThemes },
                { x: 6.7, y: 4.6, w: 5.9, h: 1.5, bg: 'FFF8E8', bc: 'D97706', lbl: 'CONSTRAINTS', lc: 'D97706', val: d.constraints },
            ];
            boxes.forEach(b => {
                s2.addShape(prs.ShapeType.rect, { x: b.x, y: b.y, w: b.w, h: b.h, fill: { color: b.bg }, line: { color: b.bc, width: 2 } });
                s2.addText(b.lbl, { x: b.x + 0.15, y: b.y + 0.1, w: b.w - 0.3, h: 0.28, fontSize: 9, bold: true, color: b.lc, fontFace: 'Calibri' });
                s2.addText(b.val || '—', { x: b.x + 0.15, y: b.y + 0.42, w: b.w - 0.3, h: b.h - 0.52, fontSize: 10, color: '222233', fontFace: 'Calibri', valign: 'top', wrap: true });
            });

            // SLIDE 3: Roadmap
            const s3 = prs.addSlide();
            s3.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s3, 'High-Level Program Roadmap', 'Phases and Workstreams');
            if (d.phases.length > 0 && d.startDate) {
                const pStart = new Date(d.startDate);
                const pEnd = new Date(d.endDate || d.phases[d.phases.length - 1]?.endDate || d.startDate);
                const totalMs = Math.max(pEnd - pStart, 1);
                const barAreaX = 3.2, barAreaW = 9.8;
                const rowH = 0.42, rowGap = 0.07;
                // Quarter lines
                let qd = new Date(pStart.getFullYear(), Math.floor(pStart.getMonth() / 3) * 3, 1);
                while (qd <= pEnd) {
                    const xq = barAreaX + ((qd - pStart) / totalMs) * barAreaW;
                    if (xq >= barAreaX && xq <= barAreaX + barAreaW) {
                        s3.addText(`Q${Math.floor(qd.getMonth() / 3) + 1}'${qd.getFullYear().toString().slice(2)}`, { x: xq, y: 1.18, w: 1, h: 0.22, fontSize: 8, color: '888899', fontFace: 'Calibri', bold: true });
                        s3.addShape(prs.ShapeType.line, { x: xq, y: 1.38, w: 0, h: 5.5, line: { color: 'CCCCDD', width: 0.5, dashType: 'dash' } });
                    }
                    qd = new Date(qd.getFullYear(), qd.getMonth() + 3, 1);
                }
                // Phase bars
                d.phases.forEach((p, i) => {
                    const y = 1.4 + i * (rowH + rowGap);
                    s3.addText(p.name || `Phase ${i + 1}`, { x: 0.4, y: y + 0.06, w: 2.7, h: rowH - 0.12, fontSize: 10, bold: true, color: '222233', fontFace: 'Calibri', valign: 'middle' });
                    if (p.startDate && p.endDate) {
                        const bx = barAreaX + ((new Date(p.startDate) - pStart) / totalMs) * barAreaW;
                        const bw = Math.max(0.15, ((new Date(p.endDate) - new Date(p.startDate)) / totalMs) * barAreaW);
                        const bc = (p.color || '#' + pColor).replace('#', '');
                        s3.addShape(prs.ShapeType.rect, { x: bx, y: y + 0.04, w: bw, h: rowH - 0.08, fill: { color: bc }, line: { color: bc, width: 0 } });
                        s3.addText(p.type || '', { x: bx + 0.06, y: y + 0.1, w: Math.max(0.06, bw - 0.1), h: rowH - 0.28, fontSize: 8, color: 'FFFFFF', fontFace: 'Calibri', bold: true });
                    }
                });
                // Workstream rows
                const wsY0 = 1.4 + d.phases.length * (rowH + rowGap) + 0.3;
                s3.addText('WORKSTREAMS', { x: 0.4, y: wsY0 - 0.28, w: 12, h: 0.24, fontSize: 9, bold: true, color: pColor, fontFace: 'Calibri' });
                d.workstreams.slice(0, 4).forEach((w, i) => {
                    const y = wsY0 + i * (rowH + rowGap);
                    s3.addText(w.name || `WS ${i + 1}`, { x: 0.4, y: y + 0.04, w: 2.7, h: rowH - 0.1, fontSize: 9, color: '333344', fontFace: 'Calibri', valign: 'middle' });
                    const cc = w.criticality === 'High' ? '4f46e5' : w.criticality === 'Medium' ? '0891b2' : '059669';
                    s3.addShape(prs.ShapeType.rect, { x: barAreaX, y: y + 0.08, w: barAreaW, h: rowH - 0.18, fill: { color: cc + '22' }, line: { color: cc + '55', width: 1 } });
                    s3.addText(w.milestones || '', { x: barAreaX + 0.1, y: y + 0.1, w: barAreaW - 0.2, h: rowH - 0.2, fontSize: 8, color: '333344', fontFace: 'Calibri', valign: 'middle' });
                });
            } else {
                s3.addText('No phases defined. Please complete Steps 2 & 3.', { x: 1, y: 3, w: 11, h: 1, fontSize: 16, color: '888899', align: 'center', fontFace: 'Calibri' });
            }

            // SLIDE 4: Milestones table
            const s4 = prs.addSlide();
            s4.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s4, 'Key Milestones & Phase Gates', 'Entry and exit criteria per phase');
            if (d.phases.length > 0) {
                const rows4 = [
                    [{ text: 'Phase', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Start', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'End', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Entry Criteria', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Exit Criteria', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }],
                    ...d.phases.map((p, i) => { const f = { color: i % 2 === 0 ? 'EEEEFC' : 'FFFFFF' }; return [{ text: p.name || '', options: { fill: f, bold: true, color: '222233' } }, { text: p.startDate || '', options: { fill: f, color: '333344' } }, { text: p.endDate || '', options: { fill: f, color: '333344' } }, { text: p.entryCriteria || '', options: { fill: f, fontSize: 9, color: '555566' } }, { text: p.exitCriteria || '', options: { fill: f, fontSize: 9, color: '555566' } }]; })
                ];
                s4.addTable(rows4, { x: 0.4, y: 1.25, w: 12.6, colW: [2.6, 1.2, 1.2, 3.8, 3.8], fontSize: 10, border: { type: 'solid', color: 'CCCCEE', pt: 1 }, fontFace: 'Calibri' });
            } else {
                s4.addText('No phases defined.', { x: 1, y: 3, w: 11, h: 1, fontSize: 16, color: '888899', align: 'center', fontFace: 'Calibri' });
            }

            // SLIDE 5: RAID
            const s5 = prs.addSlide();
            s5.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s5, 'RAID Summary', 'Risks · Assumptions · Issues · Dependencies');
            const raidSec = [{ lbl: 'RISKS', items: d.risks, col: 'DC2626' }, { lbl: 'ISSUES', items: d.issues, col: 'D97706' }, { lbl: 'ASSUMPTIONS', items: d.assumptions, col: '0891B2' }, { lbl: 'DEPENDENCIES', items: d.dependencies, col: '7C3AED' }];
            raidSec.forEach((sec, si) => {
                const cx = 0.4 + (si % 2) * 6.5, cy = 1.25 + Math.floor(si / 2) * 3.0;
                s5.addShape(prs.ShapeType.rect, { x: cx, y: cy, w: 6.2, h: 2.7, fill: { color: 'FFFFFF' }, line: { color: sec.col, width: 2 } });
                s5.addShape(prs.ShapeType.rect, { x: cx, y: cy, w: 6.2, h: 0.35, fill: { color: sec.col } });
                s5.addText(`${sec.lbl} (${sec.items.length})`, { x: cx + 0.1, y: cy + 0.04, w: 6, h: 0.28, fontSize: 10, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
                sec.items.slice(0, 3).forEach((item, ii) => {
                    const iy = cy + 0.45 + ii * 0.7;
                    s5.addShape(prs.ShapeType.rect, { x: cx + 0.12, y: iy, w: 5.96, h: 0.62, fill: { color: sec.col + '11' }, line: { color: sec.col + '33', width: 0.5 } });
                    s5.addText(item.description || '—', { x: cx + 0.22, y: iy + 0.04, w: 5.76, h: 0.36, fontSize: 9, color: '222233', fontFace: 'Calibri', wrap: true });
                    s5.addText(`Owner: ${item.owner || '—'}  |  ${item.status || ''}`, { x: cx + 0.22, y: iy + 0.4, w: 5.76, h: 0.18, fontSize: 7.5, color: '888899', fontFace: 'Calibri' });
                });
                if (!sec.items.length) s5.addText('None identified', { x: cx + 0.12, y: cy + 1.1, w: 5.96, h: 0.3, fontSize: 10, color: '888899', fontFace: 'Calibri', align: 'center', italic: true });
            });

            // SLIDE 6: Workstream Status
            const s6 = prs.addSlide();
            s6.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s6, 'Workstream Status', 'Current focus and deliverables');
            if (d.workstreams.length > 0) {
                const rows6 = [
                    [{ text: 'Workstream', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Owner', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Criticality', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Deliverables', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Milestones', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }],
                    ...d.workstreams.map((w, i) => { const f = { color: i % 2 === 0 ? 'EEEEFC' : 'FFFFFF' }; const cc = w.criticality === 'High' ? 'DC2626' : w.criticality === 'Medium' ? 'D97706' : '059669'; return [{ text: w.name || '', options: { fill: f, bold: true, color: '222233' } }, { text: w.owner || '', options: { fill: f, color: '333344' } }, { text: w.criticality || '', options: { fill: f, bold: true, color: cc } }, { text: (w.deliverables || '').slice(0, 100), options: { fill: f, fontSize: 9, color: '444455' } }, { text: (w.milestones || '').slice(0, 100), options: { fill: f, fontSize: 9, color: '444455' } }]; })
                ];
                s6.addTable(rows6, { x: 0.4, y: 1.25, w: 12.6, colW: [2.8, 1.8, 1.2, 3.4, 3.4], fontSize: 10, border: { type: 'solid', color: 'CCCCEE', pt: 1 }, fontFace: 'Calibri' });
            }

            // SLIDE 7: Stakeholders
            const s7 = prs.addSlide();
            s7.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: LIGHT } });
            addHeader(s7, 'Stakeholder Map', 'RACI and engagement strategy');
            if (d.stakeholders.length > 0) {
                const rows7 = [
                    [{ text: 'Name', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Role', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Influence', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Interest', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'RACI', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }, { text: 'Notes', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }],
                    ...d.stakeholders.map((s, i) => { const f = { color: i % 2 === 0 ? 'EEEEFC' : 'FFFFFF' }; return [{ text: s.name || '', options: { fill: f, bold: true, color: '222233' } }, { text: s.role || '', options: { fill: f, color: '333344' } }, { text: s.influence || '', options: { fill: f, color: '444455' } }, { text: s.interest || '', options: { fill: f, color: '444455' } }, { text: s.raci || '', options: { fill: f, bold: true, color: pColor } }, { text: (s.notes || '').slice(0, 80), options: { fill: f, fontSize: 9, color: '555566' } }]; })
                ];
                s7.addTable(rows7, { x: 0.4, y: 1.25, w: 12.6, colW: [2.4, 2.5, 1.2, 1.2, 0.8, 4.5], fontSize: 10, border: { type: 'solid', color: 'CCCCEE', pt: 1 }, fontFace: 'Calibri' });
            }

            const fileName = `${safeFileName(d.programName)}_Steering_Pack_${today()}.pptx`;

            // Generate blob and trigger manual download
            prs.write('blob').then(content => {
                const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
                downloadBlob(blob, fileName);
                hideSpinner();
                showToast(`✓ PowerPoint exported: ${fileName}`);
            }).catch(e => {
                console.error(e);
                hideSpinner();
                showToast('PPT generation failed: ' + e.message, 'error');
            });
        } catch (err) {
            hideSpinner();
            console.error(err);
            showToast('PowerPoint generation failed: ' + err.message, 'error');
        }
    }, 100);
}

function hexToRgb(hex) {
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}
function rgbToHex({ r, g, b }) {
    return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
