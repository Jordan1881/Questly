require('dotenv').config()

const base = {
  client: 'pg',
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
  pool: { min: 2, max: 10 },
}

module.exports = {
  development: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'questly_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
  },

  test: {
    ...base,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_TEST_NAME || 'questly_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    // Jest gives each test file a fresh module registry, so each file builds its
    // own knex pool. With min:2 those idle connections linger across ~50 files and
    // approach Postgres's max_connections (100), causing flaky "too many clients"
    // failures in later suites. min:0 + a short idle timeout lets each pool release
    // its connections promptly so the total stays well under the cap.
    pool: { min: 0, max: 8, idleTimeoutMillis: 1000 },
  },

  production: {
    ...base,
    connection:
      process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
        ? process.env.DATABASE_URL
        : {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'questly_dev',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
          },
    pool: { min: 2, max: 10 },
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  },
}
