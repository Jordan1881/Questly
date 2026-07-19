const { ZodError } = require('zod')

// Central request-validation middleware. Pass a Zod schema for the request body;
// on success the parsed (and coerced) value replaces req.body, so controllers
// receive already-validated input. This is the single, reusable validation
// boundary — controllers keep their own checks as defense-in-depth.
//
// Ordered AFTER auth middleware in routes, so 401/403 still take precedence
// over 400 (an unauthenticated caller never learns whether their body was valid).
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body ?? {})
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
        return res.status(400).json({ error: issues[0]?.message || 'Invalid request', details: issues })
      }
      next(err)
    }
  }
}

module.exports = { validateBody }
