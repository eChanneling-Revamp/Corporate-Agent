import { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Send,
  Eye,
  Edit,
  Plus,
  Filter,
  Search,
  Download,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  DollarSign
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'

interface ApprovalRequest {
  id: string
  type: 'appointment' | 'billing' | 'refund' | 'special-request' | 'policy-exception' | 'bulk-booking'
  title: string
  description: string
  requestedBy: string
  requestedDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'on-hold'
  currentApprover: string
  nextApprover?: string
  approvalLevel: number
  maxApprovalLevel: number
  estimatedValue?: number
  customerName?: string
  doctorName?: string
  hospitalName?: string
  appointmentDate?: string
  comments: ApprovalComment[]
  attachments: string[]
  deadlineDate: string
  escalationHistory: EscalationRecord[]
  businessJustification: string
  impactAssessment: string
}

interface ApprovalComment {
  id: string
  userId: string
  userName: string
  comment: string
  timestamp: string
  action: 'comment' | 'approve' | 'reject' | 'escalate' | 'request-info'
}

interface EscalationRecord {
  id: string
  fromLevel: number
  toLevel: number
  escalatedBy: string
  escalatedTo: string
  reason: string
  timestamp: string
}

interface ApprovalWorkflow {
  id: string
  name: string
  type: string
  levels: ApprovalLevel[]
  conditions: WorkflowCondition[]
  active: boolean
  createdDate: string
}

interface ApprovalLevel {
  level: number
  name: string
  approvers: string[]
  required: number // minimum number of approvals needed
  autoEscalationHours: number
  canReject: boolean
}

interface WorkflowCondition {
  id: string
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: string
  action: 'assign_workflow' | 'skip_level' | 'auto_approve'
}

export default function ApprovalWorkflows() {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false)
  const [newComment, setNewComment] = useState('')

  // Mock data
  useEffect(() => {
    const mockApprovalRequests: ApprovalRequest[] = [
      {
        id: 'AR001',
        type: 'billing',
        title: 'Billing Exception Request',
        description: 'Request for billing adjustment due to insurance coverage dispute',
        requestedBy: 'John Agent',
        requestedDate: '2025-11-15',
        priority: 'high',
        status: 'pending',
        currentApprover: 'Sarah Manager',
        nextApprover: 'David Director',
        approvalLevel: 1,
        maxApprovalLevel: 2,
        estimatedValue: 2500,
        customerName: 'John Doe',
        businessJustification: 'Customer has valid insurance claim that was initially rejected due to coding error',
        impactAssessment: 'Medium financial impact, high customer satisfaction impact',
        comments: [
          {
            id: 'C001',
            userId: 'UA001',
            userName: 'John Agent',
            comment: 'Customer provided additional documentation supporting the claim',
            timestamp: '2025-11-15T10:30:00',
            action: 'comment'
          }
        ],
        attachments: ['insurance_claim.pdf', 'medical_records.pdf'],
        deadlineDate: '2025-11-20',
        escalationHistory: []
      },
      {
        id: 'AR002',
        type: 'appointment',
        title: 'Emergency Appointment Override',
        description: 'Request to override booking limits for urgent cardiac consultation',
        requestedBy: 'Lisa Wong',
        requestedDate: '2025-11-14',
        priority: 'urgent',
        status: 'approved',
        currentApprover: 'Michael Director',
        approvalLevel: 2,
        maxApprovalLevel: 2,
        customerName: 'Robert Johnson',
        doctorName: 'Dr. James Miller',
        hospitalName: 'Lanka Hospital',
        appointmentDate: '2025-11-16',
        businessJustification: 'Patient experiencing chest pain and requires immediate consultation',
        impactAssessment: 'Critical patient safety issue requiring immediate attention',
        comments: [
          {
            id: 'C002',
            userId: 'SM001',
            userName: 'Sarah Manager',
            comment: 'Approved at level 1 due to medical urgency',
            timestamp: '2025-11-14T14:20:00',
            action: 'approve'
          },
          {
            id: 'C003',
            userId: 'MD001',
            userName: 'Michael Director',
            comment: 'Final approval granted. Ensure proper documentation.',
            timestamp: '2025-11-14T15:45:00',
            action: 'approve'
          }
        ],
        attachments: ['medical_emergency_note.pdf'],
        deadlineDate: '2025-11-16',
        escalationHistory: []
      },
      {
        id: 'AR003',
        type: 'refund',
        title: 'Service Refund Request',
        description: 'Customer requesting refund due to cancelled appointment by hospital',
        requestedBy: 'Mike Chen',
        requestedDate: '2025-11-13',
        priority: 'medium',
        status: 'escalated',
        currentApprover: 'David Director',
        approvalLevel: 2,
        maxApprovalLevel: 3,
        estimatedValue: 500,
        customerName: 'Emily Davis',
        businessJustification: 'Hospital cancelled appointment last minute, customer incurred travel costs',
        impactAssessment: 'Low financial impact, maintaining customer goodwill',
        comments: [
          {
            id: 'C004',
            userId: 'MC001',
            userName: 'Mike Chen',
            comment: 'Customer is frustrated and threatening to switch providers',
            timestamp: '2025-11-13T09:15:00',
            action: 'comment'
          },
          {
            id: 'C005',
            userId: 'SM001',
            userName: 'Sarah Manager',
            comment: 'Escalating to director level due to policy implications',
            timestamp: '2025-11-13T16:30:00',
            action: 'escalate'
          }
        ],
        attachments: ['refund_request_form.pdf'],
        deadlineDate: '2025-11-18',
        escalationHistory: [
          {
            id: 'E001',
            fromLevel: 1,
            toLevel: 2,
            escalatedBy: 'Sarah Manager',
            escalatedTo: 'David Director',
            reason: 'Policy exception requires director approval',
            timestamp: '2025-11-13T16:30:00'
          }
        ]
      },
      {
        id: 'AR004',
        type: 'bulk-booking',
        title: 'Corporate Bulk Booking Request',
        description: 'Request for 50 employee health checkups with special pricing',
        requestedBy: 'Tom Wilson',
        requestedDate: '2025-11-12',
        priority: 'medium',
        status: 'on-hold',
        currentApprover: 'Sarah Manager',
        approvalLevel: 1,
        maxApprovalLevel: 3,
        estimatedValue: 25000,
        customerName: 'ABC Corporation',
        businessJustification: 'Large corporate client requesting annual health screening package',
        impactAssessment: 'High revenue opportunity, requires resource planning',
        comments: [
          {
            id: 'C006',
            userId: 'TW001',
            userName: 'Tom Wilson',
            comment: 'Client needs confirmation by end of week for planning purposes',
            timestamp: '2025-11-12T11:00:00',
            action: 'comment'
          },
          {
            id: 'C007',
            userId: 'SM001',
            userName: 'Sarah Manager',
            comment: 'On hold pending resource availability confirmation from hospitals',
            timestamp: '2025-11-12T14:45:00',
            action: 'request-info'
          }
        ],
        attachments: ['corporate_contract.pdf', 'employee_list.xlsx'],
        deadlineDate: '2025-11-22',
        escalationHistory: []
      }
    ]

    const mockWorkflows: ApprovalWorkflow[] = [
      {
        id: 'WF001',
        name: 'Standard Billing Approval',
        type: 'billing',
        levels: [
          {
            level: 1,
            name: 'Manager Review',
            approvers: ['Sarah Manager', 'John Manager'],
            required: 1,
            autoEscalationHours: 24,
            canReject: true
          },
          {
            level: 2,
            name: 'Director Approval',
            approvers: ['Michael Director', 'Patricia Director'],
            required: 1,
            autoEscalationHours: 48,
            canReject: true
          }
        ],
        conditions: [
          {
            id: 'C001',
            field: 'estimatedValue',
            operator: 'greater_than',
            value: '1000',
            action: 'assign_workflow'
          }
        ],
        active: true,
        createdDate: '2025-01-15'
      },
      {
        id: 'WF002',
        name: 'Emergency Appointment Override',
        type: 'appointment',
        levels: [
          {
            level: 1,
            name: 'Medical Director Review',
            approvers: ['Dr. Sarah Williams', 'Dr. Michael Chen'],
            required: 1,
            autoEscalationHours: 2,
            canReject: true
          }
        ],
        conditions: [
          {
            id: 'C002',
            field: 'priority',
            operator: 'equals',
            value: 'urgent',
            action: 'assign_workflow'
          }
        ],
        active: true,
        createdDate: '2025-02-01'
      }
    ]

    setTimeout(() => {
      setApprovalRequests(mockApprovalRequests)
      setWorkflows(mockWorkflows)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRequests = approvalRequests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || request.status === statusFilter
    const matchesType = !typeFilter || request.type === typeFilter
    const matchesPriority = !priorityFilter || request.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
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
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'escalated': return 'bg-orange-100 text-orange-800'
      case 'on-hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />
      case 'billing': return <DollarSign className="h-4 w-4" />
      case 'refund': return <ArrowDown className="h-4 w-4" />
      case 'special-request': return <AlertTriangle className="h-4 w-4" />
      case 'bulk-booking': return <User className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleApproval = (requestId: string, action: 'approve' | 'reject', comment: string) => {
    setApprovalRequests(requests =>
      requests.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: action === 'approve' ? 'approved' : 'rejected',
              comments: [
                ...request.comments,
                {
                  id: `C${Date.now()}`,
                  userId: 'current_user',
                  userName: 'Current User',
                  comment,
                  timestamp: new Date().toISOString(),
                  action
                }
              ]
            }
          : request
      )
    )
    
    toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
    setSelectedRequest(null)
    setNewComment('')
  }

  const handleEscalation = (requestId: string, reason: string) => {
    setApprovalRequests(requests =>
      requests.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'escalated',
              approvalLevel: request.approvalLevel + 1,
              escalationHistory: [
                ...request.escalationHistory,
                {
                  id: `E${Date.now()}`,
                  fromLevel: request.approvalLevel,
                  toLevel: request.approvalLevel + 1,
                  escalatedBy: 'Current User',
                  escalatedTo: request.nextApprover || 'Senior Management',
                  reason,
                  timestamp: new Date().toISOString()
                }
              ],
              comments: [
                ...request.comments,
                {
                  id: `C${Date.now()}`,
                  userId: 'current_user',
                  userName: 'Current User',
                  comment: `Escalated to next level: ${reason}`,
                  timestamp: new Date().toISOString(),
                  action: 'escalate'
                }
              ]
            }
          : request
      )
    )
    
    toast.success('Request escalated successfully')
    setSelectedRequest(null)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading approval workflows...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Approval Workflows</title>
        <meta name="description" content="Configurable approval workflows and request management" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage approval requests and configure workflow processes
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={() => toast.success('Exporting approval data...')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
              <button
                onClick={() => setShowCreateWorkflow(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
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
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalRequests.filter(r => r.status === 'pending').length}
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
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Escalated</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalRequests.filter(r => r.status === 'escalated').length}
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
                  <p className="text-sm font-medium text-gray-600">Urgent Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {approvalRequests.filter(r => r.priority === 'urgent' && r.status !== 'approved').length}
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
                  { id: 'requests', name: 'Approval Requests' },
                  { id: 'workflows', name: 'Workflow Configuration' },
                  { id: 'analytics', name: 'Analytics' }
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
              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search requests..."
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
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="escalated">Escalated</option>
                        <option value="on-hold">On Hold</option>
                      </select>
                    </div>
                    <div>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="appointment">Appointment</option>
                        <option value="billing">Billing</option>
                        <option value="refund">Refund</option>
                        <option value="special-request">Special Request</option>
                        <option value="bulk-booking">Bulk Booking</option>
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
                  </div>

                  {/* Requests List */}
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getTypeIcon(request.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-medium text-gray-900">{request.title}</h4>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                                  {request.priority}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                <div>
                                  <span className="font-medium">Requested by:</span> {request.requestedBy}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span> {new Date(request.requestedDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Deadline:</span> {new Date(request.deadlineDate).toLocaleDateString()}
                                </div>
                                {request.customerName && (
                                  <div>
                                    <span className="font-medium">Customer:</span> {request.customerName}
                                  </div>
                                )}
                                {request.estimatedValue && (
                                  <div>
                                    <span className="font-medium">Value:</span> ${request.estimatedValue.toLocaleString()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Level:</span> {request.approvalLevel}/{request.maxApprovalLevel}
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Current Approver:</span> {request.currentApprover}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toast.success('Edit request functionality coming soon')}
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

              {/* Workflows Tab */}
              {activeTab === 'workflows' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Configured Workflows</h3>
                    <button
                      onClick={() => setShowCreateWorkflow(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Create Workflow
                    </button>
                  </div>
                  
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{workflow.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {workflow.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-2">
                            <div><span className="font-medium">Type:</span> {workflow.type}</div>
                            <div><span className="font-medium">Levels:</span> {workflow.levels.length}</div>
                            <div className="mt-3">
                              <span className="font-medium">Approval Levels:</span>
                              <div className="mt-1 space-y-1">
                                {workflow.levels.map((level) => (
                                  <div key={level.level} className="bg-white p-2 rounded border text-xs">
                                    <div className="font-medium">Level {level.level}: {level.name}</div>
                                    <div>Approvers: {level.approvers.join(', ')}</div>
                                    <div>Required: {level.required}, Auto-escalation: {level.autoEscalationHours}h</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toast.success('Edit workflow functionality coming soon')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Dashboard</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Approval analytics and reporting features coming soon.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Request Detail Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-gray-900">{selectedRequest.title}</h3>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request Details */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Request Details</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium">Description:</span>
                          <div className="mt-1">{selectedRequest.description}</div>
                        </div>
                        <div>
                          <span className="font-medium">Business Justification:</span>
                          <div className="mt-1">{selectedRequest.businessJustification}</div>
                        </div>
                        <div>
                          <span className="font-medium">Impact Assessment:</span>
                          <div className="mt-1">{selectedRequest.impactAssessment}</div>
                        </div>
                        {selectedRequest.estimatedValue && (
                          <div>
                            <span className="font-medium">Estimated Value:</span>
                            <div className="mt-1">${selectedRequest.estimatedValue.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comments and Actions */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Comments & Actions</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedRequest.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">{comment.userName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{comment.comment}</div>
                            {comment.action !== 'comment' && (
                              <div className="mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  comment.action === 'approve' ? 'bg-green-100 text-green-800' :
                                  comment.action === 'reject' ? 'bg-red-100 text-red-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {comment.action}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      {selectedRequest.status === 'pending' && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <textarea
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              rows={3}
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproval(selectedRequest.id, 'approve', newComment)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2 inline" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval(selectedRequest.id, 'reject', newComment)}
                              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-2 inline" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleEscalation(selectedRequest.id, newComment || 'Escalated for review')}
                              className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                            >
                              <ArrowUp className="h-4 w-4 mr-2 inline" />
                              Escalate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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