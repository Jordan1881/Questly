// Force test DB settings — repo/org secrets (e.g. Railway DATABASE_URL) must not
// leak into Jest or knex will connect as the wrong user.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret'
process.env.DB_HOST = process.env.DB_HOST || 'localhost'
process.env.DB_PORT = process.env.DB_PORT || '5432'
process.env.DB_USER = process.env.DB_USER || 'postgres'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'
process.env.DB_NAME = process.env.DB_NAME || 'questly_dev'
process.env.DB_TEST_NAME = process.env.DB_TEST_NAME || 'questly_test'
delete process.env.DATABASE_URL
