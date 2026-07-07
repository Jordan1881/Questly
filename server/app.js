const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes/index')
const { notFound, errorHandler } = require('./middleware/errorHandler')

function createApp() {
  const app = express()

  if (process.env.NODE_ENV === 'production') {
    const proxyHops = Number(process.env.TRUST_PROXY_HOPS)
    app.set('trust proxy', Number.isFinite(proxyHops) && proxyHops > 0 ? proxyHops : 1)
  }

  app.use(helmet())
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
  app.use(morgan('dev'))
  app.use(express.json())
  app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
