const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgent() {
  try {
    const agent = await prisma.agent.findFirst();
    console.log('Current agent in DB:');
    console.log('ID:', agent.id);
    console.log('Username:', agent.username);
    console.log('Contact Person (name):', agent.contactPerson);
    console.log('Company Name:', agent.companyName);
    console.log('Email:', agent.email);
    console.log('Phone:', agent.phone);
    console.log('Updated At:', agent.updatedAt);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgent();