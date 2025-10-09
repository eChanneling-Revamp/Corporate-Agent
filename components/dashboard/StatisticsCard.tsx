import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatisticsCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
  bgColor: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
  subtitle?: string
  onClick?: () => void
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  bgColor,
  trend,
  loading = false,
  subtitle,
  onClick
}) => {
  const [animatedValue, setAnimatedValue] = useState('0')
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Animate number on mount
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const getTrendIcon = () => {
    if (trend === 'up' || isPositive) return <TrendingUp size={12} className="inline" />
    if (trend === 'down' || !isPositive) return <TrendingDown size={12} className="inline" />
    return <Minus size={12} className="inline" />
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
      } ${isHovered ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate font-medium">{title}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 transition-all duration-500">
                {animatedValue}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl ${bgColor} flex-shrink-0 transition-transform duration-300 ${
              isHovered ? 'scale-110' : ''
            }`}>
              {icon}
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className={`text-xs font-semibold flex items-center space-x-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {getTrendIcon()}
                <span>{change}</span>
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StatisticsCard