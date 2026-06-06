const { runPersonalDataReportCycle } = require('../services/atlassianPersonalDataReport')

const DAY_MS = 24 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 60 * 1000

let intervalId = null
let running = false

async function tick() {
  if (running) return
  running = true

  try {
    const result = await runPersonalDataReportCycle()
    if (!result.skipped) {
      console.log(
        `[personal-data-report] reported=${result.reported ?? 0} erased=${result.erased ?? 0} refreshed=${result.refreshed ?? 0}`,
      )
    }
  } catch (err) {
    console.error('[personal-data-report] failed:', err.message)
  } finally {
    running = false
  }
}

function startPersonalDataReportJob({ enabled = true } = {}) {
  if (!enabled || intervalId) return

  setTimeout(() => {
    tick()
    intervalId = setInterval(tick, DAY_MS)
  }, STARTUP_DELAY_MS)
}

function stopPersonalDataReportJob() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

module.exports = {
  startPersonalDataReportJob,
  stopPersonalDataReportJob,
  tick,
}
