import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aCBAppointment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.corporateEmployee.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.agent.deleteMany();

  console.log('🧹 Cleared existing data');

  // Seed Hospitals
  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: 'National Hospital of Sri Lanka',
        address: 'Regent Street, Colombo 08',
        city: 'Colombo',
        phone: '+94112691111',
        email: 'info@nhsl.health.gov.lk',
        latitude: 6.9147,
        longitude: 79.8612,
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'General Surgery'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Asiri Central Hospital',
        address: 'No. 114, Norris Canal Road, Colombo 10',
        city: 'Colombo',
        phone: '+94112665500',
        email: 'info@asirihealth.com',
        latitude: 6.9271,
        longitude: 79.8612,
        specialties: ['Dermatology', 'ENT', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Rheumatology'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true,
          cafeteria: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Nawaloka Hospital',
        address: 'No. 23, Deshamanya H.K. Dharmadasa Mawatha, Colombo 02',
        city: 'Colombo',
        phone: '+94112544444',
        email: 'info@nawaloka.com',
        latitude: 6.9174,
        longitude: 79.8553,
        specialties: ['Obstetrics & Gynecology', 'Pediatrics', 'Psychiatry', 'Endocrinology', 'Ophthalmology'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true,
          maternity: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Lanka Hospital',
        address: 'No. 578, Elvitigala Mawatha, Colombo 05',
        city: 'Colombo',
        phone: '+94115430000',
        email: 'info@lankahospitals.com',
        latitude: 6.8918,
        longitude: 79.8772,
        specialties: ['Plastic Surgery', 'Urology', 'Anesthesiology', 'Emergency Medicine', 'Family Medicine'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true,
          helipad: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Durdans Hospital',
        address: 'No. 3, Alfred Place, Colombo 03',
        city: 'Colombo',
        phone: '+94112140000',
        email: 'info@durdans.com',
        latitude: 6.9147,
        longitude: 79.8501,
        specialties: ['Interventional Cardiology', 'Neurosurgery', 'Oncology', 'Transplant Surgery'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true,
          vip_rooms: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Hemas Hospital Wattala',
        address: 'No. 389, Negombo Road, Wattala',
        city: 'Wattala',
        phone: '+94112930000',
        email: 'info@hemashospitals.com',
        latitude: 6.9784,
        longitude: 79.8921,
        specialties: ['General Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          parking: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Golden Key Eye Hospital',
        address: 'No. 374, Union Place, Colombo 02',
        city: 'Colombo',
        phone: '+94112303030',
        email: 'info@goldenkey.lk',
        latitude: 6.9147,
        longitude: 79.8612,
        specialties: ['Ophthalmology', 'Corneal Transplant', 'Retinal Surgery', 'Laser Eye Surgery'],
        facilities: {
          pharmacy: true,
          laboratory: true,
          laser_center: true,
          parking: true
        },
        isActive: true
      }
    }),
    prisma.hospital.create({
      data: {
        name: 'Joseph Fraser Memorial Hospital',
        address: 'Sangaraja Mawatha, Kandy',
        city: 'Kandy',
        phone: '+94812232337',
        email: 'info@jfmh.health.gov.lk',
        latitude: 7.2906,
        longitude: 80.6337,
        specialties: ['General Medicine', 'Surgery', 'Pediatrics', 'Orthopedics', 'Emergency Medicine'],
        facilities: {
          emergency: true,
          icu: true,
          pharmacy: true,
          laboratory: true,
          radiology: true,
          parking: true
        },
        isActive: true
      }
    })
  ]);

  console.log('🏥 Created 8 hospitals');

  // Seed Doctors
  const doctors = await Promise.all([
    // Cardiology Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Pradeep Kariyawasam',
        specialization: 'Cardiology',
        qualifications: 'MBBS, MD (Cardiology), FRCP (London)',
        experience: '15 years',
        hospital: hospitals[0].name,
        hospitalId: hospitals[0].id,
        location: 'Colombo',
        fee: 3500.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          { day: 'WED', times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          { day: 'FRI', times: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI'],
        rating: 4.8,
        totalReviews: 156,
        bio: 'Consultant Cardiologist specializing in interventional cardiology and heart failure management.',
        isActive: true
      }
    }),
    prisma.doctor.create({
      data: {
        name: 'Dr. Samanthi Fernando',
        specialization: 'Cardiology',
        qualifications: 'MBBS, MD (Cardiology), FACC',
        experience: '12 years',
        hospital: hospitals[4].name,
        hospitalId: hospitals[4].id,
        location: 'Colombo',
        fee: 4000.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION', 'VIDEO_CONSULTATION'],
        availableSlots: [
          { day: 'TUE', times: ['08:00', '09:00', '10:00', '15:00', '16:00', '17:00'] },
          { day: 'THU', times: ['08:00', '09:00', '10:00', '15:00', '16:00', '17:00'] },
          { day: 'SAT', times: ['08:00', '09:00', '10:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.9,
        totalReviews: 203,
        bio: 'Leading cardiologist with expertise in cardiac catheterization and preventive cardiology.',
        isActive: true
      }
    }),

    // Neurology Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Rohana Marasinghe',
        specialization: 'Neurology',
        qualifications: 'MBBS, MD (Neurology), FRCP (Edinburgh)',
        experience: '18 years',
        hospital: hospitals[0].name,
        hospitalId: hospitals[0].id,
        location: 'Colombo',
        fee: 3800.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['14:00', '15:00', '16:00', '17:00'] },
          { day: 'WED', times: ['14:00', '15:00', '16:00', '17:00'] },
          { day: 'FRI', times: ['14:00', '15:00', '16:00', '17:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI'],
        rating: 4.7,
        totalReviews: 98,
        bio: 'Consultant Neurologist with specialization in epilepsy, stroke management and movement disorders.',
        isActive: true
      }
    }),

    // Orthopedics Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Chandana Silva',
        specialization: 'Orthopedics',
        qualifications: 'MBBS, MS (Orthopedics), FRCS (Edinburgh)',
        experience: '20 years',
        hospital: hospitals[1].name,
        hospitalId: hospitals[1].id,
        location: 'Colombo',
        fee: 4200.00,
        consultationTypes: ['REGULAR'],
        availableSlots: [
          { day: 'TUE', times: ['09:00', '10:00', '11:00', '16:00', '17:00'] },
          { day: 'THU', times: ['09:00', '10:00', '11:00', '16:00', '17:00'] },
          { day: 'SAT', times: ['09:00', '10:00', '11:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.6,
        totalReviews: 142,
        bio: 'Senior Consultant Orthopedic Surgeon specializing in joint replacement and sports injuries.',
        isActive: true
      }
    }),

    // Pediatrics Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Malika Perera',
        specialization: 'Pediatrics',
        qualifications: 'MBBS, MD (Pediatrics), MRCPCH',
        experience: '14 years',
        hospital: hospitals[2].name,
        hospitalId: hospitals[2].id,
        location: 'Colombo',
        fee: 3200.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION', 'VIDEO_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] },
          { day: 'WED', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] },
          { day: 'FRI', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] },
          { day: 'SAT', times: ['08:00', '09:00', '10:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI', 'SAT'],
        rating: 4.9,
        totalReviews: 187,
        bio: 'Consultant Pediatrician with expertise in neonatal care and childhood development.',
        isActive: true
      }
    }),

    // Dermatology Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Saman Ratnatunga',
        specialization: 'Dermatology',
        qualifications: 'MBBS, MD (Dermatology), MRCP (UK)',
        experience: '11 years',
        hospital: hospitals[1].name,
        hospitalId: hospitals[1].id,
        location: 'Colombo',
        fee: 3600.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['14:00', '15:00', '16:00', '17:00', '18:00'] },
          { day: 'WED', times: ['14:00', '15:00', '16:00', '17:00', '18:00'] },
          { day: 'SAT', times: ['09:00', '10:00', '11:00', '12:00'] }
        ],
        workingDays: ['MON', 'WED', 'SAT'],
        rating: 4.5,
        totalReviews: 76,
        bio: 'Consultant Dermatologist specializing in medical and cosmetic dermatology.',
        isActive: true
      }
    }),

    // ENT Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Nimal Jayasekara',
        specialization: 'ENT',
        qualifications: 'MBBS, MS (ENT), FRCS (Edinburgh)',
        experience: '16 years',
        hospital: hospitals[1].name,
        hospitalId: hospitals[1].id,
        location: 'Colombo',
        fee: 3400.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'TUE', times: ['09:00', '10:00', '11:00', '15:00', '16:00'] },
          { day: 'THU', times: ['09:00', '10:00', '11:00', '15:00', '16:00'] },
          { day: 'SAT', times: ['14:00', '15:00', '16:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.4,
        totalReviews: 89,
        bio: 'Consultant ENT Surgeon with expertise in head and neck surgery.',
        isActive: true
      }
    }),

    // Obstetrics & Gynecology Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Shirani Rajapaksa',
        specialization: 'Obstetrics & Gynecology',
        qualifications: 'MBBS, MD (Obs & Gyn), MRCOG',
        experience: '19 years',
        hospital: hospitals[2].name,
        hospitalId: hospitals[2].id,
        location: 'Colombo',
        fee: 4000.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION', 'VIDEO_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['09:00', '10:00', '11:00', '16:00', '17:00'] },
          { day: 'WED', times: ['09:00', '10:00', '11:00', '16:00', '17:00'] },
          { day: 'FRI', times: ['09:00', '10:00', '11:00', '16:00', '17:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI'],
        rating: 4.8,
        totalReviews: 234,
        bio: 'Senior Consultant Obstetrician & Gynecologist with expertise in high-risk pregnancies.',
        isActive: true
      }
    }),

    // Ophthalmology Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Kamani Mendis',
        specialization: 'Ophthalmology',
        qualifications: 'MBBS, DO, MS (Ophthalmology), FRCS',
        experience: '13 years',
        hospital: hospitals[6].name,
        hospitalId: hospitals[6].id,
        location: 'Colombo',
        fee: 3800.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] },
          { day: 'TUE', times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] },
          { day: 'WED', times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] },
          { day: 'THU', times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] },
          { day: 'FRI', times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] }
        ],
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        rating: 4.7,
        totalReviews: 167,
        bio: 'Consultant Ophthalmologist specializing in cataract and retinal surgery.',
        isActive: true
      }
    }),

    // General Surgery Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Upul Dissanayake',
        specialization: 'General Surgery',
        qualifications: 'MBBS, MS (General Surgery), FRCS',
        experience: '22 years',
        hospital: hospitals[3].name,
        hospitalId: hospitals[3].id,
        location: 'Colombo',
        fee: 4500.00,
        consultationTypes: ['REGULAR'],
        availableSlots: [
          { day: 'TUE', times: ['15:00', '16:00', '17:00', '18:00'] },
          { day: 'THU', times: ['15:00', '16:00', '17:00', '18:00'] },
          { day: 'SAT', times: ['09:00', '10:00', '11:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.6,
        totalReviews: 112,
        bio: 'Senior Consultant General Surgeon with expertise in laparoscopic surgery.',
        isActive: true
      }
    }),

    // Kandy Hospital Doctors
    prisma.doctor.create({
      data: {
        name: 'Dr. Mahinda Wickramasinghe',
        specialization: 'General Medicine',
        qualifications: 'MBBS, MD (General Medicine), MRCP',
        experience: '17 years',
        hospital: hospitals[7].name,
        hospitalId: hospitals[7].id,
        location: 'Kandy',
        fee: 2800.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] },
          { day: 'WED', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] },
          { day: 'FRI', times: ['08:00', '09:00', '10:00', '15:00', '16:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI'],
        rating: 4.5,
        totalReviews: 93,
        bio: 'Consultant Physician with expertise in diabetes management and internal medicine.',
        isActive: true
      }
    }),

    prisma.doctor.create({
      data: {
        name: 'Dr. Anoma Rathnayake',
        specialization: 'Pediatrics',
        qualifications: 'MBBS, MD (Pediatrics), DCH',
        experience: '12 years',
        hospital: hospitals[7].name,
        hospitalId: hospitals[7].id,
        location: 'Kandy',
        fee: 2600.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'TUE', times: ['08:00', '09:00', '10:00', '16:00', '17:00'] },
          { day: 'THU', times: ['08:00', '09:00', '10:00', '16:00', '17:00'] },
          { day: 'SAT', times: ['08:00', '09:00', '10:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.8,
        totalReviews: 145,
        bio: 'Consultant Pediatrician specializing in child nutrition and developmental disorders.',
        isActive: true
      }
    }),

    // More specialists
    prisma.doctor.create({
      data: {
        name: 'Dr. Ruwan Jayawardena',
        specialization: 'Gastroenterology',
        qualifications: 'MBBS, MD (Gastroenterology), MRCP',
        experience: '14 years',
        hospital: hospitals[1].name,
        hospitalId: hospitals[1].id,
        location: 'Colombo',
        fee: 3700.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['15:00', '16:00', '17:00', '18:00'] },
          { day: 'WED', times: ['15:00', '16:00', '17:00', '18:00'] },
          { day: 'FRI', times: ['15:00', '16:00', '17:00', '18:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI'],
        rating: 4.6,
        totalReviews: 78,
        bio: 'Consultant Gastroenterologist specializing in liver diseases and endoscopy.',
        isActive: true
      }
    }),

    prisma.doctor.create({
      data: {
        name: 'Dr. Thilini Amarasinghe',
        specialization: 'Nephrology',
        qualifications: 'MBBS, MD (Nephrology), MRCP',
        experience: '11 years',
        hospital: hospitals[1].name,
        hospitalId: hospitals[1].id,
        location: 'Colombo',
        fee: 3600.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION', 'VIDEO_CONSULTATION'],
        availableSlots: [
          { day: 'TUE', times: ['14:00', '15:00', '16:00', '17:00'] },
          { day: 'THU', times: ['14:00', '15:00', '16:00', '17:00'] },
          { day: 'SAT', times: ['09:00', '10:00', '11:00'] }
        ],
        workingDays: ['TUE', 'THU', 'SAT'],
        rating: 4.7,
        totalReviews: 62,
        bio: 'Consultant Nephrologist with expertise in dialysis and kidney transplantation.',
        isActive: true
      }
    }),

    prisma.doctor.create({
      data: {
        name: 'Dr. Asanka Gunasekara',
        specialization: 'Psychiatry',
        qualifications: 'MBBS, MD (Psychiatry), MRCPsych',
        experience: '16 years',
        hospital: hospitals[2].name,
        hospitalId: hospitals[2].id,
        location: 'Colombo',
        fee: 3500.00,
        consultationTypes: ['REGULAR', 'TELE_CONSULTATION', 'VIDEO_CONSULTATION'],
        availableSlots: [
          { day: 'MON', times: ['14:00', '15:00', '16:00', '17:00', '18:00'] },
          { day: 'WED', times: ['14:00', '15:00', '16:00', '17:00', '18:00'] },
          { day: 'FRI', times: ['14:00', '15:00', '16:00', '17:00', '18:00'] },
          { day: 'SAT', times: ['09:00', '10:00', '11:00'] }
        ],
        workingDays: ['MON', 'WED', 'FRI', 'SAT'],
        rating: 4.8,
        totalReviews: 134,
        bio: 'Consultant Psychiatrist specializing in anxiety disorders and depression management.',
        isActive: true
      }
    })
  ]);

  console.log('👨‍⚕️ Created 15 doctors across multiple specializations');

  // Create the demo agent
  const hashedPassword = await hash('ABcd123#', 10);
  
  const demoAgent = await prisma.agent.create({
    data: {
      agentType: 'CORPORATE',
      companyName: 'TechCorp Solutions (Pvt) Ltd',
      registrationNumber: 'PV12345',
      contactPerson: 'Nimal Perera',
      email: 'nimal.perera@techcorp.lk',
      phone: '+94112345678',
      address: 'No. 123, Galle Road, Colombo 03, Sri Lanka',
      username: 'demo_agent',
      password: hashedPassword,
      status: 'ACTIVE',
      permissions: {
        canBookAppointments: true,
        canCancelAppointments: true,
        canViewReports: true,
        canManageEmployees: true,
        canProcessPayments: true,
        bulkBookingLimit: 50
      }
    }
  });

  console.log('🏢 Created demo agent: TechCorp Solutions');

  // Create branches for the agent
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        name: 'TechCorp Head Office',
        location: 'Colombo 03',
        address: 'No. 123, Galle Road, Colombo 03',
        phone: '+94112345678',
        agentId: demoAgent.id
      }
    }),
    prisma.branch.create({
      data: {
        name: 'TechCorp Kandy Branch',
        location: 'Kandy',
        address: 'No. 45, Peradeniya Road, Kandy',
        phone: '+94812345678',
        agentId: demoAgent.id
      }
    }),
    prisma.branch.create({
      data: {
        name: 'TechCorp Galle Branch',
        location: 'Galle',
        address: 'No. 78, Matara Road, Galle',
        phone: '+94912345678',
        agentId: demoAgent.id
      }
    })
  ]);

  console.log('🏢 Created 3 branches for TechCorp');

  // Create corporate employees
  const employees = await Promise.all([
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC001',
        name: 'Kasun Bandara',
        email: 'kasun.bandara@techcorp.lk',
        phone: '+94771234567',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        agentId: demoAgent.id,
        packageType: 'Premium',
        monthlyLimit: 10000.00,
        usedLimit: 2450.00,
        dependents: [
          { name: 'Malki Bandara', relationship: 'Spouse', age: 29 },
          { name: 'Sahan Bandara', relationship: 'Child', age: 5 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC002',
        name: 'Chamari Silva',
        email: 'chamari.silva@techcorp.lk',
        phone: '+94772345678',
        department: 'Marketing',
        designation: 'Marketing Manager',
        agentId: demoAgent.id,
        packageType: 'Premium',
        monthlyLimit: 10000.00,
        usedLimit: 1800.00,
        dependents: [
          { name: 'Roshan Silva', relationship: 'Spouse', age: 33 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC003',
        name: 'Pradeep Fernando',
        email: 'pradeep.fernando@techcorp.lk',
        phone: '+94773456789',
        department: 'Finance',
        designation: 'Finance Officer',
        agentId: demoAgent.id,
        packageType: 'Standard',
        monthlyLimit: 7500.00,
        usedLimit: 3200.00,
        dependents: [],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC004',
        name: 'Dilani Wickramasinghe',
        email: 'dilani.wickramasinghe@techcorp.lk',
        phone: '+94774567890',
        department: 'Human Resources',
        designation: 'HR Manager',
        agentId: demoAgent.id,
        packageType: 'Premium',
        monthlyLimit: 10000.00,
        usedLimit: 1200.00,
        dependents: [
          { name: 'Amara Wickramasinghe', relationship: 'Child', age: 8 },
          { name: 'Nisha Wickramasinghe', relationship: 'Child', age: 12 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC005',
        name: 'Nuwan Rajapaksa',
        email: 'nuwan.rajapaksa@techcorp.lk',
        phone: '+94775678901',
        department: 'Operations',
        designation: 'Operations Manager',
        agentId: demoAgent.id,
        packageType: 'Executive',
        monthlyLimit: 15000.00,
        usedLimit: 4800.00,
        dependents: [
          { name: 'Sanduni Rajapaksa', relationship: 'Spouse', age: 31 },
          { name: 'Kavindi Rajapaksa', relationship: 'Child', age: 7 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC006',
        name: 'Samantha Gunasekara',
        email: 'samantha.gunasekara@techcorp.lk',
        phone: '+94776789012',
        department: 'Engineering',
        designation: 'DevOps Engineer',
        agentId: demoAgent.id,
        packageType: 'Standard',
        monthlyLimit: 7500.00,
        usedLimit: 2100.00,
        dependents: [],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC007',
        name: 'Anushka Perera',
        email: 'anushka.perera@techcorp.lk',
        phone: '+94777890123',
        department: 'Sales',
        designation: 'Sales Executive',
        agentId: demoAgent.id,
        packageType: 'Standard',
        monthlyLimit: 7500.00,
        usedLimit: 890.00,
        dependents: [
          { name: 'Tharaka Perera', relationship: 'Spouse', age: 28 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC008',
        name: 'Janith Wijesinghe',
        email: 'janith.wijesinghe@techcorp.lk',
        phone: '+94778901234',
        department: 'Engineering',
        designation: 'Software Engineer',
        agentId: demoAgent.id,
        packageType: 'Standard',
        monthlyLimit: 7500.00,
        usedLimit: 1650.00,
        dependents: [],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC009',
        name: 'Thanuja Abeysekara',
        email: 'thanuja.abeysekara@techcorp.lk',
        phone: '+94779012345',
        department: 'Quality Assurance',
        designation: 'QA Lead',
        agentId: demoAgent.id,
        packageType: 'Premium',
        monthlyLimit: 10000.00,
        usedLimit: 3100.00,
        dependents: [
          { name: 'Dinesh Abeysekara', relationship: 'Spouse', age: 35 },
          { name: 'Hiruni Abeysekara', relationship: 'Child', age: 9 }
        ],
        isActive: true
      }
    }),
    prisma.corporateEmployee.create({
      data: {
        employeeId: 'TC010',
        name: 'Lakshan Mendis',
        email: 'lakshan.mendis@techcorp.lk',
        phone: '+94770123456',
        department: 'Support',
        designation: 'Technical Support Specialist',
        agentId: demoAgent.id,
        packageType: 'Basic',
        monthlyLimit: 5000.00,
        usedLimit: 780.00,
        dependents: [],
        isActive: true
      }
    })
  ]);

  console.log('👥 Created 10 corporate employees');

  // Generate appointment numbers
  const generateAppointmentNumber = () => {
    return 'APT' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  // Create appointments with various statuses and dates
  const appointments = [];
  const transactions = [];
  
  const today = new Date();
  
  // Create appointments for the past 3 months
  for (let i = 0; i < 150; i++) {
    const randomDaysBack = Math.floor(Math.random() * 90);
    const appointmentDate = new Date(today);
    appointmentDate.setDate(appointmentDate.getDate() - randomDaysBack);
    
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    const randomHour = Math.floor(Math.random() * 10) + 8; // 8 AM to 5 PM
    const timeSlot = `${randomHour.toString().padStart(2, '0')}:00`;
    
    const appointmentStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const paymentStatuses = ['PAID', 'PENDING', 'FAILED'];
    
    const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
    let paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    // Logic: completed appointments should be paid, cancelled can be refunded
    if (status === 'COMPLETED') paymentStatus = 'PAID';
    if (status === 'CANCELLED' && Math.random() > 0.5) paymentStatus = 'REFUNDED';
    
    const appointmentNumber = generateAppointmentNumber();
    
    const appointment = {
      appointmentNumber,
      patientName: randomEmployee.name,
      patientPhone: randomEmployee.phone,
      patientEmail: randomEmployee.email,
      patientNIC: `${Math.floor(Math.random() * 900000000) + 100000000}V`,
      doctorId: randomDoctor.id,
      doctorName: randomDoctor.name,
      specialty: randomDoctor.specialization,
      hospitalId: randomDoctor.hospitalId!,
      hospitalName: randomDoctor.hospital,
      sessionId: `SES${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      sessionDate: appointmentDate,
      sessionTime: timeSlot,
      appointmentType: randomDoctor.consultationTypes[Math.floor(Math.random() * randomDoctor.consultationTypes.length)] as any,
      status: status as any,
      paymentStatus: paymentStatus as any,
      amount: randomDoctor.fee,
      agentId: demoAgent.id,
      bulkBookingId: Math.random() > 0.8 ? `BULK${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
      cancellationReason: status === 'CANCELLED' ? 'Patient cancelled due to personal reasons' : null,
      cancelledAt: status === 'CANCELLED' ? appointmentDate : null,
      refundAmount: status === 'CANCELLED' && paymentStatus === 'REFUNDED' ? randomDoctor.fee : null,
      refundStatus: status === 'CANCELLED' && paymentStatus === 'REFUNDED' ? 'COMPLETED' : null
    };
    
    appointments.push(appointment);
    
    // Create corresponding transaction for paid appointments
    if (paymentStatus === 'PAID' || paymentStatus === 'REFUNDED') {
      const paymentMethods = ['CREDIT_CARD', 'CORPORATE_BILLING', 'ONLINE_BANKING', 'BANK_TRANSFER'];
      const transaction = {
        transactionId: generateTransactionId(),
        amount: randomDoctor.fee,
        currency: 'LKR',
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as any,
        paymentGateway: 'PayHere',
        status: paymentStatus as any,
        agentId: demoAgent.id,
        appointmentIds: [appointmentNumber],
        gatewayResponse: {
          gateway_transaction_id: `PH${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
          status_code: paymentStatus === 'PAID' ? '2' : paymentStatus === 'REFUNDED' ? '-2' : '0',
          status_message: paymentStatus === 'PAID' ? 'Success' : paymentStatus === 'REFUNDED' ? 'Refunded' : 'Failed',
          payment_id: Math.floor(Math.random() * 1000000),
          order_id: appointmentNumber
        }
      };
      
      transactions.push(transaction);
    }
  }

  // Bulk create appointments
  await prisma.appointment.createMany({
    data: appointments
  });

  // Bulk create transactions
  await prisma.transaction.createMany({
    data: transactions
  });

  console.log(`📅 Created ${appointments.length} appointments`);
  console.log(`💳 Created ${transactions.length} transactions`);

  // Create future appointments (upcoming)
  const futureAppointments = [];
  
  for (let i = 0; i < 25; i++) {
    const randomDaysFuture = Math.floor(Math.random() * 30) + 1;
    const appointmentDate = new Date(today);
    appointmentDate.setDate(appointmentDate.getDate() + randomDaysFuture);
    
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    const randomHour = Math.floor(Math.random() * 10) + 8;
    const timeSlot = `${randomHour.toString().padStart(2, '0')}:00`;
    
    futureAppointments.push({
      appointmentNumber: generateAppointmentNumber(),
      patientName: randomEmployee.name,
      patientPhone: randomEmployee.phone,
      patientEmail: randomEmployee.email,
      patientNIC: `${Math.floor(Math.random() * 900000000) + 100000000}V`,
      doctorId: randomDoctor.id,
      doctorName: randomDoctor.name,
      specialty: randomDoctor.specialization,
      hospitalId: randomDoctor.hospitalId!,
      hospitalName: randomDoctor.hospital,
      sessionId: `SES${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      sessionDate: appointmentDate,
      sessionTime: timeSlot,
      appointmentType: 'REGULAR' as any,
      status: 'CONFIRMED' as any,
      paymentStatus: Math.random() > 0.3 ? 'PAID' : 'PENDING' as any,
      amount: randomDoctor.fee,
      agentId: demoAgent.id
    });
  }

  await prisma.appointment.createMany({
    data: futureAppointments
  });

  console.log(`📋 Created ${futureAppointments.length} future appointments`);

  // Create ACB (unpaid) appointments
  const acbAppointments = [];
  
  for (let i = 0; i < 15; i++) {
    const randomDaysFuture = Math.floor(Math.random() * 7) + 1;
    const appointmentDate = new Date(today);
    appointmentDate.setDate(appointmentDate.getDate() + randomDaysFuture);
    
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    const randomHour = Math.floor(Math.random() * 10) + 8;
    const timeSlot = `${randomHour.toString().padStart(2, '0')}:00`;
    
    const expiryDate = new Date(appointmentDate);
    expiryDate.setHours(appointmentDate.getHours() - 2); // Expires 2 hours before appointment
    
    acbAppointments.push({
      appointmentNumber: generateAppointmentNumber(),
      patientName: randomEmployee.name,
      patientPhone: randomEmployee.phone,
      doctorName: randomDoctor.name,
      sessionDate: appointmentDate,
      sessionTime: timeSlot,
      amount: randomDoctor.fee,
      paymentUrl: `https://www.payhere.lk/pay/${Math.random().toString(36).substr(2, 15)}`,
      expiresAt: expiryDate,
      isConfirmed: Math.random() > 0.7,
      confirmedAt: Math.random() > 0.7 ? new Date() : null,
      agentId: demoAgent.id
    });
  }

  await prisma.aCBAppointment.createMany({
    data: acbAppointments
  });

  console.log(`⏰ Created ${acbAppointments.length} ACB appointments`);

  // Create notifications
  const notifications = [];
  const notificationTypes = [
    'APPOINTMENT_CONFIRMED',
    'PAYMENT_SUCCESS',
    'APPOINTMENT_CANCELLED',
    'SESSION_UPDATED',
    'PAYMENT_FAILED',
    'SYSTEM_ALERT'
  ];
  
  for (let i = 0; i < 50; i++) {
    const randomDaysBack = Math.floor(Math.random() * 30);
    const notificationDate = new Date(today);
    notificationDate.setDate(notificationDate.getDate() - randomDaysBack);
    
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    let title, message, priority, actionUrl;
    
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
        title = 'Appointment Confirmed';
        message = `Your appointment with ${doctors[Math.floor(Math.random() * doctors.length)].name} has been confirmed for ${notificationDate.toLocaleDateString()}.`;
        priority = 'NORMAL';
        actionUrl = '/appointments';
        break;
      case 'PAYMENT_SUCCESS':
        title = 'Payment Successful';
        message = `Payment of LKR ${(Math.random() * 5000 + 2000).toFixed(2)} has been processed successfully.`;
        priority = 'NORMAL';
        actionUrl = '/payments';
        break;
      case 'APPOINTMENT_CANCELLED':
        title = 'Appointment Cancelled';
        message = 'Your appointment has been cancelled. Refund will be processed within 3-5 business days.';
        priority = 'HIGH';
        actionUrl = '/appointments';
        break;
      case 'SESSION_UPDATED':
        title = 'Session Time Updated';
        message = 'The time for your upcoming appointment has been updated. Please check the new details.';
        priority = 'HIGH';
        actionUrl = '/appointments';
        break;
      case 'PAYMENT_FAILED':
        title = 'Payment Failed';
        message = 'Your payment could not be processed. Please try again or use a different payment method.';
        priority = 'URGENT';
        actionUrl = '/payments';
        break;
      case 'SYSTEM_ALERT':
        title = 'System Maintenance';
        message = 'Scheduled system maintenance will occur on Sunday 2:00 AM - 4:00 AM. Service may be temporarily unavailable.';
        priority = 'LOW';
        actionUrl = null;
        break;
      default:
        title = 'Notification';
        message = 'You have a new notification.';
        priority = 'NORMAL';
        actionUrl = null;
    }
    
    notifications.push({
      agentId: demoAgent.id,
      type: type as any,
      title,
      message,
      priority: priority as any,
      isRead: Math.random() > 0.4,
      readAt: Math.random() > 0.4 ? notificationDate : null,
      actionUrl,
      createdAt: notificationDate
    });
  }

  await prisma.notification.createMany({
    data: notifications
  });

  console.log(`🔔 Created ${notifications.length} notifications`);

  // Create reports
  const reportTypes = ['APPOINTMENT_SUMMARY', 'FINANCIAL_SUMMARY', 'EMPLOYEE_UTILIZATION', 'MONTHLY_STATEMENT'];
  const reports = [];
  
  for (let i = 0; i < 12; i++) {
    const monthsBack = i;
    const startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() - monthsBack + 1, 0);
    
    const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
    let reportData;
    
    switch (reportType) {
      case 'APPOINTMENT_SUMMARY':
        reportData = {
          totalAppointments: Math.floor(Math.random() * 50) + 20,
          confirmedAppointments: Math.floor(Math.random() * 40) + 15,
          cancelledAppointments: Math.floor(Math.random() * 10) + 2,
          completedAppointments: Math.floor(Math.random() * 35) + 10,
          specialtyBreakdown: {
            'Cardiology': Math.floor(Math.random() * 10) + 5,
            'Dermatology': Math.floor(Math.random() * 8) + 3,
            'Pediatrics': Math.floor(Math.random() * 12) + 6,
            'Orthopedics': Math.floor(Math.random() * 7) + 2
          }
        };
        break;
      case 'FINANCIAL_SUMMARY':
        const totalRevenue = (Math.random() * 200000) + 100000;
        reportData = {
          totalRevenue: totalRevenue,
          totalExpenses: totalRevenue * 0.75,
          netProfit: totalRevenue * 0.25,
          paymentMethodBreakdown: {
            'CORPORATE_BILLING': totalRevenue * 0.4,
            'CREDIT_CARD': totalRevenue * 0.3,
            'ONLINE_BANKING': totalRevenue * 0.2,
            'BANK_TRANSFER': totalRevenue * 0.1
          },
          refundsProcessed: (Math.random() * 15000) + 5000
        };
        break;
      case 'EMPLOYEE_UTILIZATION':
        reportData = {
          totalEmployees: employees.length,
          activeEmployees: Math.floor(employees.length * 0.9),
          utilizationRate: Math.floor(Math.random() * 30) + 60,
          departmentUtilization: {
            'Engineering': Math.floor(Math.random() * 20) + 70,
            'Marketing': Math.floor(Math.random() * 25) + 55,
            'Finance': Math.floor(Math.random() * 15) + 65,
            'Human Resources': Math.floor(Math.random() * 30) + 50,
            'Operations': Math.floor(Math.random() * 20) + 75
          }
        };
        break;
      case 'MONTHLY_STATEMENT':
        reportData = {
          openingBalance: (Math.random() * 50000) + 25000,
          totalCredits: (Math.random() * 150000) + 80000,
          totalDebits: (Math.random() * 120000) + 70000,
          closingBalance: (Math.random() * 60000) + 30000,
          transactionCount: Math.floor(Math.random() * 100) + 50,
          averageTransactionValue: (Math.random() * 2000) + 1000
        };
        break;
    }
    
    reports.push({
      reportType: reportType as any,
      reportName: `${reportType.replace(/_/g, ' ')} - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      startDate,
      endDate,
      parameters: {
        agentId: demoAgent.id,
        includeRefunds: true,
        includeCancellations: true
      },
      agentId: demoAgent.id,
      data: reportData,
      fileUrl: `/reports/${reportType.toLowerCase()}_${startDate.getFullYear()}_${(startDate.getMonth() + 1).toString().padStart(2, '0')}.pdf`
    });
  }

  await prisma.report.createMany({
    data: reports
  });

  console.log(`📊 Created ${reports.length} reports`);

  // Create audit logs
  const auditLogs = [];
  const actions = [
    'LOGIN',
    'LOGOUT',
    'CREATE_APPOINTMENT',
    'CANCEL_APPOINTMENT',
    'PROCESS_PAYMENT',
    'GENERATE_REPORT',
    'UPDATE_PROFILE',
    'BULK_BOOKING',
    'VIEW_DASHBOARD',
    'SEARCH_DOCTOR'
  ];
  
  for (let i = 0; i < 200; i++) {
    const randomDaysBack = Math.floor(Math.random() * 60);
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - randomDaysBack);
    logDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    let entityType = 'Agent';
    let entityId = demoAgent.id;
    let oldValue = null;
    let newValue = null;
    
    if (action === 'CREATE_APPOINTMENT') {
      entityType = 'Appointment';
      entityId = appointments[Math.floor(Math.random() * appointments.length)]?.appointmentNumber || 'APT123456';
      newValue = { status: 'CONFIRMED', amount: Math.random() * 5000 + 2000 };
    } else if (action === 'CANCEL_APPOINTMENT') {
      entityType = 'Appointment';
      entityId = appointments[Math.floor(Math.random() * appointments.length)]?.appointmentNumber || 'APT123456';
      oldValue = { status: 'CONFIRMED' };
      newValue = { status: 'CANCELLED', cancellationReason: 'Patient request' };
    } else if (action === 'PROCESS_PAYMENT') {
      entityType = 'Transaction';
      entityId = transactions[Math.floor(Math.random() * transactions.length)]?.transactionId || 'TXN123456';
      newValue = { status: 'PAID', amount: Math.random() * 5000 + 2000 };
    }
    
    auditLogs.push({
      agentId: demoAgent.id,
      agentEmail: demoAgent.email,
      action,
      entityType,
      entityId,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      oldValue,
      newValue,
      timestamp: logDate
    });
  }

  await prisma.auditLog.createMany({
    data: auditLogs
  });

  console.log(`📋 Created ${auditLogs.length} audit log entries`);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${hospitals.length} Hospitals`);
  console.log(`- ${doctors.length} Doctors`);
  console.log(`- 1 Corporate Agent (TechCorp Solutions)`);
  console.log(`- ${branches.length} Branches`);
  console.log(`- ${employees.length} Corporate Employees`);
  console.log(`- ${appointments.length + futureAppointments.length} Total Appointments`);
  console.log(`- ${transactions.length} Transactions`);
  console.log(`- ${acbAppointments.length} ACB Appointments`);
  console.log(`- ${notifications.length} Notifications`);
  console.log(`- ${reports.length} Reports`);
  console.log(`- ${auditLogs.length} Audit Log Entries`);
  console.log('\n🔐 Login Credentials:');
  console.log('Username: demo_agent');
  console.log('Password: ABcd123#');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });