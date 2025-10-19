import React, { useState, useEffect, useMemo } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Filter, 
  Search,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Target
} from 'lucide-react'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  assignedTo: string
  createdAt: Date
  dueDate: Date
  category: string
  customerId?: string
  customerName?: string
  tags: string[]
  completionRate: number
  attachments?: number
  comments?: number
}

interface TaskManagementProps {
  userId: string
  userRole: 'agent' | 'supervisor' | 'admin'
  onTaskUpdate?: (task: Task) => void
}

const TaskManagement: React.FC<TaskManagementProps> = ({ userId, userRole, onTaskUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Mock data generation
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: 'TSK001',
        title: 'Process appointment cancellation request',
        description: 'Customer requested cancellation for appointment APT-2024-001',
        priority: 'high',
        status: 'in-progress',
        assignedTo: userId,
        createdAt: new Date('2024-01-10'),
        dueDate: new Date('2024-01-15'),
        category: 'Appointment',
        customerId: 'CUST001',
        customerName: 'John Silva',
        tags: ['urgent', 'cancellation'],
        completionRate: 60,
        attachments: 2,
        comments: 3
      },
      {
        id: 'TSK002',
        title: 'Follow up on payment issue',
        description: 'Payment failed for booking ID BK-2024-123',
        priority: 'critical',
        status: 'pending',
        assignedTo: userId,
        createdAt: new Date('2024-01-12'),
        dueDate: new Date('2024-01-13'),
        category: 'Payment',
        customerId: 'CUST002',
        customerName: 'Mary Fernando',
        tags: ['payment', 'follow-up'],
        completionRate: 0,
        attachments: 1,
        comments: 5
      },
      {
        id: 'TSK003',
        title: 'Update doctor availability',
        description: 'Dr. Chen requested schedule change for next week',
        priority: 'medium',
        status: 'completed',
        assignedTo: userId,
        createdAt: new Date('2024-01-08'),
        dueDate: new Date('2024-01-12'),
        category: 'Schedule',
        tags: ['doctor', 'schedule'],
        completionRate: 100,
        attachments: 0,
        comments: 2
      },
      {
        id: 'TSK004',
        title: 'Verify insurance details',
        description: 'Verify insurance coverage for patient ID PAT-567',
        priority: 'low',
        status: 'pending',
        assignedTo: userId,
        createdAt: new Date('2024-01-11'),
        dueDate: new Date('2024-01-18'),
        category: 'Insurance',
        customerId: 'CUST003',
        customerName: 'David Perera',
        tags: ['insurance', 'verification'],
        completionRate: 25,
        attachments: 3,
        comments: 1
      },
      {
        id: 'TSK005',
        title: 'Resolve complaint ticket',
        description: 'Customer complaint about long wait time',
        priority: 'high',
        status: 'overdue',
        assignedTo: userId,
        createdAt: new Date('2024-01-09'),
        dueDate: new Date('2024-01-11'),
        category: 'Complaint',
        customerId: 'CUST004',
        customerName: 'Lisa Jayawardena',
        tags: ['complaint', 'urgent'],
        completionRate: 40,
        attachments: 1,
        comments: 8
      }
    ]
    
    setTasks(mockTasks)
    setFilteredTasks(mockTasks)
  }, [userId])

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks]

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus)
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority)
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'status':
          const statusOrder = { overdue: 0, pending: 1, 'in-progress': 2, completed: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        default: // dueDate
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
    })

    setFilteredTasks(filtered)
  }, [tasks, filterStatus, filterPriority, searchQuery, sortBy])

  // Statistics
  const statistics = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const overdue = tasks.filter(t => t.status === 'overdue').length
    const critical = tasks.filter(t => t.priority === 'critical').length
    const high = tasks.filter(t => t.priority === 'high').length
    
    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      critical,
      high,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [tasks])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleQuickAction = (taskId: string, action: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    switch (action) {
      case 'complete':
        task.status = 'completed'
        task.completionRate = 100
        break
      case 'archive':
        // Archive logic
        break
      case 'delete':
        setTasks(tasks.filter(t => t.id !== taskId))
        return
    }

    if (onTaskUpdate) {
      onTaskUpdate(task)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.completionRate}% completed
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">Active now</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical/High</p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.critical + statistics.high}
              </p>
              <p className="text-xs text-gray-500 mt-1">Priority tasks</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Flag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Calendar
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List View */}
      {view === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {task.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.attachments && task.attachments > 0 && (
                              <span className="text-xs text-gray-500">
                                📎 {task.attachments}
                              </span>
                            )}
                            {task.comments && task.comments > 0 && (
                              <span className="text-xs text-gray-500">
                                💬 {task.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {task.customerName ? (
                        <div>
                          <p className="text-sm text-gray-900">{task.customerName}</p>
                          <p className="text-xs text-gray-500">{task.customerId}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(task.dueDate), 'h:mm a')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{task.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              task.completionRate === 100 ? 'bg-green-500' :
                              task.completionRate >= 70 ? 'bg-blue-500' :
                              task.completionRate >= 30 ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${task.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleQuickAction(task.id, 'complete')}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Complete"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction(task.id, 'archive')}
                          className="text-gray-600 hover:text-gray-800"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        {userRole !== 'agent' && (
                          <button
                            onClick={() => handleQuickAction(task.id, 'delete')}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {['pending', 'in-progress', 'overdue', 'completed'].map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {status.replace('-', ' ')}
                </h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  {filteredTasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredTasks
                  .filter(t => t.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1">
                          {task.title}
                        </p>
                        <span className={`ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority[0].toUpperCase()}
                        </span>
                      </div>
                      {task.customerName && (
                        <p className="text-xs text-gray-600 mb-2">
                          <User className="h-3 w-3 inline mr-1" />
                          {task.customerName}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </p>
                        <div className="flex items-center space-x-1">
                          {task.attachments && task.attachments > 0 && (
                            <span className="text-xs text-gray-500">📎</span>
                          )}
                          {task.comments && task.comments > 0 && (
                            <span className="text-xs text-gray-500">💬</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${task.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskManagement
