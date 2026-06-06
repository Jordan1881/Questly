require('dotenv').config()
const createApp = require('./app')
const config = require('./config/index')
const { startPersonalDataReportJob } = require('./jobs/personalDataReportJob')

const app = createApp()

app.listen(config.port, () => {
  console.log(`Questly API listening on :${config.port} [${config.env}]`)
  if (config.env === 'production' || config.atlassian.reportingRefreshToken) {
    startPersonalDataReportJob({ enabled: Boolean(config.atlassian.reportingRefreshToken) })
  }
})
