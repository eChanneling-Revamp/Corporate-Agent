import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { Download, Calendar, TrendingUp, Users, DollarSign, FileText, Filter, RefreshCw, Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import ExportModal from '../components/reports/ExportModal';

interface Report {
  id: string;
  title: string;
  type: 'APPOINTMENT_SUMMARY' | 'REVENUE_ANALYSIS' | 'AGENT_PERFORMANCE' | 'CUSTOMER_SATISFACTION' | 'OPERATIONAL_METRICS';
  description?: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  parameters: any;
  generatedAt?: string;
  generatedById: string;
  generatedByName?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportFormData {
  title: string;
  type: 'APPOINTMENT_SUMMARY' | 'REVENUE_ANALYSIS' | 'AGENT_PERFORMANCE' | 'CUSTOMER_SATISFACTION' | 'OPERATIONAL_METRICS';
  description?: string;
  parameters: {
    dateFrom: string;
    dateTo: string;
    agentIds?: string[];
    hospitalIds?: string[];
    doctorIds?: string[];
    includeMetrics?: string[];
  };
}

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [searchQuery, statusFilter, typeFilter]);

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter })
      });

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
      } else {
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Generate new report
  const generateReport = async (reportData: ReportFormData) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Report generation started');
        setShowReportForm(false);
        await fetchReports();
      } else {
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  // Delete report
  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Report deleted successfully');
        await fetchReports();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  // Download report
  const downloadReport = async (report: Report) => {
    if (!report.fileUrl) {
      toast.error('Report file not available');
      return;
    }

    try {
      const response = await fetch(report.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'GENERATING': 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-blue-100 text-blue-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Get type display name
  const getTypeDisplayName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'APPOINTMENT_SUMMARY': 'Appointment Summary',
      'REVENUE_ANALYSIS': 'Revenue Analysis',
      'AGENT_PERFORMANCE': 'Agent Performance',
      'CUSTOMER_SATISFACTION': 'Customer Satisfaction',
      'OPERATIONAL_METRICS': 'Operational Metrics'
    };
    return typeNames[type] || type;
  };

  // Mock data for charts
  const appointmentData = [
    { name: 'Jan', appointments: 65, revenue: 45000 },
    { name: 'Feb', appointments: 59, revenue: 38000 },
    { name: 'Mar', appointments: 80, revenue: 52000 },
    { name: 'Apr', appointments: 81, revenue: 58000 },
    { name: 'May', appointments: 56, revenue: 42000 },
    { name: 'Jun', appointments: 55, revenue: 39000 },
  ];

  const specialtyData = [
    { name: 'Cardiology', value: 35, color: '#8884d8' },
    { name: 'Neurology', value: 25, color: '#82ca9d' },
    { name: 'Pediatrics', value: 20, color: '#ffc658' },
    { name: 'Orthopedics', value: 15, color: '#ff7c7c' },
    { name: 'Others', value: 5, color: '#8dd1e1' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate and manage reports</p>
          </div>
          <button
            onClick={() => {
              setShowReportForm(true);
              setSelectedReport(null);
              setIsEditMode(false);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setReportType('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                reportType === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setReportType('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                reportType === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Reports
            </button>
            <button
              onClick={() => setReportType('scheduled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                reportType === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled Reports
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {reportType === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">1,234</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">LKR 2.4M</p>
                    <p className="text-xs text-green-600">+8% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Agents</p>
                    <p className="text-2xl font-semibold text-gray-900">24</p>
                    <p className="text-xs text-green-600">+2 new this month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">94.2%</p>
                    <p className="text-xs text-green-600">+2.1% improvement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={appointmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="appointments" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={specialtyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {specialtyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports Tab */}
        {reportType === 'saved' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="GENERATING">Generating</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="APPOINTMENT_SUMMARY">Appointment Summary</option>
                  <option value="REVENUE_ANALYSIS">Revenue Analysis</option>
                  <option value="AGENT_PERFORMANCE">Agent Performance</option>
                  <option value="CUSTOMER_SATISFACTION">Customer Satisfaction</option>
                  <option value="OPERATIONAL_METRICS">Operational Metrics</option>
                </select>
              </div>
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading reports...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{report.title}</div>
                              {report.description && (
                                <div className="text-sm text-gray-500">{report.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getTypeDisplayName(report.type)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.generatedByName || 'System'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {report.status === 'COMPLETED' && report.fileUrl && (
                                <button
                                  onClick={() => downloadReport(report)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Download Report"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  // View report details
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteReport(report.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Report"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {reportType === 'scheduled' && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Reports</h3>
            <p className="text-gray-600 mb-4">
              Set up automated report generation on a recurring schedule.
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Report
            </button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportType={reportType}
      />
    </DashboardLayout>
  );
};

export default Reports;