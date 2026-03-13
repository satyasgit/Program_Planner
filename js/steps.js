// ===== STEP RENDERERS =====
const Steps = (() => {
    // ---- HELPER: field ----
    function field(id, label, type = 'text', value = '', placeholder = '', required = false, tip = '', options = []) {
        const req = required ? '<span class="required">*</span>' : '';
        const tipHtml = tip ? `<span class="tooltip-icon" data-tip="${tip}">?</span>` : '';
        let input;
        if (type === 'select') {
            input = `<select id="${id}">
        ${options.map(o => `<option value="${o.value ?? o}" ${(o.value ?? o) === value ? 'selected' : ''}>${o.label ?? o}</option>`).join('')}
      </select>`;
        } else if (type === 'textarea') {
            input = `<textarea id="${id}" placeholder="${placeholder}" rows="3">${value}</textarea>`;
        } else {
            input = `<input type="${type}" id="${id}" value="${value}" placeholder="${placeholder}" />`;
        }
        return `<div class="form-group">
      <label for="${id}">${label} ${req} ${tipHtml}</label>
      ${input}
    </div>`;
    }

    function span2(html) { return html.replace('class="form-group"', 'class="form-group span-2"'); }
    function span3(html) { return html.replace('class="form-group"', 'class="form-group span-3"'); }

    function divider(title) {
        return `<div class="section-divider"><h3>${title}</h3></div>`;
    }

    // ---- HELPER: Generate unique ID ----
    function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

    // ---- STEP 1: Programme Info ----
    function renderStep1() {
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 1 of 7</div>
        <div class="step-title">Programme Information</div>
        <div class="step-desc">Define the core identity, scope, and strategic context of your programme.</div>
      </div>
      <div class="form-grid cols-2">
        ${span2(field('progName', 'Programme Name', 'text', AppData.programName, 'e.g. Core Banking Transformation', true, 'Full official programme name'))}
        ${field('progBU', 'Business Unit', 'text', AppData.businessUnit, 'e.g. Technology & Operations')}
        ${field('progPortfolio', 'Portfolio', 'text', AppData.portfolio, 'e.g. Digital Transformation')}
        ${field('progSponsor', 'Executive Sponsor', 'text', AppData.sponsor, 'Name & Title', true)}
        ${field('progPM', 'Programme Manager', 'text', AppData.programManager, 'Name', true)}
        ${field('progStartDate', 'Start Date', 'date', AppData.startDate, '', true)}
        ${field('progEndDate', 'End Date', 'date', AppData.endDate, '', true)}
        ${field('progCurrency', 'Currency', 'select', AppData.currency, '', false, 'Reporting currency for budgets', [
            { value: 'USD', label: 'USD – US Dollar' },
            { value: 'GBP', label: 'GBP – British Pound' },
            { value: 'EUR', label: 'EUR – Euro' },
            { value: 'INR', label: 'INR – Indian Rupee' },
            { value: 'AUD', label: 'AUD – Australian Dollar' },
            { value: 'CAD', label: 'CAD – Canadian Dollar' },
            { value: 'SGD', label: 'SGD – Singapore Dollar' },
        ])}
        ${field('progFY', 'Fiscal Year Start Month', 'select', AppData.fiscalYearStart, '', false, 'Month when your fiscal year begins', [
            { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
            { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
            { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
            { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
        ])}
      </div>
      ${divider('Strategic Context')}
      <div class="form-grid cols-1">
        ${field('progDesc', 'Programme Description', 'textarea', AppData.description, 'High-level overview of the programme...', true, '1-3 sentence executive summary')}
        ${field('progObj', 'Strategic Objectives', 'textarea', AppData.objectives, 'List key objectives (one per line)...', true, 'What must this programme achieve?')}
        ${field('progMetrics', 'Success Metrics & KPIs', 'textarea', AppData.successMetrics, 'e.g. 99.99% uptime | 35% TCO reduction...', false, 'How will success be measured?')}
        ${field('progThemes', 'Strategic Themes', 'textarea', AppData.strategicThemes, 'e.g. Digital-first | Cloud-native...', false, 'Themes that align this programme to strategy')}
        ${field('progConstraints', 'Key Constraints', 'textarea', AppData.constraints, 'e.g. Budget cap, compliance requirements...', false, 'Budget, timeline, regulatory constraints')}
        ${field('progRegulatory', 'Regulatory Drivers', 'textarea', AppData.regulatoryDrivers, 'e.g. PCI-DSS, GDPR...', false, 'Compliance requirements driving the programme')}
      </div>
    </div>`;
    }

    function saveStep1() {
        AppData.programName = document.getElementById('progName')?.value || '';
        AppData.businessUnit = document.getElementById('progBU')?.value || '';
        AppData.portfolio = document.getElementById('progPortfolio')?.value || '';
        AppData.sponsor = document.getElementById('progSponsor')?.value || '';
        AppData.programManager = document.getElementById('progPM')?.value || '';
        AppData.startDate = document.getElementById('progStartDate')?.value || '';
        AppData.endDate = document.getElementById('progEndDate')?.value || '';
        AppData.currency = document.getElementById('progCurrency')?.value || 'USD';
        AppData.fiscalYearStart = document.getElementById('progFY')?.value || '1';
        AppData.description = document.getElementById('progDesc')?.value || '';
        AppData.objectives = document.getElementById('progObj')?.value || '';
        AppData.successMetrics = document.getElementById('progMetrics')?.value || '';
        AppData.strategicThemes = document.getElementById('progThemes')?.value || '';
        AppData.constraints = document.getElementById('progConstraints')?.value || '';
        AppData.regulatoryDrivers = document.getElementById('progRegulatory')?.value || '';
    }

    function validateStep1() {
        const req = ['progName', 'progSponsor', 'progPM', 'progStartDate', 'progEndDate', 'progDesc', 'progObj'];
        let ok = true;
        req.forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.value.trim()) { if (el) { el.classList.add('invalid'); } ok = false; }
            else el.classList.remove('invalid');
        });
        if (!ok) Wizard.showToast('Please fill in all required fields ✱', 'error');
        return ok;
    }

    // ---- STEP 2: Phases ----
    function phaseItemHtml(p, idx) {
        const colorOpts = PHASE_COLORS.map(c =>
            `<option value="${c.bg}" ${p.color === c.bg ? 'selected' : ''} style="background:${c.bg}">${c.label}</option>`
        ).join('');
        return `<div class="dynamic-item" id="phase_${p.id}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('phase_${p.id}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge" style="background:${p.color}22;color:${p.color};border-color:${p.color}55">Phase ${idx + 1}</span>
        <span class="item-title-preview">${p.name || 'New Phase'}</span>
        <span class="item-toggle" id="tog_phase_${p.id}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removePhase('${p.id}')">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_phase_${p.id}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group span-2">
            <label>Phase Name <span class="required">*</span></label>
            <input type="text" class="ph-name" data-id="${p.id}" value="${p.name}" placeholder="e.g. Discover & Plan" oninput="Steps.updatePhasePreview('${p.id}',this.value)" />
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" class="ph-start" data-id="${p.id}" value="${p.startDate}" />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" class="ph-end" data-id="${p.id}" value="${p.endDate}" />
          </div>
          <div class="form-group">
            <label>Phase Type</label>
            <select class="ph-type" data-id="${p.id}">
              ${['Plan', 'Design', 'Execute', 'Test', 'Deploy', 'Close', 'Other'].map(t => `<option ${p.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Colour</label>
            <select class="ph-color" data-id="${p.id}" onchange="Steps.updatePhaseColor('${p.id}',this.value)">${colorOpts}</select>
          </div>
          <div class="form-group span-2">
            <label>Description</label>
            <textarea class="ph-desc" data-id="${p.id}" rows="2" placeholder="What happens in this phase?">${p.description}</textarea>
          </div>
          <div class="form-group">
            <label>Entry Criteria</label>
            <textarea class="ph-entry" data-id="${p.id}" rows="2" placeholder="What must be true to enter this phase?">${p.entryCriteria}</textarea>
          </div>
          <div class="form-group">
            <label>Exit Criteria</label>
            <textarea class="ph-exit" data-id="${p.id}" rows="2" placeholder="What must be true to exit this phase?">${p.exitCriteria}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function renderStep2() {
        const list = AppData.phases.map((p, i) => phaseItemHtml(p, i)).join('');
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 2 of 7</div>
        <div class="step-title">Programme Phases</div>
        <div class="step-desc">Define the major phases of delivery — from discovery to close. Phases form the backbone of your roadmap.</div>
      </div>
      <div class="dynamic-list" id="phaseList">${list}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addPhase()">+ Add Phase</button>
    </div>`;
    }

    function saveStep2() {
        document.querySelectorAll('#phaseList .dynamic-item').forEach(item => {
            const id = item.id.replace('phase_', '');
            const ph = AppData.phases.find(p => p.id === id);
            if (!ph) return;
            ph.name = item.querySelector('.ph-name')?.value || '';
            ph.startDate = item.querySelector('.ph-start')?.value || '';
            ph.endDate = item.querySelector('.ph-end')?.value || '';
            ph.type = item.querySelector('.ph-type')?.value || '';
            ph.color = item.querySelector('.ph-color')?.value || '#4f46e5';
            ph.description = item.querySelector('.ph-desc')?.value || '';
            ph.entryCriteria = item.querySelector('.ph-entry')?.value || '';
            ph.exitCriteria = item.querySelector('.ph-exit')?.value || '';
        });
    }

    // ---- STEP 3: Workstreams ----
    function wsItemHtml(w, idx) {
        return `<div class="dynamic-item" id="ws_${w.id}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('ws_${w.id}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge">WS ${idx + 1}</span>
        <span class="item-title-preview">${w.name || 'New Workstream'}</span>
        <span class="item-toggle" id="tog_ws_${w.id}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removeWorkstream('${w.id}')">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_ws_${w.id}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group span-2">
            <label>Workstream Name <span class="required">*</span></label>
            <input type="text" class="ws-name" data-id="${w.id}" value="${w.name}" placeholder="e.g. Platform Engineering" oninput="Steps.updateWsPreview('${w.id}',this.value)" />
          </div>
          <div class="form-group">
            <label>Owner / Lead</label>
            <input type="text" class="ws-owner" data-id="${w.id}" value="${w.owner}" placeholder="Name" />
          </div>
          <div class="form-group">
            <label>Department / Team</label>
            <input type="text" class="ws-dept" data-id="${w.id}" value="${w.department}" placeholder="e.g. Engineering" />
          </div>
          <div class="form-group">
            <label>Criticality</label>
            <select class="ws-crit" data-id="${w.id}">
              ${CRITICALITY_OPTIONS.map(c => `<option ${w.criticality === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="ws-status" data-id="${w.id}">
              ${STATUS_OPTIONS.map(s => `<option ${w.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group span-2">
            <label>Key Deliverables</label>
            <textarea class="ws-deliverables" data-id="${w.id}" rows="2" placeholder="What will this workstream produce?">${w.deliverables}</textarea>
          </div>
          <div class="form-group span-2">
            <label>Key Milestones</label>
            <textarea class="ws-milestones" data-id="${w.id}" rows="2" placeholder="Major checkpoints and target dates">${w.milestones}</textarea>
          </div>
          <div class="form-group span-2">
            <label>Dependencies</label>
            <textarea class="ws-deps" data-id="${w.id}" rows="2" placeholder="Other workstreams or teams this depends on">${w.dependencies}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function renderStep3() {
        const list = AppData.workstreams.map((w, i) => wsItemHtml(w, i)).join('');
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 3 of 7</div>
        <div class="step-title">Workstreams</div>
        <div class="step-desc">Organise delivery into distinct workstreams. Each workstream has an owner, deliverables, and dependencies.</div>
      </div>
      <div class="dynamic-list" id="wsList">${list}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addWorkstream()">+ Add Workstream</button>
    </div>`;
    }

    function saveStep3() {
        document.querySelectorAll('#wsList .dynamic-item').forEach(item => {
            const id = item.id.replace('ws_', '');
            const ws = AppData.workstreams.find(w => w.id === id);
            if (!ws) return;
            ws.name = item.querySelector('.ws-name')?.value || '';
            ws.owner = item.querySelector('.ws-owner')?.value || '';
            ws.department = item.querySelector('.ws-dept')?.value || '';
            ws.criticality = item.querySelector('.ws-crit')?.value || 'High';
            ws.status = item.querySelector('.ws-status')?.value || 'Not Started';
            ws.deliverables = item.querySelector('.ws-deliverables')?.value || '';
            ws.milestones = item.querySelector('.ws-milestones')?.value || '';
            ws.dependencies = item.querySelector('.ws-deps')?.value || '';
        });
    }

    // ---- STEP 4: Tasks ----
    function taskItemHtml(t, idx) {
        const phaseOpts = [{ id: '', name: '— None —' }, ...AppData.phases]
            .map(p => `<option value="${p.id}" ${t.phase === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const wsOpts = [{ id: '', name: '— None —' }, ...AppData.workstreams]
            .map(w => `<option value="${w.id}" ${t.workstream === w.id ? 'selected' : ''}>${w.name}</option>`).join('');
        return `<div class="dynamic-item" id="task_${t.id}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('task_${t.id}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge">#${idx + 1}</span>
        <span class="item-title-preview">${t.title || 'New Task'}</span>
        <span class="item-toggle" id="tog_task_${t.id}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removeTask('${t.id}')">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_task_${t.id}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group span-2">
            <label>Title <span class="required">*</span></label>
            <input type="text" class="task-title" data-id="${t.id}" value="${t.title}" placeholder="e.g. AWS Landing Zone Setup" oninput="Steps.updateTaskPreview('${t.id}',this.value)" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select class="task-type" data-id="${t.id}">
              ${TASK_TYPE_OPTIONS.map(o => `<option ${t.type === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select class="task-priority" data-id="${t.id}">
              ${PRIORITY_OPTIONS.map(o => `<option ${t.priority === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="task-status" data-id="${t.id}">
              ${STATUS_OPTIONS.map(o => `<option ${t.status === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Estimate</label>
            <input type="text" class="task-estimate" data-id="${t.id}" value="${t.estimate}" placeholder="e.g. 10d, 3w" />
          </div>
          <div class="form-group">
            <label>Phase</label>
            <select class="task-phase" data-id="${t.id}">${phaseOpts}</select>
          </div>
          <div class="form-group">
            <label>Workstream</label>
            <select class="task-ws" data-id="${t.id}">${wsOpts}</select>
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <input type="text" class="task-assignee" data-id="${t.id}" value="${t.assignee}" placeholder="Name" />
          </div>
          <div class="form-group">
            <label>Predecessors</label>
            <input type="text" class="task-pred" data-id="${t.id}" value="${t.predecessors}" placeholder="e.g. t1,t2" />
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" class="task-start" data-id="${t.id}" value="${t.startDate}" />
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" class="task-due" data-id="${t.id}" value="${t.dueDate}" />
          </div>
          <div class="form-group span-2">
            <label>Description</label>
            <textarea class="task-desc" data-id="${t.id}" rows="2" placeholder="What does this task involve?">${t.description}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function renderStep4() {
        const list = AppData.tasks.map((t, i) => taskItemHtml(t, i)).join('');
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 4 of 7</div>
        <div class="step-title">Task Backlog</div>
        <div class="step-desc">Add high-level Epics, Features, and Milestones. These populate the detailed plan sheet in your Excel output.</div>
      </div>
      <div class="dynamic-list" id="taskList">${list}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addTask()">+ Add Task / Epic</button>
    </div>`;
    }

    function saveStep4() {
        document.querySelectorAll('#taskList .dynamic-item').forEach(item => {
            const id = item.id.replace('task_', '');
            const t = AppData.tasks.find(x => x.id === id);
            if (!t) return;
            t.title = item.querySelector('.task-title')?.value || '';
            t.type = item.querySelector('.task-type')?.value || 'Task';
            t.priority = item.querySelector('.task-priority')?.value || 'Medium';
            t.status = item.querySelector('.task-status')?.value || 'Not Started';
            t.estimate = item.querySelector('.task-estimate')?.value || '';
            t.phase = item.querySelector('.task-phase')?.value || '';
            t.workstream = item.querySelector('.task-ws')?.value || '';
            t.assignee = item.querySelector('.task-assignee')?.value || '';
            t.predecessors = item.querySelector('.task-pred')?.value || '';
            t.startDate = item.querySelector('.task-start')?.value || '';
            t.dueDate = item.querySelector('.task-due')?.value || '';
            t.description = item.querySelector('.task-desc')?.value || '';
        });
    }

    // ---- STEP 5: RAID ----
    function raidItemHtml(item, category, idx) {
        return `<div class="dynamic-item" id="${category}_${item.id}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('${category}_${item.id}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge">${item.id}</span>
        <span class="item-title-preview">${item.description?.substring(0, 70) || 'New Item'}</span>
        <span class="item-toggle" id="tog_${category}_${item.id}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removeRaid('${category}','${item.id}')">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_${category}_${item.id}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group span-2">
            <label>Description <span class="required">*</span></label>
            <textarea class="raid-desc" data-cat="${category}" data-id="${item.id}" rows="2" placeholder="Describe the ${category}...">${item.description}</textarea>
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" class="raid-category" data-cat="${category}" data-id="${item.id}" value="${item.category}" placeholder="e.g. Technical, Resource" />
          </div>
          <div class="form-group">
            <label>Owner</label>
            <input type="text" class="raid-owner" data-cat="${category}" data-id="${item.id}" value="${item.owner}" placeholder="Name" />
          </div>
          ${category === 'risks' || category === 'issues' ? `
          <div class="form-group">
            <label>Probability</label>
            <select class="raid-prob" data-cat="${category}" data-id="${item.id}">
              ${category === 'risks' ? RISK_PROBABILITY.map(p => `<option ${item.probability === p ? 'selected' : ''}>${p}</option>`).join('') : '<option>N/A</option>'}
            </select>
          </div>
          <div class="form-group">
            <label>Impact</label>
            <select class="raid-impact" data-cat="${category}" data-id="${item.id}">
              ${RISK_IMPACT.map(i => `<option ${item.impact === i ? 'selected' : ''}>${i}</option>`).join('')}
            </select>
          </div>` : ''}
          <div class="form-group">
            <label>Status</label>
            <select class="raid-status" data-cat="${category}" data-id="${item.id}">
              ${['Open', 'In Progress', 'Closed', 'Accepted'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Target Date</label>
            <input type="date" class="raid-date" data-cat="${category}" data-id="${item.id}" value="${item.targetDate}" />
          </div>
          <div class="form-group span-2">
            <label>Mitigation / Response</label>
            <textarea class="raid-mitigation" data-cat="${category}" data-id="${item.id}" rows="2" placeholder="How will this be mitigated or resolved?">${item.mitigation}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function raidSection(title, category, items, prefix) {
        const list = items.map((item, i) => raidItemHtml(item, category, i)).join('');
        return `
      ${divider(title)}
      <div class="dynamic-list" id="${category}List">${list}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addRaid('${category}','${prefix}')">+ Add ${title.slice(0, -1)}</button>`;
    }

    function renderStep5() {
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 5 of 7</div>
        <div class="step-title">RAID Log</div>
        <div class="step-desc">Document Risks, Assumptions, Issues, and Dependencies. These export directly to the RAID tab in your Excel file.</div>
      </div>
      ${raidSection('Risks', 'risks', AppData.risks, 'R')}
      ${raidSection('Issues', 'issues', AppData.issues, 'I')}
      ${raidSection('Assumptions', 'assumptions', AppData.assumptions, 'A')}
      ${raidSection('Dependencies', 'dependencies', AppData.dependencies, 'D')}
    </div>`;
    }

    function saveStep5() {
        ['risks', 'issues', 'assumptions', 'dependencies'].forEach(cat => {
            const container = document.getElementById(`${cat}List`);
            if (!container) return;
            container.querySelectorAll('.dynamic-item').forEach(item => {
                const id = item.id.replace(`${cat}_`, '');
                const entry = AppData[cat].find(x => x.id === id);
                if (!entry) return;
                entry.description = item.querySelector('.raid-desc')?.value || '';
                entry.category = item.querySelector('.raid-category')?.value || '';
                entry.owner = item.querySelector('.raid-owner')?.value || '';
                entry.status = item.querySelector('.raid-status')?.value || 'Open';
                entry.targetDate = item.querySelector('.raid-date')?.value || '';
                entry.mitigation = item.querySelector('.raid-mitigation')?.value || '';
                const prob = item.querySelector('.raid-prob');
                if (prob) entry.probability = prob.value;
                const impact = item.querySelector('.raid-impact');
                if (impact) entry.impact = impact.value;
            });
        });
    }

    // ---- STEP 6: Stakeholders ----
    function shItemHtml(sh, idx) {
        return `<div class="dynamic-item" id="sh_${sh.id}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('sh_${sh.id}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge">#${idx + 1}</span>
        <span class="item-title-preview">${sh.name || 'New Stakeholder'} — ${sh.role || ''}</span>
        <span class="item-toggle" id="tog_sh_${sh.id}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removeStakeholder('${sh.id}')">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_sh_${sh.id}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input type="text" class="sh-name" data-id="${sh.id}" value="${sh.name}" placeholder="Full name" oninput="Steps.updateShPreview('${sh.id}',this.value,'${sh.role}')" />
          </div>
          <div class="form-group">
            <label>Role / Title</label>
            <input type="text" class="sh-role" data-id="${sh.id}" value="${sh.role}" placeholder="e.g. CTO / Sponsor" />
          </div>
          <div class="form-group">
            <label>Influence</label>
            <select class="sh-influence" data-id="${sh.id}">
              ${INFLUENCE_OPTIONS.map(o => `<option ${sh.influence === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Interest</label>
            <select class="sh-interest" data-id="${sh.id}">
              ${INTEREST_OPTIONS.map(o => `<option ${sh.interest === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>RACI</label>
            <select class="sh-raci" data-id="${sh.id}">
              ${RACI_OPTIONS.map(o => `<option value="${o}" ${sh.raci === o ? 'selected' : ''}>${o || '—'}</option>`).join('')}
            </select>
          </div>
          <div class="form-group span-2">
            <label>Notes / Engagement Approach</label>
            <textarea class="sh-notes" data-id="${sh.id}" rows="2" placeholder="Key considerations for engagement">${sh.notes}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function commItemHtml(c, idx) {
        return `<div class="dynamic-item" id="comm_${idx}">
      <div class="dynamic-item-header" onclick="Steps.toggleItem('comm_${idx}')">
        <span class="item-drag-handle">⠿</span>
        <span class="item-badge">Comm ${idx + 1}</span>
        <span class="item-title-preview">${c.title || 'New Communication'}</span>
        <span class="item-toggle" id="tog_comm_${idx}">▼</span>
        <button class="item-remove" onclick="event.stopPropagation();Steps.removeComm(${idx})">✕</button>
      </div>
      <div class="dynamic-item-body" id="body_comm_${idx}" style="display:none">
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Communication Title</label>
            <input type="text" class="comm-title" data-idx="${idx}" value="${c.title}" placeholder="e.g. Steering Committee" />
          </div>
          <div class="form-group">
            <label>Audience</label>
            <input type="text" class="comm-audience" data-idx="${idx}" value="${c.audience}" placeholder="e.g. Exec Sponsors, CTO" />
          </div>
          <div class="form-group">
            <label>Frequency</label>
            <select class="comm-freq" data-idx="${idx}">
              ${COMM_FREQUENCY.map(f => `<option ${c.frequency === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Format / Channel</label>
            <input type="text" class="comm-format" data-idx="${idx}" value="${c.format}" placeholder="e.g. PowerPoint, Email" />
          </div>
          <div class="form-group">
            <label>Owner</label>
            <input type="text" class="comm-owner" data-idx="${idx}" value="${c.owner}" placeholder="Name" />
          </div>
          <div class="form-group span-2">
            <label>Notes</label>
            <textarea class="comm-notes" data-idx="${idx}" rows="2" placeholder="Additional context">${c.notes}</textarea>
          </div>
        </div>
      </div>
    </div>`;
    }

    function renderStep6() {
        const shList = AppData.stakeholders.map((s, i) => shItemHtml(s, i)).join('');
        const commList = AppData.communicationPlan.map((c, i) => commItemHtml(c, i)).join('');
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 6 of 7</div>
        <div class="step-title">Stakeholders & Communications</div>
        <div class="step-desc">Map your stakeholder landscape and define the communication cadences to keep everyone aligned.</div>
      </div>
      ${divider('Stakeholder Register')}
      <div class="dynamic-list" id="shList">${shList}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addStakeholder()">+ Add Stakeholder</button>
      ${divider('Communication Plan')}
      <div class="dynamic-list" id="commList">${commList}</div>
      <br/>
      <button class="btn-add-item" onclick="Steps.addComm()">+ Add Communication</button>
    </div>`;
    }

    function saveStep6() {
        document.querySelectorAll('#shList .dynamic-item').forEach(item => {
            const id = item.id.replace('sh_', '');
            const sh = AppData.stakeholders.find(x => x.id === id);
            if (!sh) return;
            sh.name = item.querySelector('.sh-name')?.value || '';
            sh.role = item.querySelector('.sh-role')?.value || '';
            sh.influence = item.querySelector('.sh-influence')?.value || 'Medium';
            sh.interest = item.querySelector('.sh-interest')?.value || 'Medium';
            sh.raci = item.querySelector('.sh-raci')?.value || '';
            sh.notes = item.querySelector('.sh-notes')?.value || '';
        });
        document.querySelectorAll('#commList .dynamic-item').forEach((item, idx) => {
            const c = AppData.communicationPlan[idx];
            if (!c) return;
            c.title = item.querySelector('.comm-title')?.value || '';
            c.audience = item.querySelector('.comm-audience')?.value || '';
            c.frequency = item.querySelector('.comm-freq')?.value || 'Weekly';
            c.format = item.querySelector('.comm-format')?.value || '';
            c.owner = item.querySelector('.comm-owner')?.value || '';
            c.notes = item.querySelector('.comm-notes')?.value || '';
        });
    }

    // ---- STEP 7: Export ----
    function outputCardHtml(key, icon, title, desc) {
        const checked = AppData.outputs[key];
        return `<label class="output-card ${checked ? 'selected' : ''}" id="oc_${key}">
      <input type="checkbox" id="out_${key}" ${checked ? 'checked' : ''} onchange="Steps.toggleOutput('${key}')" />
      <div class="output-icon">${icon}</div>
      <div class="output-title">${title}</div>
      <div class="output-desc">${desc}</div>
    </label>`;
    }

    function renderStep7() {
        const b = AppData.branding;
        return `<div class="step-panel">
      <div class="step-header">
        <div class="step-eyebrow">Step 7 of 7</div>
        <div class="step-title">Export & Generate</div>
        <div class="step-desc">Choose your output formats and configure branding. Everything is generated client-side — no data leaves your browser.</div>
      </div>
      <div class="output-options">
        ${outputCardHtml('excel', '📊', 'Excel Workbook', 'Roadmap · Detailed Plan · RAID · Stakeholders')}
        ${outputCardHtml('ppt', '📑', 'PowerPoint Deck', 'Steering Pack with timeline & RAID slides')}
        ${outputCardHtml('pdf', '📄', 'PDF Report', 'Executive summary & programme overview')}
      </div>

      ${divider('Branding')}
      <div class="branding-row">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" id="brandCompany" value="${b.companyName}" placeholder="e.g. GlobalBank Ltd" />
        </div>
        <div class="form-group">
          <label>Logo Initials</label>
          <input type="text" id="brandLogo" value="${b.logoText}" placeholder="e.g. GB" maxlength="3" />
        </div>
        <div class="form-group">
          <label>Primary Colour</label>
          <input type="color" id="brandPrimary" value="${b.primaryColor}" />
        </div>
        <div class="form-group">
          <label>Accent Colour</label>
          <input type="color" id="brandAccent" value="${b.accentColor}" />
        </div>
      </div>

      ${divider('Generate')}
      <div class="generate-area">
        <div class="generate-title">Ready to generate your programme outputs?</div>
        <div class="generate-desc">Your data will be used to build professional programme documents — ready for leadership review.</div>
        <div class="generate-buttons">
          <button class="btn btn-success btn-lg" id="btnGenExcel" onclick="App.generateExcel()">
            📊 Download Excel
          </button>
          <button class="btn btn-warning btn-lg" id="btnGenPPT" onclick="App.generatePPT()">
            📑 Download PowerPoint
          </button>
          <button class="btn btn-accent btn-lg" id="btnGenPDF" onclick="App.generatePDF()">
            📄 Download PDF
          </button>
        </div>
      </div>
    </div>`;
    }

    function saveStep7() {
        AppData.branding.companyName = document.getElementById('brandCompany')?.value || '';
        AppData.branding.logoText = document.getElementById('brandLogo')?.value || '';
        AppData.branding.primaryColor = document.getElementById('brandPrimary')?.value || '#6366f1';
        AppData.branding.accentColor = document.getElementById('brandAccent')?.value || '#06b6d4';
        AppData.outputs.excel = document.getElementById('out_excel')?.checked ?? true;
        AppData.outputs.ppt = document.getElementById('out_ppt')?.checked ?? true;
        AppData.outputs.pdf = document.getElementById('out_pdf')?.checked ?? true;
    }

    // ---- PUBLIC API ----
    function render(step) {
        const renderers = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];
        const html = renderers[step]?.() || '';
        document.getElementById('stepContent').innerHTML = html;
    }

    function save(step) {
        const savers = [null, saveStep1, saveStep2, saveStep3, saveStep4, saveStep5, saveStep6, saveStep7];
        savers[step]?.();
    }

    function validate(step) {
        if (step === 1) return validateStep1();
        return true;
    }

    function toggleItem(id) {
        const body = document.getElementById(`body_${id}`);
        const tog = document.getElementById(`tog_${id}`);
        if (!body) return;
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : '';
        if (tog) tog.classList.toggle('open', !open);
    }

    // ---- Phase helpers ----
    function addPhase() {
        const id = uid('p');
        AppData.phases.push({ id, name: '', description: '', startDate: '', endDate: '', color: PHASE_COLORS[AppData.phases.length % PHASE_COLORS.length].bg, entryCriteria: '', exitCriteria: '', type: 'Execute' });
        render(2);
        const newItem = document.getElementById(`phase_${id}`);
        if (newItem) toggleItem(`phase_${id}`);
        newItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removePhase(id) { AppData.phases = AppData.phases.filter(p => p.id !== id); render(2); }
    function updatePhasePreview(id, val) { const el = document.querySelector(`#phase_${id} .item-title-preview`); if (el) el.textContent = val || 'New Phase'; }
    function updatePhaseColor(id, color) { const badge = document.querySelector(`#phase_${id} .item-badge`); if (badge) { badge.style.background = color + '22'; badge.style.color = color; badge.style.borderColor = color + '55'; } }

    // ---- Workstream helpers ----
    function addWorkstream() {
        const id = uid('w');
        AppData.workstreams.push({ id, name: '', owner: '', department: '', criticality: 'High', status: 'Not Started', deliverables: '', milestones: '', dependencies: '' });
        render(3);
        toggleItem(`ws_${id}`);
        document.getElementById(`ws_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removeWorkstream(id) { AppData.workstreams = AppData.workstreams.filter(w => w.id !== id); render(3); }
    function updateWsPreview(id, val) { const el = document.querySelector(`#ws_${id} .item-title-preview`); if (el) el.textContent = val || 'New Workstream'; }

    // ---- Task helpers ----
    function addTask() {
        const id = uid('t');
        AppData.tasks.push({ id, title: '', description: '', type: 'Task', priority: 'Medium', status: 'Not Started', phase: '', workstream: '', assignee: '', estimate: '', startDate: '', dueDate: '', predecessors: '' });
        render(4);
        toggleItem(`task_${id}`);
        document.getElementById(`task_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removeTask(id) { AppData.tasks = AppData.tasks.filter(t => t.id !== id); render(4); }
    function updateTaskPreview(id, val) { const el = document.querySelector(`#task_${id} .item-title-preview`); if (el) el.textContent = val || 'New Task'; }

    // ---- RAID helpers ----
    function addRaid(cat, prefix) {
        const items = AppData[cat];
        const n = items.length + 1;
        const id = `${prefix}${String(n).padStart(3, '0')}`;
        items.push({ id, category: '', description: '', probability: 'Medium (30-70%)', impact: 'Medium', exposure: 'Medium', mitigation: '', owner: '', targetDate: '', status: 'Open' });
        render(5);
        toggleItem(`${cat}_${id}`);
        document.getElementById(`${cat}_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removeRaid(cat, id) { AppData[cat] = AppData[cat].filter(x => x.id !== id); render(5); }

    // ---- Stakeholder helpers ----
    function addStakeholder() {
        const id = uid('sh');
        AppData.stakeholders.push({ id, name: '', role: '', influence: 'Medium', interest: 'Medium', raci: '', notes: '' });
        render(6);
        toggleItem(`sh_${id}`);
        document.getElementById(`sh_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removeStakeholder(id) { AppData.stakeholders = AppData.stakeholders.filter(s => s.id !== id); render(6); }
    function updateShPreview(id, name, role) { const el = document.querySelector(`#sh_${id} .item-title-preview`); if (el) el.textContent = `${name || 'New Stakeholder'} — ${role || ''}`; }

    // ---- Comm helpers ----
    function addComm() {
        AppData.communicationPlan.push({ title: '', audience: '', frequency: 'Weekly', format: 'Email', owner: '', notes: '' });
        render(6);
        const idx = AppData.communicationPlan.length - 1;
        toggleItem(`comm_${idx}`);
        document.getElementById(`comm_${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function removeComm(idx) { AppData.communicationPlan.splice(idx, 1); render(6); }

    // ---- Output toggle ----
    function toggleOutput(key) {
        const checked = document.getElementById(`out_${key}`)?.checked;
        AppData.outputs[key] = !!checked;
        const card = document.getElementById(`oc_${key}`);
        if (card) card.classList.toggle('selected', !!checked);
    }

    return {
        render, save, validate,
        toggleItem,
        addPhase, removePhase, updatePhasePreview, updatePhaseColor,
        addWorkstream, removeWorkstream, updateWsPreview,
        addTask, removeTask, updateTaskPreview,
        addRaid, removeRaid,
        addStakeholder, removeStakeholder, updateShPreview,
        addComm, removeComm,
        toggleOutput
    };
})();
