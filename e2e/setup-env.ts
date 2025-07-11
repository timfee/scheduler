// Setup environment variables for E2E tests
Object.assign(process.env, { NODE_ENV: 'test' });
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SQLITE_PATH = ':memory:';
process.env.WEBHOOK_SECRET = 'test-webhook-secret-that-is-long-enough-to-meet-requirements';

// Additional test environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-for-nextauth';