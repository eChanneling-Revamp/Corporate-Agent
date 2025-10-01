import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Users, Search, FileText, ArrowRight } from 'lucide-react';
const QuickActionsPanel = () => {
  const actions = [{
    title: 'New Appointment',
    description: 'Book a new appointment for a patient',
    icon: <CalendarPlus size={20} className="text-blue-500" />,
    path: '/doctor-search',
    primary: true
  }, {
    title: 'Bulk Booking',
    description: 'Book appointments for multiple patients',
    icon: <Users size={20} className="text-purple-500" />,
    path: '/doctor-search?bulk=true',
    primary: false
  }, {
    title: 'Search Doctors',
    description: 'Find doctors by specialization',
    icon: <Search size={20} className="text-green-500" />,
    path: '/doctor-search',
    primary: false
  }, {
    title: 'Generate Report',
    description: 'Create custom reports',
    icon: <FileText size={20} className="text-amber-500" />,
    path: '/reports',
    primary: false
  }];
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {actions.map((action, index) => <Link key={index} to={action.path} className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${action.primary ? 'bg-blue-50' : ''}`}>
            <div className="flex items-center">
              <div className="mr-3">{action.icon}</div>
              <div>
                <h3 className={`font-medium ${action.primary ? 'text-blue-700' : 'text-gray-800'}`}>
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </Link>)}
      </div>
    </div>;
};
export default QuickActionsPanel;