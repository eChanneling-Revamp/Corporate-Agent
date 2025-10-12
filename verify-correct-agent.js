const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSpecificLogin() {
  try {
    console.log('Testing specific agent login...');
    
    // Find the correct agent
    const agent = await prisma.agent.findUnique({
      where: { username: 'demo_agent' }
    });
    
    if (!agent) {
      console.log('❌ Agent not found');
      return;
    }
    
    console.log('✅ Found agent:');
    console.log('   ID:', agent.id);
    console.log('   Username:', agent.username);  
    console.log('   Email:', agent.email);
    console.log('   Contact Person:', agent.contactPerson);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('ABcd123#', agent.password);
    console.log('   Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    
    // Check appointments for this agent
    const appointmentCount = await prisma.appointment.count({
      where: { agentId: agent.id }
    });
    
    console.log('   Appointments:', appointmentCount);
    
    if (appointmentCount > 0) {
      // Get sample appointments
      const sampleAppointments = await prisma.appointment.findMany({
        where: { agentId: agent.id },
        take: 3,
        select: {
          appointmentNumber: true,
          patientName: true,
          doctorName: true,
          status: true,
          amount: true
        }
      });
      
      console.log('\n✅ Sample appointments:');
      sampleAppointments.forEach(apt => {
        console.log(`   - ${apt.appointmentNumber}: ${apt.patientName} -> ${apt.doctorName} (${apt.status}) LKR ${apt.amount}`);
      });
    }
    
    console.log('\n🎯 This is the agent ID that should be in the session:', agent.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificLogin();