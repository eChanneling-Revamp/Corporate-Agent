import { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Bell,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Send,
  Filter,
  Search,
  Eye,
  Download
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'

interface FollowUpTask {
  id: string
  patientId: string
  patientName: string
  type: 'appointment-reminder' | 'follow-up-call' | 'medication-check' | 'test-result' | 'general-follow-up'
  title: string
  description: string
  scheduledDate: string
  scheduledTime: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'missed' | 'cancelled'
  assignedAgent: string
  contactMethod: 'phone' | 'email' | 'sms' | 'in-person'
  lastAttempt?: string
  attempts: number
  maxAttempts: number
  notes: string[]
  createdDate: string
  completedDate?: string
  originalAppointmentId?: string
  doctorName?: string
  hospitalName?: string
  remindersSent: number
}

interface ReminderTemplate {
  id: string
  name: string
  type: string
  subject: string
  message: string
  timing: number // hours before appointment
  method: 'email' | 'sms' | 'phone'
}

export default function FollowUpScheduling() {
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([])
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null)
  const [newTask, setNewTask] = useState({
    patientId: '',
    patientName: '',
    type: 'general-follow-up',
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'medium',
    contactMethod: 'phone',
    assignedAgent: 'Current Agent'
  })

  // Mock data
  useEffect(() => {
    const mockFollowUpTasks: FollowUpTask[] = [
      {
        id: 'FU001',
        patientId: 'PAT001',
        patientName: 'John Doe',
        type: 'appointment-reminder',
        title: 'Cardiology Follow-up Reminder',
        description: 'Remind patient about upcoming cardiology appointment with Dr. James Miller',
        scheduledDate: '2025-11-20',
        scheduledTime: '10:00',
        priority: 'high',
        status: 'pending',
        assignedAgent: 'Sarah Johnson',
        contactMethod: 'phone',
        attempts: 0,
        maxAttempts: 3,
        notes: [],
        createdDate: '2025-10-15',
        originalAppointmentId: 'APT001',
        doctorName: 'Dr. James Miller',
        hospitalName: 'Lanka Hospital',
        remindersSent: 1
      },
      {
        id: 'FU002',
        patientId: 'PAT002',
        patientName: 'Jane Smith',
        type: 'medication-check',
        title: 'Asthma Medication Follow-up',
        description: 'Check on patient compliance with new asthma medication',
        scheduledDate: '2025-11-18',
        scheduledTime: '14:30',
        priority: 'medium',
        status: 'in-progress',
        assignedAgent: 'Mike Chen',
        contactMethod: 'phone',
        lastAttempt: '2025-11-17',
        attempts: 1,
        maxAttempts: 3,
        notes: ['Patient answered, reported slight side effects', 'Advised to continue medication and monitor'],
        createdDate: '2025-10-20',
        remindersSent: 0
      },
      {
        id: 'FU003',
        patientId: 'PAT003',
        patientName: 'Robert Johnson',
        type: 'test-result',
        title: 'Lab Results Discussion',
        description: 'Discuss recent blood test results and next steps',
        scheduledDate: '2025-11-15',
        scheduledTime: '11:00',
        priority: 'urgent',
        status: 'completed',
        assignedAgent: 'Lisa Wong',
        contactMethod: 'phone',
        lastAttempt: '2025-11-15',
        attempts: 1,
        maxAttempts: 2,
        notes: ['Results discussed with patient', 'Follow-up appointment scheduled', 'Patient satisfied with explanation'],
        createdDate: '2025-11-10',
        completedDate: '2025-11-15',
        remindersSent: 2
      },
      {
        id: 'FU004',
        patientId: 'PAT004',
        patientName: 'Emily Davis',
        type: 'follow-up-call',
        title: 'Post-Surgery Check',
        description: 'Follow-up call after minor surgery to check recovery',
        scheduledDate: '2025-11-25',
        scheduledTime: '15:00',
        priority: 'high',
        status: 'pending',
        assignedAgent: 'David Kim',
        contactMethod: 'phone',
        attempts: 0,
        maxAttempts: 3,
        notes: [],
        createdDate: '2025-11-05',
        remindersSent: 0
      },
      {
        id: 'FU005',
        patientId: 'PAT005',
        patientName: 'Michael Wilson',
        type: 'appointment-reminder',
        title: 'Diabetes Management Appointment',
        description: 'Reminder for quarterly diabetes check-up',
        scheduledDate: '2025-11-12',
        scheduledTime: '09:30',
        priority: 'medium',
        status: 'missed',
        assignedAgent: 'Sarah Johnson',
        contactMethod: 'phone',
        lastAttempt: '2025-11-12',
        attempts: 3,
        maxAttempts: 3,
        notes: ['No answer - left voicemail', 'No answer - sent SMS', 'No answer - marked as missed'],
        createdDate: '2025-11-01',
        doctorName: 'Dr. Michael Brown',
        hospitalName: 'Apollo Hospital',
        remindersSent: 2
      }
    ]

    const mockReminderTemplates: ReminderTemplate[] = [
      {
        id: 'RT001',
        name: 'Standard Appointment Reminder',
        type: 'appointment-reminder',
        subject: 'Appointment Reminder - {doctorName}',
        message: 'Dear {patientName}, this is a reminder of your appointment with {doctorName} on {appointmentDate} at {appointmentTime}. Please confirm your attendance.',
        timing: 24,
        method: 'sms'
      },
      {
        id: 'RT002',
        name: 'Follow-up Call Template',
        type: 'follow-up-call',
        subject: 'Follow-up Call Scheduled',
        message: 'Hello {patientName}, we have scheduled a follow-up call for {scheduledDate} to check on your progress. Our team will contact you at {contactTime}.',
        timing: 48,
        method: 'email'
      },
      {
        id: 'RT003',
        name: 'Medication Reminder',
        type: 'medication-check',
        subject: 'Medication Check Reminder',
        message: 'Hi {patientName}, please remember to take your prescribed medication as directed. If you have any questions or concerns, please contact us.',
        timing: 12,
        method: 'sms'
      }
    ]

    setTimeout(() => {
      setFollowUpTasks(mockFollowUpTasks)
      setReminderTemplates(mockReminderTemplates)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTasks = followUpTasks.filter(task => {
    const matchesSearch = 
      task.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || task.status === statusFilter
    const matchesPriority = !priorityFilter || task.priority === priorityFilter
    const matchesType = !typeFilter || task.type === typeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment-reminder': return <Calendar className="h-4 w-4" />
      case 'follow-up-call': return <Phone className="h-4 w-4" />
      case 'medication-check': return <Bell className="h-4 w-4" />
      case 'test-result': return <AlertTriangle className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const handleCreateTask = () => {
    const task: FollowUpTask = {
      id: `FU${String(followUpTasks.length + 1).padStart(3, '0')}`,
      ...newTask,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      notes: [],
      createdDate: new Date().toISOString().split('T')[0],
      remindersSent: 0
    } as FollowUpTask

    setFollowUpTasks([...followUpTasks, task])
    setShowCreateModal(false)
    setNewTask({
      patientId: '',
      patientName: '',
      type: 'general-follow-up',
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      priority: 'medium',
      contactMethod: 'phone',
      assignedAgent: 'Current Agent'
    })
    toast.success('Follow-up task created successfully')
  }

  const handleCompleteTask = (taskId: string) => {
    setFollowUpTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', completedDate: new Date().toISOString().split('T')[0] }
          : task
      )
    )
    toast.success('Task marked as completed')
  }

  const handleAddNote = (taskId: string, note: string) => {
    setFollowUpTasks(tasks =>
      tasks.map(task =>
        task.id === taskId
          ? { ...task, notes: [...task.notes, `${new Date().toLocaleString()}: ${note}`] }
          : task
      )
    )
    toast.success('Note added successfully')
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading follow-up scheduling...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Follow-up Scheduling</title>
        <meta name="description" content="Automated follow-up scheduling and patient communication management" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Follow-up Scheduling</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage patient follow-ups, reminders, and automated communications
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={() => toast.success('Exporting follow-up data...')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Follow-up
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {followUpTasks.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {followUpTasks.filter(t => t.status === 'completed' && t.completedDate === new Date().toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {followUpTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Send className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reminders Sent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {followUpTasks.reduce((sum, task) => sum + task.remindersSent, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'tasks', name: 'Follow-up Tasks' },
                  { id: 'templates', name: 'Reminder Templates' },
                  { id: 'calendar', name: 'Calendar View' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="missed">Missed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="appointment-reminder">Appointment Reminder</option>
                        <option value="follow-up-call">Follow-up Call</option>
                        <option value="medication-check">Medication Check</option>
                        <option value="test-result">Test Result</option>
                        <option value="general-follow-up">General Follow-up</option>
                      </select>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getTypeIcon(task.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                <div>
                                  <span className="font-medium">Patient:</span> {task.patientName}
                                </div>
                                <div>
                                  <span className="font-medium">Scheduled:</span> {task.scheduledDate} at {task.scheduledTime}
                                </div>
                                <div>
                                  <span className="font-medium">Assigned:</span> {task.assignedAgent}
                                </div>
                                <div>
                                  <span className="font-medium">Contact Method:</span> {task.contactMethod}
                                </div>
                                <div>
                                  <span className="font-medium">Attempts:</span> {task.attempts}/{task.maxAttempts}
                                </div>
                                <div>
                                  <span className="font-medium">Reminders Sent:</span> {task.remindersSent}
                                </div>
                              </div>
                              
                              {task.notes.length > 0 && (
                                <div className="mt-3">
                                  <h6 className="font-medium text-gray-900 text-sm mb-1">Notes:</h6>
                                  <div className="space-y-1">
                                    {task.notes.slice(-2).map((note, index) => (
                                      <p key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                                        {note}
                                      </p>
                                    ))}
                                    {task.notes.length > 2 && (
                                      <p className="text-xs text-gray-400">
                                        ... and {task.notes.length - 2} more notes
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => toast.success('Edit task functionality coming soon')}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Reminder Templates</h3>
                    <button
                      onClick={() => toast.success('Create template functionality coming soon')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Create Template
                    </button>
                  </div>
                  
                  {reminderTemplates.map((template) => (
                    <div key={template.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {template.method}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><span className="font-medium">Type:</span> {template.type}</div>
                            <div><span className="font-medium">Timing:</span> {template.timing} hours before</div>
                            <div><span className="font-medium">Subject:</span> {template.subject}</div>
                            <div className="mt-2">
                              <span className="font-medium">Message:</span>
                              <div className="mt-1 p-2 bg-white rounded border text-sm">
                                {template.message}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toast.success('Edit template functionality coming soon')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.success('Delete template functionality coming soon')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Calendar View</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Calendar integration coming soon for better task visualization.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Create Task Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create Follow-up Task</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                      <input
                        type="text"
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newTask.patientName}
                        onChange={(e) => setNewTask({...newTask, patientName: e.target.value})}
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Task Type</label>
                      <select
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newTask.type}
                        onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                      >
                        <option value="general-follow-up">General Follow-up</option>
                        <option value="appointment-reminder">Appointment Reminder</option>
                        <option value="follow-up-call">Follow-up Call</option>
                        <option value="medication-check">Medication Check</option>
                        <option value="test-result">Test Result</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 rows-3"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newTask.scheduledDate}
                          onChange={(e) => setNewTask({...newTask, scheduledDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                          type="time"
                          className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newTask.scheduledTime}
                          onChange={(e) => setNewTask({...newTask, scheduledTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Method</label>
                      <select
                        className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newTask.contactMethod}
                        onChange={(e) => setNewTask({...newTask, contactMethod: e.target.value})}
                      >
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="in-person">In Person</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}