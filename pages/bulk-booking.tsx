import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Users,
  Save,
  Search
} from 'lucide-react'
import { bulkBookAppointments, setBulkBookingData } from '../store/slices/appointmentSlice'
import { fetchDoctors, searchDoctors } from '../store/slices/doctorSlice'
import { RootState } from '../store/store'

interface BulkBookingFormData {
  doctorId: string
  date: string
  timeSlots: string[]
  patients: {
    name: string
    email: string
    phone: string
  }[]
  notes: string
}

export default function BulkBooking() {
  const dispatch = useDispatch<any>()
  const { doctors, isLoading: doctorsLoading } = useSelector((state: RootState) => state.doctors)
  const { isLoading: appointmentsLoading } = useSelector((state: RootState) => state.appointments)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [availableTimeSlots] = useState([
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BulkBookingFormData>({
    defaultValues: {
      patients: [{ name: '', email: '', phone: '' }],
      timeSlots: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'patients',
  })

  const watchedTimeSlots = watch('timeSlots')
  const watchedPatients = watch('patients')

  useEffect(() => {
    dispatch(fetchDoctors())
  }, [dispatch])

  const addPatient = () => {
    append({ name: '', email: '', phone: '' })
  }

  const removePatient = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleTimeSlotToggle = (timeSlot: string) => {
    const currentSlots = watchedTimeSlots || []
    const updatedSlots = currentSlots.includes(timeSlot)
      ? currentSlots.filter(slot => slot !== timeSlot)
      : [...currentSlots, timeSlot]
    
    setValue('timeSlots', updatedSlots)
  }

  const onSubmit = async (data: BulkBookingFormData) => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor')
      return
    }

    if (data.timeSlots.length === 0) {
      toast.error('Please select at least one time slot')
      return
    }

    if (data.timeSlots.length !== data.patients.length) {
      toast.error('Number of time slots must match number of patients')
      return
    }

    try {
      await dispatch(bulkBookAppointments({
        doctorId: selectedDoctor.id,
        date: data.date,
        timeSlots: data.timeSlots,
        patients: data.patients,
        notes: data.notes,
      })).unwrap()

      toast.success('Bulk appointments booked successfully!')
      
      // Reset form
      setValue('patients', [{ name: '', email: '', phone: '' }])
      setValue('timeSlots', [])
      setValue('notes', '')
      setSelectedDoctor(null)
    } catch (error) {
      toast.error('Failed to book appointments')
    }
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Bulk Appointment Booking - eChanneling Corporate Agent</title>
        <meta name="description" content="Book multiple appointments at once" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Appointment Booking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Book multiple appointments for different patients with the same doctor
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{watchedPatients?.length || 0} Patients</span>
              <Clock className="h-4 w-4 ml-4" />
              <span>{watchedTimeSlots?.length || 0} Time Slots</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Doctor Selection */}
            <div className="card">
              <h3 className="card-header">Select Doctor</h3>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    {...register('doctorId', { required: 'Please select a doctor' })}
                    className={`input pl-10 ${errors.doctorId ? 'input-error' : ''}`}
                    onChange={(e) => {
                      const doctor = doctors.find(d => d.id === e.target.value)
                      setSelectedDoctor(doctor)
                    }}
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialization} ({doctor.hospital})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.doctorId && (
                  <p className="text-sm text-red-600">{errors.doctorId.message}</p>
                )}

                {selectedDoctor && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={selectedDoctor.image}
                        alt={selectedDoctor.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Dr. {selectedDoctor.name}</h4>
                        <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                        <p className="text-sm text-gray-600">{selectedDoctor.hospital}</p>
                        <p className="text-sm font-medium text-green-600 mt-1">Fee: {selectedDoctor.fee}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div className="card">
              <h3 className="card-header">Select Date</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('date', { required: 'Please select a date' })}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className={`input pl-10 ${errors.date ? 'input-error' : ''}`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time Slots Selection */}
            <div className="card">
              <h3 className="card-header">Select Time Slots</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableTimeSlots.map((timeSlot) => (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => handleTimeSlotToggle(timeSlot)}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      watchedTimeSlots?.includes(timeSlot)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Selected: {watchedTimeSlots?.length || 0} time slots
              </p>
            </div>

            {/* Patient Details */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Patient Details</h3>
                <button
                  type="button"
                  onClick={addPatient}
                  className="btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Patient
                </button>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Patient #{index + 1}</h4>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePatient(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            {...register(`patients.${index}.name`, {
                              required: 'Patient name is required',
                            })}
                            type="text"
                            className={`input pl-10 ${errors.patients?.[index]?.name ? 'input-error' : ''}`}
                            placeholder="Enter patient name"
                          />
                        </div>
                        {errors.patients?.[index]?.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.patients[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            {...register(`patients.${index}.email`, {
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                              },
                            })}
                            type="email"
                            className={`input pl-10 ${errors.patients?.[index]?.email ? 'input-error' : ''}`}
                            placeholder="Enter email address"
                          />
                        </div>
                        {errors.patients?.[index]?.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.patients[index]?.email?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            {...register(`patients.${index}.phone`, {
                              required: 'Phone number is required',
                              pattern: {
                                value: /^[0-9+\-\s()]+$/,
                                message: 'Invalid phone number',
                              },
                            })}
                            type="tel"
                            className={`input pl-10 ${errors.patients?.[index]?.phone ? 'input-error' : ''}`}
                            placeholder="Enter phone number"
                          />
                        </div>
                        {errors.patients?.[index]?.phone && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.patients[index]?.phone?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="card">
              <h3 className="card-header">Additional Notes</h3>
              <textarea
                {...register('notes')}
                rows={4}
                className="input"
                placeholder="Enter any additional notes for these appointments..."
              />
            </div>

            {/* Summary and Submit */}
            <div className="card bg-gray-50">
              <h3 className="card-header">Booking Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Doctor:</span>
                  <p className="text-gray-900">
                    {selectedDoctor ? `Dr. ${selectedDoctor.name}` : 'Not selected'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Patients:</span>
                  <p className="text-gray-900">{watchedPatients?.length || 0}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time Slots:</span>
                  <p className="text-gray-900">{watchedTimeSlots?.length || 0}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={appointmentsLoading || !selectedDoctor}
                  className="btn-primary w-full md:w-auto"
                >
                  {appointmentsLoading ? (
                    <div className="loading-spinner mr-2" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Book All Appointments
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}