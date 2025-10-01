import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu, ChevronDown, Search, UserCircle, HelpCircle, Settings, LogOut } from 'lucide-react';
interface HeaderProps {
  toggleSidebar: () => void;
}
const Header: React.FC<HeaderProps> = ({
  toggleSidebar
}) => {
  const location = useLocation();
  // Function to get page title based on current path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/doctor-search':
        return 'Doctor Search & Booking';
      case '/appointments':
        return 'Appointment Management';
      case '/payments':
        return 'Payment Management';
      case '/reports':
        return 'Reports & Analytics';
      case '/settings':
        return 'Profile & Settings';
      case '/support':
        return 'Help & Support';
      default:
        return 'Dashboard';
    }
  };
  return <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none" title="Toggle sidebar">
          <Menu size={20} />
        </button>
        <div className="ml-4">
          <h1 className="text-lg font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
          <div className="flex items-center text-xs text-gray-500">
            <span>Home</span>
            <span className="mx-1">/</span>
            <span>{getPageTitle()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-64">
          <Search size={18} className="text-gray-500" />
          <input type="text" placeholder="Global search..." className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full" />
        </div>
        <div className="hidden md:flex items-center space-x-1">
          <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Help">
            <HelpCircle size={20} />
          </button>
          <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Settings">
            <Settings size={20} />
          </button>
        </div>
        <div className="relative">
          <button className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none" title="Notifications">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
        <div className="relative group">
          <div className="flex items-center cursor-pointer">
            <div className="hidden md:block mr-3 text-right">
              <p className="text-sm font-medium text-gray-800">Sarah Johnson</p>
              <p className="text-xs text-gray-500">Corporate Agent</p>
            </div>
            <div className="flex items-center">
              <UserCircle size={32} className="text-gray-500" />
              <ChevronDown size={16} className="ml-1 text-gray-500" />
            </div>
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Your Profile
            </a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Help & Support
            </a>
            <div className="border-t border-gray-100 my-1"></div>
            <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
              Sign out
            </a>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;