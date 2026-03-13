// ===== CENTRAL DATA STORE =====
const AppData = {
  // Programme fields
  programName: '',
  description: '',
  businessUnit: '',
  portfolio: '',
  sponsor: '',
  programManager: '',
  startDate: '',
  endDate: '',
  currency: 'USD',
  fiscalYearStart: '1',
  objectives: '',
  successMetrics: '',
  strategicThemes: '',
  constraints: '',
  regulatoryDrivers: '',

  // Phases
  phases: [],

  // Workstreams
  workstreams: [],

  // Tasks / Backlog
  tasks: [],

  // RAID
  risks: [],
  issues: [],
  assumptions: [],
  dependencies: [],

  // Stakeholders & Communication
  stakeholders: [],
  communicationPlan: [],

  // Output config
  outputs: { excel: true, ppt: true, pdf: true },
  branding: {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    companyName: '',
    logoText: ''
  }
};

// Phase color palette
const PHASE_COLORS = [
  { bg: '#4f46e5', text: '#fff', label: 'Indigo' },
  { bg: '#7c3aed', text: '#fff', label: 'Violet' },
  { bg: '#0891b2', text: '#fff', label: 'Cyan' },
  { bg: '#059669', text: '#fff', label: 'Emerald' },
  { bg: '#d97706', text: '#fff', label: 'Amber' },
  { bg: '#dc2626', text: '#fff', label: 'Red' },
  { bg: '#db2777', text: '#fff', label: 'Pink' },
  { bg: '#7e22ce', text: '#fff', label: 'Purple' },
];

const CRITICALITY_OPTIONS = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'On Track', 'At Risk', 'Delayed', 'Completed', 'On Hold'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const TASK_TYPE_OPTIONS = ['Epic', 'Feature', 'Story', 'Task', 'Bug', 'Milestone'];
const RISK_PROBABILITY = ['High (>70%)', 'Medium (30-70%)', 'Low (<30%)'];
const RISK_IMPACT = ['Critical', 'High', 'Medium', 'Low'];
const INFLUENCE_OPTIONS = ['High', 'Medium', 'Low'];
const INTEREST_OPTIONS = ['High', 'Medium', 'Low'];
const RACI_OPTIONS = ['R', 'A', 'C', 'I', ''];
const COMM_FREQUENCY = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Ad-hoc'];

// ===== SAMPLE DATA (Core Banking Transformation) =====
const SAMPLE_DATA = {
  programName: 'Core Banking Transformation Program',
  description: 'End-to-end modernisation of the core banking platform, migrating from legacy mainframe systems to a cloud-native architecture to improve scalability, resilience, and customer experience.',
  businessUnit: 'Technology & Operations',
  portfolio: 'Digital Transformation Portfolio',
  sponsor: 'Sarah Mitchell (CTO)',
  programManager: 'James Okafor',
  startDate: '2026-04-01',
  endDate: '2027-09-30',
  currency: 'USD',
  fiscalYearStart: '4',
  objectives: '1. Replace legacy mainframe with cloud-native core banking platform\n2. Achieve 99.99% system uptime and sub-second response times\n3. Enable real-time payments and open banking APIs\n4. Reduce total cost of ownership by 35% within 3 years',
  successMetrics: 'System uptime ≥ 99.99% | Transaction processing time < 500ms | API onboarding time < 5 days | TCO reduction 35% by Year 3 | Zero Sev-1 incidents post go-live',
  strategicThemes: 'Digital-first Banking | Cloud-native Architecture | Customer Experience Excellence | Operational Resilience',
  constraints: 'Regulatory compliance with PCI-DSS, SOX, and GDPR mandatory | No customer-impacting downtime during migration | Budget cap of $45M USD | Key milestones aligned to fiscal year-end',
  regulatoryDrivers: 'PCI-DSS v4.0 compliance | SOX audit requirements | GDPR data residency | Central Bank digital reporting mandates',

  phases: [
    { id: 'p1', name: 'Discover & Plan', description: 'Requirements gathering, vendor selection, architecture blueprint, and program setup.', startDate: '2026-04-01', endDate: '2026-06-30', color: '#4f46e5', entryCriteria: 'Program charter approved, budget allocated', exitCriteria: 'Architecture approved, vendor contracted', type: 'Plan' },
    { id: 'p2', name: 'Design & Prototype', description: 'Detailed solution design, data model mapping, integration blueprints, and proof-of-concept build.', startDate: '2026-07-01', endDate: '2026-09-30', color: '#7c3aed', entryCriteria: 'Vendor onboarded, architecture signed off', exitCriteria: 'POC validated, design documents approved', type: 'Design' },
    { id: 'p3', name: 'Build & Integrate', description: 'Core platform configuration, custom development, data migration scripts, and integration build.', startDate: '2026-10-01', endDate: '2027-02-28', color: '#0891b2', entryCriteria: 'Designs approved, dev team onboarded', exitCriteria: 'All components built and unit tested', type: 'Execute' },
    { id: 'p4', name: 'Test & Validate', description: 'SIT, UAT, performance testing, security testing, parallel run, and sign-off.', startDate: '2027-03-01', endDate: '2027-06-30', color: '#059669', entryCriteria: 'Build complete, test environment ready', exitCriteria: 'UAT sign-off, performance benchmarks met', type: 'Test' },
    { id: 'p5', name: 'Deploy & Stabilise', description: 'Phased production rollout, hypercare period, and legacy decommission.', startDate: '2027-07-01', endDate: '2027-09-30', color: '#d97706', entryCriteria: 'UAT passed, go-live checklist approved', exitCriteria: 'Full production stability, legacy decommissioned', type: 'Close' },
  ],

  workstreams: [
    { id: 'w1', name: 'Platform Engineering', owner: 'Priya Sharma', department: 'Engineering', criticality: 'High', deliverables: 'Cloud-native core banking platform, APIs, microservices', milestones: 'Platform MVP by Q3 2026, Full build by Q1 2027', dependencies: 'Infrastructure (w2), Data Migration (w3)' },
    { id: 'w2', name: 'Infrastructure & Cloud', owner: 'David Chen', department: 'Infrastructure', criticality: 'High', deliverables: 'AWS landing zone, CI/CD pipelines, security controls', milestones: 'Landing zone ready by June 2026, DR tested by Q4 2026', dependencies: 'None' },
    { id: 'w3', name: 'Data Migration', owner: 'Aisha Patel', department: 'Data Engineering', criticality: 'High', deliverables: 'Data mapping, migration scripts, reconciliation framework', milestones: 'Data mapping complete Q2 2026, Dry run 1 by Q1 2027', dependencies: 'Platform Engineering (w1)' },
    { id: 'w4', name: 'Integration & APIs', owner: 'Marcus Johnson', department: 'Engineering', criticality: 'High', deliverables: 'Open banking APIs, third-party integrations, ESB replacement', milestones: 'API catalogue published Q3 2026, All integrations tested Q2 2027', dependencies: 'Platform Engineering (w1)' },
    { id: 'w5', name: 'Testing & QA', owner: 'Li Wei', department: 'QA', criticality: 'High', deliverables: 'Test strategy, automated test suites, UAT coordination', milestones: 'Test strategy by June 2026, Automation framework by Q4 2026', dependencies: 'All workstreams' },
    { id: 'w6', name: 'Change Management', owner: 'Emma Rodriguez', department: 'HR & Comms', criticality: 'Medium', deliverables: 'Change impact assessment, training materials, communications', milestones: 'Impact assessment by Q3 2026, Training complete Q2 2027', dependencies: 'None' },
  ],

  tasks: [
    { id: 't1', title: 'Program Charter & Governance Setup', description: 'Establish program governance structure, steering committee, and ways of working.', type: 'Epic', workstream: 'w1', phase: 'p1', priority: 'Critical', status: 'In Progress', assignee: 'James Okafor', estimate: '10d', startDate: '2026-04-01', dueDate: '2026-04-15', predecessors: '' },
    { id: 't2', title: 'Vendor Selection & Contract', description: 'RFP process, vendor evaluation, and contract execution for core banking platform.', type: 'Epic', workstream: 'w1', phase: 'p1', priority: 'Critical', status: 'In Progress', assignee: 'Sarah Mitchell', estimate: '30d', startDate: '2026-04-01', dueDate: '2026-05-31', predecessors: 't1' },
    { id: 't3', title: 'AWS Landing Zone Setup', description: 'Configure multi-account AWS organisation, networking, security baseline, and CI/CD.', type: 'Feature', workstream: 'w2', phase: 'p1', priority: 'High', status: 'Not Started', assignee: 'David Chen', estimate: '20d', startDate: '2026-04-15', dueDate: '2026-05-30', predecessors: 't1' },
    { id: 't4', title: 'Solution Architecture Blueprint', description: 'End-to-end target architecture document covering platform, data, integration, and security.', type: 'Feature', workstream: 'w1', phase: 'p1', priority: 'Critical', status: 'Not Started', assignee: 'Priya Sharma', estimate: '15d', startDate: '2026-05-01', dueDate: '2026-06-15', predecessors: 't2' },
    { id: 't5', title: 'Data Mapping & Lineage Analysis', description: 'Map all legacy data entities to target schema; document transformation rules.', type: 'Epic', workstream: 'w3', phase: 'p2', priority: 'High', status: 'Not Started', assignee: 'Aisha Patel', estimate: '40d', startDate: '2026-07-01', dueDate: '2026-09-30', predecessors: 't4' },
    { id: 't6', title: 'Core Platform Configuration', description: 'Configure core banking modules: accounts, loans, payments, GL.', type: 'Epic', workstream: 'w1', phase: 'p3', priority: 'Critical', status: 'Not Started', assignee: 'Priya Sharma', estimate: '60d', startDate: '2026-10-01', dueDate: '2026-12-31', predecessors: 't4,t5' },
  ],

  risks: [
    { id: 'R001', category: 'Technical', description: 'Legacy data quality issues may delay migration timelines', probability: 'High (>70%)', impact: 'High', exposure: 'High', mitigation: 'Conduct early data profiling and cleansing sprints; allocate 20% buffer to migration schedule', owner: 'Aisha Patel', targetDate: '2026-08-31', status: 'Open' },
    { id: 'R002', category: 'Resource', description: 'Skilled cloud-native banking engineers are scarce; hiring delays could impact delivery', probability: 'Medium (30-70%)', impact: 'High', exposure: 'High', mitigation: 'Engage specialist SI partner; begin recruitment 2 months ahead of schedule', owner: 'James Okafor', targetDate: '2026-05-01', status: 'Open' },
    { id: 'R003', category: 'Regulatory', description: 'Regulatory approval for new payment flows may extend timeline', probability: 'Medium (30-70%)', impact: 'Critical', exposure: 'High', mitigation: 'Engage regulator early; allocate dedicated compliance resource', owner: 'Sarah Mitchell', targetDate: '2026-06-30', status: 'Open' },
  ],

  issues: [
    { id: 'I001', category: 'Vendor', description: 'Vendor API documentation is incomplete for payment module integration', probability: 'N/A', impact: 'High', exposure: 'Medium', mitigation: 'Escalate to vendor account manager; schedule weekly API review sessions', owner: 'Marcus Johnson', targetDate: '2026-05-15', status: 'Open' },
  ],

  assumptions: [
    { id: 'A001', category: 'Budget', description: 'Total program budget of $45M USD is approved and available from Q1 FY27', probability: 'N/A', impact: 'Critical', exposure: 'High', mitigation: 'Confirm budget sign-off before program kick-off', owner: 'Sarah Mitchell', targetDate: '2026-04-01', status: 'Open' },
    { id: 'A002', category: 'Technical', description: 'Existing integration layer can be reused with minimal refactoring', probability: 'N/A', impact: 'Medium', exposure: 'Medium', mitigation: 'Validate during Discover phase technical assessment', owner: 'Priya Sharma', targetDate: '2026-06-30', status: 'Open' },
  ],

  dependencies: [
    { id: 'D001', category: 'Internal', description: 'Infrastructure landing zone must be ready before Platform Engineering can begin build', probability: 'N/A', impact: 'High', exposure: 'High', mitigation: 'Infrastructure workstream to start 2 weeks ahead; daily sync with Platform Engineering', owner: 'David Chen', targetDate: '2026-06-01', status: 'Open' },
  ],

  stakeholders: [
    { id: 'sh1', name: 'Sarah Mitchell', role: 'CTO / Sponsor', influence: 'High', interest: 'High', raci: 'A', notes: 'Final decision authority; attend monthly SteerCo' },
    { id: 'sh2', name: 'Board of Directors', role: 'Executive Sponsor Group', influence: 'High', interest: 'Medium', raci: 'I', notes: 'Quarterly board updates required' },
    { id: 'sh3', name: 'James Okafor', role: 'Program Manager', influence: 'High', interest: 'High', raci: 'R', notes: 'Day-to-day program delivery accountability' },
    { id: 'sh4', name: 'Risk & Compliance Team', role: 'Regulatory Oversight', influence: 'High', interest: 'High', raci: 'C', notes: 'Must approve all regulatory-impacting decisions' },
    { id: 'sh5', name: 'Business Operations', role: 'End Users', influence: 'Medium', interest: 'High', raci: 'C', notes: 'Key UAT participants; change champions required' },
  ],

  communicationPlan: [
    { title: 'Steering Committee', audience: 'Exec Sponsors, CTO', frequency: 'Monthly', format: 'PowerPoint Deck', owner: 'James Okafor', notes: 'Covers status, RAID, financials, decisions required' },
    { title: 'Program Status Report', audience: 'All Stakeholders', frequency: 'Weekly', format: 'Email + Dashboard', owner: 'James Okafor', notes: 'RAG status, key milestones, blockers' },
    { title: 'Workstream Leads Sync', audience: 'Workstream Leads', frequency: 'Weekly', format: 'Video Call', owner: 'James Okafor', notes: 'Progress, blockers, cross-stream dependencies' },
    { title: 'All Hands Update', audience: 'Full Program Team', frequency: 'Monthly', format: 'Video Call', owner: 'James Okafor', notes: 'Full team alignment, wins, upcoming focuses' },
  ],

  outputs: { excel: true, ppt: true, pdf: true },
  branding: {
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
    accentColor: '#0891b2',
    companyName: 'GlobalBank Ltd',
    logoText: 'GB'
  }
};
