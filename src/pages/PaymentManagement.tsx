import React from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
const PaymentManagement = () => {
  // Sample payment data
  const payments = [{
    id: 'PMT-5678',
    appointmentId: 'APT-10234',
    patient: 'John Smith',
    doctor: 'Dr. Sarah Williams',
    date: '2023-10-15',
    amount: 'Rs 2,500',
    method: 'Credit Card',
    status: 'Completed',
    transactionId: 'TXN-123456'
  }, {
    id: 'PMT-5679',
    appointmentId: 'APT-10235',
    patient: 'Emily Johnson',
    doctor: 'Dr. Michael Chen',
    date: '2023-10-15',
    amount: 'Rs 3,200',
    method: 'Net Banking',
    status: 'Pending',
    transactionId: 'TXN-123457'
  }, {
    id: 'PMT-5680',
    appointmentId: 'APT-10236',
    patient: 'Robert Davis',
    doctor: 'Dr. Lisa Kumar',
    date: '2023-10-15',
    amount: 'Rs 1,800',
    method: 'UPI',
    status: 'Completed',
    transactionId: 'TXN-123458'
  }, {
    id: 'PMT-5681',
    appointmentId: 'APT-10237',
    patient: 'Sarah Wilson',
    doctor: 'Dr. James Rodriguez',
    date: '2023-10-16',
    amount: 'Rs 3,500',
    method: 'Credit Card',
    status: 'Failed',
    transactionId: 'TXN-123459'
  }, {
    id: 'PMT-5682',
    appointmentId: 'APT-10238',
    patient: 'Michael Brown',
    doctor: 'Dr. Patricia Lee',
    date: '2023-10-16',
    amount: 'Rs 2,200',
    method: 'Debit Card',
    status: 'Completed',
    transactionId: 'TXN-123460'
  }, {
    id: 'PMT-5683',
    appointmentId: 'APT-10239',
    patient: 'Jennifer Garcia',
    doctor: 'Dr. David Wilson',
    date: '2023-10-17',
    amount: 'Rs 2,800',
    method: 'UPI',
    status: 'Refunded',
    transactionId: 'TXN-123461'
  }];
  const getStatusBadge = status => {
    switch (status) {
      case 'Completed':
        return <span className="flex items-center text-green-700 bg-green-50 rounded-full px-2 py-1 text-xs font-medium">
            <CheckCircle size={12} className="mr-1" /> {status}
          </span>;
      case 'Pending':
        return <span className="flex items-center text-amber-700 bg-amber-50 rounded-full px-2 py-1 text-xs font-medium">
            <AlertCircle size={12} className="mr-1" /> {status}
          </span>;
      case 'Failed':
        return <span className="flex items-center text-red-700 bg-red-50 rounded-full px-2 py-1 text-xs font-medium">
            <XCircle size={12} className="mr-1" /> {status}
          </span>;
      case 'Refunded':
        return <span className="flex items-center text-blue-700 bg-blue-50 rounded-full px-2 py-1 text-xs font-medium">
            <CheckCircle size={12} className="mr-1" /> {status}
          </span>;
      default:
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            {status}
          </span>;
    }
  };
  return <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <h3 className="text-2xl font-semibold text-gray-800">148</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-green-600">+12%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <h3 className="text-2xl font-semibold text-gray-800">Rs 325,840</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-green-600">+8%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Pending Payments</p>
          <h3 className="text-2xl font-semibold text-gray-800">12</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-red-600">+3%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Failed Transactions</p>
          <h3 className="text-2xl font-semibold text-gray-800">5</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-green-600">-2%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
      </div>
      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Search by payment ID, patient name, or transaction ID..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div>
                <input type="date" className="block w-full border border-gray-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="From" />
              </div>
              <span className="text-gray-500">to</span>
              <div>
                <input type="date" className="block w-full border border-gray-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="To" />
              </div>
            </div>
            <select className="block w-full border border-gray-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
              <Filter size={18} className="mr-2" />
              Apply
            </button>
          </div>
        </div>
      </div>
      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Payment History
          </h2>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center text-sm">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map(payment => <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                    {payment.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {payment.appointmentId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {payment.patient}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {payment.doctor}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {payment.date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                    {payment.amount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {payment.method}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                    <button className="text-blue-600 hover:text-blue-800" title="View Receipt">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">6</span> of{' '}
                <span className="font-medium">148</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
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
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronRight size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default PaymentManagement;