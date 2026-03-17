# Database Setup Guide (Supabase)

Follow these steps to set up your PostgreSQL database in Supabase to work with the Program Management Automation Suite.

## 1. Create Tables
Copy and paste the following SQL into the **SQL Editor** in your Supabase Dashboard and click **Run**.

```sql
-- 1. Programs Table (Main)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_unit TEXT,
    portfolio TEXT,
    sponsor TEXT,
    pm TEXT,
    start_date DATE,
    end_date DATE,
    currency TEXT DEFAULT 'USD',
    fiscal_year_start INTEGER,
    description TEXT,
    objectives TEXT,
    success_metrics TEXT,
    strategic_themes TEXT,
    constraints TEXT,
    regulatory_drivers TEXT,
    branding JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Phases Table
CREATE TABLE phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    start_date DATE,
    end_date DATE,
    color TEXT,
    description TEXT,
    entry_criteria TEXT,
    exit_criteria TEXT,
    order_index INTEGER
);

-- 3. Workstreams Table
CREATE TABLE workstreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner TEXT,
    department TEXT,
    criticality TEXT,
    status TEXT,
    deliverables TEXT,
    milestones TEXT,
    dependencies TEXT
);

-- 4. RAID Items Table
CREATE TABLE raid_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- Risk, Issue, Assumption, Dependency
    sub_category TEXT,       -- Detailed category string
    description TEXT,
    owner TEXT,
    probability TEXT,
    impact TEXT,
    status TEXT,
    target_date DATE,
    mitigation TEXT
);

-- 5. Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
    workstream_id UUID REFERENCES workstreams(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    priority TEXT,
    status TEXT,
    assignee TEXT,
    estimate TEXT,
    start_date DATE,
    due_date DATE
);
```

## 2. Configure Credentials
Once the tables are created, copy your **Project URL** and **Anon Key** from `Project Settings > API` and paste them into `js/data.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  key: 'your-public-anon-key'
};
```

## 3. Security Best Practices (Industry Standards)

### A. Environment Variables (.env)
In a production environment, you should never hardcode keys in `.js` files. 
- **Standard**: Use a `.env` file and a build tool like Vite or Webpack.
- **Why**: This prevents keys from being committed to GitHub/GitLab.

### B. Row Level Security (RLS)
Since this is a client-side app, the `anon` key is visible in the browser. You MUST enable Supabase RLS to protect your data.
- **Action**: Go to `Authentication > Policies` in Supabase.
- **Rule**: Create policies that restrict access (e.g., only authenticated users can read/write programs).

### C. Backend API (Optional but Recommended)
For maximum security, use a **Serverless Function** (Edge Function) or a dedicated backend (Node/Python) to interact with the database. The client talks to your API, and your API (which holds the secret keys) talks to Supabase.

---

## 4. Updates & Migrations

### V1.1 Jira Integration Migration
To support importing data from Jira (via CSV or API) and retain traceability, run the following SQL snippet in the SQL Editor to add the necessary columns:

```sql
-- Add tracking for the source system on the Program level
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'Manual',
ADD COLUMN IF NOT EXISTS external_project_key TEXT;

-- Add tracking for Jira Ticket IDs on the Task level
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add tracking for Jira Ticket IDs on the RAID level
ALTER TABLE raid_items 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT;
```
