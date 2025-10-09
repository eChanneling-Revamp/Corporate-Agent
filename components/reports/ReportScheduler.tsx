import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Mail,
  Download,
  FileText,
  Send,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Filter,
  RefreshCw,
  Copy,
  Eye,
  Archive,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { format, addDays, addWeeks, addMonths } from 'date-fns'
import toast from 'react-hot-toast'

interface ScheduledReport {
  id: string
  name: string
  type: 'appointments' | 'revenue' | 'performance' | 'customer' | 'operational' | 'custom'
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  recipients: string[]
  filters: {
    dateRange?: string
    departments?: string[]
    agents?: string[]
    status?: string[]
    customFilters?: Record<string, any>
  }
  schedule: {
    startDate: Date
    endDate?: Date
    time: string
    daysOfWeek?: number[]
    dayOfMonth?: number
    timezone: string
  }
  status: 'active' | 'paused' | 'completed' | 'failed'
  lastRun?: Date
  nextRun?: Date
  createdBy: string
  createdAt: Date
  metadata: {
    includeCharts: boolean
    includeRawData: boolean
    compressionEnabled: boolean
    encryptionEnabled: boolean
    priority: 'low' | 'medium' | 'high'
  }
  history: Array<{
    runDate: Date
    status: 'success' | 'failed'
    duration: number
    fileSize: string
    recipients: number
    error?: string
  }>
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  icon: React.ReactNode
  defaultFilters: Record<string, any>
  availableFormats: string[]
  estimatedRunTime: string
}

interface ReportSchedulerProps {
  userRole: 'agent' | 'supervisor' | 'admin'
  userId: string
  onScheduleCreate?: (schedule: ScheduledReport) => void
  onScheduleUpdate?: (schedule: ScheduledReport) => void
  onScheduleDelete?: (scheduleId: string) => void
}

const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  userRole,
  userId,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete
}) => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')
  const [loading, setLoading] = useState(false)
  const [testRunning, setTestRunning] = useState<string | null>(null)

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'appointments',
      name: 'Appointment Summary',
      description: 'Daily appointment statistics and trends',
      type: 'appointments',
      icon: <Calendar className="h-5 w-5" />,
      defaultFilters: { dateRange: 'yesterday' },
      availableFormats: ['pdf', 'excel', 'csv'],
      estimatedRunTime: '2-3 minutes'
    },
    {
      id: 'revenue',
      name: 'Revenue Report',
      description: 'Financial performance and revenue analytics',
      type: 'revenue',
      icon: <DollarSign className="h-5 w-5" />,
      defaultFilters: { dateRange: 'last-month' },
      availableFormats: ['pdf', 'excel'],
      estimatedRunTime: '3-5 minutes'
    },
    {
      id: 'performance',
      name: 'Agent Performance',
      description: 'Individual and team performance metrics',
      type: 'performance',
      icon: <TrendingUp className="h-5 w-5" />,
      defaultFilters: { dateRange: 'last-week' },
      availableFormats: ['pdf', 'excel', 'csv'],
      estimatedRunTime: '4-6 minutes'
    },
    {
      id: 'customer',
      name: 'Customer Analytics',
      description: 'Customer satisfaction and interaction analysis',
      type: 'customer',
      icon: <Users className="h-5 w-5" />,
      defaultFilters: { dateRange: 'last-quarter' },
      availableFormats: ['pdf', 'excel'],
      estimatedRunTime: '5-7 minutes'
    },
    {
      id: 'operational',
      name: 'Operational Report',
      description: 'System usage and operational efficiency',
      type: 'operational',
      icon: <BarChart3 className="h-5 w-5" />,
      defaultFilters: { dateRange: 'last-month' },
      availableFormats: ['pdf', 'excel', 'json'],
      estimatedRunTime: '3-4 minutes'
    },
    {
      id: 'custom',
      name: 'Custom Report',
      description: 'Create a custom report with specific parameters',
      type: 'custom',
      icon: <Settings className="h-5 w-5" />,
      defaultFilters: {},
      availableFormats: ['pdf', 'excel', 'csv', 'json'],
      estimatedRunTime: 'Varies'
    }
  ]

  // Load mock scheduled reports
  useEffect(() => {
    const mockReports: ScheduledReport[] = [
      {
        id: 'SCH001',
        name: 'Daily Appointment Summary',
        type: 'appointments',
        frequency: 'daily',
        format: 'pdf',
        recipients: ['manager@echanneling.com', 'team@echanneling.com'],
        filters: {
          dateRange: 'yesterday',
          departments: ['Cardiology', 'Neurology']
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          time: '08:00',
          timezone: 'Asia/Colombo'
        },
        status: 'active',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000),
        createdBy: userId,
        createdAt: new Date('2024-01-01'),
        metadata: {
          includeCharts: true,
          includeRawData: false,
          compressionEnabled: true,
          encryptionEnabled: false,
          priority: 'medium'
        },
        history: [
          {
            runDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'success',
            duration: 145,
            fileSize: '2.4 MB',
            recipients: 2
          },
          {
            runDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
            status: 'success',
            duration: 132,
            fileSize: '2.2 MB',
            recipients: 2
          }
        ]
      },
      {
        id: 'SCH002',
        name: 'Weekly Revenue Analysis',
        type: 'revenue',
        frequency: 'weekly',
        format: 'excel',
        recipients: ['cfo@echanneling.com', 'accounting@echanneling.com'],
        filters: {
          dateRange: 'last-week'
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          time: '09:00',
          daysOfWeek: [1], // Monday
          timezone: 'Asia/Colombo'
        },
        status: 'active',
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        createdBy: userId,
        createdAt: new Date('2024-01-01'),
        metadata: {
          includeCharts: true,
          includeRawData: true,
          compressionEnabled: true,
          encryptionEnabled: true,
          priority: 'high'
        },
        history: [
          {
            runDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'success',
            duration: 287,
            fileSize: '5.1 MB',
            recipients: 2
          }
        ]
      },
      {
        id: 'SCH003',
        name: 'Monthly Performance Report',
        type: 'performance',
        frequency: 'monthly',
        format: 'pdf',
        recipients: ['hr@echanneling.com'],
        filters: {
          dateRange: 'last-month',
          agents: ['all']
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          time: '10:00',
          dayOfMonth: 1,
          timezone: 'Asia/Colombo'
        },
        status: 'paused',
        lastRun: new Date('2024-01-01'),
        nextRun: new Date('2024-02-01'),
        createdBy: userId,
        createdAt: new Date('2024-01-01'),
        metadata: {
          includeCharts: true,
          includeRawData: true,
          compressionEnabled: false,
          encryptionEnabled: false,
          priority: 'low'
        },
        history: []
      }
    ]

    if (userRole === 'admin' || userRole === 'supervisor') {
      setScheduledReports(mockReports)
    } else {
      // Agents can only see their own scheduled reports
      setScheduledReports(mockReports.filter(r => r.createdBy === userId))
    }
  }, [userId, userRole])

  // Calculate next run time
  const calculateNextRun = (schedule: ScheduledReport['schedule'], frequency: string): Date => {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)
    
    let nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun = addDays(nextRun, 1)
        }
        break
      case 'weekly':
        nextRun = addWeeks(nextRun, 1)
        break
      case 'monthly':
        nextRun = addMonths(nextRun, 1)
        break
      default:
        break
    }

    return nextRun
  }

  // Handle report actions
  const handleRunNow = async (reportId: string) => {
    setTestRunning(reportId)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    toast.success('Report generated successfully')
    setTestRunning(null)

    // Update last run time
    setScheduledReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              lastRun: new Date(),
              history: [
                {
                  runDate: new Date(),
                  status: 'success',
                  duration: Math.floor(Math.random() * 300) + 100,
                  fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
                  recipients: r.recipients.length
                },
                ...r.history
              ].slice(0, 10)
            }
          : r
      )
    )
  }

  const handleToggleStatus = (reportId: string) => {
    setScheduledReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
          : r
      )
    )
    toast.success('Report schedule updated')
  }

  const handleDuplicate = (report: ScheduledReport) => {
    const duplicated: ScheduledReport = {
      ...report,
      id: `SCH${Date.now()}`,
      name: `${report.name} (Copy)`,
      createdAt: new Date(),
      history: []
    }
    setScheduledReports(prev => [...prev, duplicated])
    toast.success('Report schedule duplicated')
  }

  const handleDelete = (reportId: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      setScheduledReports(prev => prev.filter(r => r.id !== reportId))
      if (onScheduleDelete) {
        onScheduleDelete(reportId)
      }
      toast.success('Report schedule deleted')
    }
  }

  // Filter reports
  const filteredReports = scheduledReports.filter(report => {
    if (filter === 'all') return true
    return report.status === filter
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Get frequency label
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'once': return 'One-time'
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'quarterly': return 'Quarterly'
      default: return frequency
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scheduled Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automate report generation and distribution
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Reports</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>

          {/* Create New */}
          {(userRole === 'admin' || userRole === 'supervisor') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Templates Grid */}
      {showCreateModal && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Report Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setEditingReport({
                    id: `SCH${Date.now()}`,
                    name: template.name,
                    type: template.type as any,
                    frequency: 'daily',
                    format: 'pdf',
                    recipients: [],
                    filters: template.defaultFilters,
                    schedule: {
                      startDate: new Date(),
                      time: '08:00',
                      timezone: 'Asia/Colombo'
                    },
                    status: 'active',
                    createdBy: userId,
                    createdAt: new Date(),
                    metadata: {
                      includeCharts: true,
                      includeRawData: false,
                      compressionEnabled: true,
                      encryptionEnabled: false,
                      priority: 'medium'
                    },
                    history: []
                  })
                  setShowCreateModal(false)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {template.estimatedRunTime}
                      </span>
                      <div className="flex items-center space-x-1">
                        {template.availableFormats.map((format) => (
                          <span
                            key={format}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateModal(false)}
            className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No scheduled reports found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create a new schedule to automate report generation
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      {report.metadata.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Frequency:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {getFrequencyLabel(report.frequency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-2 text-gray-900 font-medium uppercase">
                          {report.format}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Recipients:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {report.recipients.length} users
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Run:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {report.nextRun ? format(new Date(report.nextRun), 'MMM d, h:mm a') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Last Run Info */}
                    {report.lastRun && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-gray-600">
                                Last run: {format(new Date(report.lastRun), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            {report.history[0] && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                  {report.history[0].duration}s
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                  {report.history[0].fileSize}
                                </span>
                              </>
                            )}
                          </div>
                          {report.history.length > 0 && (
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              View History
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleRunNow(report.id)}
                      disabled={testRunning === report.id}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Run Now"
                    >
                      {testRunning === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(report.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={report.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {report.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingReport(report)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(report)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReportScheduler
