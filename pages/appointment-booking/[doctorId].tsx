import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import DashboardLayout from '../../components/layout/DashboardLayout'
import TimeSlotPicker from '../../components/booking/TimeSlotPicker'
import PatientInformationForm from '../../components/booking/PatientInformationForm'
import BookingConfirmation from '../../components/booking/BookingConfirmation'
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle,
  MapPin,
  Star,
  Clock,
  Phone,
  Info,
  Shield,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DoctorInfo {
  id: number
  name: string
  specialization: string
  hospital: string
  location: string
  fee: number
  rating: number
  experience: number
  patients: number
  image: string
  availability: string
  languages: string[]
  qualifications: string[]
}

interface TimeSlot {
  id: string
  time: string
  available: boolean
  currentAppointmentNo: number
  maxAppointments: number
  estimatedAppointmentTime: string
  fee: number
  hospital: string
  hospitalLocation: string
}

interface PatientInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nic: string
  address: string
  emergencyContact: string
  emergencyName: string
  medicalHistory: string
  allergies: string
  currentMedications: string
  insuranceProvider?: string
  insurancePolicyNo?: string
  isNewPatient: boolean
}

const AppointmentBooking = () => {
  const router = useRouter()
  const { doctorId } = router.query
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nic: '',
    address: '',
    emergencyContact: '',
    emergencyName: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    insuranceProvider: '',
    insurancePolicyNo: '',
    isNewPatient: true
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // Fetch doctor information
  useEffect(() => {
    if (doctorId) {
      // Mock doctor data - replace with API call
      setDoctorInfo({
        id: Number(doctorId),
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiologist',
        hospital: 'City General Hospital',
        location: 'Colombo 03',
        fee: 3500,
        rating: 4.8,
        experience: 15,
        patients: 2500,
        image: '/api/placeholder/150/150',
        availability: 'Mon-Sat',
        languages: ['English', 'Sinhala', 'Tamil'],
        qualifications: ['MBBS', 'MD (Cardiology)', 'FACC']
      })
    }
  }, [doctorId])

  const steps = [
    { number: 1, title: 'Select Date & Time', icon: Calendar },
    { number: 2, title: 'Patient Information', icon: User },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: CheckCircle }
  ]

  const validatePatientInfo = () => {
    const newErrors: { [key: string]: string } = {}

    if (!patientInfo.firstName) newErrors.firstName = 'First name is required'
    if (!patientInfo.lastName) newErrors.lastName = 'Last name is required'
    if (!patientInfo.email) newErrors.email = 'Email is required'
    if (!patientInfo.phone) newErrors.phone = 'Phone number is required'
    if (!patientInfo.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!patientInfo.gender) newErrors.gender = 'Gender is required'
    if (!patientInfo.nic) newErrors.nic = 'NIC/Passport is required'
    if (!patientInfo.address) newErrors.address = 'Address is required'
    if (!patientInfo.emergencyContact) newErrors.emergencyContact = 'Emergency contact is required'
    if (!patientInfo.emergencyName) newErrors.emergencyName = 'Emergency contact name is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (patientInfo.email && !emailRegex.test(patientInfo.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/
    if (patientInfo.phone && !phoneRegex.test(patientInfo.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedSlot) {
        toast.error('Please select a time slot')
        return
      }
    } else if (currentStep === 2) {
      if (!validatePatientInfo()) {
        toast.error('Please fill all required fields')
        return
      }
    } else if (currentStep === 3) {
      if (!agreeToTerms) {
        toast.error('Please agree to the terms and conditions')
        return
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePaymentSubmit = async () => {
    setLoading(true)
    
    // Simulate payment processing
    setTimeout(() => {
      const confirmation = {
        appointmentId: `APT${Date.now()}`,
        appointmentNumber: selectedSlot?.currentAppointmentNo ? selectedSlot.currentAppointmentNo + 1 : 1,
        doctorName: doctorInfo?.name || '',
        doctorSpecialization: doctorInfo?.specialization || '',
        hospital: selectedSlot?.hospital || doctorInfo?.hospital || '',
        location: selectedSlot?.hospitalLocation || doctorInfo?.location || '',
        date: selectedDate,
        time: selectedSlot?.time || '',
        patientName: `${patientInfo.firstName} ${patientInfo.lastName}`,
        patientEmail: patientInfo.email,
        patientPhone: patientInfo.phone,
        fee: selectedSlot?.fee || 0,
        paymentStatus: 'completed' as const,
        estimatedAppointmentTime: selectedSlot?.estimatedAppointmentTime || '',
        hospitalPhone: '011-2345678',
        specialInstructions: [
          'Please bring any previous medical reports',
          'Fasting may be required for certain tests'
        ]
      }
      
      setBookingConfirmation(confirmation)
      setCurrentStep(4)
      setLoading(false)
      toast.success('Payment successful! Appointment confirmed.')
    }, 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.success('PDF download started')
  }

  const handleSendSMS = () => {
    toast.success('Appointment details sent via SMS')
  }

  const handleSendEmail = () => {
    toast.success('Appointment details sent to your email')
  }

  if (!doctorInfo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Book Appointment - {doctorInfo.name}</title>
        <meta name="description" content="Book your appointment online" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/doctor-search')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Doctor Search
        </button>

        {/* Doctor Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <img
              src={doctorInfo.image}
              alt={doctorInfo.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{doctorInfo.name}</h1>
                  <p className="text-lg text-blue-600">{doctorInfo.specialization}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doctorInfo.qualifications.map((qual, index) => (
                      <span key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {qual}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 text-left sm:text-right">
                  <div className="flex items-center text-yellow-500 mb-1">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-semibold">{doctorInfo.rating}</span>
                    <span className="ml-1 text-gray-500 text-sm">({doctorInfo.patients} patients)</span>
                  </div>
                  <p className="text-sm text-gray-600">{doctorInfo.experience} years experience</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{doctorInfo.hospital}, {doctorInfo.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">Available {doctorInfo.availability}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="text-sm">Speaks: {doctorInfo.languages.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.number === currentStep
                const isCompleted = step.number < currentStep
                
                return (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <span className={`mt-2 text-xs sm:text-sm font-medium ${
                        isActive ? 'text-blue-600' : 
                        isCompleted ? 'text-green-600' : 
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-colors ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <TimeSlotPicker
              doctorId={doctorInfo.id}
              doctorName={doctorInfo.name}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedSlot={selectedSlot}
              onSlotSelect={setSelectedSlot}
            />
          )}

          {currentStep === 2 && (
            <PatientInformationForm
              patientInfo={patientInfo}
              onUpdate={setPatientInfo}
              errors={errors}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-medium">{selectedDate.toLocaleDateString()} at {selectedSlot?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor</span>
                    <span className="font-medium">{doctorInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient</span>
                    <span className="font-medium">{patientInfo.firstName} {patientInfo.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Appointment Number</span>
                    <span className="font-medium">#{selectedSlot?.currentAppointmentNo ? selectedSlot.currentAppointmentNo + 1 : 1}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Amount</span>
                      <span className="font-bold text-blue-600">LKR {selectedSlot?.fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'card' 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Credit/Debit Card</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'bank' 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Bank Transfer</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('counter')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'counter' 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">Pay at Counter</p>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      You will be redirected to our secure payment gateway to complete the transaction.
                    </p>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Transfer the amount to the following account and bring the receipt:
                    </p>
                    <div className="text-sm">
                      <p><strong>Bank:</strong> Commercial Bank</p>
                      <p><strong>Account:</strong> 1234567890</p>
                      <p><strong>Branch:</strong> Colombo</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'counter' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      You can pay at the hospital counter when you arrive for your appointment.
                      Please arrive 20 minutes early to complete the payment.
                    </p>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and 
                    <a href="#" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>. 
                    I understand that my appointment is subject to availability and may be rescheduled if necessary.
                  </span>
                </label>
              </div>
            </div>
          )}

          {currentStep === 4 && bookingConfirmation && (
            <BookingConfirmation
              booking={bookingConfirmation}
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
              onSendSMS={handleSendSMS}
              onSendEmail={handleSendEmail}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2 ${
                currentStep === 1 ? 'invisible' : ''
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handlePaymentSubmit}
                disabled={loading || !agreeToTerms}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Complete Booking</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Finish Button for Confirmation */}
        {currentStep === 4 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => router.push('/appointments')}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View My Appointments
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AppointmentBooking
