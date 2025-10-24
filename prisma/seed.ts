import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('ABcd123#', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'agent@gmail.com' },
    update: {},
    create: {
      email: 'agent@gmail.com',
      password: hashedPassword,
      name: 'Corporate Agent',
      role: 'AGENT',
      companyName: 'eChanneling Corporate',
      contactNumber: '+94771234567',
      isActive: true,
      isEmailVerified: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create hospitals
  const hospitals = await Promise.all([
    prisma.hospital.upsert({
      where: { id: 'hospital1' },
      update: {},
      create: {
        id: 'hospital1',
        name: 'Asiri Medical Hospital',
        address: '181 Kirula Road, Colombo 05',
        city: 'Colombo',
        district: 'Colombo',
        contactNumber: '+94112301300',
        email: 'info@asirihealth.com',
        website: 'https://asirihealth.com',
        facilities: ['ICU', 'Emergency', 'Laboratory', 'Pharmacy', 'Cardiology']
      }
    }),
    prisma.hospital.upsert({
      where: { id: 'hospital2' },
      update: {},
      create: {
        id: 'hospital2',
        name: 'Nawaloka Hospital',
        address: '23 Sri Sangaraja Mawatha, Colombo 02',
        city: 'Colombo',
        district: 'Colombo',
        contactNumber: '+94115577111',
        email: 'info@nawaloka.com',
        website: 'https://nawaloka.com',
        facilities: ['ICU', 'Emergency', 'Laboratory', 'Radiology', 'Neurology']
      }
    })
  ])

  console.log('✅ Created hospitals:', hospitals.length)

  // Create doctors
  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { id: 'doctor1' },
      update: {},
      create: {
        id: 'doctor1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@asiri.lk',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD Cardiology',
        experience: 15,
        consultationFee: 3500.00,
        rating: 4.8,
        description: 'Experienced cardiologist specializing in preventive cardiology and heart disease management.',
        languages: ['English', 'Sinhala'],
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        hospitalId: hospitals[0].id
      }
    }),
    prisma.doctor.upsert({
      where: { id: 'doctor2' },
      update: {},
      create: {
        id: 'doctor2',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@nawaloka.lk',
        specialization: 'Neurology',
        qualification: 'MBBS, MD Neurology',
        experience: 12,
        consultationFee: 4000.00,
        rating: 4.6,
        description: 'Neurologist with expertise in treating neurological disorders and brain conditions.',
        languages: ['English', 'Tamil', 'Sinhala'],
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        hospitalId: hospitals[1].id
      }
    }),
    prisma.doctor.upsert({
      where: { id: 'doctor3' },
      update: {},
      create: {
        id: 'doctor3',
        name: 'Dr. Priya Fernando',
        email: 'priya.fernando@asiri.lk',
        specialization: 'Pediatrics',
        qualification: 'MBBS, MD Pediatrics',
        experience: 10,
        consultationFee: 3000.00,
        rating: 4.9,
        description: 'Pediatrician dedicated to providing comprehensive healthcare for children.',
        languages: ['English', 'Sinhala'],
        availableDays: ['Monday', 'Tuesday', 'Thursday'],
        hospitalId: hospitals[0].id
      }
    })
  ])

  console.log('✅ Created doctors:', doctors.length)

  // Create time slots for the next 7 days
  console.log('🕒 Creating time slots...')
  let slotsCreated = 0
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    date.setHours(0, 0, 0, 0) // Set to start of day
    
    for (const doctor of doctors) {
      // Morning slots (9:00 AM - 12:00 PM)
      await prisma.timeSlot.upsert({
        where: {
          doctorId_date_startTime: {
            doctorId: doctor.id,
            date: date,
            startTime: new Date('2000-01-01T09:00:00Z')
          }
        },
        update: {},
        create: {
          doctorId: doctor.id,
          date: date,
          startTime: new Date('2000-01-01T09:00:00Z'),
          endTime: new Date('2000-01-01T12:00:00Z'),
          maxAppointments: 20,
          currentBookings: Math.floor(Math.random() * 5), // Random bookings 0-4
          consultationFee: parseFloat(doctor.consultationFee.toString())
        }
      })
      
      // Evening slots (6:00 PM - 9:00 PM)
      await prisma.timeSlot.upsert({
        where: {
          doctorId_date_startTime: {
            doctorId: doctor.id,
            date: date,
            startTime: new Date('2000-01-01T18:00:00Z')
          }
        },
        update: {},
        create: {
          doctorId: doctor.id,
          date: date,
          startTime: new Date('2000-01-01T18:00:00Z'),
          endTime: new Date('2000-01-01T21:00:00Z'),
          maxAppointments: 15,
          currentBookings: Math.floor(Math.random() * 3), // Random bookings 0-2
          consultationFee: parseFloat(doctor.consultationFee.toString()) * 1.2 // Evening premium
        }
      })
      
      slotsCreated += 2
    }
  }

  console.log('✅ Created time slots:', slotsCreated)

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Follow up with pending appointments',
        description: 'Contact patients with pending appointment confirmations',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        assignedToId: adminUser.id
      }
    }),
    prisma.task.create({
      data: {
        title: 'Update doctor availability',
        description: 'Update Dr. Sarah Johnson availability for next week',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        assignedToId: adminUser.id
      }
    })
  ])

  console.log('✅ Created tasks:', tasks.length)

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Welcome to eChanneling Corporate',
        message: 'Your account has been successfully activated. You can now start managing appointments.',
        type: 'SYSTEM_ALERT'
      }
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'New appointment booking',
        message: 'A new appointment has been booked for Dr. Sarah Johnson',
        type: 'APPOINTMENT_CONFIRMED'
      }
    })
  ])

  console.log('✅ Created notifications:', notifications.length)

  console.log('🎉 Database seeding completed successfully!')
  console.log('📧 Demo user credentials:')
  console.log('   Email: agent@gmail.com')
  console.log('   Password: ABcd123#')
  console.log('🏥 Created:', hospitals.length, 'hospitals')
  console.log('👨‍⚕️ Created:', doctors.length, 'doctors')
  console.log('🕒 Created:', slotsCreated, 'time slots')
  console.log('📋 Created:', tasks.length, 'tasks')
  console.log('🔔 Created:', notifications.length, 'notifications')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })