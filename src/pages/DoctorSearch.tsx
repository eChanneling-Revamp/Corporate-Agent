import { useMemo, useState } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, Star, ChevronDown, X } from 'lucide-react';
import { useAppState } from '../store/AppState';
import { useToast } from '../store/Toast';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';

const DoctorSearch = () => {
  const { doctors, filteredDoctors, filters, searchDoctors, clearFilters, bookAppointment } = useAppState();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [query, setQuery] = useState(filters.query || '');
  const [specialization, setSpecialization] = useState(filters.specialization || '');
  const [hospital, setHospital] = useState(filters.hospital || '');
  const [date, setDate] = useState(filters.date || '');
  const [feeMin, setFeeMin] = useState<number | ''>(filters.feeMin ?? '');
  const [feeMax, setFeeMax] = useState<number | ''>(filters.feeMax ?? '');
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Booking modal state
  const [bookingDoctorId, setBookingDoctorId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDone, setBookingDone] = useState<string | null>(null);

  const specializations = useMemo(() => Array.from(new Set(doctors.map(d => d.specialization))), [doctors]);
  const hospitals = useMemo(() => Array.from(new Set(doctors.map(d => d.hospital))), [doctors]);

  const results = filteredDoctors;

  const applySearch = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (specialization) params.spec = specialization;
    if (hospital) params.h = hospital;
    if (date) params.d = date;
    if (feeMin !== '' && !isNaN(Number(feeMin))) params.min = String(feeMin);
    if (feeMax !== '' && !isNaN(Number(feeMax))) params.max = String(feeMax);
    setSearchParams(params, { replace: true });
    searchDoctors({
      query,
      specialization: specialization || undefined,
      hospital: hospital || undefined,
      date: date || undefined,
      feeMin: feeMin === '' ? undefined : Number(feeMin),
      feeMax: feeMax === '' ? undefined : Number(feeMax),
    });
    setTimeout(() => setLoading(false), 300);
  };

  // Auto-search on debounced query change to feel responsive
  useEffect(() => {
    if (debouncedQuery !== (filters.query || '')) {
      searchDoctors({
        query: debouncedQuery,
        specialization: specialization || undefined,
        hospital: hospital || undefined,
        date: date || undefined,
        feeMin: feeMin === '' ? undefined : Number(feeMin),
        feeMax: feeMax === '' ? undefined : Number(feeMax),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const resetFilters = () => {
    setQuery('');
    setSpecialization('');
    setHospital('');
    setDate('');
    setFeeMin('');
    setFeeMax('');
    clearFilters();
    setSearchParams({}, { replace: true });
  };

  const openBooking = (id: number) => {
    const doc = doctors.find(d => d.id === id);
    setBookingDoctorId(id);
    setPatientName('');
    setBookingDate(doc?.availableDates[0] || '');
    setBookingTime('09:00 AM');
    setBookingDone(null);
  };

  const confirmBooking = () => {
    const doc = doctors.find(d => d.id === bookingDoctorId);
    if (!doc) return;
    if (!patientName.trim()) {
      showToast({ type: 'error', title: 'Missing patient name', message: 'Please enter a patient name to continue.' });
      return;
    }
    if (!bookingDate.trim() || !bookingTime.trim()) {
      showToast({ type: 'error', title: 'Incomplete details', message: 'Please provide both a date and a time.' });
      return;
    }
    const appt = bookAppointment({ doctor: doc, patient: patientName.trim(), date: bookingDate.trim(), time: bookingTime.trim() });
    setBookingDone(appt.id);
    showToast({ type: 'success', title: 'Booking confirmed', message: `Appointment ${appt.id} created for ${appt.patient}.` });
  };

  // Hydrate filters from URL on first load
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const spec = searchParams.get('spec') || '';
    const h = searchParams.get('h') || '';
    const d = searchParams.get('d') || '';
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const hasAny = q || spec || h || d || min || max;
    if (hasAny) {
      setQuery(q);
      setSpecialization(spec);
      setHospital(h);
      setDate(d);
      setFeeMin(min ? Number(min) : '');
      setFeeMax(max ? Number(max) : '');
      searchDoctors({
        query: q,
        specialization: spec || undefined,
        hospital: h || undefined,
        date: d || undefined,
        feeMin: min ? Number(min) : undefined,
        feeMax: max ? Number(max) : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search for doctors, specializations, or hospitals..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
            <Filter size={18} className="mr-2" />
            Filters
            <ChevronDown size={16} className="ml-2" />
          </button>
          <button onClick={applySearch} className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-60" disabled={loading}>
            <Search size={18} className="mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={resetFilters} className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
            Clear
          </button>
        </div>
        {/* Advanced Filters */}
        {showFilters && <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specialization Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Specializations</option>
                {specializations.map((spec, index) => <option key={index} value={spec}>{spec}</option>)}
              </select>
            </div>
            {/* Hospital Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <select value={hospital} onChange={(e) => setHospital(e.target.value)} className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Hospitals</option>
                {hospitals.map((h, index) => <option key={index} value={h}>{h}</option>)}
              </select>
            </div>
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {/* Fee Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Range
              </label>
              <div className="flex items-center space-x-2">
                <input value={feeMin} onChange={(e) => setFeeMin(e.target.value === '' ? '' : Number(e.target.value))} type="number" placeholder="Min" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="text-gray-500">to</span>
                <input value={feeMax} onChange={(e) => setFeeMax(e.target.value === '' ? '' : Number(e.target.value))} type="number" placeholder="Max" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>}
        {/* Active Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.specialization && (
            <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
              {filters.specialization}
              <button onClick={() => { setSpecialization(''); searchDoctors({ specialization: undefined }); }} className="ml-1 text-blue-700 hover:text-blue-900">
                <X size={14} />
              </button>
            </div>
          )}
          {filters.hospital && (
            <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
              {filters.hospital}
              <button onClick={() => { setHospital(''); searchDoctors({ hospital: undefined }); }} className="ml-1 text-blue-700 hover:text-blue-900">
                <X size={14} />
              </button>
            </div>
          )}
          {filters.date && (
            <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
              {filters.date}
              <button onClick={() => { setDate(''); searchDoctors({ date: undefined }); }} className="ml-1 text-blue-700 hover:text-blue-900">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Search Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Found {results.length} doctors
          </h2>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Sort by:</span>
            <select className="text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Relevance</option>
              <option>Rating: High to Low</option>
              <option>Fee: Low to High</option>
              <option>Fee: High to Low</option>
              <option>Experience</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          )}
          {!loading && results.map(doctor => <div key={doctor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex">
                <div className="w-32 h-full">
                  <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {doctor.specialization}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {doctor.rating}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({doctor.reviews})
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-1" />
                    {doctor.hospital}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-1" />
                    Experience: {doctor.experience}
                  </div>
                  <div className="mt-2 flex items-center text-sm font-medium text-blue-700">
                    <DollarSign size={14} className="mr-1" />
                    Consultation Fee: {doctor.fee}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {doctor.availableDates.map((date, index) => <span key={index} className="inline-block bg-green-50 text-green-700 rounded px-2 py-1 text-xs font-medium">
                          {date}
                        </span>)}
                    </div>
                    <button onClick={() => openBooking(doctor.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingDoctorId !== null && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Booking</h3>
              <button onClick={() => setBookingDoctorId(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Patient Name</label>
                <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date</label>
                  <input type="text" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Time</label>
                  <input type="text" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {bookingDone && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  Booking confirmed. Appointment ID: <strong>{bookingDone}</strong>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => setBookingDoctorId(null)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
              <button onClick={confirmBooking} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60" disabled={!patientName.trim() || !bookingDate.trim() || !bookingTime.trim()}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default DoctorSearch;