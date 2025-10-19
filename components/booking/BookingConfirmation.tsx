import React from 'react'
import { CheckCircle, Calendar, Clock, User, MapPin, Phone, Mail, FileText, Download, Printer, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'

interface BookingDetails {
  appointmentId: string
  appointmentNumber: number
  doctorName: string
  doctorSpecialization: string
  hospital: string
  location: string
  date: Date
  time: string
  patientName: string
  patientEmail: string
  patientPhone: string
  fee: number
  paymentStatus: 'pending' | 'completed'
  estimatedAppointmentTime: string
  hospitalAddress?: string
  doctorPhone?: string
  hospitalPhone?: string
  specialInstructions?: string[]
}

interface BookingConfirmationProps {
  booking: BookingDetails
  onPrint: () => void
  onDownloadPDF: () => void
  onSendSMS: () => void
  onSendEmail: () => void
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onPrint,
  onDownloadPDF,
  onSendSMS,
  onSendEmail
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Appointment Confirmed!</h2>
        <p className="text-green-700">
          Your appointment has been successfully booked with {booking.doctorName}
        </p>
        <div className="mt-4 p-3 bg-white rounded-lg inline-block">
          <p className="text-sm text-gray-600">Appointment ID</p>
          <p className="text-2xl font-bold text-gray-900">{booking.appointmentId}</p>
        </div>
      </div>

      {/* Appointment Details Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h3 className="text-xl font-bold mb-3">Appointment Details</h3>
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-xs text-blue-100 uppercase tracking-wide mb-1">Your Appointment</p>
              <p className="text-3xl font-bold">{booking.appointmentNumber}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Please remember this number</p>
              <p className="text-xs text-blue-200">for quick check-in at the hospital</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Doctor Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Doctor Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.doctorName}</p>
                  <p className="text-sm text-gray-600">{booking.doctorSpecialization}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.hospital}</p>
                  <p className="text-sm text-gray-600">{booking.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Time */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Date & Time</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{format(booking.date, 'EEEE')}</p>
                  <p className="text-sm text-gray-600">{format(booking.date, 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.time}</p>
                  <p className="text-sm text-gray-600">Arrival time</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.estimatedAppointmentTime}</p>
                  <p className="text-sm text-gray-600">Est. appointment time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.patientName}</p>
                  <p className="text-sm text-gray-600">Patient Name</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.patientPhone}</p>
                  <p className="text-sm text-gray-600">Contact Number</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Information</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-semibold text-gray-900">LKR {booking.fee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Important Instructions</h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Please arrive 15 minutes before your appointment time for registration</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Bring your National ID card or Passport for verification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>If you have medical reports or prescriptions, please bring them</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>For cancellation, please call at least 2 hours before appointment time</span>
                </li>
                {booking.specialInstructions?.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          {(booking.doctorPhone || booking.hospitalPhone) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {booking.hospitalPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{booking.hospitalPhone}</p>
                      <p className="text-sm text-gray-600">Hospital Contact</p>
                    </div>
                  </div>
                )}
                {booking.doctorPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{booking.doctorPhone}</p>
                      <p className="text-sm text-gray-600">Doctor's Office</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onPrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onSendSMS}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send SMS</span>
            </button>
            <button
              onClick={onSendEmail}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Send Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Section (Optional) */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Check-in Code</h4>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            {/* QR Code would go here */}
            <span className="text-gray-500 text-xs">QR Code</span>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-2">
              Show this QR code at the hospital reception for quick check-in
            </p>
            <p className="text-xs text-gray-500">
              This code contains your appointment ID and patient information
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Save Details</p>
            <p className="text-xs text-gray-600 mt-1">Download or print your appointment details</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Arrive Early</p>
            <p className="text-xs text-gray-600 mt-1">Come 15 minutes before your appointment</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <p className="text-sm font-medium text-gray-900">Check-in</p>
            <p className="text-xs text-gray-600 mt-1">Show your appointment details at reception</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation
