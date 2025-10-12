const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLoginCredentials() {
  try {
    console.log('🔐 Testing login credentials...\n');
    
    // Test email login
    console.log('1. Testing email login: admin@gmail.com');
    const agentByEmail = await prisma.agent.findFirst({
      where: { email: 'admin@gmail.com' }
    });
    
    if (agentByEmail) {
      console.log('✅ Agent found by email');
      console.log('   - ID:', agentByEmail.id);
      console.log('   - Contact Person:', agentByEmail.contactPerson);
      console.log('   - Company:', agentByEmail.companyName);
      
      // Test password
      const passwordMatch = await bcrypt.compare('ABcd123#', agentByEmail.password);
      console.log('   - Password match:', passwordMatch ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ No agent found with email: admin@gmail.com');
    }
    
    console.log('\n2. Testing username login: demo_agent');
    const agentByUsername = await prisma.agent.findFirst({
      where: { username: 'demo_agent' }
    });
    
    if (agentByUsername) {
      console.log('✅ Agent found by username');
      console.log('   - Email:', agentByUsername.email);
      console.log('   - Contact Person:', agentByUsername.contactPerson);
      console.log('   - Same agent as email login:', agentByEmail?.id === agentByUsername.id ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ No agent found with username: demo_agent');
    }
    
    console.log('\n🎯 Login Credentials Summary:');
    console.log('Email: admin@gmail.com');
    console.log('Password: ABcd123#');
    console.log('Alternative Username: demo_agent');
    console.log('Status:', agentByEmail?.status || 'Unknown');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginCredentials();