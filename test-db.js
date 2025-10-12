// Test script to verify database and authentication
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testDatabaseAndAuth() {
  try {
    console.log('🔍 Testing database and auth setup...')
    
    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { username: 'demo_agent' }
    })
    
    if (agent) {
      console.log('✅ Agent found:', {
        id: agent.id,
        username: agent.username,
        email: agent.email,
        status: agent.status
      })
      
      // Test password
      const isPasswordValid = await bcrypt.compare('ABcd123#', agent.password)
      console.log('✅ Password valid:', isPasswordValid)
      
      // Check appointments count
      const appointmentCount = await prisma.appointment.count({
        where: { agentId: agent.id }
      })
      console.log('📊 Appointments for this agent:', appointmentCount)
      
      // Check notifications
      const notificationCount = await prisma.notification.count()
      console.log('🔔 Total notifications:', notificationCount)
      
      // Check doctors
      const doctorCount = await prisma.doctor.count()
      console.log('👨‍⚕️ Total doctors:', doctorCount)
      
    } else {
      console.log('❌ No agent found with username "demo_agent"')
    }
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    await prisma.$disconnect()
  }
}

testDatabaseAndAuth();