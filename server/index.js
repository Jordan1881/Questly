require('dotenv').config()
const createApp = require('./app')
const config = require('./config/index')

const app = createApp()

app.listen(config.port, () => {
  console.log(`Questly API listening on :${config.port} [${config.env}]`)
})
