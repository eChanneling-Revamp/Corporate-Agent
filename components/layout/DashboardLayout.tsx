import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastContainer } from '../../store/Toast'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto transition-transform duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:w-16 xl:w-20' : 'lg:w-64 xl:w-72 2xl:w-64'
      }`}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          toggleMobileMenu={toggleMobileMenu}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6 bg-gray-50">
          <div className="max-w-full mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
      
      <ToastContainer />
    </div>
  )
}

export default DashboardLayout