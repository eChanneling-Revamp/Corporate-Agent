import { useState, useEffect } from 'react';
import { Search, Filter, Download, Send, Trash2, Check, Clock, AlertTriangle, XCircle, Eye, Edit, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  hospitalName: string;
  sessionDate: string;
  sessionTime: string;
  status: string;
  amount: number;
  appointmentNumber: string;
  paymentStatus: string;
}

const AppointmentManagement = () => {
  const dispatch = useDispatch<any>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.appointments);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Load appointments from Redux store
  useEffect(() => {
    dispatch(fetchAppointments({}));
  }, [dispatch]);

  const filteredAppointments = (appointments || []).filter((appointment: any) => {
    const matchesSearch = !searchQuery || 
      appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.appointmentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || appointment.status.toLowerCase().includes(statusFilter.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(filteredAppointments.length, startIndex + pageSize);
  const pageItems = filteredAppointments.slice(startIndex, endIndex);

  useEffect(() => { 
    setPage(1); 
  }, [filteredAppointments, pageSize]);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return <span className="flex items-center text-green-700 bg-green-50 rounded-full px-2 py-1 text-xs font-medium">
            <Check size={12} className="mr-1" /> Confirmed
          </span>;
      case 'PENDING':
        return <span className="flex items-center text-amber-700 bg-amber-50 rounded-full px-2 py-1 text-xs font-medium">
            <Clock size={12} className="mr-1" /> Pending
          </span>;
      case 'CANCELLED':
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            <XCircle size={12} className="mr-1" /> Cancelled
          </span>;
      case 'COMPLETED':
        return <span className="flex items-center text-blue-700 bg-blue-50 rounded-full px-2 py-1 text-xs font-medium">
            <Check size={12} className="mr-1" /> Completed
          </span>;
      case 'NO_SHOW':
        return <span className="flex items-center text-red-700 bg-red-50 rounded-full px-2 py-1 text-xs font-medium">
            <AlertTriangle size={12} className="mr-1" /> No Show
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
      setSelectedAppointments(pageItems.map(app => app.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectAppointment = (id: string) => {
    setSelectedAppointments(prev => 
      prev.includes(id) 
        ? prev.filter(appointmentId => appointmentId !== id)
        : [...prev, id]
    );
  };

  const handleCancelAppointments = () => {
    if (selectedAppointments.length === 0) {
      toast.error('Please select appointments to cancel');
      return;
    }
    
    toast.success(`${selectedAppointments.length} appointment(s) cancelled successfully`);
    setSelectedAppointments([]);
    setSelectAll(false);
  };

  const handleResendSMS = () => {
    if (selectedAppointments.length === 0) {
      toast.error('Please select appointments to send SMS');
      return;
    }
    
    toast.success(`SMS sent to ${selectedAppointments.length} appointment(s)`);
  };

  const handleExportAppointments = () => {
    toast.success('Appointments exported successfully');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage and track all your appointments</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              >
                <option value="">All Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Payment Failed">Payment Failed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAppointments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm text-blue-800">
                {selectedAppointments.length} appointment(s) selected
              </span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={handleResendSMS}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Send className="h-4 w-4" />
                  <span>Send SMS</span>
                </button>
                <button
                  onClick={handleCancelAppointments}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleExportAppointments}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor & Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAppointments.includes(appointment.id)}
                        onChange={() => toggleSelectAppointment(appointment.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                        <div className="text-sm text-gray-500">{appointment.appointmentNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{appointment.doctorName}</div>
                        <div className="text-sm text-gray-500">{appointment.hospitalName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{new Date(appointment.sessionDate).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{appointment.sessionTime}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      LKR {appointment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-3 sm:px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-200 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to {endIndex} of {filteredAppointments.length} results
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full sm:w-auto"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentManagement;