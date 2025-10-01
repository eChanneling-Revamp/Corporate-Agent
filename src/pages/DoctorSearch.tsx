import React, { useState } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, Star, ChevronDown, X } from 'lucide-react';
const DoctorSearch = () => {
  const [showFilters, setShowFilters] = useState(true);
  // Sample doctors data
  const doctors = [{
    id: 1,
    name: 'Dr. Sarah Williams',
    specialization: 'Cardiologist',
    hospital: 'City Medical Center',
    experience: '15 years',
    rating: 4.8,
    reviews: 124,
    fee: '₹ 2,500',
    availableDates: ['Today', 'Tomorrow', 'Oct 18', 'Oct 20'],
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }, {
    id: 2,
    name: 'Dr. Michael Chen',
    specialization: 'Neurologist',
    hospital: 'Central Hospital',
    experience: '12 years',
    rating: 4.6,
    reviews: 98,
    fee: '₹ 3,200',
    availableDates: ['Tomorrow', 'Oct 19', 'Oct 21'],
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }, {
    id: 3,
    name: 'Dr. Lisa Kumar',
    specialization: 'Dermatologist',
    hospital: 'Skin & Care Clinic',
    experience: '8 years',
    rating: 4.9,
    reviews: 156,
    fee: '₹ 1,800',
    availableDates: ['Today', 'Oct 18', 'Oct 19', 'Oct 22'],
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }, {
    id: 4,
    name: 'Dr. James Rodriguez',
    specialization: 'Orthopedic',
    hospital: 'Orthopedic Specialty Center',
    experience: '20 years',
    rating: 4.7,
    reviews: 210,
    fee: '₹ 3,500',
    availableDates: ['Oct 18', 'Oct 19', 'Oct 20', 'Oct 21'],
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }];
  // Sample specializations
  const specializations = ['Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'Ophthalmologist', 'Psychiatrist', 'Dentist', 'Urologist'];
  // Sample hospitals
  const hospitals = ['City Medical Center', 'Central Hospital', 'Skin & Care Clinic', 'Orthopedic Specialty Center', 'Vision Care Hospital', 'Metro Healthcare', 'Apollo Hospital', 'General Hospital'];
  return <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Search for doctors, specializations, or hospitals..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
            <Filter size={18} className="mr-2" />
            Filters
            <ChevronDown size={16} className="ml-2" />
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
            <Search size={18} className="mr-2" />
            Search
          </button>
        </div>
        {/* Advanced Filters */}
        {showFilters && <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specialization Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Specializations</option>
                {specializations.map((spec, index) => <option key={index} value={spec}>
                    {spec}
                  </option>)}
              </select>
            </div>
            {/* Hospital Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <select className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Hospitals</option>
                {hospitals.map((hospital, index) => <option key={index} value={hospital}>
                    {hospital}
                  </option>)}
              </select>
            </div>
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <input type="date" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {/* Fee Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Range
              </label>
              <div className="flex items-center space-x-2">
                <input type="number" placeholder="Min" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="number" placeholder="Max" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>}
        {/* Active Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
            Cardiologist
            <button className="ml-1 text-blue-700 hover:text-blue-900">
              <X size={14} />
            </button>
          </div>
          <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
            City Medical Center
            <button className="ml-1 text-blue-700 hover:text-blue-900">
              <X size={14} />
            </button>
          </div>
          <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
            Today
            <button className="ml-1 text-blue-700 hover:text-blue-900">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
      {/* Search Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Found {doctors.length} doctors
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
          {doctors.map(doctor => <div key={doctor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    <button className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default DoctorSearch;