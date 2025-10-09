import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, AlertCircle, Check, MapPin } from 'lucide-react'
import { format } from 'date-fns'

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

interface TimeSlotPickerProps {
  doctorId: number
  doctorName: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  onSlotSelect: (slot: TimeSlot) => void
  selectedSlot: TimeSlot | null
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  doctorId,
  doctorName,
  selectedDate,
  onDateChange,
  onSlotSelect,
  selectedSlot
}) => {
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  // Generate next 14 days for demonstration
  useEffect(() => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    setAvailableDates(dates)
  }, [doctorId])

  // Generate time slots when date changes
  useEffect(() => {
    setLoading(true)
    // Mock time slots - in production, fetch from API
    const slots: TimeSlot[] = [
      // Morning slots - City General Hospital
      { id: '1', time: '09:00 AM', available: true, currentAppointmentNo: 5, maxAppointments: 20, estimatedAppointmentTime: '09:15 AM', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      { id: '2', time: '09:30 AM', available: true, currentAppointmentNo: 8, maxAppointments: 20, estimatedAppointmentTime: '09:54 AM', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      { id: '3', time: '10:00 AM', available: true, currentAppointmentNo: 12, maxAppointments: 20, estimatedAppointmentTime: '10:36 AM', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      { id: '4', time: '10:30 AM', available: false, currentAppointmentNo: 20, maxAppointments: 20, estimatedAppointmentTime: 'Full', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      { id: '5', time: '11:00 AM', available: true, currentAppointmentNo: 15, maxAppointments: 20, estimatedAppointmentTime: '11:45 AM', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      { id: '6', time: '11:30 AM', available: true, currentAppointmentNo: 10, maxAppointments: 20, estimatedAppointmentTime: '12:00 PM', fee: 3500, hospital: 'City General Hospital', hospitalLocation: 'Colombo 03' },
      
      // Afternoon slots - National Hospital
      { id: '7', time: '02:00 PM', available: true, currentAppointmentNo: 3, maxAppointments: 20, estimatedAppointmentTime: '02:09 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      { id: '8', time: '02:30 PM', available: true, currentAppointmentNo: 7, maxAppointments: 20, estimatedAppointmentTime: '02:51 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      { id: '9', time: '03:00 PM', available: true, currentAppointmentNo: 11, maxAppointments: 20, estimatedAppointmentTime: '03:33 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      { id: '10', time: '03:30 PM', available: true, currentAppointmentNo: 18, maxAppointments: 20, estimatedAppointmentTime: '04:24 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      { id: '11', time: '04:00 PM', available: true, currentAppointmentNo: 14, maxAppointments: 20, estimatedAppointmentTime: '04:42 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      { id: '12', time: '04:30 PM', available: true, currentAppointmentNo: 9, maxAppointments: 20, estimatedAppointmentTime: '04:57 PM', fee: 3500, hospital: 'National Hospital', hospitalLocation: 'Colombo 10' },
      
      // Evening slots - Asiri Surgical Hospital
      { id: '13', time: '05:00 PM', available: true, currentAppointmentNo: 6, maxAppointments: 15, estimatedAppointmentTime: '05:18 PM', fee: 4000, hospital: 'Asiri Surgical Hospital', hospitalLocation: 'Colombo 05' },
      { id: '14', time: '05:30 PM', available: true, currentAppointmentNo: 4, maxAppointments: 15, estimatedAppointmentTime: '05:42 PM', fee: 4000, hospital: 'Asiri Surgical Hospital', hospitalLocation: 'Colombo 05' },
      { id: '15', time: '06:00 PM', available: false, currentAppointmentNo: 15, maxAppointments: 15, estimatedAppointmentTime: 'Full', fee: 4000, hospital: 'Asiri Surgical Hospital', hospitalLocation: 'Colombo 05' },
    ]
    
    setTimeout(() => {
      setTimeSlots(slots)
      setLoading(false)
    }, 500)
  }, [selectedDate, doctorId])

  const getDayName = (date: Date) => {
    return format(date, 'EEE')
  }

  const getDateNumber = (date: Date) => {
    return format(date, 'd')
  }

  const getMonthName = (date: Date) => {
    return format(date, 'MMM')
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return date.toDateString() === tomorrow.toDateString()
  }

  const getSlotStatus = (slot: TimeSlot) => {
    const percentFull = (slot.currentAppointmentNo / slot.maxAppointments) * 100
    if (!slot.available) return 'full'
    if (percentFull >= 80) return 'almost-full'
    if (percentFull >= 50) return 'moderate'
    return 'available'
  }

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-red-50 border-red-200 text-red-700'
      case 'almost-full': return 'bg-orange-50 border-orange-200 text-orange-700'
      case 'moderate': return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      default: return 'bg-green-50 border-green-200 text-green-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Select Date
          </h3>
          <span className="text-sm text-gray-500">
            Next available: {format(availableDates[0] || new Date(), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {availableDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString()
            const today = isToday(date)
            const tomorrow = isTomorrow(date)
            
            return (
              <button
                key={index}
                onClick={() => onDateChange(date)}
                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {today ? 'Today' : tomorrow ? 'Tomorrow' : getDayName(date)}
                </span>
                <span className="text-xl font-bold mt-1">{getDateNumber(date)}</span>
                <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {getMonthName(date)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Available Time Slots
          </h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
              <span className="text-gray-600">Filling Fast</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span className="text-gray-600">Full</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeSlots.map((slot) => {
              const status = getSlotStatus(slot)
              const isSelected = selectedSlot?.id === slot.id
              const statusColor = getSlotStatusColor(status)
              
              return (
                <button
                  key={slot.id}
                  onClick={() => slot.available && onSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 shadow-lg ring-2 ring-blue-200 scale-[1.02]' 
                      : slot.available
                        ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg hover:scale-[1.01]'
                        : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-600 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">{slot.time}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor}`}>
                      {status === 'full' ? 'Full' : status === 'almost-full' ? 'Filling Fast' : 'Available'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Appointment Number Badge */}
                    <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">
                        Appointment {slot.currentAppointmentNo + 1}
                      </span>
                    </div>

                    {/* Estimated Time */}
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg mr-2">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estimated Time</p>
                        <p className="font-semibold text-gray-900">{slot.estimatedAppointmentTime}</p>
                      </div>
                    </div>

                    {/* Hospital Location */}
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                      <div className="font-medium text-gray-900 text-sm">{slot.hospital}</div>
                      <div className="text-xs text-gray-600 mt-0.5 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {slot.hospitalLocation}
                      </div>
                    </div>

                    {/* Consultation Fee */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Consultation Fee</span>
                      <span className="text-lg font-bold text-gray-900">
                        LKR {slot.fee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!slot.available && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-10 rounded-lg flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Fully Booked
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Information:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Appointment numbers are assigned in order of booking</li>
                <li>Estimated appointment times are approximate and may vary</li>
                <li>Doctor visits multiple hospitals - check location before booking</li>
                <li>Evening slots (after 5 PM) have a higher consultation fee</li>
                <li>Please arrive 15 minutes before your appointment time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeSlotPicker
