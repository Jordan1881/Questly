function notFound(req, res, next) {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
}

// Express 4-argument error handler — must keep all 4 params even if next is unused.
function errorHandler(err, req, res, next) {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${status}] ${message}`, err.stack)
  }

  res.status(status).json({ error: message })
}

module.exports = { notFound, errorHandler }
