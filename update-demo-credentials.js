const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateDemoCredentials() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('ABcd123#', 12);
    
    // Update the existing demo agent
    const updatedAgent = await prisma.agent.update({
      where: {
        username: 'demo_agent'
      },
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Demo credentials updated successfully!');
    console.log('New login credentials:');
    console.log('Email: admin@gmail.com');
    console.log('Password: ABcd123#');
    console.log('');
    console.log('Updated agent details:');
    console.log('- ID:', updatedAgent.id);
    console.log('- Username:', updatedAgent.username);
    console.log('- Email:', updatedAgent.email);
    console.log('- Contact Person:', updatedAgent.contactPerson);
    console.log('- Company:', updatedAgent.companyName);
    
  } catch (error) {
    console.error('❌ Error updating demo credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoCredentials();