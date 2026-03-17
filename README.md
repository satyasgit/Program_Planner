# Program Management Automation Suite

A high-fidelity, client-side web application designed to automate the creation of strategic program plans, roadmaps, and execution dossiers.

## 🚀 Key Features

- **Strategic Planning Wizard**: A 7-step guided journey to define your program's DNA, from objectives and strategic themes to RAID logs and stakeholder maps.
- **Searchable Dashboard**: A centralized "Program Library" to manage multiple strategic plans with real-time filtering and progress tracking.
- **Jira Integration**: Instantly generate program blueprints by importing Jira issues via direct API connection or CSV upload.
- **Advanced Analytics**: Dedicated dashboards powered by Chart.js showing task distribution, resource allocation, and RAID criticality matrixes.
- **Advanced Export Suite**:
  - **MS Excel**: Professional multi-sheet workbook with a visually appealing **Gantt Chart** (powered by ExcelJS).
  - **MS PowerPoint**: Executive steering pack with automated slide generation.
  - **PDF**: Formal program dossier with full RAID and stakeholder reporting.
- **Relational Cloud Storage**: Real-time synchronization with **Supabase (PostgreSQL)** for persistence.
- **Premium UI**: Modern, glassmorphic design system with responsive layouts and smooth animations.

## 🏗️ Application Architecture

The application focuses on a "Thick Client" architecture, executing complex rendering and generation logic directly in the user's browser to minimize latency and server costs.

```mermaid
graph TD
    Client[Browser Client]
    Supabase[(Supabase PostgreSQL)]
    External[External Systems]

    subscript1[User Interface Layer]
    Dashboard[Portfolio Dashboard]
    WizardUI[7-Step Wizard]
    AnalyticsUI[Analytics Dashboard]
    ImportUI[Jira Import Flow]

    subscript2[Core Business Logic]
    Engine[Wizard Engine]
    State[Global State Manager]
    Exporters[Excel/PPT/PDF Generators]
    DBClient[Supabase JS Client]

    Client --> subscript1
    Client --> subscript2
    
    Dashboard --- Engine
    WizardUI --- Engine
    AnalyticsUI --- State
    ImportUI --- Engine
    
    Engine --- State
    Engine --- DBClient
    Exporters --- State
    
    DBClient <-->|REST / WSS| Supabase
    ImportUI -.->|API Call (Optional)| External
```

### Architecture Highlights
1.  **Zero-Backend Generation**: Complex files (.xlsx, .pptx, .pdf) are generated entirely client-side using robust JS libraries.
2.  **Stateless UI, Stateful DB**: The UI seamlessly rebuilds itself from the `AppData` global state, which stays perfectly synced with the Supabase backend.
3.  **Modular Exporters**: Each output format has its own dedicated logic file (`generators/excel.js`, etc.), keeping the app highly scalable.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Flex/Grid), and ES6+ JavaScript.
- **Database**: Supabase (PostgreSQL) with relational schema.
- **Libraries (CDN)**:
  - `ExcelJS`: Professional Excel generation & styling.
  - `PptxGenJS`: Client-side PowerPoint generation.
  - `jsPDF` & `jsPDF-AutoTable`: PDF creation and table formatting.
  - `Chart.js`: Data visualization and analytics.
  - `SheetJS` (xlsx): Local CSV/Excel parsing for Jira imports.
  - `Supabase-JS`: Real-time backend integration.

## 📦 Getting Started

### 1. Local Development
Simply serve the root directory using any local web server.
```bash
# Example using Python
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### 2. Database Connection
To enable cloud storage and search, configure your Supabase instance:

1. Create a new project on [Supabase.com](https://supabase.com).
2. Run the SQL schema provided in `docs/database_setup.md` in the Supabase SQL Editor.
3. Update `js/data.js` with your project credentials:
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'https://your-project.supabase.co',
     key: 'your-public-anon-key'
   };
   ```

## 📂 Project Structure

- `index.html`: Main application entry point.
- `css/`: Application styles and theme definitions.
- `js/`:
  - `app.js`: Application bootstrap and event delegation.
  - `wizard.js`: Wizard navigation and global state management.
  - `steps.js`: Step-by-step rendering and field validation.
  - `data.js`: Central data structure and configuration.
  - `db.js`: Supabase relational database service.
  - `generators/`: Specific logic for Excel, PPT, and PDF creation.
- `docs/`: Database setup instructions and technical walkthroughs.

## 📄 License
Internal Property - Designed for Program Management Professionals.
