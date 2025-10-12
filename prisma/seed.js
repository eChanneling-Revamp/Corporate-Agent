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
    
    // Create hospitals
    const hospitals = await prisma.hospital.createMany({
      data: [
        {
          name: 'City General Hospital',
          address: '123 Hospital Road, Colombo 03',
          city: 'Colombo',
          phone: '+94112345001',
          email: 'info@citygeneral.lk',
          specialties: ['Cardiology', 'Neurology', 'General Medicine', 'Surgery'],
          isActive: true
        },
        {
          name: 'National Hospital',
          address: '45 National Road, Colombo 10',
          city: 'Colombo',
          phone: '+94112345002',
          email: 'contact@nationalhospital.lk',
          specialties: ['Neurology', 'Oncology', 'Cardiology', 'Pediatrics'],
          isActive: true
        },
        {
          name: "Children's Hospital",
          address: '67 Kids Lane, Nugegoda',
          city: 'Nugegoda',
          phone: '+94112345003',
          email: 'info@childrenshospital.lk',
          specialties: ['Pediatrics', 'Child Surgery', 'Neonatology'],
          isActive: true
        },
        {
          name: 'Private Medical Center',
          address: '89 Medical Street, Colombo 07',
          city: 'Colombo',
          phone: '+94112345004',
          email: 'reception@privatemedical.lk',
          specialties: ['General Medicine', 'Dermatology', 'Orthopedics'],
          isActive: true
        }
      ]
    })
    
    console.log(`✅ Created ${hospitals.count} hospitals`)
    
    // Create doctors
    const doctors = await prisma.doctor.createMany({
      data: [
        {
          name: 'Dr. Sarah Johnson',
          specialization: 'Cardiology',
          qualifications: 'MBBS, MD (Cardiology), FRCP',
          experience: '15 years',
          hospital: 'City General Hospital',
          location: 'Colombo 03',
          fee: 3500,
          consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
          availableSlots: ['09:00', '09:30', '10:00', '14:00', '14:30', '15:00'],
          workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
          rating: 4.8,
          totalReviews: 124,
          bio: 'Experienced cardiologist specializing in heart disease treatment and prevention.',
          isActive: true
        },
        {
          name: 'Dr. Michael Chen',
          specialization: 'Neurology',
          qualifications: 'MBBS, MD (Neurology), FRCP',
          experience: '12 years',
          hospital: 'National Hospital',
          location: 'Colombo 10',
          fee: 4000,
          consultationTypes: ['REGULAR', 'VIDEO_CONSULTATION'],
          availableSlots: ['08:00', '08:30', '09:00', '16:00', '16:30', '17:00'],
          workingDays: ['MON', 'WED', 'FRI', 'SAT'],
          rating: 4.9,
          totalReviews: 89,
          bio: 'Neurologist with expertise in brain and nervous system disorders.',
          isActive: true
        },
        {
          name: 'Dr. Emily Davis',
          specialization: 'Pediatrics',
          qualifications: 'MBBS, MD (Pediatrics), DCH',
          experience: '10 years',
          hospital: "Children's Hospital",
          location: 'Nugegoda',
          fee: 2800,
          consultationTypes: ['REGULAR', 'CHAT_CONSULTATION'],
          availableSlots: ['10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'],
          workingDays: ['TUE', 'THU', 'SAT', 'SUN'],
          rating: 4.7,
          totalReviews: 156,
          bio: 'Pediatrician dedicated to child health and development.',
          isActive: true
        },
        {
          name: 'Dr. Robert Wilson',
          specialization: 'Orthopedics',
          qualifications: 'MBBS, MS (Orthopedics), FRCS',
          experience: '18 years',
          hospital: 'Private Medical Center',
          location: 'Colombo 07',
          fee: 3200,
          consultationTypes: ['REGULAR'],
          availableSlots: ['09:00', '10:00', '11:00', '15:00', '16:00'],
          workingDays: ['MON', 'TUE', 'WED', 'THU'],
          rating: 4.6,
          totalReviews: 203,
          bio: 'Orthopedic surgeon specializing in bone and joint treatments.',
          isActive: true
        },
        {
          name: 'Dr. Priya Sharma',
          specialization: 'Dermatology',
          qualifications: 'MBBS, MD (Dermatology), DDV',
          experience: '8 years',
          hospital: 'Private Medical Center',
          location: 'Colombo 07',
          fee: 2500,
          consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
          availableSlots: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'],
          workingDays: ['MON', 'TUE', 'WED', 'FRI'],
          rating: 4.5,
          totalReviews: 67,
          bio: 'Dermatologist focusing on skin, hair, and nail conditions.',
          isActive: true
        }
      ]
    })
    
    console.log(`✅ Created ${doctors.count} doctors`)
    
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