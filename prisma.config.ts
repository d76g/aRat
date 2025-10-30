import { defineConfig } from 'prisma/config'

export default defineConfig({
  seed: 'tsx --require dotenv/config scripts/seed.ts'
})
