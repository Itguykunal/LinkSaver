// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  
  // Delete existing demo user if exists
  await prisma.user.deleteMany({
    where: { email: 'test@example.com' }
  })
  
  // Create demo user with hashed password
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const demoUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword
    }
  })
  
  console.log('Created demo user:', {
    id: demoUser.id,
    email: demoUser.email
  })
  
  // Optionally, create some demo bookmarks
  await prisma.bookmark.createMany({
    data: [
      {
        url: 'https://github.com',
        title: 'GitHub',
        favicon: 'https://github.com/favicon.ico',
        summary: 'GitHub is where people build software.',
        userId: demoUser.id
      },
      {
        url: 'https://stackoverflow.com',
        title: 'Stack Overflow',
        favicon: 'https://stackoverflow.com/favicon.ico',
        summary: 'Stack Overflow is the largest online community for developers.',
        userId: demoUser.id
      }
    ]
  })
  
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })