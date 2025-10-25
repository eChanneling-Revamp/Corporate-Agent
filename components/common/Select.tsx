import React, { useState } from 'react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            isOpen,
            setIsOpen
          })
        }
        return child
      })}
    </div>
  )
}

export const SelectTrigger: React.FC<SelectTriggerProps & { value?: string; isOpen?: boolean; setIsOpen?: (open: boolean) => void }> = ({ 
  className = '', 
  children, 
  value,
  isOpen,
  setIsOpen
}) => {
  return (
    <button
      type="button"
      className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      onClick={() => setIsOpen?.(!isOpen)}
    >
      {children}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export const SelectContent: React.FC<SelectContentProps & { isOpen?: boolean; onValueChange?: (value: string) => void; setIsOpen?: (open: boolean) => void }> = ({ 
  children, 
  isOpen, 
  onValueChange, 
  setIsOpen 
}) => {
  if (!isOpen) return null

  return (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      <div className="py-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setIsOpen
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

export const SelectItem: React.FC<SelectItemProps & { onValueChange?: (value: string) => void; setIsOpen?: (open: boolean) => void }> = ({ 
  value, 
  children, 
  onValueChange, 
  setIsOpen 
}) => {
  return (
    <button
      type="button"
      className="w-full px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
      onClick={() => {
        onValueChange?.(value)
        setIsOpen?.(false)
      }}
    >
      {children}
    </button>
  )
}

export const SelectValue: React.FC<SelectValueProps & { value?: string }> = ({ placeholder, value }) => {
  return (
    <span className="block truncate">
      {value || placeholder}
    </span>
  )
}