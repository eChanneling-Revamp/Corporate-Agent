const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  try {
    // Create a test agent
    const hashedPassword = await bcrypt.hash('ABcd123#', 10)
    
    const agent = await prisma.agent.upsert({
      where: { email: 'agent@gmail.com' },
      update: {},
      create: {
        agentType: 'CORPORATE',
        companyName: 'Demo Company Ltd',
        registrationNumber: 'REG001',
        contactPerson: 'Demo Agent',
        email: 'agent@gmail.com',
        phone: '+94771234567',
        address: '123 Main Street, Colombo 01',
        username: 'demo_agent',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Created test agent:', agent.email)
    
    // Create a branch for the agent
    const branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        location: 'Colombo',
        address: '123 Main Street, Colombo 01',
        phone: '+94112345678',
        agentId: agent.id
      }
    })
    
    console.log('✅ Created branch:', branch.name)
    
    // Create some sample corporate employees
    const employees = await prisma.corporateEmployee.createMany({
      data: [
        {
          agentId: agent.id,
          employeeId: 'EMP001',
          name: 'John Doe',
          email: 'john.doe@democompany.com',
          phone: '+94771111111',
          department: 'Engineering',
          designation: 'Software Engineer',
          monthlyLimit: 25000.00,
          isActive: true
        },
        {
          agentId: agent.id,
          employeeId: 'EMP002',
          name: 'Jane Smith',
          email: 'jane.smith@democompany.com',
          phone: '+94772222222',
          department: 'HR',
          designation: 'HR Manager',
          monthlyLimit: 30000.00,
          isActive: true
        }
      ]
    })
    
    console.log(`✅ Created ${employees.count} corporate employees`)
    
    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Test Login Credentials:')
    console.log('   Email: agent@gmail.com')
    console.log('   Password: ABcd123#')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })