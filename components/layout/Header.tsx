import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../hooks/useSocket'
import NotificationDropdown from '../../components/common/NotificationDropdown'
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
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center min-w-0">
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu || toggleSidebar} 
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none lg:hidden" 
          title="Toggle menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Desktop sidebar toggle */}
        <button 
          onClick={toggleSidebar} 
          className="hidden lg:block p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none" 
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        
        <div className="ml-2 sm:ml-4 min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
            {getPageTitle()}
          </h1>
          <div className="hidden sm:flex items-center text-xs text-gray-500">
            <span>Home</span>
            <span className="mx-1">/</span>
            <span className="truncate">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
        {/* Search - hidden on small screens */}
        <div className="hidden xl:flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-48 xl:w-64">
          <Search size={18} className="text-gray-500" />
          <input 
            type="text" 
            placeholder="Global search..." 
            className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full" 
          />
        </div>

        {/* Quick actions - show only help on mobile */}
        <div className="hidden sm:flex items-center space-x-1">
          <Link href="/help-support" className="p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Help">
            <HelpCircle size={18} />
          </Link>
          <Link href="/settings" className="hidden md:block p-2 rounded-md text-gray-600 hover:bg-gray-100" title="Settings">
            <Settings size={18} />
          </Link>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors" 
            title="Notifications"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} className={unreadCount > 0 ? 'animate-pulse' : ''} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={markAsRead}
              onClearAll={clearAll}
            />
          )}
        </div>

        {/* User Profile */}
        <div className="relative group">
          <div className="flex items-center cursor-pointer p-1 sm:p-2 rounded-md hover:bg-gray-100">
            <div className="hidden sm:block mr-2 sm:mr-3 text-right">
              <p className="text-sm font-medium text-gray-800 truncate max-w-20 sm:max-w-none">{user?.name || 'Agent'}</p>
              <p className="text-xs text-gray-500 hidden md:block">Corporate Agent</p>
            </div>
            <div className="flex items-center">
              <UserCircle size={28} className="sm:w-8 sm:h-8 text-gray-500" />
              <ChevronDown size={14} className="ml-1 text-gray-500 hidden sm:block" />
            </div>
          </div>
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
            <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
              <p className="text-sm font-medium text-gray-800">{user?.name || 'Agent'}</p>
              <p className="text-xs text-gray-500">Corporate Agent</p>
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