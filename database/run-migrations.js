#!/usr/bin/env node

// Database Migration Runner
// Executes all migrations in order

const fs = require('fs');
const path = require('path');
const PostgreSQLConnection = require('./pg-connection');

// Load environment variables from .env file if it exists
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

class MigrationRunner {
  constructor() {
    this.connection = new PostgreSQLConnection();
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async run() {
    console.log('=== Database Migration Runner ===\n');

    // Test connection
    console.log('Testing database connection...');
    const connected = await this.connection.testConnection();
    if (!connected) {
      console.error('\nFailed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Get migration files
    const migrationFiles = this.getMigrationFiles();
    if (migrationFiles.length === 0) {
      console.log('\nNo migration files found.');
      return;
    }

    console.log(`\nFound ${migrationFiles.length} migration files:\n`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    // Create migrations tracking table
    await this.createMigrationsTable();

    // Run migrations
    console.log('\nRunning migrations...\n');
    const results = [];
    
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.sql');
      
      // Check if migration already run
      const alreadyRun = await this.isMigrationRun(migrationName);
      if (alreadyRun) {
        console.log(`✓ ${migrationName} (already run)`);
        results.push({ file, status: 'skipped', reason: 'already run' });
        continue;
      }

      // Run migration
      const filePath = path.join(this.migrationsPath, file);
      const result = await this.connection.runMigration(filePath);
      
      if (result.success) {
        await this.recordMigration(migrationName);
        console.log(`✓ ${migrationName}`);
        results.push({ file, status: 'success' });
      } else {
        console.log(`✗ ${migrationName}: ${result.error}`);
        results.push({ file, status: 'failed', error: result.error });
        
        // Stop on first failure
        break;
      }
    }

    // Summary
    console.log('\n=== Migration Summary ===\n');
    const successful = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);

    // List tables
    console.log('\n=== Database Tables ===\n');
    const tables = await this.connection.getTables();
    tables.forEach(table => console.log(`  - ${table}`));

    if (failed > 0) {
      console.log('\n⚠  Migration failed. Please fix the errors and try again.');
      process.exit(1);
    } else {
      console.log('\n✓ All migrations completed successfully!');
    }
  }

  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql') && !file.includes('rollback'))
      .sort();
  }

  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.connection.query(sql);
    } catch (error) {
      console.error('Failed to create migrations table:', error.message);
    }
  }

  async isMigrationRun(migrationName) {
    try {
      const sql = `SELECT 1 FROM migrations WHERE name = '${migrationName}';`;
      const result = await this.connection.query(sql);
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async recordMigration(migrationName) {
    const sql = `INSERT INTO migrations (name) VALUES ('${migrationName}');`;
    await this.connection.query(sql);
  }
}

// Run migrations if called directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run().catch(error => {
    console.error('\nUnexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = MigrationRunner;