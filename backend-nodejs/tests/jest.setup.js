// Runs in every Jest worker before each test file.
// Ensures DATABASE_URL points to tourism_test for all integration tests.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test'), override: true });

// Suppress expected console.error noise during integration tests.
// These are all intentional test scenarios (wrong passwords, invalid states, no SMTP, etc.)
// Tests still pass — this just keeps the output clean.
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args[0] ? String(args[0]) : '';

  // Suppress: email delivery failures (no SMTP in test env)
  if (msg.includes('Failed to send email') || msg.includes('ECONNREFUSED')) return;

  // Suppress: Resend API errors (free plan domain restriction)
  if (msg.includes('Resend error') || msg.includes('Resend exception')) return;

  // Suppress: expected HTTP error logs from GlobalExceptionHandler
  if (msg.match(/\] (POST|GET|PUT|PATCH|DELETE) .+ →/)) return;

  // Suppress: Prisma full error stack dumps from GlobalExceptionHandler
  if (msg.startsWith('FULL ERROR:')) return;

  // Pass through everything else (real unexpected errors)
  originalConsoleError(...args);
};
