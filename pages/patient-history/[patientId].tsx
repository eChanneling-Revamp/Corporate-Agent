import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { 
  Calendar, 
  FileText, 
  Heart, 
  Pill, 
  Activity, 
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  Plus,
  Eye,
  Edit,
  Search,
  Filter
} from 'lucide-react'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import DashboardLayout from '../../components/layout/DashboardLayout'
import toast from 'react-hot-toast'

interface MedicalRecord {
  id: string
  date: string
  type: 'consultation' | 'diagnosis' | 'prescription' | 'lab-result' | 'procedure'
  title: string
  description: string
  doctorName: string
  hospitalName: string
  specialty: string
  findings?: string
  treatment?: string
  medications?: Medication[]
  labResults?: LabResult[]
  followUpDate?: string
  attachments?: string[]
  status: 'active' | 'completed' | 'cancelled'
}

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  startDate: string
  endDate?: string
  prescribedBy: string
}

interface LabResult {
  testName: string
  value: string
  normalRange: string
  unit: string
  status: 'normal' | 'abnormal' | 'critical'
  notes?: string
}

interface Allergy {
  id: string
  allergen: string
  reaction: string
  severity: 'mild' | 'moderate' | 'severe'
  dateDiscovered: string
  notes?: string
}

interface VitalSigns {
  date: string
  bloodPressure: string
  heartRate: number
  temperature: number
  weight: number
  height: number
  bmi: number
  oxygenSaturation?: number
}

interface PatientHistory {
  patientId: string
  patientName: string
  dateOfBirth: string
  gender: string
  bloodType: string
  email: string
  phone: string
  address: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  medicalRecords: MedicalRecord[]
  allergies: Allergy[]
  chronicConditions: string[]
  currentMedications: Medication[]
  vitalSigns: VitalSigns[]
  insuranceInfo: {
    provider: string
    policyNumber: string
    groupNumber: string
  }
  lastVisit: string
  totalVisits: number
  familyHistory?: string[]
  socialHistory?: {
    smoking: boolean
    alcohol: boolean
    exercise: string
    occupation: string
  }
}

export default function PatientHistoryDetail() {
  const router = useRouter()
  const { patientId } = router.query
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [recordTypeFilter, setRecordTypeFilter] = useState('')

  // Mock patient history data
  useEffect(() => {
    if (!patientId) return

    const mockPatientHistory: PatientHistory = {
      patientId: patientId as string,
      patientName: 'John Doe',
      dateOfBirth: '1985-05-15',
      gender: 'Male',
      bloodType: 'O+',
      email: 'john.doe@email.com',
      phone: '+94771234567',
      address: '123 Main St, Colombo 03, Sri Lanka',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+94777654321'
      },
      lastVisit: '2025-10-15',
      totalVisits: 28,
      insuranceInfo: {
        provider: 'Sri Lanka Insurance',
        policyNumber: 'SLI123456789',
        groupNumber: 'GRP001'
      },
      allergies: [
        {
          id: '1',
          allergen: 'Penicillin',
          reaction: 'Skin rash and difficulty breathing',
          severity: 'severe',
          dateDiscovered: '2018-03-15',
          notes: 'Discovered during treatment for strep throat'
        },
        {
          id: '2',
          allergen: 'Shellfish',
          reaction: 'Hives and swelling',
          severity: 'moderate',
          dateDiscovered: '2020-07-22'
        }
      ],
      chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
      currentMedications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: 'Long term',
          instructions: 'Take in the morning with food',
          startDate: '2023-01-15',
          prescribedBy: 'Dr. Sarah Wilson'
        },
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: 'Long term',
          instructions: 'Take with meals',
          startDate: '2022-08-10',
          prescribedBy: 'Dr. Michael Brown'
        }
      ],
      vitalSigns: [
        {
          date: '2025-10-15',
          bloodPressure: '135/85',
          heartRate: 75,
          temperature: 37.0,
          weight: 78.5,
          height: 175,
          bmi: 25.6,
          oxygenSaturation: 98
        },
        {
          date: '2025-07-15',
          bloodPressure: '140/90',
          heartRate: 80,
          temperature: 36.8,
          weight: 79.2,
          height: 175,
          bmi: 25.9,
          oxygenSaturation: 97
        }
      ],
      familyHistory: ['Heart Disease (Father)', 'Diabetes (Mother)', 'High Blood Pressure (Both Parents)'],
      socialHistory: {
        smoking: false,
        alcohol: true,
        exercise: 'Light exercise 2-3 times per week',
        occupation: 'Software Engineer'
      },
      medicalRecords: [
        {
          id: '1',
          date: '2025-10-15',
          type: 'consultation',
          title: 'Annual Health Checkup',
          description: 'Routine annual physical examination and health assessment',
          doctorName: 'Dr. Sarah Wilson',
          hospitalName: 'Apollo Hospital',
          specialty: 'General Medicine',
          findings: 'Overall health is good. Blood pressure slightly elevated. Weight stable.',
          treatment: 'Continue current medications. Recommend increased physical activity.',
          followUpDate: '2026-04-15',
          status: 'completed'
        },
        {
          id: '2',
          date: '2025-09-22',
          type: 'lab-result',
          title: 'Quarterly Diabetes Monitoring',
          description: 'HbA1c and lipid profile testing',
          doctorName: 'Dr. Michael Brown',
          hospitalName: 'Nawaloka Hospital',
          specialty: 'Endocrinology',
          labResults: [
            {
              testName: 'HbA1c',
              value: '6.8',
              normalRange: '< 7.0',
              unit: '%',
              status: 'normal',
              notes: 'Good diabetic control'
            },
            {
              testName: 'Total Cholesterol',
              value: '195',
              normalRange: '< 200',
              unit: 'mg/dL',
              status: 'normal'
            },
            {
              testName: 'LDL Cholesterol',
              value: '115',
              normalRange: '< 100',
              unit: 'mg/dL',
              status: 'abnormal',
              notes: 'Slightly elevated, dietary modifications recommended'
            }
          ],
          status: 'completed'
        },
        {
          id: '3',
          date: '2025-08-10',
          type: 'prescription',
          title: 'Blood Pressure Medication Adjustment',
          description: 'Adjustment of antihypertensive medication due to elevated readings',
          doctorName: 'Dr. Sarah Wilson',
          hospitalName: 'Apollo Hospital',
          specialty: 'Cardiology',
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              duration: '3 months',
              instructions: 'Take in the morning, monitor blood pressure weekly',
              startDate: '2025-08-10',
              endDate: '2025-11-10',
              prescribedBy: 'Dr. Sarah Wilson'
            }
          ],
          followUpDate: '2025-11-10',
          status: 'active'
        },
        {
          id: '4',
          date: '2025-06-05',
          type: 'procedure',
          title: 'ECG and Stress Test',
          description: 'Cardiac evaluation due to family history of heart disease',
          doctorName: 'Dr. James Miller',
          hospitalName: 'Lanka Hospital',
          specialty: 'Cardiology',
          findings: 'ECG shows normal sinus rhythm. Stress test results within normal limits.',
          treatment: 'No immediate intervention required. Continue lifestyle modifications.',
          status: 'completed'
        },
        {
          id: '5',
          date: '2025-03-20',
          type: 'diagnosis',
          title: 'Hypertension Diagnosis',
          description: 'Confirmed diagnosis of essential hypertension after multiple elevated readings',
          doctorName: 'Dr. Sarah Wilson',
          hospitalName: 'Apollo Hospital',
          specialty: 'General Medicine',
          findings: 'Persistent elevated blood pressure readings over 3 months. Average 145/92 mmHg.',
          treatment: 'Lifestyle modifications and antihypertensive medication initiated.',
          medications: [
            {
              name: 'Lisinopril',
              dosage: '5mg',
              frequency: 'Once daily',
              duration: 'Long term',
              instructions: 'Start with 5mg daily, increase as needed',
              startDate: '2025-03-20',
              prescribedBy: 'Dr. Sarah Wilson'
            }
          ],
          status: 'completed'
        }
      ]
    }

    setTimeout(() => {
      setPatientHistory(mockPatientHistory)
      setLoading(false)
    }, 1000)
  }, [patientId])

  const filteredMedicalRecords = patientHistory?.medicalRecords.filter(record => {
    const matchesSearch = 
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctorName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = !recordTypeFilter || record.type === recordTypeFilter

    return matchesSearch && matchesType
  }) || []

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <User className="h-5 w-5 text-blue-600" />
      case 'diagnosis': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'prescription': return <Pill className="h-5 w-5 text-green-600" />
      case 'lab-result': return <Activity className="h-5 w-5 text-purple-600" />
      case 'procedure': return <Heart className="h-5 w-5 text-orange-600" />
      default: return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-100 text-yellow-800'
      case 'moderate': return 'bg-orange-100 text-orange-800'
      case 'severe': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLabStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600'
      case 'abnormal': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
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

  if (!patientHistory) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
            <p className="mt-2 text-gray-600">The requested patient history could not be found.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Patient History - {patientHistory.patientName}</title>
        <meta name="description" content="Comprehensive patient medical history and records" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                ← Back to Customers
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{patientHistory.patientName}</h1>
              <p className="mt-1 text-sm text-gray-600">
                Patient ID: {patientHistory.patientId} • Total Visits: {patientHistory.totalVisits}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={() => toast.success('Exporting patient history...')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export History
              </button>
              <button
                onClick={() => toast.success('Add new record functionality coming soon')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </button>
            </div>
          </div>

          {/* Patient Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">DOB:</span>
                  <span className="ml-1 font-medium">{patientHistory.dateOfBirth}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-1 font-medium">{patientHistory.gender}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-gray-600">Blood Type:</span>
                  <span className="ml-1 font-medium">{patientHistory.bloodType}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-1 font-medium">{patientHistory.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-1 font-medium">{patientHistory.phone}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <div className="ml-1 font-medium">{patientHistory.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium">{patientHistory.emergencyContact.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Relationship:</span>
                  <div className="font-medium">{patientHistory.emergencyContact.relationship}</div>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <div className="font-medium">{patientHistory.emergencyContact.phone}</div>
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <div className="font-medium">{patientHistory.insuranceInfo.provider}</div>
                </div>
                <div>
                  <span className="text-gray-600">Policy Number:</span>
                  <div className="font-medium">{patientHistory.insuranceInfo.policyNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Group Number:</span>
                  <div className="font-medium">{patientHistory.insuranceInfo.groupNumber}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'overview', name: 'Overview' },
                  { id: 'records', name: 'Medical Records' },
                  { id: 'medications', name: 'Medications' },
                  { id: 'allergies', name: 'Allergies' },
                  { id: 'vitals', name: 'Vital Signs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Chronic Conditions */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Chronic Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {patientHistory.chronicConditions.map((condition, index) => (
                        <span key={index} className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Family History */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Family History</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="space-y-2 text-sm">
                        {patientHistory.familyHistory?.map((history, index) => (
                          <li key={index} className="flex items-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
                            {history}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Social History */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Social History</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Smoking:</span> {patientHistory.socialHistory?.smoking ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Alcohol:</span> {patientHistory.socialHistory?.alcohol ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Exercise:</span> {patientHistory.socialHistory?.exercise}
                        </div>
                        <div>
                          <span className="font-medium">Occupation:</span> {patientHistory.socialHistory?.occupation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search medical records..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={recordTypeFilter}
                        onChange={(e) => setRecordTypeFilter(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="consultation">Consultation</option>
                        <option value="diagnosis">Diagnosis</option>
                        <option value="prescription">Prescription</option>
                        <option value="lab-result">Lab Result</option>
                        <option value="procedure">Procedure</option>
                      </select>
                    </div>
                  </div>

                  {/* Records Timeline */}
                  <div className="space-y-4">
                    {filteredMedicalRecords.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getRecordIcon(record.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-lg font-medium text-gray-900">{record.title}</h5>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                  {record.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                              <div className="text-sm text-gray-500 space-y-1">
                                <div>
                                  <span className="font-medium">Doctor:</span> {record.doctorName} ({record.specialty})
                                </div>
                                <div>
                                  <span className="font-medium">Hospital:</span> {record.hospitalName}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span> {new Date(record.date).toLocaleDateString()}
                                </div>
                                {record.followUpDate && (
                                  <div>
                                    <span className="font-medium">Follow-up:</span> {new Date(record.followUpDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              
                              {record.findings && (
                                <div className="mt-3">
                                  <h6 className="font-medium text-gray-900 text-sm">Findings:</h6>
                                  <p className="text-sm text-gray-600">{record.findings}</p>
                                </div>
                              )}
                              
                              {record.treatment && (
                                <div className="mt-3">
                                  <h6 className="font-medium text-gray-900 text-sm">Treatment:</h6>
                                  <p className="text-sm text-gray-600">{record.treatment}</p>
                                </div>
                              )}

                              {record.labResults && record.labResults.length > 0 && (
                                <div className="mt-3">
                                  <h6 className="font-medium text-gray-900 text-sm mb-2">Lab Results:</h6>
                                  <div className="space-y-2">
                                    {record.labResults.map((result, index) => (
                                      <div key={index} className="bg-white rounded p-3 border">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-sm">{result.testName}</span>
                                          <span className={`text-sm font-medium ${getLabStatusColor(result.status)}`}>
                                            {result.status}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          <span className="font-medium">{result.value} {result.unit}</span>
                                          <span className="ml-2 text-gray-500">(Normal: {result.normalRange})</span>
                                        </div>
                                        {result.notes && (
                                          <p className="text-sm text-gray-500 mt-1">{result.notes}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.medications && record.medications.length > 0 && (
                                <div className="mt-3">
                                  <h6 className="font-medium text-gray-900 text-sm mb-2">Medications Prescribed:</h6>
                                  <div className="space-y-2">
                                    {record.medications.map((medication, index) => (
                                      <div key={index} className="bg-white rounded p-3 border">
                                        <div className="font-medium text-sm">{medication.name} {medication.dosage}</div>
                                        <div className="text-sm text-gray-600">{medication.frequency} for {medication.duration}</div>
                                        <div className="text-sm text-gray-500">{medication.instructions}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toast.success('View record details')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toast.success('Edit record')}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Current Medications</h4>
                  {patientHistory.currentMedications.map((medication, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{medication.name}</h5>
                          <div className="text-sm text-gray-600 mt-1">
                            <div><span className="font-medium">Dosage:</span> {medication.dosage}</div>
                            <div><span className="font-medium">Frequency:</span> {medication.frequency}</div>
                            <div><span className="font-medium">Duration:</span> {medication.duration}</div>
                            <div><span className="font-medium">Instructions:</span> {medication.instructions}</div>
                            <div><span className="font-medium">Start Date:</span> {medication.startDate}</div>
                            <div><span className="font-medium">Prescribed by:</span> {medication.prescribedBy}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Pill className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Allergies Tab */}
              {activeTab === 'allergies' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Known Allergies</h4>
                  {patientHistory.allergies.map((allergy) => (
                    <div key={allergy.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900">{allergy.allergen}</h5>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(allergy.severity)}`}>
                              {allergy.severity}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div><span className="font-medium">Reaction:</span> {allergy.reaction}</div>
                            <div><span className="font-medium">Discovered:</span> {allergy.dateDiscovered}</div>
                            {allergy.notes && (
                              <div><span className="font-medium">Notes:</span> {allergy.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vital Signs Tab */}
              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Vital Signs History</h4>
                  {patientHistory.vitalSigns.map((vitals, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{new Date(vitals.date).toLocaleDateString()}</h5>
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Blood Pressure:</span>
                          <div className="text-gray-900">{vitals.bloodPressure} mmHg</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Heart Rate:</span>
                          <div className="text-gray-900">{vitals.heartRate} bpm</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Temperature:</span>
                          <div className="text-gray-900">{vitals.temperature}°C</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Weight:</span>
                          <div className="text-gray-900">{vitals.weight} kg</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Height:</span>
                          <div className="text-gray-900">{vitals.height} cm</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">BMI:</span>
                          <div className="text-gray-900">{vitals.bmi}</div>
                        </div>
                        {vitals.oxygenSaturation && (
                          <div>
                            <span className="font-medium text-gray-700">O2 Saturation:</span>
                            <div className="text-gray-900">{vitals.oxygenSaturation}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}