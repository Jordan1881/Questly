const { z } = require('zod')

// Shared request schemas. Messages are chosen to match the historical inline
// controller messages so behavior is unchanged for existing clients/tests.

const loginSchema = z
  .object({
    email: z.string({ error: 'email and password are required' }).min(1, 'email and password are required'),
    password: z.string({ error: 'email and password are required' }).min(1, 'email and password are required'),
  })
  .loose()

const taskCompletionSchema = z
  .object({
    completed: z.boolean({ error: 'completed must be a boolean' }),
  })
  .loose()

const sprintCreateSchema = z
  .object({
    name: z.string({ error: 'name is required' }).trim().min(1, 'name is required'),
    startDate: z.union([z.string(), z.null()]).optional(),
    endDate: z.union([z.string(), z.null()]).optional(),
  })
  .loose()

module.exports = {
  loginSchema,
  taskCompletionSchema,
  sprintCreateSchema,
}
