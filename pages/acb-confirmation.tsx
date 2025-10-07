import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import toast from 'react-hot-toast'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  MapPin,
  DollarSign,
  Search,
  Filter
} from 'lucide-react'
import { 
  fetchPendingACBAppointments, 
  confirmACBAppointment 
} from '../store/slices/appointmentSlice'
import { RootState } from '../store/store'

export default function ACBConfirmation() {
  const dispatch = useDispatch<any>()
  const { pendingACBAppointments, isLoading } = useSelector((state: RootState) => state.appointments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchPendingACBAppointments())
  }, [dispatch])

  const handleConfirmACB = async (appointmentId: string) => {
    setConfirmingId(appointmentId)
    try {
      await dispatch(confirmACBAppointment(appointmentId)).unwrap()
      toast.success('ACB appointment confirmed successfully!')
    } catch (error) {
      toast.error('Failed to confirm ACB appointment')
    } finally {
      setConfirmingId(null)
    }
  }

  const filteredAppointments = pendingACBAppointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !filterDate || appointment.date === filterDate
    
    return matchesSearch && matchesDate
  })

  return (
    <ProtectedRoute>
      <Head>
        <title>ACB Confirmation - eChanneling Corporate Agent</title>
        <meta name="description" content="Confirm Advance Call Booking (ACB) appointments" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ACB Confirmation</h1>
              <p className="mt-1 text-sm text-gray-600">
                Confirm unpaid Advance Call Booking appointments
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{pendingACBAppointments.length} Pending ACB</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name, doctor, or appointment ID..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="input pl-10"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterDate('')
                  }}
                  className="btn-secondary whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* ACB Appointments List */}
          {isLoading ? (
            <div className="card">
              <div className="flex items-center justify-center py-12">
                <div className="loading-spinner mr-3" />
                <span className="text-gray-600">Loading ACB appointments...</span>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="card">
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {pendingACBAppointments.length === 0 
                    ? 'No Pending ACB Appointments' 
                    : 'No Matching Appointments'}
                </h3>
                <p className="text-gray-600">
                  {pendingACBAppointments.length === 0 
                    ? 'All ACB appointments have been confirmed.' 
                    : 'Try adjusting your search criteria.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Patient & Appointment Info */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">Patient Information</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="font-semibold text-lg">{appointment.patientName}</p>
                            {appointment.patientEmail && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {appointment.patientEmail}
                              </div>
                            )}
                            {appointment.patientPhone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {appointment.patientPhone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">Appointment Details</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">ID:</span> {appointment.id}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Date:</span> {appointment.date}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Time:</span> {appointment.time}
                            </p>
                            <div className="flex items-center">
                              <span className="badge badge-warning">ACB Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Doctor & Hospital Info */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">Doctor Information</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="font-semibold text-lg">{appointment.doctorName}</p>
                            <p className="text-sm text-gray-600">{appointment.specialization}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {appointment.hospital}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">Payment Information</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="text-lg font-semibold text-green-600">
                              Rs {appointment.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center">
                              <span className="badge badge-warning">Payment Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-6">
                      <button
                        onClick={() => handleConfirmACB(appointment.id)}
                        disabled={confirmingId === appointment.id}
                        className="btn-success"
                      >
                        {confirmingId === appointment.id ? (
                          <div className="loading-spinner mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm ACB
                      </button>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {appointment.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Card */}
          {filteredAppointments.length > 0 && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">ACB Summary</h3>
                  <p className="text-sm text-blue-700">
                    {filteredAppointments.length} appointments pending confirmation
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">Total Pending Amount</p>
                  <p className="text-xl font-bold text-blue-900">
                    Rs {filteredAppointments.reduce((sum, apt) => sum + apt.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}