#!/usr/bin/env node

// Database Connection Tester
// Tests PostgreSQL connection and displays configuration

const PostgreSQLConnection = require('./pg-connection');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function testConnection() {
  console.log('=== PostgreSQL Connection Test ===\n');

  // Display configuration (without password)
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || 'program_planner'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}\n`);

  const connection = new PostgreSQLConnection();

  // Test connection
  console.log('Testing connection...');
  const connected = await connection.testConnection();

  if (!connected) {
    console.log('\n✗ Connection failed!');
    console.log('\nTroubleshooting steps:');
    console.log('1. Ensure PostgreSQL is installed and running');
    console.log('2. Check your .env file has correct credentials');
    console.log('3. Verify the database exists');
    console.log('4. Check PostgreSQL logs for errors');
    process.exit(1);
  }

  console.log('\n✓ Connection successful!');

  // Get PostgreSQL version
  try {
    const version = await connection.query('SELECT version();');
    console.log('\nPostgreSQL Version:');
    console.log(version);
  } catch (error) {
    console.error('Failed to get version:', error.message);
  }

  // List databases
  try {
    console.log('\nAvailable Databases:');
    const databases = await connection.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `);
    databases.split('\n').forEach(db => {
      if (db.trim()) console.log(`  - ${db}`);
    });
  } catch (error) {
    console.error('Failed to list databases:', error.message);
  }

  // List tables in current database
  try {
    console.log(`\nTables in ${process.env.DB_NAME || 'program_planner'}:`);
    const tables = await connection.getTables();
    if (tables.length === 0) {
      console.log('  (no tables found - run migrations to create tables)');
    } else {
      tables.forEach(table => console.log(`  - ${table}`));
    }
  } catch (error) {
    console.error('Failed to list tables:', error.message);
  }

  console.log('\n✓ All tests passed!');
}

// Run test
testConnection().catch(error => {
  console.error('\nUnexpected error:', error.message);
  process.exit(1);
});