import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  User,
  MapPin,
  FileText,
  Heart,
  AlertCircle,
  Download,
  Upload,
  MoreVertical,
  Star
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'
import { RootState } from '../store/store'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  medicalInfo: {
    bloodType: string
    allergies: string[]
    chronicConditions: string[]
    currentMedications: string[]
  }
  insurance: {
    provider: string
    policyNumber: string
    groupNumber: string
    validUntil: string
  }
  preferences: {
    preferredLanguage: string
    communicationMethod: 'email' | 'sms' | 'phone'
    appointmentReminders: boolean
    newsletterSubscription: boolean
  }
  tags: string[]
  status: 'active' | 'inactive' | 'suspended'
  totalAppointments: number
  lastAppointment: string
  nextAppointment: string
  customerValue: number
  satisfaction: number
  createdAt: string
  updatedAt: string
}

interface CustomerFilters {
  status: string
  gender: string
  city: string
  ageRange: string
  lastVisit: string
  tags: string[]
}

export default function CustomerManagement() {
  const dispatch = useDispatch<any>()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const [filters, setFilters] = useState<CustomerFilters>({
    status: '',
    gender: '',
    city: '',
    ageRange: '',
    lastVisit: '',
    tags: []
  })

  // Mock customer data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+94771234567',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        address: {
          street: '123 Main St',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+94777654321'
        },
        medicalInfo: {
          bloodType: 'O+',
          allergies: ['Penicillin', 'Shellfish'],
          chronicConditions: ['Hypertension'],
          currentMedications: ['Lisinopril 10mg']
        },
        insurance: {
          provider: 'Sri Lanka Insurance',
          policyNumber: 'SLI123456789',
          groupNumber: 'GRP001',
          validUntil: '2025-12-31'
        },
        preferences: {
          preferredLanguage: 'English',
          communicationMethod: 'email',
          appointmentReminders: true,
          newsletterSubscription: true
        },
        tags: ['VIP', 'Loyal Customer'],
        status: 'active',
        totalAppointments: 15,
        lastAppointment: '2025-10-15',
        nextAppointment: '2025-11-20',
        customerValue: 75000,
        satisfaction: 4.8,
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2025-10-15T00:00:00Z'
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+94779876543',
        dateOfBirth: '1990-08-22',
        gender: 'female',
        address: {
          street: '456 Oak Ave',
          city: 'Kandy',
          state: 'Central Province',
          zipCode: '20000',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Michael Johnson',
          relationship: 'Brother',
          phone: '+94773456789'
        },
        medicalInfo: {
          bloodType: 'A+',
          allergies: ['Latex'],
          chronicConditions: [],
          currentMedications: []
        },
        insurance: {
          provider: 'Ceylinco Insurance',
          policyNumber: 'CEY987654321',
          groupNumber: 'GRP002',
          validUntil: '2025-06-30'
        },
        preferences: {
          preferredLanguage: 'English',
          communicationMethod: 'sms',
          appointmentReminders: true,
          newsletterSubscription: false
        },
        tags: ['New Customer'],
        status: 'active',
        totalAppointments: 3,
        lastAppointment: '2025-09-28',
        nextAppointment: '',
        customerValue: 12000,
        satisfaction: 4.5,
        createdAt: '2025-08-01T00:00:00Z',
        updatedAt: '2025-09-28T00:00:00Z'
      },
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@email.com',
        phone: '+94765432109',
        dateOfBirth: '1978-12-10',
        gender: 'male',
        address: {
          street: '789 Pine Rd',
          city: 'Galle',
          state: 'Southern Province',
          zipCode: '80000',
          country: 'Sri Lanka'
        },
        emergencyContact: {
          name: 'Lisa Brown',
          relationship: 'Wife',
          phone: '+94764321098'
        },
        medicalInfo: {
          bloodType: 'B+',
          allergies: [],
          chronicConditions: ['Diabetes Type 2'],
          currentMedications: ['Metformin 500mg']
        },
        insurance: {
          provider: 'AIA Insurance',
          policyNumber: 'AIA555666777',
          groupNumber: 'GRP003',
          validUntil: '2025-08-15'
        },
        preferences: {
          preferredLanguage: 'Sinhala',
          communicationMethod: 'phone',
          appointmentReminders: true,
          newsletterSubscription: true
        },
        tags: ['Chronic Care', 'Regular Customer'],
        status: 'active',
        totalAppointments: 28,
        lastAppointment: '2025-10-10',
        nextAppointment: '2025-10-25',
        customerValue: 140000,
        satisfaction: 4.9,
        createdAt: '2022-05-20T00:00:00Z',
        updatedAt: '2025-10-10T00:00:00Z'
      }
    ]

    setTimeout(() => {
      setCustomers(mockCustomers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)

    const matchesFilters = 
      (!filters.status || customer.status === filters.status) &&
      (!filters.gender || customer.gender === filters.gender) &&
      (!filters.city || customer.address.city === filters.city)

    return matchesSearch && matchesFilters
  })

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    // Navigate to edit page or open edit modal
    toast.success(`Edit functionality for ${customer.firstName} ${customer.lastName}`)
  }

  const handleDeleteCustomers = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers to delete')
      return
    }
    
    toast.success(`Deleted ${selectedCustomers.length} customer(s)`)
    setSelectedCustomers([])
  }

  const handleExportCustomers = () => {
    toast.success('Exporting customer data...')
  }

  const handleImportCustomers = () => {
    toast.success('Import functionality coming soon')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerValueColor = (value: number) => {
    if (value >= 100000) return 'text-green-600 font-semibold'
    if (value >= 50000) return 'text-blue-600 font-medium'
    return 'text-gray-600'
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Customer Management - eChanneling Corporate Agent</title>
        <meta name="description" content="Manage customer profiles and relationships" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage customer profiles, relationships, and interactions
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={handleImportCustomers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExportCustomers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                      viewMode === 'table' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.gender}
                      onChange={(e) => setFilters({...filters, gender: e.target.value})}
                    >
                      <option value="">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.city}
                      onChange={(e) => setFilters({...filters, city: e.target.value})}
                    >
                      <option value="">All Cities</option>
                      <option value="Colombo">Colombo</option>
                      <option value="Kandy">Kandy</option>
                      <option value="Galle">Galle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.ageRange}
                      onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
                    >
                      <option value="">All Ages</option>
                      <option value="18-30">18-30</option>
                      <option value="31-45">31-45</option>
                      <option value="46-60">46-60</option>
                      <option value="60+">60+</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Customers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {customers.filter(c => c.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Satisfaction</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(customers.reduce((sum, c) => sum + c.satisfaction, 0) / customers.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {customers.reduce((sum, c) => sum + c.totalAppointments, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading customers...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.length === paginatedCustomers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomers(paginatedCustomers.map(c => c.id))
                            } else {
                              setSelectedCustomers([])
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satisfaction
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers([...selectedCustomers, customer.id])
                              } else {
                                setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {customer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.address.city}</div>
                          <div className="text-sm text-gray-500">{customer.address.state}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalAppointments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${getCustomerValueColor(customer.customerValue)}`}>
                            Rs {customer.customerValue.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{customer.satisfaction}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= filteredCustomers.length}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{filteredCustomers.length}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage * itemsPerPage >= filteredCustomers.length}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Actions */}
          {selectedCustomers.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {selectedCustomers.length} customer(s) selected
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedCustomers([])}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomers}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Detail Modal */}
        {showCustomerModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCustomerModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Customer Profile - {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h3>
                    <button
                      onClick={() => setShowCustomerModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                        <div><span className="font-medium">Email:</span> {selectedCustomer.email}</div>
                        <div><span className="font-medium">Phone:</span> {selectedCustomer.phone}</div>
                        <div><span className="font-medium">Date of Birth:</span> {selectedCustomer.dateOfBirth}</div>
                        <div><span className="font-medium">Gender:</span> {selectedCustomer.gender}</div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Address</h4>
                      <div className="space-y-2 text-sm">
                        <div>{selectedCustomer.address.street}</div>
                        <div>{selectedCustomer.address.city}, {selectedCustomer.address.state}</div>
                        <div>{selectedCustomer.address.zipCode}</div>
                        <div>{selectedCustomer.address.country}</div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedCustomer.emergencyContact.name}</div>
                        <div><span className="font-medium">Relationship:</span> {selectedCustomer.emergencyContact.relationship}</div>
                        <div><span className="font-medium">Phone:</span> {selectedCustomer.emergencyContact.phone}</div>
                      </div>
                    </div>

                    {/* Medical Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Medical Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Blood Type:</span> {selectedCustomer.medicalInfo.bloodType}</div>
                        <div><span className="font-medium">Allergies:</span> {selectedCustomer.medicalInfo.allergies.join(', ') || 'None'}</div>
                        <div><span className="font-medium">Chronic Conditions:</span> {selectedCustomer.medicalInfo.chronicConditions.join(', ') || 'None'}</div>
                        <div><span className="font-medium">Current Medications:</span> {selectedCustomer.medicalInfo.currentMedications.join(', ') || 'None'}</div>
                      </div>
                    </div>

                    {/* Insurance Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Insurance</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Provider:</span> {selectedCustomer.insurance.provider}</div>
                        <div><span className="font-medium">Policy Number:</span> {selectedCustomer.insurance.policyNumber}</div>
                        <div><span className="font-medium">Group Number:</span> {selectedCustomer.insurance.groupNumber}</div>
                        <div><span className="font-medium">Valid Until:</span> {selectedCustomer.insurance.validUntil}</div>
                      </div>
                    </div>

                    {/* Customer Metrics */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Customer Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Total Appointments:</span> {selectedCustomer.totalAppointments}</div>
                        <div><span className="font-medium">Customer Value:</span> Rs {selectedCustomer.customerValue.toLocaleString()}</div>
                        <div><span className="font-medium">Satisfaction Rating:</span> {selectedCustomer.satisfaction}/5</div>
                        <div><span className="font-medium">Status:</span> 
                          <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                            {selectedCustomer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => handleEditCustomer(selectedCustomer)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Edit Customer
                  </button>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}