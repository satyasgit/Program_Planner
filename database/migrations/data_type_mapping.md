# SQLite to PostgreSQL Data Type Mapping Guide

## Date: 2026-04-10

## Core Data Type Mappings

| SQLite Type | PostgreSQL Type | Notes |
|-------------|-----------------|-------|
| INTEGER | INTEGER or SERIAL | Use SERIAL for auto-incrementing primary keys |
| INTEGER PRIMARY KEY | SERIAL PRIMARY KEY | Automatic conversion for primary keys |
| TEXT | VARCHAR(n) or TEXT | Use VARCHAR with length limit where appropriate |
| REAL | DECIMAL or NUMERIC | For financial data, use DECIMAL(15,2) |
| BLOB | BYTEA | Binary data storage |
| DATETIME | TIMESTAMP | With or without timezone |
| DATE | DATE | Date only, no time component |
| BOOLEAN | BOOLEAN | SQLite stores as 0/1, PostgreSQL has native boolean |

## Specific Column Mappings

### Users Table
- `id INTEGER PRIMARY KEY` → `id SERIAL PRIMARY KEY`
- `email TEXT` → `email VARCHAR(255)`
- `password TEXT` → `password_hash VARCHAR(255)`
- `role TEXT` → `role VARCHAR(50)`
- `created_at DATETIME` → `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### Projects Table
- `id INTEGER PRIMARY KEY` → `id SERIAL PRIMARY KEY`
- `user_id INTEGER` → `user_id INTEGER`
- `name TEXT` → `name VARCHAR(255)`
- `description TEXT` → `description TEXT`
- `status TEXT` → `status VARCHAR(50)`
- `budget REAL` → `budget DECIMAL(15,2)`

### Programs Table
- `id INTEGER PRIMARY KEY` → `id SERIAL PRIMARY KEY`
- `project_id INTEGER` → `project_id INTEGER`
- `name TEXT` → `name VARCHAR(255)`
- `priority TEXT` → `priority VARCHAR(20)`
- `progress INTEGER` → `progress_percentage INTEGER`

### Steps Table
- `id INTEGER PRIMARY KEY` → `id SERIAL PRIMARY KEY`
- `program_id INTEGER` → `program_id INTEGER`
- `sequence_number INTEGER` → `sequence_number INTEGER`
- `estimated_hours REAL` → `estimated_hours DECIMAL(8,2)`

## Special Considerations

### Auto-increment Handling
- SQLite: `AUTOINCREMENT`
- PostgreSQL: `SERIAL` or `GENERATED ALWAYS AS IDENTITY`

### Foreign Key Constraints
- SQLite: May not enforce by default
- PostgreSQL: Enforced by default, add `ON DELETE CASCADE` where needed

### JSON Data
- SQLite: Stored as TEXT
- PostgreSQL: Use JSONB for better performance and indexing

### Default Values
- Both support `DEFAULT` clause
- PostgreSQL supports more complex default expressions

### Indexes
- SQLite: Limited index types
- PostgreSQL: B-tree, Hash, GiST, SP-GiST, GIN, BRIN

## Migration Script Template

```sql
-- Example conversion
-- SQLite:
CREATE TABLE example (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL:
CREATE TABLE example (
    id SERIAL PRIMARY KEY,
    data TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Migration Considerations

1. **NULL Handling**: Verify NULL constraints match
2. **Character Encoding**: Ensure UTF-8 encoding
3. **Timezone**: Consider timezone handling for timestamps
4. **Sequences**: Reset sequences after data import
5. **Triggers**: Rewrite SQLite triggers for PostgreSQL
