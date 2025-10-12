const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test agent query
    const agent = await prisma.agent.findFirst({
      where: { username: 'demo_agent' }
    });
    
    console.log('Agent found:', agent ? 'Yes' : 'No');
    if (agent) {
      console.log('Agent ID:', agent.id);
      console.log('Agent Email:', agent.email);
      console.log('Agent Status:', agent.status);
    }
    
    // Test appointment count
    const appointmentCount = await prisma.appointment.count();
    console.log('Total appointments in database:', appointmentCount);
    
    // Test recent appointments for the agent
    if (agent) {
      const agentAppointments = await prisma.appointment.count({
        where: { agentId: agent.id }
      });
      console.log('Agent appointments:', agentAppointments);
      
      // Get a few sample appointments
      const sampleAppointments = await prisma.appointment.findMany({
        where: { agentId: agent.id },
        take: 3,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Sample appointments:', sampleAppointments.length);
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();