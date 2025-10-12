import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  Search, 
  UserCircle, 
  HelpCircle, 
  Settings, 
  LogOut 
} from 'lucide-react'

interface HeaderProps {
  toggleSidebar: () => void
  toggleMobileMenu?: () => void
  mobileMenuOpen?: boolean
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, toggleMobileMenu, mobileMenuOpen }) => {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Function to get page title based on current path
  const getPageTitle = () => {
    switch (router.pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/doctor-search':
        return 'Doctor Search & Booking'
      case '/appointments':
        return 'Appointment Management'
      case '/bulk-booking':
        return 'Bulk Appointment Booking'
      case '/acb-confirmation':
        return 'ACB Confirmation'
      case '/payments':
        return 'Payment Management'
      case '/reports':
        return 'Reports & Analytics'
      case '/settings':
        return 'Profile & Settings'
      case '/support':
        return 'Help & Support'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-2 sm:px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center min-w-0 flex-1">
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu || toggleSidebar} 
          className="p-1.5 sm:p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none lg:hidden" 
          title="Toggle menu"
        >
          <Menu size={18} className="sm:w-5 sm:h-5" />
        </button>
        
        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden lg:block p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none" 
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        
        <div className="ml-1 sm:ml-2 lg:ml-4 min-w-0 flex-1">
          <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 truncate">
            {getPageTitle()}
          </h1>
          <div className="hidden md:flex items-center text-xs text-gray-500 mt-0.5">
            <span>Home</span>
            <span className="mx-1">/</span>
            <span className="truncate">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
        {/* Search - responsive sizing */}
        <div className="hidden lg:flex items-center bg-gray-100 rounded-md px-2 sm:px-3 py-1.5 w-32 lg:w-48 xl:w-64">
          <Search size={16} className="text-gray-500 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full min-w-0" 
          />
        </div>

        {/* Quick actions - responsive visibility */}
        <div className="hidden sm:flex items-center space-x-0.5 sm:space-x-1">
          <Link href="/help-support" className="p-1.5 sm:p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Help">
            <HelpCircle size={16} className="sm:w-4 sm:h-4" />
          </Link>
          <Link href="/settings" className="hidden lg:block p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Settings">
            <Settings size={16} />
          </Link>
        </div>

        {/* Notifications - responsive sizing */}
        <div className="relative">
          <button 
            className="relative p-1.5 sm:p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none" 
            title="Notifications"
          >
            <Bell size={16} className="sm:w-4 sm:h-4" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        {/* User Profile - responsive design */}
        <div className="relative group">
          <div className="flex items-center cursor-pointer p-1 sm:p-1.5 lg:p-2 rounded-md hover:bg-gray-100">
            <div className="hidden md:block mr-1 lg:mr-3 text-right min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-800 truncate max-w-16 lg:max-w-none">{user?.name || 'Ojitha Rajapaksha'}</p>
              <p className="text-xs text-gray-500 hidden lg:block">Sri Lanka Telecom</p>
            </div>
            <div className="flex items-center">
              <UserCircle size={24} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-500" />
              <ChevronDown size={12} className="ml-0.5 sm:ml-1 text-gray-500 hidden sm:block" />
            </div>
          </div>
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
            <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
              <p className="text-sm font-medium text-gray-800">{user?.name || 'Ojitha Rajapaksha'}</p>
              <p className="text-xs text-gray-500">Sri Lanka Telecom</p>
            </div>
            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Your Profile
            </Link>
            <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </Link>
            <Link href="/help-support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Help & Support
            </Link>
            <div className="border-t border-gray-100 my-1"></div>
            <button 
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header