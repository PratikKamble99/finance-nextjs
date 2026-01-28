import { prisma } from './db'

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Simple test query
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

export async function testNetWorthSnapshotTable(): Promise<boolean> {
  try {
    // Test if the netWorthSnapshot table exists and is accessible
    const count = await prisma.netWorthSnapshot.count()
    console.log(`✅ NetWorthSnapshot table accessible, found ${count} records`)
    return true
  } catch (error) {
    console.error('❌ NetWorthSnapshot table test failed:', error)
    return false
  }
}