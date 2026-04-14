/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 60000,
  verbose: true,
  // Runs in each worker before test files — loads .env.test
  setupFiles: ['./tests/jest.setup.js'],
  // Runs once before all suites — seeds the test DB
  globalSetup: './tests/integration/setup.js',
};
