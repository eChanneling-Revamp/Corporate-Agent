import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  Heart,
  AlertTriangle,
  Download,
  Plus,
  FileText
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'

interface PatientSummary {
  id: string
  name: string
  dateOfBirth: string
  gender: string
  bloodType: string
  email: string
  phone: string
  lastVisit: string
  totalVisits: number
  chronicConditions: string[]
  allergies: number
  activeConditions: number
  riskLevel: 'low' | 'medium' | 'high'
  preferredDoctor: string
  insuranceProvider: string
}

export default function PatientHistory() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortBy, setSortBy] = useState('lastVisit')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Mock patient data
  useEffect(() => {
    const mockPatients: PatientSummary[] = [
      {
        id: 'PAT001',
        name: 'John Doe',
        dateOfBirth: '1985-05-15',
        gender: 'Male',
        bloodType: 'O+',
        email: 'john.doe@email.com',
        phone: '+94771234567',
        lastVisit: '2025-10-15',
        totalVisits: 28,
        chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
        allergies: 2,
        activeConditions: 2,
        riskLevel: 'medium',
        preferredDoctor: 'Dr. Sarah Wilson',
        insuranceProvider: 'Sri Lanka Insurance'
      },
      {
        id: 'PAT002',
        name: 'Jane Smith',
        dateOfBirth: '1990-08-22',
        gender: 'Female',
        bloodType: 'A+',
        email: 'jane.smith@email.com',
        phone: '+94777654321',
        lastVisit: '2025-09-30',
        totalVisits: 15,
        chronicConditions: ['Asthma'],
        allergies: 1,
        activeConditions: 1,
        riskLevel: 'low',
        preferredDoctor: 'Dr. Michael Brown',
        insuranceProvider: 'Ceylinco Insurance'
      },
      {
        id: 'PAT003',
        name: 'Robert Johnson',
        dateOfBirth: '1975-12-03',
        gender: 'Male',
        bloodType: 'B+',
        email: 'robert.johnson@email.com',
        phone: '+94712345678',
        lastVisit: '2025-10-10',
        totalVisits: 45,
        chronicConditions: ['Heart Disease', 'High Cholesterol', 'Hypertension'],
        allergies: 3,
        activeConditions: 3,
        riskLevel: 'high',
        preferredDoctor: 'Dr. James Miller',
        insuranceProvider: 'AIA Insurance'
      },
      {
        id: 'PAT004',
        name: 'Emily Davis',
        dateOfBirth: '1988-03-14',
        gender: 'Female',
        bloodType: 'AB+',
        email: 'emily.davis@email.com',
        phone: '+94765432109',
        lastVisit: '2025-08-25',
        totalVisits: 12,
        chronicConditions: [],
        allergies: 0,
        activeConditions: 0,
        riskLevel: 'low',
        preferredDoctor: 'Dr. Sarah Wilson',
        insuranceProvider: 'National Insurance'
      },
      {
        id: 'PAT005',
        name: 'Michael Wilson',
        dateOfBirth: '1960-11-30',
        gender: 'Male',
        bloodType: 'O-',
        email: 'michael.wilson@email.com',
        phone: '+94723456789',
        lastVisit: '2025-10-12',
        totalVisits: 67,
        chronicConditions: ['Diabetes', 'Kidney Disease', 'Arthritis'],
        allergies: 4,
        activeConditions: 3,
        riskLevel: 'high',
        preferredDoctor: 'Dr. Patricia Lee',
        insuranceProvider: 'Union Assurance'
      },
      {
        id: 'PAT006',
        name: 'Sarah Brown',
        dateOfBirth: '1995-07-18',
        gender: 'Female',
        bloodType: 'A-',
        email: 'sarah.brown@email.com',
        phone: '+94776543210',
        lastVisit: '2025-09-15',
        totalVisits: 8,
        chronicConditions: ['Migraine'],
        allergies: 1,
        activeConditions: 1,
        riskLevel: 'low',
        preferredDoctor: 'Dr. David Kim',
        insuranceProvider: 'Janashakthi Insurance'
      }
    ]

    setTimeout(() => {
      setPatients(mockPatients)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredAndSortedPatients = patients
    .filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesGender = !genderFilter || patient.gender === genderFilter
      const matchesRisk = !riskFilter || patient.riskLevel === riskFilter

      return matchesSearch && matchesGender && matchesRisk
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof PatientSummary]
      let bValue: any = b[sortBy as keyof PatientSummary]

      if (sortBy === 'lastVisit') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortBy === 'name') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const exportData = () => {
    const csvContent = [
      ['Patient ID', 'Name', 'Age', 'Gender', 'Blood Type', 'Phone', 'Email', 'Last Visit', 'Total Visits', 'Risk Level', 'Chronic Conditions'],
      ...filteredAndSortedPatients.map(patient => [
        patient.id,
        patient.name,
        calculateAge(patient.dateOfBirth).toString(),
        patient.gender,
        patient.bloodType,
        patient.phone,
        patient.email,
        patient.lastVisit,
        patient.totalVisits.toString(),
        patient.riskLevel,
        patient.chronicConditions.join('; ')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patient-history.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Patient data exported successfully')
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading patient history...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Patient History Management</title>
        <meta name="description" content="Comprehensive patient medical history tracking and management" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive medical history tracking for all patients
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
              <button
                onClick={() => toast.success('Add new patient functionality coming soon')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">{patients.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Risk Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {patients.filter(p => p.riskLevel === 'high').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Conditions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {patients.reduce((sum, p) => sum + p.activeConditions, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Visits</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {patients.filter(p => {
                      const lastVisit = new Date(p.lastVisit)
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                      return lastVisit >= thirtyDaysAgo
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Patients</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, phone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex space-x-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="lastVisit">Last Visit</option>
                    <option value="name">Name</option>
                    <option value="totalVisits">Total Visits</option>
                    <option value="riskLevel">Risk Level</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Patient List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Patient Records ({filteredAndSortedPatients.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Filtered results
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medical Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit History
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">
                              ID: {patient.id} • Age: {calculateAge(patient.dateOfBirth)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {patient.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <span className="font-medium">Blood Type:</span>
                            <span className="ml-1">{patient.bloodType}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.chronicConditions.length > 0 ? (
                              <div>
                                <span className="font-medium">Conditions:</span>
                                <div>{patient.chronicConditions.slice(0, 2).join(', ')}</div>
                                {patient.chronicConditions.length > 2 && (
                                  <div className="text-gray-400">+{patient.chronicConditions.length - 2} more</div>
                                )}
                              </div>
                            ) : (
                              'No chronic conditions'
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">Total: {patient.totalVisits} visits</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(patient.riskLevel)}`}>
                          {patient.riskLevel} risk
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {patient.allergies} allergies
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/patient-history/${patient.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View History
                          </Link>
                          <button
                            onClick={() => toast.success('Generate report functionality coming soon')}
                            className="text-gray-600 hover:text-gray-900 flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedPatients.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}