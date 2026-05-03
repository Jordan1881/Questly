const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const UserModel = require('../models/user')

const SALT_ROUNDS = 12
const INVALID_CREDENTIALS = 'Invalid credentials'

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

async function register(req, res, next) {
  try {
    const { email, username, password, role } = req.body
    if (!email || !username || !password || !role) {
      return res.status(400).json({ error: 'email, username, password and role are required' })
    }

    const existing = await UserModel.findByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await UserModel.create({ email, username, password_hash, role })
    const token = signToken(user)

    res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const row = await UserModel.findByEmail(email)
    const valid = row && (await bcrypt.compare(password, row.password_hash))
    if (!valid) {
      return res.status(401).json({ error: INVALID_CREDENTIALS })
    }

    const { password_hash, ...user } = row
    const token = signToken(user)

    res.status(200).json({ user, token })
  } catch (err) {
    next(err)
  }
}

async function me(req, res) {
  const { id, email, username, role, workspace_id, avatar_url, current_sprint_xp, lifetime_xp } =
    req.user
  res.json({ user: { id, email, username, role, workspace_id, avatar_url, current_sprint_xp, lifetime_xp } })
}

function logout(_req, res) {
  res.json({ message: 'Logged out' })
}

module.exports = { register, login, me, logout }
