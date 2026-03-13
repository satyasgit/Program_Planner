// ===== PDF GENERATOR =====
// Uses jsPDF + jsPDF-AutoTable loaded via CDN

function generatePDF() {
    Steps.save(Wizard.currentStep());
    const d = AppData;
    if (!d.programName) { showToast('Please fill in Program Basics first (Step 1).', 'error'); return; }

    showSpinner('Generating PDF dossier…');
    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();   // 297
            const H = doc.internal.pageSize.getHeight();  // 210

            const pHex = d.branding.primaryColor || '#4f46e5';
            const sHex = d.branding.secondaryColor || '#7c3aed';
            const aHex = d.branding.accentColor || '#0891b2';
            const pRgb = hexToRgbArr(pHex);
            const sRgb = hexToRgbArr(sHex);
            const aRgb = hexToRgbArr(aHex);

            let pageNum = 0;
            const addPage = (bg) => {
                if (pageNum > 0) doc.addPage();
                pageNum++;
                doc.setFillColor(...(bg || [248, 247, 255]));
                doc.rect(0, 0, W, H, 'F');
            };
            const header = (title, sub) => {
                doc.setFillColor(...pRgb);
                doc.rect(0, 0, W, 22, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16); doc.setTextColor(255, 255, 255);
                doc.text(title, 10, 13);
                if (sub) { doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(sub, 10, 19); }
                // Logo initials
                if (d.branding.logoText) {
                    doc.setFillColor(...sRgb);
                    doc.ellipse(W - 14, 11, 7, 7, 'F');
                    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
                    doc.text(d.branding.logoText, W - 14, 13.5, { align: 'center' });
                }
            };
            const sectionTitle = (txt, y, color) => {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
                doc.setTextColor(...(color || pRgb));
                doc.text(txt, 10, y);
                doc.setDrawColor(...(color || pRgb));
                doc.setLineWidth(0.5); doc.line(10, y + 1.5, W - 10, y + 1.5);
            };
            const bodyText = (txt, x, y, maxW, fontSize = 9) => {
                doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize);
                doc.setTextColor(50, 50, 70);
                const lines = doc.splitTextToSize(txt || '—', maxW);
                doc.text(lines, x, y);
                return lines.length * (fontSize * 0.4);
            };

            // ─── PAGE 1: Cover ─────────────────────────────────────────
            addPage([15, 14, 23]);
            doc.setFillColor(...pRgb); doc.rect(0, 0, 6, H, 'F');
            doc.setFillColor(...sRgb); doc.rect(6, 0, 2.5, H, 'F');
            if (d.branding.logoText) {
                doc.setFillColor(...pRgb); doc.ellipse(30, 28, 14, 14, 'F');
                doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
                doc.text(d.branding.logoText, 30, 32, { align: 'center' });
            }
            if (d.branding.companyName) {
                doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 170, 200);
                doc.text(d.branding.companyName, 25, 50);
            }
            doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(240, 238, 255);
            const titleLines = doc.splitTextToSize(d.programName || 'Program', 200);
            doc.text(titleLines, 25, 65);
            doc.setFillColor(...aRgb); doc.rect(25, 75 + titleLines.length * 7, 60, 1.2, 'F');
            doc.setFontSize(14); doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 170, 200);
            doc.text('Program Steering Dossier', 25, 82 + titleLines.length * 7);
            const meta = [['Sponsor', d.sponsor], ['Program Manager', d.programManager], ['Start Date', d.startDate], ['End Date', d.endDate]];
            meta.forEach(([lbl, val], i) => {
                const bx = 25 + i * 65, by = 150;
                doc.setFillColor(30, 28, 46); doc.rect(bx, by, 60, 22, 'F');
                doc.setDrawColor(80, 80, 130); doc.rect(bx, by, 60, 22);
                doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(136, 136, 170);
                doc.text(lbl, bx + 3, by + 6);
                doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(232, 230, 240);
                doc.text(val || '—', bx + 3, by + 14);
            });
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 100);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 25, H - 8);

            // ─── PAGE 2: Program Summary ────────────────────────────────
            addPage();
            header('Program Summary', d.programName);
            let y = 30;
            sectionTitle('PROGRAM INFORMATION', y, pRgb); y += 5;
            const infoRows = [['Program Name', d.programName], ['Business Unit', d.businessUnit], ['Portfolio', d.portfolio], ['Executive Sponsor', d.sponsor], ['Program Manager', d.programManager], ['Start Date', d.startDate], ['Target End Date', d.endDate], ['Currency', d.currency]];
            doc.autoTable({ startY: y, head: [], body: infoRows, theme: 'plain', styles: { fontSize: 9, cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', textColor: pRgb, cellWidth: 50 }, 1: { textColor: [50, 50, 70] } }, margin: { left: 10, right: 10 } });
            y = doc.lastAutoTable.finalY + 6;
            sectionTitle('OBJECTIVES & SUCCESS METRICS', y, pRgb); y += 5;
            doc.autoTable({ startY: y, head: [], body: [[d.objectives || '—', d.successMetrics || '—']], theme: 'grid', styles: { fontSize: 8.5, cellPadding: 3, textColor: [50, 50, 70] }, headStyles: { fillColor: pRgb }, columnStyles: { 0: { cellWidth: 130, valign: 'top' }, 1: { cellWidth: 130, valign: 'top' } }, margin: { left: 10, right: 10 } });
            y = doc.lastAutoTable.finalY + 6;
            if (y < H - 30) {
                sectionTitle('STRATEGIC THEMES & CONSTRAINTS', y, pRgb); y += 5;
                doc.autoTable({ startY: y, head: [], body: [[d.strategicThemes || '—', d.constraints || '—']], theme: 'grid', styles: { fontSize: 8.5, cellPadding: 3, textColor: [50, 50, 70] }, columnStyles: { 0: { cellWidth: 130, valign: 'top' }, 1: { cellWidth: 130, valign: 'top' } }, margin: { left: 10, right: 10 } });
            }

            // ─── PAGE 3: Roadmap ────────────────────────────────────────
            if (d.phases.length > 0) {
                addPage();
                header('High-Level Program Roadmap', 'Phases and Workstreams');
                const phRows = d.phases.map(p => [p.name || '', p.type || '', p.startDate || '', p.endDate || '', p.entryCriteria || '', p.exitCriteria || '']);
                doc.autoTable({ startY: 28, head: [['Phase', 'Type', 'Start', 'End', 'Entry Criteria', 'Exit Criteria']], body: phRows, theme: 'striped', headStyles: { fillColor: pRgb, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' }, styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 85 }, 5: { cellWidth: 85 } }, margin: { left: 10, right: 10 } });
                let yr = doc.lastAutoTable.finalY + 8;
                if (d.workstreams.length > 0 && yr < H - 40) {
                    sectionTitle('WORKSTREAMS', yr, sRgb); yr += 5;
                    const wsRows = d.workstreams.map(w => [w.name, w.owner, w.criticality, w.deliverables, w.milestones]);
                    doc.autoTable({ startY: yr, head: [['Workstream', 'Owner', 'Criticality', 'Key Deliverables', 'Milestones']], body: wsRows, theme: 'striped', headStyles: { fillColor: sRgb, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' }, styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 32 }, 2: { cellWidth: 20 }, 3: { cellWidth: 88 }, 4: { cellWidth: 88 } }, margin: { left: 10, right: 10 } });
                }
            }

            // ─── PAGE 4: RAID Log ────────────────────────────────────────
            addPage();
            header('RAID Log', 'Risks · Assumptions · Issues · Dependencies');
            const allRaid = [
                ...d.risks.map(r => [r.id, 'Risk', r.category, r.description, r.probability, r.impact, r.mitigation, r.owner, r.targetDate, r.status]),
                ...d.issues.map(r => [r.id, 'Issue', r.category, r.description, 'N/A', r.impact, r.mitigation, r.owner, r.targetDate, r.status]),
                ...d.assumptions.map(r => [r.id, 'Assumption', r.category, r.description, 'N/A', 'N/A', r.mitigation, r.owner, r.targetDate, r.status]),
                ...d.dependencies.map(r => [r.id, 'Dependency', r.category, r.description, 'N/A', 'N/A', r.mitigation, r.owner, r.targetDate, r.status]),
            ];
            if (allRaid.length > 0) {
                doc.autoTable({ startY: 28, head: [['ID', 'Type', 'Category', 'Description', 'Prob.', 'Impact', 'Mitigation', 'Owner', 'Target Date', 'Status']], body: allRaid, theme: 'striped', headStyles: { fillColor: pRgb, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' }, styles: { fontSize: 7.5, cellPadding: 2, textColor: [40, 40, 60], overflow: 'linebreak' }, columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 18 }, 2: { cellWidth: 20 }, 3: { cellWidth: 55 }, 4: { cellWidth: 22 }, 5: { cellWidth: 16 }, 6: { cellWidth: 55 }, 7: { cellWidth: 28 }, 8: { cellWidth: 20 }, 9: { cellWidth: 16 } }, margin: { left: 10, right: 10 } });
            } else {
                doc.setFontSize(12); doc.setTextColor(150, 150, 170);
                doc.text('No RAID items entered.', W / 2, H / 2, { align: 'center' });
            }

            // ─── PAGE 5: Stakeholders & Comms ────────────────────────────
            if (d.stakeholders.length > 0 || d.communicationPlan.length > 0) {
                addPage();
                header('Stakeholders & Communication Plan', 'RACI and cadence');
                if (d.stakeholders.length > 0) {
                    const shRows = d.stakeholders.map(s => [s.name, s.role, s.influence, s.interest, s.raci, s.notes]);
                    doc.autoTable({ startY: 28, head: [['Name', 'Role', 'Influence', 'Interest', 'RACI', 'Engagement Notes']], body: shRows, theme: 'striped', headStyles: { fillColor: pRgb, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' }, styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] }, columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold' }, 1: { cellWidth: 40 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 12 }, 5: { cellWidth: 130 } }, margin: { left: 10, right: 10 } });
                }
                if (d.communicationPlan.length > 0) {
                    let yc = (doc.lastAutoTable?.finalY || 28) + 8;
                    sectionTitle('COMMUNICATION PLAN', yc, aRgb); yc += 5;
                    const cRows = d.communicationPlan.map(c => [c.title, c.audience, c.frequency, c.format, c.owner, c.notes]);
                    doc.autoTable({ startY: yc, head: [['Event', 'Audience', 'Frequency', 'Format', 'Owner', 'Notes']], body: cRows, theme: 'striped', headStyles: { fillColor: aRgb, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' }, styles: { fontSize: 8, cellPadding: 2.5, textColor: [40, 40, 60] }, columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 42 }, 2: { cellWidth: 22 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 }, 5: { cellWidth: 90 } }, margin: { left: 10, right: 10 } });
                }
            }

            // ─── Page numbers ─────────────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 170);
                doc.text(`${d.programName || 'Program'} — Confidential`, 10, H - 4);
                doc.text(`Page ${i} of ${totalPages}`, W - 10, H - 4, { align: 'right' });
                doc.setDrawColor(...pRgb); doc.setLineWidth(0.3); doc.line(10, H - 6, W - 10, H - 6);
            }

            const fileName = `${safeFileName(d.programName)}_Program_Dossier_${today()}.pdf`;

            // Generate blob and trigger manual download
            const blob = doc.output('blob');
            downloadBlob(blob, fileName);

            hideSpinner();
            showToast(`✓ PDF exported: ${fileName}`);
        } catch (err) {
            hideSpinner();
            console.error(err);
            showToast('PDF generation failed: ' + err.message, 'error');
        }
    }, 100);
}

function hexToRgbArr(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
