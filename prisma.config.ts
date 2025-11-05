import 'dotenv/config';
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  // Seed configuration is in package.json under "prisma.seed"
  // Environment variables are loaded via dotenv/config import above
})
