import React from 'react';
import { Download, Calendar, FileText, BarChart2, PieChart, LineChart, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartLineChart, Line, PieChart as RechartPieChart, Pie, Cell } from 'recharts';
const Reports = () => {
  // Sample data for charts
  const monthlyBookings = [{
    month: 'Jan',
    appointments: 65
  }, {
    month: 'Feb',
    appointments: 59
  }, {
    month: 'Mar',
    appointments: 80
  }, {
    month: 'Apr',
    appointments: 81
  }, {
    month: 'May',
    appointments: 56
  }, {
    month: 'Jun',
    appointments: 55
  }, {
    month: 'Jul',
    appointments: 40
  }, {
    month: 'Aug',
    appointments: 70
  }, {
    month: 'Sep',
    appointments: 90
  }, {
    month: 'Oct',
    appointments: 85
  }, {
    month: 'Nov',
    appointments: 0
  }, {
    month: 'Dec',
    appointments: 0
  }];
  const revenueData = [{
    month: 'Jan',
    revenue: 125000
  }, {
    month: 'Feb',
    revenue: 118000
  }, {
    month: 'Mar',
    revenue: 160000
  }, {
    month: 'Apr',
    revenue: 165000
  }, {
    month: 'May',
    revenue: 140000
  }, {
    month: 'Jun',
    revenue: 145000
  }, {
    month: 'Jul',
    revenue: 120000
  }, {
    month: 'Aug',
    revenue: 155000
  }, {
    month: 'Sep',
    revenue: 180000
  }, {
    month: 'Oct',
    revenue: 170000
  }, {
    month: 'Nov',
    revenue: 0
  }, {
    month: 'Dec',
    revenue: 0
  }];
  const specializationData = [{
    name: 'Cardiologist',
    value: 35
  }, {
    name: 'Neurologist',
    value: 25
  }, {
    name: 'Dermatologist',
    value: 18
  }, {
    name: 'Orthopedic',
    value: 15
  }, {
    name: 'Others',
    value: 7
  }];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  return <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Bookings (Oct)</p>
          <h3 className="text-2xl font-semibold text-gray-800">354</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-green-600">+5.2%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Revenue (Oct)</p>
          <h3 className="text-2xl font-semibold text-gray-800">₹ 170,000</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-red-600">-5.5%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Top Doctor</p>
          <h3 className="text-2xl font-semibold text-gray-800">
            Dr. Sarah Williams
          </h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-600">
              42 appointments
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Top Specialization</p>
          <h3 className="text-2xl font-semibold text-gray-800">Cardiologist</h3>
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-600">
              35% of bookings
            </span>
          </div>
        </div>
      </div>
      {/* Chart Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <LineChart size={20} className="text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Booking Trends
              </h2>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Details
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartLineChart data={monthlyBookings} margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} activeDot={{
                r: 8
              }} />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Revenue by Month Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <BarChart2 size={20} className="text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Revenue by Month
              </h2>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Details
            </button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={value => [`₹ ${value}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Popularity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <PieChart size={20} className="text-amber-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Specialization Distribution
              </h2>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPieChart>
                <Pie data={specializationData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                name,
                percent
              }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {specializationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </RechartPieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Report Generation Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:col-span-2">
          <div className="flex items-center mb-4">
            <FileText size={20} className="text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Generate Reports
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="booking">Booking Summary</option>
                <option value="revenue">Revenue Report</option>
                <option value="doctor">Doctor Performance</option>
                <option value="patient">Patient Statistics</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex items-center space-x-2">
                <input type="date" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="date" className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input id="pdf" name="format" type="radio" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                  <label htmlFor="pdf" className="ml-2 block text-sm text-gray-700">
                    PDF
                  </label>
                </div>
                <div className="flex items-center">
                  <input id="excel" name="format" type="radio" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="excel" className="ml-2 block text-sm text-gray-700">
                    Excel
                  </label>
                </div>
                <div className="flex items-center">
                  <input id="csv" name="format" type="radio" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="csv" className="ml-2 block text-sm text-gray-700">
                    CSV
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                <Download size={18} className="mr-2" />
                Generate Report
              </button>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Recent Reports
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText size={16} className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Monthly Booking Summary - October 2023
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated on Oct 15, 2023
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText size={16} className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Revenue Report - Q3 2023
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated on Oct 10, 2023
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText size={16} className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Doctor Performance Analysis - September 2023
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated on Oct 5, 2023
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Reports;