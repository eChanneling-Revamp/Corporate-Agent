import { useMemo, useState } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, Star, ChevronDown, X, SlidersHorizontal, Grid, List } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import { searchDoctors, clearFilters } from '../store/slices/doctorSlice';
import DashboardLayout from '../components/layout/DashboardLayout';
import DoctorCard from '../components/doctor/DoctorCard';
import AdvancedFilters from '../components/doctor/AdvancedFilters';

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
  experience?: number;
  patients?: number;
  languages?: string[];
}

const DoctorSearch = () => {
  const dispatch = useDispatch<any>();
  const router = useRouter();
  const { doctors, loading } = useSelector((state: RootState) => state.doctors) as any;
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('relevance');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    hospital: '',
    location: '',
    feeMin: '' as number | '',
    feeMax: '' as number | '',
    rating: '' as number | '',
    availability: '',
    gender: '',
    experience: '' as number | ''
  });

  // Booking modal state
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Enhanced mock data for demonstration
  const mockDoctors: Doctor[] = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiologist',
      hospital: 'City General Hospital',
      location: 'Colombo 03',
      fee: 3500,
      rating: 4.8,
      availability: ['2024-01-15 09:00', '2024-01-15 14:00', '2024-01-16 10:00', '2024-01-17 11:00'],
      image: '/api/placeholder/150/150',
      experience: 15,
      patients: 2500,
      languages: ['English', 'Sinhala', 'Tamil']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialization: 'Neurologist',
      hospital: 'National Hospital',
      location: 'Colombo 10',
      fee: 4000,
      rating: 4.9,
      availability: ['2024-01-15 11:00', '2024-01-16 09:00', '2024-01-17 15:00', '2024-01-18 10:00'],
      image: '/api/placeholder/150/150',
      experience: 20,
      patients: 3200,
      languages: ['English', 'Mandarin']
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      specialization: 'Pediatrician',
      hospital: 'Children\'s Hospital',
      location: 'Nugegoda',
      fee: 2800,
      rating: 4.7,
      availability: ['2024-01-15 08:00', '2024-01-15 16:00', '2024-01-16 14:00', '2024-01-17 09:00'],
      image: '/api/placeholder/150/150',
      experience: 12,
      patients: 1800,
      languages: ['English', 'Sinhala']
    }
  ];

  const specializations = useMemo(() => Array.from(new Set(mockDoctors.map(d => d.specialization))), []);
  const hospitals = useMemo(() => Array.from(new Set(mockDoctors.map(d => d.hospital))), []);
  const locations = useMemo(() => Array.from(new Set(mockDoctors.map(d => d.location))), []);

  const filteredDoctors = useMemo(() => {
    let results = mockDoctors.filter(doctor => {
      const matchesQuery = !query || 
        doctor.name.toLowerCase().includes(query.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(query.toLowerCase()) ||
        doctor.hospital.toLowerCase().includes(query.toLowerCase());
      
      const matchesSpecialization = !filters.specialization || doctor.specialization === filters.specialization;
      const matchesHospital = !filters.hospital || doctor.hospital === filters.hospital;
      const matchesLocation = !filters.location || doctor.location === filters.location;
      const matchesFeeMin = filters.feeMin === '' || doctor.fee >= Number(filters.feeMin);
      const matchesFeeMax = filters.feeMax === '' || doctor.fee <= Number(filters.feeMax);
      const matchesRating = filters.rating === '' || doctor.rating >= Number(filters.rating);
      const matchesExperience = filters.experience === '' || (doctor.experience && doctor.experience >= Number(filters.experience));

      return matchesQuery && matchesSpecialization && matchesHospital && matchesLocation && 
             matchesFeeMin && matchesFeeMax && matchesRating && matchesExperience;
    });

    // Sort results
    if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'fee-low') {
      results.sort((a, b) => a.fee - b.fee);
    } else if (sortBy === 'fee-high') {
      results.sort((a, b) => b.fee - a.fee);
    } else if (sortBy === 'experience') {
      results.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    }

    return results;
  }, [query, filters, sortBy]);

  const handleSearch = () => {
    // In a real app, this would trigger an API call
    toast.success(`Found ${filteredDoctors.length} doctors`);
  };

  const handleClearFilters = () => {
    setQuery('');
    setFilters({
      specialization: '',
      hospital: '',
      location: '',
      feeMin: '',
      feeMax: '',
      rating: '',
      availability: '',
      gender: '',
      experience: ''
    });
    setSortBy('relevance');
  };

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    toast.success(`Found ${filteredDoctors.length} doctors matching your criteria`);
  };

  const handleViewDetails = (doctorId: number) => {
    toast('Doctor profile view coming soon!', { icon: 'ℹ️' });
  };

  const handleBookAppointment = (doctorId: number) => {
    // Navigate to the comprehensive booking page
    router.push(`/appointment-booking/${doctorId}`);
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(true)}
                className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced</span>
              </button>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Highest Rating</option>
                <option value="fee-low">Lowest Fee</option>
                <option value="fee-high">Highest Fee</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>

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
          <div className="p-4 sm:p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Found {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            </h2>
            {filteredDoctors.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing results {1}-{filteredDoctors.length}
              </span>
            )}
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 p-4' : 'divide-y'}>
            {filteredDoctors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <div key={doctor.id} className={viewMode === 'list' ? 'p-4 sm:p-6' : ''}>
                  <DoctorCard 
                    doctor={doctor} 
                    onBook={handleBookAppointment}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Advanced Filters Modal */}
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleClearFilters}
          specializations={specializations}
          hospitals={hospitals}
          locations={locations}
        />

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