const crypto = require('crypto')
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const pinoHttp = require('pino-http')
const routes = require('./routes/index')
const logger = require('./lib/logger')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const avatarStorage = require('./lib/avatarStorage')
const { serveAvatar } = require('./lib/avatarServe')

function createApp() {
  const app = express()

  if (process.env.NODE_ENV === 'production') {
    const proxyHops = Number(process.env.TRUST_PROXY_HOPS)
    app.set('trust proxy', Number.isFinite(proxyHops) && proxyHops > 0 ? proxyHops : 1)
  }

  app.use(helmet())
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
    }),
  )
  // Structured request logging with a per-request id. pino-http also records
  // response time (responseTime), which is our built-in latency measurement.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id']
        const id = existing || crypto.randomUUID()
        res.setHeader('X-Request-Id', id)
        return id
      },
    }),
  )
  app.use(express.json())

  if (avatarStorage.isLocalMode()) {
    app.get('/api/uploads/avatars/:filename', serveAvatar)
    app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))
  }

  // Versioned alias: /api/v1/* is identical to /api/* today. New/breaking
  // shapes would ship under /api/v2 while /api and /api/v1 stay backward-compatible.
  app.use('/api', routes)
  app.use('/api/v1', routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
