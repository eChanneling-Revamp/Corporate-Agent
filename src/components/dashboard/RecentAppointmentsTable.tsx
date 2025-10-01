import React from 'react';
import { Eye, XCircle, Send, Check, Clock, AlertTriangle } from 'lucide-react';
const RecentAppointmentsTable = () => {
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
      default:
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            {status}
          </span>;
    }
  };
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Recent Appointments
        </h2>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
            Export
          </button>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
            {appointments.map(appointment => <tr key={appointment.id} className="hover:bg-gray-50">
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
                    <button className="text-red-600 hover:text-red-800" title="Cancel">
                      <XCircle size={18} />
                    </button>
                    <button className="text-green-600 hover:text-green-800" title="Resend">
                      <Send size={18} />
                    </button>
                  </div>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <div>Showing 5 of 24 appointments</div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
            2
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
            3
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100">
            Next
          </button>
        </div>
      </div>
    </div>;
};
export default RecentAppointmentsTable;