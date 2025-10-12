import { useMemo, useState } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, Star, ChevronDown, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import { searchDoctors, clearFilters } from '../store/slices/doctorSlice';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  location: string;
  fee: number;
  rating: number;
  availability: string[];
  image: string;
}

const DoctorSearch = () => {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { doctors, isLoading } = useSelector((state: RootState) => state.doctors);
  const [showFilters, setShowFilters] = useState(true);
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState('');
  const [feeMin, setFeeMin] = useState<number | ''>('');
  const [feeMax, setFeeMax] = useState<number | ''>('');

  // Booking modal state
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Mock data for demonstration
  const mockDoctors: Doctor[] = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiologist',
      hospital: 'City General Hospital',
      location: 'Colombo 03',
      fee: 3500,
      rating: 4.8,
      availability: ['2024-01-15 09:00', '2024-01-15 14:00', '2024-01-16 10:00'],
      image: '/api/placeholder/150/150'
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialization: 'Neurologist',
      hospital: 'National Hospital',
      location: 'Colombo 10',
      fee: 4000,
      rating: 4.9,
      availability: ['2024-01-15 11:00', '2024-01-16 09:00', '2024-01-17 15:00'],
      image: '/api/placeholder/150/150'
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      specialization: 'Pediatrician',
      hospital: 'Children\'s Hospital',
      location: 'Nugegoda',
      fee: 2800,
      rating: 4.7,
      availability: ['2024-01-15 08:00', '2024-01-15 16:00', '2024-01-16 14:00'],
      image: '/api/placeholder/150/150'
    }
  ];

  const specializations = useMemo(() => Array.from(new Set(mockDoctors.map(d => d.specialization))), []);
  const hospitals = useMemo(() => Array.from(new Set(mockDoctors.map(d => d.hospital))), []);

  const filteredDoctors = useMemo(() => {
    return mockDoctors.filter(doctor => {
      const matchesQuery = !query || 
        doctor.name.toLowerCase().includes(query.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(query.toLowerCase()) ||
        doctor.hospital.toLowerCase().includes(query.toLowerCase());
      
      const matchesSpecialization = !specialization || doctor.specialization === specialization;
      const matchesHospital = !hospital || doctor.hospital === hospital;
      const matchesFeeMin = feeMin === '' || doctor.fee >= Number(feeMin);
      const matchesFeeMax = feeMax === '' || doctor.fee <= Number(feeMax);

      return matchesQuery && matchesSpecialization && matchesHospital && matchesFeeMin && matchesFeeMax;
    });
  }, [query, specialization, hospital, feeMin, feeMax]);

  const handleSearch = () => {
    // In a real app, this would trigger an API call
    toast.success(`Found ${filteredDoctors.length} doctors`);
  };

  const handleClearFilters = () => {
    setQuery('');
    setSpecialization('');
    setHospital('');
    setDate('');
    setFeeMin('');
    setFeeMax('');
  };

  const handleBookAppointment = (doctorId: number) => {
    setBookingDoctorId(doctorId);
  };

  const submitBooking = () => {
    if (!patientName || !bookingDate || !bookingTime) {
      toast.error('Please fill all booking details');
      return;
    }

    const doctor = mockDoctors.find(d => d.id === bookingDoctorId);
    toast.success(`Appointment booked with ${doctor?.name} for ${patientName}`);
    
    // Reset form
    setBookingDoctorId(null);
    setPatientName('');
    setBookingDate('');
    setBookingTime('');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Doctor Search</h1>
          <p className="text-gray-600 text-sm sm:text-base">Find and book appointments with doctors</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold">Search Doctors</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by doctor name, specialization, or hospital..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                <select
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Hospitals</option>
                  {hospitals.map(hosp => (
                    <option key={hosp} value={hosp}>{hosp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Fee (LKR)</label>
                <input
                  type="number"
                  value={feeMin}
                  onChange={(e) => setFeeMin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Fee (LKR)</label>
                <input
                  type="number"
                  value={feeMax}
                  onChange={(e) => setFeeMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              Found {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            </h2>
          </div>

          <div className="divide-y">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto sm:mx-0"
                  />
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm text-gray-600 space-y-1 sm:space-y-0">
                          <div className="flex items-center justify-center sm:justify-start space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{doctor.hospital}, {doctor.location}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>LKR {doctor.fee}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{doctor.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBookAppointment(doctor.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto whitespace-nowrap"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Modal */}
        {bookingDoctorId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={submitBooking}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Book Appointment
                </button>
                <button
                  onClick={() => setBookingDoctorId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorSearch;