import { useMemo, useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, Star, ChevronDown, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import { searchDoctors, clearFilters } from '../store/slices/doctorSlice';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  location: string;
  fee: number;
  rating: number;
  availability: string[];
  image: string;
  experience: number;
  qualifications: string;
  bio?: string;
  totalReviews: number;
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
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Load doctors from API
  useEffect(() => {
    const loadDoctors = async () => {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (specialization) params.append('specialization', specialization);
      if (hospital) params.append('hospital', hospital);
      if (feeMin !== '') params.append('minFee', feeMin.toString());
      if (feeMax !== '') params.append('maxFee', feeMax.toString());
      
      dispatch(searchDoctors(params.toString()));
    };

    loadDoctors();
  }, [dispatch, query, specialization, hospital, feeMin, feeMax]);

  const specializations = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];
    return Array.from(new Set(doctors.map(d => d.specialization)));
  }, [doctors]);
  
  const hospitals = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];
    return Array.from(new Set(doctors.map(d => d.hospital)));
  }, [doctors]);

  const filteredDoctors = doctors || [];

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

  const handleBookAppointment = (doctorId: string) => {
    setBookingDoctorId(doctorId);
  };

  const submitBooking = async () => {
    if (!patientName || !patientPhone || !bookingDate || !bookingTime) {
      toast.error('Please fill all booking details');
      return;
    }

    const doctor = filteredDoctors.find(d => d.id === bookingDoctorId);
    if (!doctor) {
      toast.error('Doctor not found');
      return;
    }

    try {
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          doctorName: doctor.name,
          hospitalName: doctor.hospital,
          specialty: doctor.specialization,
          sessionDate: bookingDate,
          sessionTime: bookingTime,
          patientName: patientName,
          patientPhone: patientPhone,
          amount: doctor.fee,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Appointment booked successfully! Reference: ${result.appointmentNumber}`);
        
        // Reset form
        setBookingDoctorId(null);
        setPatientName('');
        setPatientPhone('');
        setBookingDate('');
        setBookingTime('');
        
        // Optionally redirect to appointments page
        router.push('/appointments');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment');
    }
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
                    placeholder="Enter patient full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Phone</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter patient phone number"
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