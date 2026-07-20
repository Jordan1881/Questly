const logger = require('../lib/logger')

function notFound(req, res, next) {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
}

// Express 4-argument error handler — must keep all 4 params even if next is unused.
function errorHandler(err, req, res, next) {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'

  // Log through the structured logger (redaction applied). 5xx are real faults
  // (log the stack); 4xx are expected client errors (warn, no stack noise).
  const log = req.log || logger
  if (status >= 500) {
    log.error({ err, status, reqId: req.id }, message)
  } else {
    log.warn({ status, reqId: req.id }, message)
  }

  res.status(status).json({ error: message })
}

module.exports = { notFound, errorHandler }
