import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixJointCounts() {
  console.log('🔍 Searching for entries with hasSmoked=true but jointCount<=0...')

  const brokenEntries = await prisma.entry.findMany({
    where: {
      hasSmoked: true,
      OR: [
        { jointCount: 0 },
        { jointCount: null },
      ],
    },
    select: {
      id: true,
      date: true,
      time: true,
      hasSmoked: true,
      jointCount: true,
    },
  })

  console.log(`\n📊 Found ${brokenEntries.length} broken entries`)

  if (brokenEntries.length === 0) {
    console.log('✅ No entries to fix!')
    return
  }

  console.log('\n🔧 Fixing entries...')

  for (const entry of brokenEntries) {
    console.log(`  Fixing entry ${entry.id} (${entry.date.toISOString().split('T')[0]} ${entry.time})`)
    await prisma.entry.update({
      where: { id: entry.id },
      data: { jointCount: 1 },
    })
  }

  console.log(`\n✅ Fixed ${brokenEntries.length} entries!`)

  // Verify
  const stillBroken = await prisma.entry.count({
    where: {
      hasSmoked: true,
      OR: [
        { jointCount: 0 },
        { jointCount: null },
      ],
    },
  })

  if (stillBroken === 0) {
    console.log('✅ All entries are now correct!')
  } else {
    console.log(`⚠️ Still ${stillBroken} broken entries remaining`)
  }
}

fixJointCounts()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
