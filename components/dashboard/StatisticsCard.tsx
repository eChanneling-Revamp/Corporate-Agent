import React from 'react'

interface StatisticsCardProps {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
  bgColor: string
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  bgColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 mb-1 truncate leading-tight">{title}</p>
          <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-gray-800 leading-tight">{value}</h3>
        </div>
        <div className={`p-1.5 sm:p-2 rounded-full ${bgColor} flex-shrink-0 ml-1`}>
          <div className="w-4 h-4 sm:w-5 sm:h-5">{icon}</div>
        </div>
      </div>
      <div className="mt-1.5 sm:mt-2 lg:mt-3">
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500 ml-1 hidden sm:inline">vs last week</span>
        <span className="text-xs text-gray-500 ml-1 sm:hidden">vs last</span>
      </div>
    </div>
  )
}

export default StatisticsCard