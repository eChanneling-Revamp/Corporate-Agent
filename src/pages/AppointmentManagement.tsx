import React, { useState, Children } from 'react';
import { Search, Filter, Calendar, Download, Send, Trash2, Check, Clock, AlertTriangle, XCircle, Eye, Edit, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
const AppointmentManagement = () => {
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Sample appointments data
  const appointments = [{
    id: 'APT-10234',
    patient: 'John Smith',
    doctor: 'Dr. Sarah Williams',
    specialization: 'Cardiologist',
    date: '2023-10-15',
    time: '10:30 AM',
    hospital: 'City Medical Center',
    status: 'Confirmed',
    amount: '₹ 2,500'
  }, {
    id: 'APT-10235',
    patient: 'Emily Johnson',
    doctor: 'Dr. Michael Chen',
    specialization: 'Neurologist',
    date: '2023-10-15',
    time: '11:45 AM',
    hospital: 'Central Hospital',
    status: 'Pending',
    amount: '₹ 3,200'
  }, {
    id: 'APT-10236',
    patient: 'Robert Davis',
    doctor: 'Dr. Lisa Kumar',
    specialization: 'Dermatologist',
    date: '2023-10-15',
    time: '2:15 PM',
    hospital: 'Skin & Care Clinic',
    status: 'Confirmed',
    amount: '₹ 1,800'
  }, {
    id: 'APT-10237',
    patient: 'Sarah Wilson',
    doctor: 'Dr. James Rodriguez',
    specialization: 'Orthopedic',
    date: '2023-10-16',
    time: '9:00 AM',
    hospital: 'Orthopedic Specialty Center',
    status: 'Payment Failed',
    amount: '₹ 3,500'
  }, {
    id: 'APT-10238',
    patient: 'Michael Brown',
    doctor: 'Dr. Patricia Lee',
    specialization: 'Ophthalmologist',
    date: '2023-10-16',
    time: '10:15 AM',
    hospital: 'Vision Care Hospital',
    status: 'Confirmed',
    amount: '₹ 2,200'
  }, {
    id: 'APT-10239',
    patient: 'Jennifer Garcia',
    doctor: 'Dr. David Wilson',
    specialization: 'Psychiatrist',
    date: '2023-10-17',
    time: '1:00 PM',
    hospital: 'Mental Health Clinic',
    status: 'Cancelled',
    amount: '₹ 2,800'
  }, {
    id: 'APT-10240',
    patient: 'Thomas Martinez',
    doctor: 'Dr. Elizabeth Taylor',
    specialization: 'Endocrinologist',
    date: '2023-10-17',
    time: '3:30 PM',
    hospital: 'Diabetes Care Center',
    status: 'Pending',
    amount: '₹ 2,600'
  }, {
    id: 'APT-10241',
    patient: 'Jessica Robinson',
    doctor: 'Dr. Robert Johnson',
    specialization: 'Pediatrician',
    date: '2023-10-18',
    time: '9:15 AM',
    hospital: "Children's Hospital",
    status: 'Confirmed',
    amount: '₹ 1,900'
  }];
  const getStatusBadge = status => {
    switch (status) {
      case 'Confirmed':
        return <span className="flex items-center text-green-700 bg-green-50 rounded-full px-2 py-1 text-xs font-medium">
            <Check size={12} className="mr-1" /> {status}
          </span>;
      case 'Pending':
        return <span className="flex items-center text-amber-700 bg-amber-50 rounded-full px-2 py-1 text-xs font-medium">
            <Clock size={12} className="mr-1" /> {status}
          </span>;
      case 'Payment Failed':
        return <span className="flex items-center text-red-700 bg-red-50 rounded-full px-2 py-1 text-xs font-medium">
            <AlertTriangle size={12} className="mr-1" /> {status}
          </span>;
      case 'Cancelled':
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            <XCircle size={12} className="mr-1" /> {status}
          </span>;
      default:
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            {status}
          </span>;
    }
  };
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(app => app.id));
    }
    setSelectAll(!selectAll);
  };
  const toggleSelectAppointment = id => {
    if (selectedAppointments.includes(id)) {
      setSelectedAppointments(selectedAppointments.filter(appId => appId !== id));
    } else {
      setSelectedAppointments([...selectedAppointments, id]);
    }
  };
  return <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Search appointments by ID, patient name, or doctor..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-auto">
              <input type="date" className="block w-full border border-gray-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <select className="block w-full sm:w-auto border border-gray-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="payment-failed">Payment Failed</option>
            </select>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                <Filter size={18} className="mr-2" />
                Apply
              </button>
              <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <SlidersHorizontal size={18} className="mr-2" />
                Advanced
              </button>
            </div>
          </div>
        </div>
        {showAdvancedFilters && <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <select className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Hospitals</option>
                <option value="city">City Medical Center</option>
                <option value="central">Central Hospital</option>
                <option value="skin">Skin & Care Clinic</option>
                <option value="ortho">Orthopedic Specialty Center</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor
              </label>
              <select className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Doctors</option>
                <option value="dr-sarah">Dr. Sarah Williams</option>
                <option value="dr-michael">Dr. Michael Chen</option>
                <option value="dr-lisa">Dr. Lisa Kumar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Range
              </label>
              <div className="flex items-center space-x-2">
                <input type="number" placeholder="Min" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="number" placeholder="Max" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>}
      </div>
      {/* Bulk Operations Panel (when appointments selected) */}
      {selectedAppointments.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium mr-2">
              {selectedAppointments.length}
            </div>
            <span className="font-medium text-blue-700 mr-2">
              appointments selected
            </span>
            <button onClick={() => setSelectedAppointments([])} className="text-sm text-blue-600 hover:text-blue-800">
              Clear selection
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm">
              <Send size={16} className="mr-2" />
              Send Reminders
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm">
              <Download size={16} className="mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center text-sm">
              <Trash2 size={16} className="mr-2" />
              Cancel Selected
            </button>
          </div>
        </div>}
      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  <div className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={selectAll} onChange={toggleSelectAll} />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment ID
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map(appointment => <tr key={appointment.id} className={`hover:bg-gray-50 ${selectedAppointments.includes(appointment.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={selectedAppointments.includes(appointment.id)} onChange={() => toggleSelectAppointment(appointment.id)} />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                    {appointment.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {appointment.patient}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div>{appointment.doctor}</div>
                    <div className="text-xs text-gray-500">
                      {appointment.specialization}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    <div>{appointment.date}</div>
                    <div className="text-xs text-gray-500">
                      {appointment.time}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {appointment.hospital}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                    {appointment.amount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex justify-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" title="View">
                        <Eye size={18} />
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Cancel">
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 gap-4 sm:gap-0">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{' '}
              <span className="font-medium">8</span> of{' '}
              <span className="font-medium">24</span> results
            </p>
          </div>
          <div>
            <div className="flex justify-center space-x-1">
              <button className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Previous</span>
                <ChevronLeft size={18} />
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100">
                1
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                3
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
              <button className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className="sr-only">Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default AppointmentManagement;