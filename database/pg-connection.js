// PostgreSQL Connection Wrapper
// Uses psql command-line tool since npm packages are not available

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PostgreSQLConnection {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || process.env.DB_PORT || 5432,
      database: config.database || process.env.DB_NAME || 'program_planner',
      user: config.user || process.env.DB_USER || 'postgres',
      password: config.password || process.env.DB_PASSWORD || 'postgres'
    };
  }

  /**
   * Execute a SQL query using psql
   * @param {string} sql - SQL query to execute
   * @returns {Promise<string>} Query result
   */
  async query(sql) {
    return new Promise((resolve, reject) => {
      const args = [
        '-h', this.config.host,
        '-p', this.config.port,
        '-U', this.config.user,
        '-d', this.config.database,
        '-t',  // tuples only (no headers)
        '-A',  // unaligned output
        '-c', sql
      ];

      const psql = spawn('psql', args, {
        env: { ...process.env, PGPASSWORD: this.config.password }
      });

      let output = '';
      let error = '';

      psql.stdout.on('data', (data) => {
        output += data.toString();
      });

      psql.stderr.on('data', (data) => {
        error += data.toString();
      });

      psql.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || `psql exited with code ${code}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  /**
   * Execute a SQL file
   * @param {string} filePath - Path to SQL file
   * @returns {Promise<string>} Execution result
   */
  async executeFile(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        reject(new Error(`SQL file not found: ${filePath}`));
        return;
      }

      const args = [
        '-h', this.config.host,
        '-p', this.config.port,
        '-U', this.config.user,
        '-d', this.config.database,
        '-f', filePath
      ];

      const psql = spawn('psql', args, {
        env: { ...process.env, PGPASSWORD: this.config.password }
      });

      let output = '';
      let error = '';

      psql.stdout.on('data', (data) => {
        output += data.toString();
      });

      psql.stderr.on('data', (data) => {
        error += data.toString();
      });

      psql.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || `psql exited with code ${code}`));
        } else {
          resolve(output);
        }
      });
    });
  }

  /**
   * Run a database migration
   * @param {string} migrationFile - Path to migration SQL file
   * @returns {Promise<Object>} Migration result
   */
  async runMigration(migrationFile) {
    const migrationName = path.basename(migrationFile);
    console.log(`Running migration: ${migrationName}`);

    try {
      const result = await this.executeFile(migrationFile);
      return {
        success: true,
        migration: migrationName,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        migration: migrationName,
        error: error.message
      };
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const result = await this.query('SELECT version();');
      console.log('Database connected:', result);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Create database if it doesn't exist
   * @param {string} databaseName - Name of database to create
   * @returns {Promise<boolean>} Creation status
   */
  async createDatabase(databaseName) {
    // Connect to postgres database to create new database
    const tempConfig = { ...this.config, database: 'postgres' };
    const tempConnection = new PostgreSQLConnection(tempConfig);

    try {
      // Check if database exists
      const checkSql = `SELECT 1 FROM pg_database WHERE datname = '${databaseName}';`;
      const exists = await tempConnection.query(checkSql);
      
      if (exists) {
        console.log(`Database ${databaseName} already exists`);
        return true;
      }

      // Create database
      await tempConnection.query(`CREATE DATABASE ${databaseName};`);
      console.log(`Database ${databaseName} created successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to create database ${databaseName}:`, error.message);
      return false;
    }
  }

  /**
   * Get table list
   * @returns {Promise<Array>} List of tables
   */
  async getTables() {
    try {
      const sql = `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `;
      const result = await this.query(sql);
      return result.split('\n').filter(table => table.trim());
    } catch (error) {
      console.error('Failed to get tables:', error.message);
      return [];
    }
  }

  /**
   * Export database schema
   * @param {string} outputFile - Path to output file
   * @returns {Promise<boolean>} Export status
   */
  async exportSchema(outputFile) {
    return new Promise((resolve, reject) => {
      const args = [
        '-h', this.config.host,
        '-p', this.config.port,
        '-U', this.config.user,
        '-d', this.config.database,
        '--schema-only',
        '-f', outputFile
      ];

      const pgDump = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: this.config.password }
      });

      let error = '';

      pgDump.stderr.on('data', (data) => {
        error += data.toString();
      });

      pgDump.on('close', (code) => {
        if (code !== 0) {
          console.error('Schema export failed:', error);
          resolve(false);
        } else {
          console.log(`Schema exported to ${outputFile}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Import data from SQL file
   * @param {string} dataFile - Path to data SQL file
   * @returns {Promise<boolean>} Import status
   */
  async importData(dataFile) {
    try {
      await this.executeFile(dataFile);
      console.log(`Data imported from ${dataFile}`);
      return true;
    } catch (error) {
      console.error('Data import failed:', error.message);
      return false;
    }
  }
}

module.exports = PostgreSQLConnection;