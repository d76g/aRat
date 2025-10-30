// Load environment variables
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...')
    
    // Check if users exist
    const users = await prisma.user.findMany({
      select: {
        email: true,
        username: true,
        status: true,
        isApproved: true,
        isAdmin: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('📊 Users in database:', users.length)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.username}) - Status: ${user.status}, Approved: ${user.isApproved}, Admin: ${user.isAdmin}`)
    })
    
    // Test admin password
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@prieelo.com' }
    })
    
    if (adminUser) {
      console.log('\n🔐 Testing admin password...')
      const isValidPassword = await bcrypt.compare('witnyz-myjfi9-civnAx', adminUser.password)
      console.log(`Admin password valid: ${isValidPassword}`)
      
      if (adminUser.status !== 'APPROVED') {
        console.log(`❌ Admin status is ${adminUser.status}, should be APPROVED`)
      }
      
      if (!adminUser.isApproved) {
        console.log(`❌ Admin isApproved is ${adminUser.isApproved}, should be true`)
      }
    } else {
      console.log('❌ Admin user not found!')
    }
    
    // Test regular user password
    const regularUser = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    })
    
    if (regularUser) {
      console.log('\n🔐 Testing regular user password...')
      const isValidPassword = await bcrypt.compare('johndoe123', regularUser.password)
      console.log(`Regular user password valid: ${isValidPassword}`)
      
      if (regularUser.status !== 'APPROVED') {
        console.log(`❌ Regular user status is ${regularUser.status}, should be APPROVED`)
      }
      
      if (!regularUser.isApproved) {
        console.log(`❌ Regular user isApproved is ${regularUser.isApproved}, should be true`)
      }
    } else {
      console.log('❌ Regular user not found!')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
