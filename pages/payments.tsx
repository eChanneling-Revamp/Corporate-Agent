import { useState, useEffect } from 'react';
import { Search, Filter, Download, CreditCard, DollarSign, TrendingUp, Calendar, Check, Clock, X, AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Payment {
  id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  hospitalName: string;
  amount: number;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cash';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  transactionId: string;
  paymentDate: string;
  commission: number;
}

const PaymentManagement = () => {
  const dispatch = useDispatch<any>();
  const { payments, isLoading } = useSelector((state: RootState) => state.payments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  // Mock data for demonstration
  const mockPayments: Payment[] = [
    {
      id: 'PAY001',
      appointmentId: 'APT001',
      patientName: 'John Silva',
      doctorName: 'Dr. Sarah Johnson',
      hospitalName: 'City General Hospital',
      amount: 3500,
      paymentMethod: 'Credit Card',
      status: 'Completed',
      transactionId: 'TXN001',
      paymentDate: '2024-01-15',
      commission: 350
    },
    {
      id: 'PAY002',
      appointmentId: 'APT002',
      patientName: 'Mary Fernando',
      doctorName: 'Dr. Michael Chen',
      hospitalName: 'National Hospital',
      amount: 4000,
      paymentMethod: 'Debit Card',
      status: 'Pending',
      transactionId: 'TXN002',
      paymentDate: '2024-01-16',
      commission: 400
    },
    {
      id: 'PAY003',
      appointmentId: 'APT003',
      patientName: 'David Perera',
      doctorName: 'Dr. Emily Davis',
      hospitalName: 'Children\'s Hospital',
      amount: 2800,
      paymentMethod: 'Bank Transfer',
      status: 'Failed',
      transactionId: 'TXN003',
      paymentDate: '2024-01-14',
      commission: 280
    },
    {
      id: 'PAY004',
      appointmentId: 'APT004',
      patientName: 'Lisa Jayawardena',
      doctorName: 'Dr. Robert Wilson',
      hospitalName: 'Private Medical Center',
      amount: 3200,
      paymentMethod: 'Credit Card',
      status: 'Refunded',
      transactionId: 'TXN004',
      paymentDate: '2024-01-13',
      commission: 320
    }
  ];

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = !searchQuery || 
      payment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalRevenue = mockPayments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalCommission = mockPayments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.commission, 0);
  
  const pendingAmount = mockPayments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="flex items-center text-green-700 bg-green-50 rounded-full px-2 py-1 text-xs font-medium">
            <Check size={12} className="mr-1" /> {status}
          </span>;
      case 'Pending':
        return <span className="flex items-center text-amber-700 bg-amber-50 rounded-full px-2 py-1 text-xs font-medium">
            <Clock size={12} className="mr-1" /> {status}
          </span>;
      case 'Failed':
        return <span className="flex items-center text-red-700 bg-red-50 rounded-full px-2 py-1 text-xs font-medium">
            <X size={12} className="mr-1" /> {status}
          </span>;
      case 'Refunded':
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            <AlertTriangle size={12} className="mr-1" /> {status}
          </span>;
      default:
        return <span className="flex items-center text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
            {status}
          </span>;
    }
  };

  const handleExportPayments = () => {
    toast.success('Payment report exported successfully');
  };

  const handleRefundPayment = (paymentId: string) => {
    toast.success('Refund initiated successfully');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Track and manage all payment transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">LKR {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                <p className="text-2xl font-bold text-gray-900">LKR {totalCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">LKR {pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{mockPayments.length}</p>
              </div>
            </div>
          </div>
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
                placeholder="Search by patient, doctor, or transaction ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>

              <button
                onClick={handleExportPayments}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient & Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.transactionId}</div>
                        <div className="text-sm text-gray-500">ID: {payment.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.patientName}</div>
                        <div className="text-sm text-gray-500">{payment.doctorName}</div>
                        <div className="text-xs text-gray-400">{payment.hospitalName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">LKR {payment.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{payment.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.paymentDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      LKR {payment.commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'Completed' && (
                        <button
                          onClick={() => handleRefundPayment(payment.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Refund
                        </button>
                      )}
                      {payment.status === 'Failed' && (
                        <button className="text-blue-600 hover:text-blue-900 text-sm">
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentManagement;