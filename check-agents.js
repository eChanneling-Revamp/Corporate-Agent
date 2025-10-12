const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        contactPerson: true,
        createdAt: true
      }
    });
    
    console.log('Agents in database:');
    agents.forEach(agent => {
      console.log(`- ID: ${agent.id}`);
      console.log(`  Username: ${agent.username}`);
      console.log(`  Email: ${agent.email}`);
      console.log(`  Contact: ${agent.contactPerson}`);
      console.log(`  Created: ${agent.createdAt}`);
      console.log('');
    });
    
    // Check appointment counts for each agent
    for (const agent of agents) {
      const appointmentCount = await prisma.appointment.count({
        where: { agentId: agent.id }
      });
      console.log(`Agent ${agent.username} (${agent.id}) has ${appointmentCount} appointments`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();