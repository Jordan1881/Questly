/** Transient Postgres / pool errors that often succeed on a single retry. */
function isTransientDbError(err) {
  if (!err) return false
  const code = err.code || err.errno
  if (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === '57P01' || // admin_shutdown
    code === '57P02' || // crash_shutdown
    code === '57P03' || // cannot_connect_now
    code === '08006' || // connection_failure
    code === '08001' || // sqlclient_unable_to_establish_sqlconnection
    code === '08003' // connection_does_not_exist
  ) {
    return true
  }

  const message = String(err.message || '')
  return /connection (terminated|refused|timeout|closed)|Connection terminated|timeout expired|Cannot create property|sorry, too many clients/i.test(
    message,
  )
}

async function withDbRetry(fn, { retries = 1 } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt >= retries || !isTransientDbError(err)) throw err
    }
  }
  throw lastErr
}

module.exports = { isTransientDbError, withDbRetry }
