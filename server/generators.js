// ===== SERVER-SIDE DOCUMENT GENERATORS =====
// These use the same NPM packages as the CDN versions but run in Node.js

const ExcelJS = require('exceljs');
const PptxGenJS = require('pptxgenjs');

// ── EXCEL GENERATOR ────────────────────────────────────────────
async function generateExcel(data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ProgramPlanner';
    workbook.created = new Date();

    const PRIMARY = 'FF4F46E5';
    const WHITE = 'FFFFFFFF';

    function headerStyle(row, color = PRIMARY) {
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.font = { color: { argb: WHITE }, bold: true, size: 11, name: 'Calibri' };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        row.height = 30;
    }

    function dataStyle(row, idx) {
        const bgColor = idx % 2 === 0 ? 'FFF3F4F6' : 'FFFFFFFF';
        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { size: 10, name: 'Calibri' };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
        });
    }

    // Overview Sheet
    const overview = workbook.addWorksheet('Program Overview');
    overview.columns = [{ width: 25 }, { width: 60 }];
    const titleRow = overview.addRow(['Programme Overview', '']);
    titleRow.font = { bold: true, size: 16, color: { argb: PRIMARY } };
    overview.addRow([]);
    const fields = [
        ['Programme Name', data.programName], ['Business Unit', data.businessUnit],
        ['Portfolio', data.portfolio], ['Sponsor', data.sponsor],
        ['Programme Manager', data.pmName || data.programManager],
        ['Start Date', data.startDate], ['End Date', data.endDate],
        ['Description', data.description], ['Objectives', data.objectives],
        ['Success Metrics', data.successMetrics], ['Strategic Themes', data.strategicThemes],
        ['Constraints', data.constraints], ['Regulatory Drivers', data.regulatoryDrivers]
    ];
    fields.forEach(([label, val]) => {
        const r = overview.addRow([label, val || '']);
        r.getCell(1).font = { bold: true, size: 10 };
    });

    // Phases Sheet
    if (data.phases && data.phases.length > 0) {
        const phaseSheet = workbook.addWorksheet('Phases');
        phaseSheet.columns = [
            { header: '#', width: 5 }, { header: 'Phase Name', width: 30 }, { header: 'Type', width: 12 },
            { header: 'Start Date', width: 14 }, { header: 'End Date', width: 14 }, { header: 'Description', width: 50 }
        ];
        headerStyle(phaseSheet.getRow(1));
        data.phases.forEach((p, i) => {
            const r = phaseSheet.addRow([i + 1, p.name, p.type, p.startDate || '', p.endDate || '', p.description || '']);
            dataStyle(r, i);
        });
    }

    // Tasks Sheet
    if (data.tasks && data.tasks.length > 0) {
        const taskSheet = workbook.addWorksheet('Task Backlog');
        taskSheet.columns = [
            { header: '#', width: 5 }, { header: 'Title', width: 35 }, { header: 'Type', width: 10 },
            { header: 'Priority', width: 10 }, { header: 'Status', width: 12 }, { header: 'Assignee', width: 18 },
            { header: 'Start', width: 12 }, { header: 'Due', width: 12 }
        ];
        headerStyle(taskSheet.getRow(1));
        data.tasks.forEach((t, i) => {
            const r = taskSheet.addRow([i + 1, t.title, t.type, t.priority, t.status, t.assignee, t.startDate || '', t.dueDate || '']);
            dataStyle(r, i);
        });
    }

    // RAID Sheet
    const raidItems = [...(data.risks || []).map(r => ({ ...r, cat: 'Risk' })),
        ...(data.issues || []).map(i => ({ ...i, cat: 'Issue' })),
        ...(data.assumptions || []).map(a => ({ ...a, cat: 'Assumption' })),
        ...(data.dependencies || []).map(d => ({ ...d, cat: 'Dependency' }))];
    if (raidItems.length > 0) {
        const raidSheet = workbook.addWorksheet('RAID Log');
        raidSheet.columns = [
            { header: 'Category', width: 14 }, { header: 'Description', width: 50 },
            { header: 'Owner', width: 18 }, { header: 'Impact', width: 10 },
            { header: 'Status', width: 12 }, { header: 'Mitigation', width: 40 }
        ];
        headerStyle(raidSheet.getRow(1));
        raidItems.forEach((item, i) => {
            const r = raidSheet.addRow([item.cat, item.description, item.owner, item.impact, item.status, item.mitigation || '']);
            dataStyle(r, i);
        });
    }

    return workbook.xlsx.writeBuffer();
}

// ── POWERPOINT GENERATOR ───────────────────────────────────────
async function generatePPT(data) {
    const prs = new PptxGenJS();
    prs.layout = 'LAYOUT_WIDE';

    const pColor = (data.branding?.primaryColor || '#4f46e5').replace('#', '');
    const sColor = (data.branding?.secondaryColor || '#7c3aed').replace('#', '');
    const DARK = '0F0E17';

    const addHeader = (slide, title, sub) => {
        slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.1, fill: { color: pColor } });
        slide.addText(title, { x: 0.4, y: 0.12, w: 10, h: 0.6, fontSize: 22, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
        if (sub) slide.addText(sub, { x: 0.4, y: 0.68, w: 10, h: 0.3, fontSize: 11, color: 'DDDDF0', fontFace: 'Calibri' });
    };

    // Title Slide
    const s1 = prs.addSlide();
    s1.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: pColor } });
    s1.addText(data.programName || 'Program Plan', { x: 0.8, y: 1.5, w: 11, h: 1.5, fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
    s1.addText(`${data.businessUnit || ''} | ${data.portfolio || ''}`, { x: 0.8, y: 3.2, w: 11, h: 0.6, fontSize: 16, color: 'E0E0FF', fontFace: 'Calibri' });
    s1.addText(`Sponsor: ${data.sponsor || 'TBD'}  |  PM: ${data.pmName || data.programManager || 'TBD'}`, { x: 0.8, y: 4.0, w: 11, h: 0.5, fontSize: 13, color: 'C0C0FF', fontFace: 'Calibri' });

    // Phases Slide
    if (data.phases && data.phases.length > 0) {
        const s2 = prs.addSlide();
        addHeader(s2, 'Programme Phases', `${data.phases.length} delivery phases`);
        const rows = [
            [{ text: '#', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Phase', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Type', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Duration', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }]
        ];
        data.phases.forEach((p, i) => {
            rows.push([`${i + 1}`, p.name, p.type || '', `${p.startDate || '?'} → ${p.endDate || '?'}`]);
        });
        s2.addTable(rows, { x: 0.5, y: 1.5, w: 12.3, fontSize: 11, fontFace: 'Calibri', border: { pt: 0.5, color: 'CCCCCC' }, autoPage: true });
    }

    // RAID Slide
    const raidItems = [...(data.risks || []).map(r => ({ ...r, cat: 'Risk' })),
        ...(data.issues || []).map(i => ({ ...i, cat: 'Issue' }))];
    if (raidItems.length > 0) {
        const s3 = prs.addSlide();
        addHeader(s3, 'RAID Summary', `${raidItems.length} items tracked`);
        const rows = [
            [{ text: 'Cat', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Description', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Owner', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } },
             { text: 'Impact', options: { bold: true, color: 'FFFFFF', fill: { color: pColor } } }]
        ];
        raidItems.forEach(item => {
            rows.push([item.cat, (item.description || '').substring(0, 80), item.owner || '', item.impact || '']);
        });
        s3.addTable(rows, { x: 0.5, y: 1.5, w: 12.3, fontSize: 10, fontFace: 'Calibri', border: { pt: 0.5, color: 'CCCCCC' }, autoPage: true });
    }

    return prs.write({ outputType: 'nodebuffer' });
}

// ── PDF GENERATOR ──────────────────────────────────────────────
async function generatePDF(data) {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const pHex = data.branding?.primaryColor || '#4f46e5';
    const pRgb = hexToRgb(pHex);

    let pageNum = 0;
    const addPage = () => { if (pageNum > 0) doc.addPage(); pageNum++; };

    // Cover Page
    addPage();
    doc.setFillColor(...pRgb);
    doc.rect(0, 0, W, H, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text(data.programName || 'Program Plan', 20, 60);
    doc.setFontSize(14);
    doc.text(`${data.businessUnit || ''} | ${data.portfolio || ''}`, 20, 80);
    doc.text(`Sponsor: ${data.sponsor || 'TBD'}  |  PM: ${data.pmName || data.programManager || 'TBD'}`, 20, 95);

    // Overview Page
    addPage();
    doc.setFillColor(248, 247, 255);
    doc.rect(0, 0, W, H, 'F');
    doc.setTextColor(...pRgb);
    doc.setFontSize(20);
    doc.text('Programme Overview', 20, 25);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    const infoLines = [
        `Description: ${data.description || 'N/A'}`,
        `Objectives: ${data.objectives || 'N/A'}`,
        `Success Metrics: ${data.successMetrics || 'N/A'}`,
        `Start: ${data.startDate || 'TBD'}  —  End: ${data.endDate || 'TBD'}`
    ];
    let y = 40;
    infoLines.forEach(line => {
        const split = doc.splitTextToSize(line, W - 40);
        doc.text(split, 20, y);
        y += split.length * 6 + 4;
    });

    // Tasks Table
    if (data.tasks && data.tasks.length > 0) {
        addPage();
        doc.setFillColor(248, 247, 255);
        doc.rect(0, 0, W, H, 'F');
        doc.setTextColor(...pRgb);
        doc.setFontSize(20);
        doc.text('Task Backlog', 20, 25);

        doc.autoTable({
            startY: 35,
            head: [['#', 'Title', 'Type', 'Priority', 'Status', 'Assignee']],
            body: data.tasks.map((t, i) => [i + 1, t.title, t.type, t.priority, t.status, t.assignee || '']),
            theme: 'grid',
            headStyles: { fillColor: pRgb, textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });
    }

    return Buffer.from(doc.output('arraybuffer'));
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

module.exports = { generateExcel, generatePPT, generatePDF };
