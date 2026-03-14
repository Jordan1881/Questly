const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const routes = require('./routes/index')
const { notFound, errorHandler } = require('./middleware/errorHandler')

function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
  app.use(morgan('dev'))
  app.use(express.json())

  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
