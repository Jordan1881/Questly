const { Router } = require('express')
const { assertE2eEnabled, seedTask, seedReward } = require('../controllers/e2eSeed')

const router = Router()

router.use(assertE2eEnabled)
router.post('/task', seedTask)
router.post('/reward', seedReward)

module.exports = router
