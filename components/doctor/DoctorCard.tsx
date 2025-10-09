import React, { useState } from 'react'
import { MapPin, DollarSign, Star, Calendar, Clock, Award, Heart, Eye } from 'lucide-react'

interface DoctorCardProps {
  doctor: {
    id: number
    name: string
    specialization: string
    hospital: string
    location: string
    fee: number
    rating: number
    availability: string[]
    image: string
    experience?: number
    patients?: number
    languages?: string[]
  }
  onBook: (doctorId: number) => void
  onViewDetails?: (doctorId: number) => void
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook, onViewDetails }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const [showAllAvailability, setShowAllAvailability] = useState(false)

  const displayedAvailability = showAllAvailability 
    ? doctor.availability 
    : doctor.availability.slice(0, 3)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Doctor Image */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div className="relative">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-blue-50"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {doctor.name}
              </h3>
              <p className="text-blue-600 font-semibold text-sm sm:text-base">
                {doctor.specialization}
              </p>
            </div>
            
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite 
                  ? 'bg-red-50 text-red-500' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-2 flex-shrink-0 text-gray-400" />
              <span className="truncate">{doctor.hospital}, {doctor.location}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <DollarSign size={16} className="mr-2 flex-shrink-0 text-gray-400" />
              <span className="font-semibold text-gray-900">LKR {doctor.fee.toLocaleString()}</span>
            </div>

            {doctor.experience && (
              <div className="flex items-center text-gray-600">
                <Award size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                <span>{doctor.experience}+ years experience</span>
              </div>
            )}

            <div className="flex items-center text-gray-600">
              <Star size={16} className="mr-2 flex-shrink-0 text-yellow-500 fill-current" />
              <span className="font-semibold text-gray-900">{doctor.rating}</span>
              <span className="ml-1 text-gray-500">
                {doctor.patients ? `(${doctor.patients} patients)` : '(125 reviews)'}
              </span>
            </div>
          </div>

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {doctor.languages.map((lang, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          {/* Availability */}
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <Clock size={14} className="mr-1 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">Available Slots:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayedAvailability.map((slot, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200"
                >
                  {slot}
                </span>
              ))}
              {doctor.availability.length > 3 && (
                <button
                  onClick={() => setShowAllAvailability(!showAllAvailability)}
                  className="px-3 py-1 text-blue-600 text-xs font-medium hover:bg-blue-50 rounded-md"
                >
                  {showAllAvailability ? 'Show less' : `+${doctor.availability.length - 3} more`}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onBook(doctor.id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
            >
              <Calendar size={16} />
              <span>Book Appointment</span>
            </button>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(doctor.id)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Eye size={16} />
                <span>View Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorCard
