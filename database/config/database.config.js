// Database Configuration
// PostgreSQL connection settings for different environments

require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5435,
      database: process.env.DB_NAME || 'program_planner_dev',
      user: process.env.DB_USER || 'program_planner_user',
      password: process.env.DB_PASSWORD || '',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'program_planner_test',
      user: process.env.TEST_DB_USER || 'program_planner_user',
      password: process.env.TEST_DB_PASSWORD || '',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT || 5432,
      database: process.env.PROD_DB_NAME,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: '../migrations',
      tableName: 'knex_migrations'
    }
  }
};
