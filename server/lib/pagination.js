// Backward-compatible pagination. When a request sends no `limit`/`offset`, the
// endpoint behaves exactly as before (returns everything) so existing clients
// and tests are unaffected. When either is present, results are bounded and the
// total is advertised via the `X-Total-Count` response header.

function parsePagination(query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const hasLimit = query.limit !== undefined && query.limit !== ''
  const hasOffset = query.offset !== undefined && query.offset !== ''
  const active = hasLimit || hasOffset

  const rawLimit = parseInt(query.limit, 10)
  const rawOffset = parseInt(query.offset, 10)

  const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? defaultLimit : rawLimit, 1), maxLimit)
  const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0)

  return { active, limit, offset }
}

function setTotalCount(res, total) {
  res.set('X-Total-Count', String(total))
}

module.exports = { parsePagination, setTotalCount }
