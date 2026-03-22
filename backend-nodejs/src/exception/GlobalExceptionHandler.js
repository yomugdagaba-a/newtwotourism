/**
 * Global Exception Handler
 * Mirrors Spring Boot's @RestControllerAdvice / GlobalExceptionHandler
 * Catches all errors thrown by services and returns consistent JSON responses.
 */

function globalExceptionHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);

  // Validation errors from validate() middleware
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({ message: 'Validation failed', errors: err.errors });
  }

  const status = err.status || err.statusCode || 500;

  // Map status codes to meaningful messages (mirrors Spring Boot exception types)
  const response = { message: err.message || 'Internal server error' };

  if (status === 500) {
    response.message = 'Internal server error';
    console.error('FULL ERROR:', err.stack);
    // In development, expose the real error message to help debug
    if (process.env.NODE_ENV !== 'production') {
      response.detail = err.message;
    }
  }

  return res.status(status).json(response);
}

module.exports = { globalExceptionHandler };
