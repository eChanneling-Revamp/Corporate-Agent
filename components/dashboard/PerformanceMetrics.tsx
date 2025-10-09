import React from 'react'
import { Target, Award, Clock, CheckCircle2 } from 'lucide-react'

interface MetricItem {
  label: string
  value: number
  target: number
  unit: string
  icon: React.ReactNode
  color: string
}

const PerformanceMetrics: React.FC = () => {
  const metrics: MetricItem[] = [
    {
      label: 'Booking Success Rate',
      value: 94.2,
      target: 95,
      unit: '%',
      icon: <CheckCircle2 size={20} />,
      color: 'green'
    },
    {
      label: 'Average Response Time',
      value: 2.3,
      target: 3,
      unit: 'min',
      icon: <Clock size={20} />,
      color: 'blue'
    },
    {
      label: 'Customer Satisfaction',
      value: 4.7,
      target: 4.5,
      unit: '/5',
      icon: <Award size={20} />,
      color: 'purple'
    },
    {
      label: 'Monthly Target Achievement',
      value: 87,
      target: 100,
      unit: '%',
      icon: <Target size={20} />,
      color: 'amber'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; progress: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-600', progress: 'bg-green-500' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', progress: 'bg-purple-500' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', progress: 'bg-amber-500' }
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Metrics</h3>
        <p className="text-sm text-gray-500 mt-1">Track your key performance indicators</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const colorClasses = getColorClasses(metric.color)
          const percentage = (metric.value / metric.target) * 100
          const isOnTarget = metric.value >= metric.target

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">{metric.label}</p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </span>
                    <span className="text-sm text-gray-500">{metric.unit}</span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                  {metric.icon}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span className={isOnTarget ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                    Target: {metric.target}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colorClasses.progress}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isOnTarget && (
                  <p className="text-xs text-green-600 font-medium">✓ Target achieved!</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PerformanceMetrics
