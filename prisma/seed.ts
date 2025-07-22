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
        url: 'https://github.com/itguykunal',
        title: 'My GitHub Profile',
        favicon: 'https://github.com/favicon.ico',
        summary: 'GitHub is where people build software.',
        userId: demoUser.id
      },
      {
        url: 'https://leetcode.com/u/iTGuyKunal/',
        title: 'My leetcode Profile',
        favicon: 'https://leetcode.com/favicon.ico',
        summary: 'LeetCode is the best platform to help you enhance your skills.',
        userId: demoUser.id
      },
      {
        url: 'https://linkedin.com/in/itguykunal',
        title: 'My Linkedin Profile',
        favicon: 'https://linkedin.com/favicon.ico',
        summary: 'job searching, building a professional brand.',
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