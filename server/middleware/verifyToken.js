const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')

async function verifyToken(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = auth.slice(7)
  let payload
  try {
    payload = jwt.verify(token, config.jwt.secret)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const user = await UserModel.findById(payload.sub)
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = user
  next()
}

module.exports = verifyToken
