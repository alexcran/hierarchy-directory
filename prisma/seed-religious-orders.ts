import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import path from 'path'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const csvPath = path.join(__dirname, '../Male Religious Orders.csv')
  const rl = createInterface({ input: createReadStream(csvPath), crlfDelay: Infinity })

  let headerSkipped = false
  const rows: { fullName: string; abbreviation: string; commonName: string | null }[] = []

  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true
      continue
    }
    // Split on first two commas to handle any commas in the commonName field
    const first = line.indexOf(',')
    if (first === -1) continue
    const second = line.indexOf(',', first + 1)
    if (second === -1) continue

    const fullName = line.slice(0, first).trim()
    const abbreviation = line.slice(first + 1, second).trim()
    if (!fullName || !abbreviation) continue

    const commonName = line.slice(second + 1).trim() || null
    rows.push({ fullName, abbreviation, commonName })
  }

  console.log(`Seeding ${rows.length} religious orders…`)
  await prisma.religiousOrder.deleteMany()
  await prisma.religiousOrder.createMany({ data: rows })
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
