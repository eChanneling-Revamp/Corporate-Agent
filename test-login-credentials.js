const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testing login credentials...');
    
    const agent = await prisma.agent.findUnique({
      where: { username: 'demo_agent' }
    });
    
    if (!agent) {
      console.log('❌ Agent not found');
      return;
    }
    
    console.log('✅ Agent found:', agent.contactPerson);
    console.log('   Email:', agent.email);
    console.log('   Status:', agent.status);
    console.log('   Company:', agent.companyName);
    
    // Test password
    const testPassword = 'ABcd123#';
    const isPasswordValid = await bcrypt.compare(testPassword, agent.password);
    
    console.log('✅ Password test:', isPasswordValid ? 'VALID' : 'INVALID');
    
    if (isPasswordValid) {
      console.log('\n🎉 Login credentials are correct!');
      console.log('   Username: demo_agent');
      console.log('   Password: ABcd123#');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();