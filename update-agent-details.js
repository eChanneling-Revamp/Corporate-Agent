const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAgentDetails() {
  try {
    console.log('🔄 Updating agent details...');
    
    // Find the current agent
    const currentAgent = await prisma.agent.findUnique({
      where: { username: 'demo_agent' }
    });
    
    if (!currentAgent) {
      console.log('❌ Agent not found');
      return;
    }
    
    console.log('📋 Current agent details:');
    console.log('   Company:', currentAgent.companyName);
    console.log('   Contact Person:', currentAgent.contactPerson);
    console.log('   Email:', currentAgent.email);
    console.log('   Phone:', currentAgent.phone);
    console.log('   Address:', currentAgent.address);
    
    // Update with new details
    const updatedAgent = await prisma.agent.update({
      where: { username: 'demo_agent' },
      data: {
        companyName: 'Sri Lanka Telecom',
        contactPerson: 'Ojitha Rajapaksha',
        email: 'ojitharajapaksha@gmail.com',
        phone: '0775878565',
        address: 'Tangalle Rd, Dickwella'
      }
    });
    
    console.log('\n✅ Agent details updated successfully!');
    console.log('📋 New agent details:');
    console.log('   Company:', updatedAgent.companyName);
    console.log('   Contact Person:', updatedAgent.contactPerson);
    console.log('   Email:', updatedAgent.email);
    console.log('   Phone:', updatedAgent.phone);
    console.log('   Address:', updatedAgent.address);
    
    // Create audit log for the update
    await prisma.auditLog.create({
      data: {
        agentId: currentAgent.id,
        agentEmail: updatedAgent.email,
        action: 'UPDATE_PROFILE',
        entityType: 'AGENT',
        entityId: currentAgent.id,
        oldValue: {
          companyName: currentAgent.companyName,
          contactPerson: currentAgent.contactPerson,
          email: currentAgent.email,
          phone: currentAgent.phone,
          address: currentAgent.address
        },
        newValue: {
          companyName: updatedAgent.companyName,
          contactPerson: updatedAgent.contactPerson,
          email: updatedAgent.email,
          phone: updatedAgent.phone,
          address: updatedAgent.address
        }
      }
    });
    
    console.log('📝 Audit log created for profile update');
    
  } catch (error) {
    console.error('❌ Error updating agent details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAgentDetails();