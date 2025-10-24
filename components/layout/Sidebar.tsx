import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Search, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  User,
  Users,
  CheckCircle,
  Heart,
  MessageSquare,
  FileText,
  UserCheck
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const router = useRouter()
  const { user, logout } = useAuth()

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      name: 'Doctor Search',
      path: '/doctor-search',
      icon: <Search size={20} />
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: <Heart size={20} />
    },
    {
      name: 'Support Tickets',
      path: '/support-tickets',
      icon: <MessageSquare size={20} />
    },
    {
      name: 'Patient History',
      path: '/patient-history',
      icon: <FileText size={20} />
    },
    {
      name: 'Follow-up Scheduling',
      path: '/follow-up-scheduling',
      icon: <Calendar size={20} />
    },
    {
      name: 'Approval Workflows',
      path: '/approval-workflows',
      icon: <UserCheck size={20} />
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: <Calendar size={20} />
    },
    {
      name: 'Bulk Booking',
      path: '/bulk-booking',
      icon: <Users size={20} />
    },
    {
      name: 'ACB Confirmation',
      path: '/acb-confirmation',
      icon: <CheckCircle size={20} />
    },
    {
      name: 'Payments',
      path: '/payments',
      icon: <CreditCard size={20} />
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 size={20} />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings size={20} />
    },
    {
      name: 'Help & Support',
      path: '/help-support',
      icon: <HelpCircle size={20} />
    }
  ]

  const isActive = (path: string) => {
    return router.pathname === path
  }

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
      collapsed ? 'w-20' : 'w-64'
    } h-full flex flex-col shadow-lg lg:shadow-none`}>
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center justify-center w-full">
          {!collapsed ? (
            <Image
              src="/logo.png"
              alt="eChanneling Logo"
              width={120}
              height={40}
              className="object-contain hover:opacity-80 transition-opacity"
              priority
            />
          ) : (
            <Image
              src="/logo.png"
              alt="eChanneling"
              width={32}
              height={32}
              className="object-contain hover:opacity-80 transition-opacity"
              priority
            />
          )}
        </Link>
      </div>
      
      <div className="py-4 flex-1 overflow-y-auto">
        <div className={`px-4 py-2 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <p className="text-xs uppercase font-medium text-gray-500">
              Main Menu
            </p>
          )}
        </div>
        
        <nav className="mt-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 ${
                isActive(item.path)
                  ? 'text-blue-700 bg-blue-50 border-r-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-700" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">
                  {user?.name || 'Agent'}
                </p>
                <p className="text-xs text-gray-500">Corporate Agent</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={logout}
              className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200"
            >
              <LogOut size={20} className="text-blue-700" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar