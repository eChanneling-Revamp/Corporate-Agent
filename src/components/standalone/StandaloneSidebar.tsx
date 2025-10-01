import React, { useState } from 'react';
import { LayoutDashboard, Search, Calendar, CreditCard, BarChart3, Settings, HelpCircle, LogOut, User } from 'lucide-react';
const StandaloneSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  const navItems = [{
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} />,
    active: true
  }, {
    name: 'Doctor Search',
    path: '/doctor-search',
    icon: <Search size={20} />,
    active: false
  }, {
    name: 'Appointments',
    path: '/appointments',
    icon: <Calendar size={20} />,
    active: false
  }, {
    name: 'Payments',
    path: '/payments',
    icon: <CreditCard size={20} />,
    active: false
  }, {
    name: 'Reports',
    path: '/reports',
    icon: <BarChart3 size={20} />,
    active: false
  }, {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={20} />,
    active: false
  }, {
    name: 'Help & Support',
    path: '/support',
    icon: <HelpCircle size={20} />,
    active: false
  }];
  return <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'} h-screen flex flex-col`}>
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && <h1 className="text-xl font-bold text-blue-700">eChannelling</h1>}
          {collapsed && <div className="w-full flex justify-center">
              <span className="text-2xl font-bold text-blue-700">e</span>
            </div>}
        </div>
        {/* Navigation */}
        <div className="py-4 flex-1 overflow-y-auto">
          <div className={`px-4 py-2 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed && <p className="text-xs uppercase font-medium text-gray-500">
                Main Menu
              </p>}
          </div>
          <nav className="mt-2">
            {navItems.map(item => <a key={item.path} href={item.path} className={`flex items-center px-4 py-3 ${item.active ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-700' : 'text-gray-700 hover:bg-gray-100'} ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                <span>{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </a>)}
          </nav>
        </div>
        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          {!collapsed ? <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={20} className="text-blue-700" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    Sarah Johnson
                  </p>
                  <p className="text-xs text-gray-500">Corporate Agent</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <LogOut size={18} />
              </button>
            </div> : <div className="flex justify-center">
              <button className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-700" />
              </button>
            </div>}
        </div>
      </aside>
      {/* Toggle Button (outside the sidebar for standalone demo) */}
      <div className="p-4">
        <button onClick={toggleSidebar} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        </button>
      </div>
    </div>;
};
export default StandaloneSidebar;