import React, { useState } from 'react'

interface TabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab
          })
        }
        return child
      })}
    </div>
  )
}

export const TabsList: React.FC<TabsListProps & { activeTab?: string; setActiveTab?: (tab: string) => void }> = ({ 
  children, 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab
          })
        }
        return child
      })}
    </div>
  )
}

export const TabsTrigger: React.FC<TabsTriggerProps & { activeTab?: string; setActiveTab?: (tab: string) => void }> = ({ 
  value, 
  children, 
  activeTab, 
  setActiveTab 
}) => {
  const isActive = activeTab === value

  return (
    <button
      type="button"
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-white text-blue-600 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      }`}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  )
}

export const TabsContent: React.FC<TabsContentProps & { activeTab?: string }> = ({ 
  value, 
  className = '', 
  children, 
  activeTab 
}) => {
  if (activeTab !== value) return null

  return (
    <div className={className}>
      {children}
    </div>
  )
}