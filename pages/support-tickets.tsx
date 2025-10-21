import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  User,
  Calendar,
  Tag,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Edit,
  MoreVertical,
  Send
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import toast from 'react-hot-toast'
import { RootState } from '../store/store'

interface Ticket {
  id: string
  ticketNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  title: string
  description: string
  category: 'technical' | 'billing' | 'appointment' | 'complaint' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed'
  assignedAgent: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  tags: string[]
  messages: TicketMessage[]
  estimatedResolution?: string
  actualResolution?: string
  satisfactionRating?: number
  resolutionNotes?: string
}

interface TicketMessage {
  id: string
  senderId: string
  senderName: string
  senderType: 'customer' | 'agent' | 'system'
  message: string
  timestamp: string
  attachments?: string[]
}

interface TicketFilters {
  status: string
  priority: string
  category: string
  assignedAgent: string
  dateRange: string
}

export default function CustomerSupport() {
  const dispatch = useDispatch<any>()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    priority: '',
    category: '',
    assignedAgent: '',
    dateRange: ''
  })

  const [newTicket, setNewTicket] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  })

  // Mock ticket data
  useEffect(() => {
    const mockTickets: Ticket[] = [
      {
        id: '1',
        ticketNumber: 'TKT-2025-001',
        customerId: '1',
        customerName: 'John Doe',
        customerEmail: 'john.doe@email.com',
        title: 'Unable to book appointment online',
        description: 'I am trying to book an appointment with Dr. Smith but the website keeps showing an error message when I try to submit the form.',
        category: 'technical',
        priority: 'high',
        status: 'in-progress',
        assignedAgent: 'Agent Sarah',
        createdAt: '2025-10-18T09:00:00Z',
        updatedAt: '2025-10-18T14:30:00Z',
        tags: ['website', 'booking', 'error'],
        estimatedResolution: '2025-10-19T17:00:00Z',
        messages: [
          {
            id: '1',
            senderId: '1',
            senderName: 'John Doe',
            senderType: 'customer',
            message: 'I am trying to book an appointment with Dr. Smith but the website keeps showing an error message when I try to submit the form.',
            timestamp: '2025-10-18T09:00:00Z'
          },
          {
            id: '2',
            senderId: 'agent1',
            senderName: 'Agent Sarah',
            senderType: 'agent',
            message: 'Hi John, I understand your frustration. Let me investigate this issue for you. Can you please tell me which browser you are using and what exactly the error message says?',
            timestamp: '2025-10-18T10:15:00Z'
          },
          {
            id: '3',
            senderId: '1',
            senderName: 'John Doe',
            senderType: 'customer',
            message: 'I am using Chrome browser. The error message says "Payment processing failed. Please try again."',
            timestamp: '2025-10-18T11:30:00Z'
          },
          {
            id: '4',
            senderId: 'agent1',
            senderName: 'Agent Sarah',
            senderType: 'agent',
            message: 'Thank you for that information. I have identified the issue with our payment gateway. Our technical team is working on it. I will book your appointment manually for now. Can you please confirm your preferred date and time?',
            timestamp: '2025-10-18T14:30:00Z'
          }
        ]
      },
      {
        id: '2',
        ticketNumber: 'TKT-2025-002',
        customerId: '2',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@email.com',
        title: 'Billing inquiry for insurance claim',
        description: 'I need clarification on my recent bill. My insurance should have covered the consultation fee but I was charged the full amount.',
        category: 'billing',
        priority: 'medium',
        status: 'waiting-customer',
        assignedAgent: 'Agent Mike',
        createdAt: '2025-10-17T14:20:00Z',
        updatedAt: '2025-10-18T16:45:00Z',
        tags: ['insurance', 'billing', 'claim'],
        estimatedResolution: '2025-10-20T12:00:00Z',
        messages: [
          {
            id: '5',
            senderId: '2',
            senderName: 'Sarah Johnson',
            senderType: 'customer',
            message: 'I need clarification on my recent bill. My insurance should have covered the consultation fee but I was charged the full amount.',
            timestamp: '2025-10-17T14:20:00Z'
          },
          {
            id: '6',
            senderId: 'agent2',
            senderName: 'Agent Mike',
            senderType: 'agent',
            message: 'Hi Sarah, I have reviewed your account and can see the issue. Your insurance claim was submitted but there was a minor error in the policy number. I have resubmitted the claim with the correct information. You should receive a refund within 3-5 business days. Could you please confirm your current insurance policy number for our records?',
            timestamp: '2025-10-18T16:45:00Z'
          }
        ]
      },
      {
        id: '3',
        ticketNumber: 'TKT-2025-003',
        customerId: '3',
        customerName: 'Michael Brown',
        customerEmail: 'michael.brown@email.com',
        title: 'Request to reschedule appointment',
        description: 'I need to reschedule my appointment with Dr. Wilson from tomorrow to next week due to an emergency.',
        category: 'appointment',
        priority: 'medium',
        status: 'resolved',
        assignedAgent: 'Agent Lisa',
        createdAt: '2025-10-16T11:00:00Z',
        updatedAt: '2025-10-16T15:30:00Z',
        resolvedAt: '2025-10-16T15:30:00Z',
        tags: ['reschedule', 'emergency'],
        satisfactionRating: 5,
        resolutionNotes: 'Appointment successfully rescheduled to next Tuesday at 2:00 PM',
        messages: [
          {
            id: '7',
            senderId: '3',
            senderName: 'Michael Brown',
            senderType: 'customer',
            message: 'I need to reschedule my appointment with Dr. Wilson from tomorrow to next week due to an emergency.',
            timestamp: '2025-10-16T11:00:00Z'
          },
          {
            id: '8',
            senderId: 'agent3',
            senderName: 'Agent Lisa',
            senderType: 'agent',
            message: 'Hi Michael, I understand you have an emergency. I have checked Dr. Wilson\'s schedule and can offer you the following slots next week: Tuesday 2:00 PM, Wednesday 10:00 AM, or Friday 3:00 PM. Which would work best for you?',
            timestamp: '2025-10-16T12:15:00Z'
          },
          {
            id: '9',
            senderId: '3',
            senderName: 'Michael Brown',
            senderType: 'customer',
            message: 'Tuesday at 2:00 PM would be perfect. Thank you so much for your help!',
            timestamp: '2025-10-16T13:00:00Z'
          },
          {
            id: '10',
            senderId: 'agent3',
            senderName: 'Agent Lisa',
            senderType: 'agent',
            message: 'Great! I have rescheduled your appointment to Tuesday, October 22nd at 2:00 PM with Dr. Wilson. You will receive a confirmation email shortly. Is there anything else I can help you with?',
            timestamp: '2025-10-16T15:30:00Z'
          }
        ]
      }
    ]

    setTimeout(() => {
      setTickets(mockTickets)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters = 
      (!filters.status || ticket.status === filters.status) &&
      (!filters.priority || ticket.priority === filters.priority) &&
      (!filters.category || ticket.category === filters.category) &&
      (!filters.assignedAgent || ticket.assignedAgent === filters.assignedAgent)

    return matchesSearch && matchesFilters
  })

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowTicketModal(true)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return

    const message: TicketMessage = {
      id: Date.now().toString(),
      senderId: 'current-agent',
      senderName: 'Agent You',
      senderType: 'agent',
      message: newMessage,
      timestamp: new Date().toISOString()
    }

    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, message],
      updatedAt: new Date().toISOString(),
      status: selectedTicket.status === 'waiting-customer' ? 'in-progress' : selectedTicket.status
    }

    setSelectedTicket(updatedTicket)
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t))
    setNewMessage('')
    toast.success('Message sent successfully')
  }

  const handleUpdateTicketStatus = (ticketId: string, newStatus: Ticket['status']) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : ticket.resolvedAt,
            closedAt: newStatus === 'closed' ? new Date().toISOString() : ticket.closedAt
          } 
        : ticket
    )
    setTickets(updatedTickets)
    
    if (selectedTicket?.id === ticketId) {
      const updatedTicket = updatedTickets.find(t => t.id === ticketId)
      if (updatedTicket) setSelectedTicket(updatedTicket)
    }
    
    toast.success(`Ticket status updated to ${newStatus}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'waiting-customer': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'urgent': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return <ArrowDown className="h-4 w-4" />
      case 'medium': return <Minus className="h-4 w-4" />
      case 'high': return <ArrowUp className="h-4 w-4" />
      case 'urgent': return <AlertCircle className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    avgResolutionTime: '2.3 hours'
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Customer Support - eChanneling Corporate Agent</title>
        <meta name="description" content="Manage customer support tickets and communications" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage support tickets and customer communications
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Open</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Resolution</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.avgResolutionTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search tickets by number, customer, or description..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting-customer">Waiting Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                      <option value="">All Categories</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="appointment">Appointment</option>
                      <option value="complaint">Complaint</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filters.assignedAgent}
                      onChange={(e) => setFilters({...filters, assignedAgent: e.target.value})}
                    >
                      <option value="">All Agents</option>
                      <option value="Agent Sarah">Agent Sarah</option>
                      <option value="Agent Mike">Agent Mike</option>
                      <option value="Agent Lisa">Agent Lisa</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tickets Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading tickets...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">{ticket.ticketNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                              <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${getPriorityColor(ticket.priority)}`}>
                            {getPriorityIcon(ticket.priority)}
                            <span className="ml-1 text-sm font-medium">{ticket.priority}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.assignedAgent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewTicket(ticket)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= filteredTickets.length}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{filteredTickets.length}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage * itemsPerPage >= filteredTickets.length}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTicketModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedTicket.ticketNumber} - {selectedTicket.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('-', ' ')}
                        </span>
                        <div className={`flex items-center ${getPriorityColor(selectedTicket.priority)}`}>
                          {getPriorityIcon(selectedTicket.priority)}
                          <span className="ml-1 text-sm font-medium">{selectedTicket.priority}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as Ticket['status'])}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting-customer">Waiting Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => setShowTicketModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Name:</span> {selectedTicket.customerName}</div>
                      <div><span className="font-medium">Email:</span> {selectedTicket.customerEmail}</div>
                      <div><span className="font-medium">Category:</span> {selectedTicket.category}</div>
                      <div><span className="font-medium">Assigned Agent:</span> {selectedTicket.assignedAgent}</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Conversation</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages.map((message) => (
                        <div key={message.id} className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'agent' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="text-sm">
                              <div className="font-medium mb-1">{message.senderName}</div>
                              <div>{message.message}</div>
                              <div className={`text-xs mt-1 ${
                                message.senderType === 'agent' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* New Message */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your response..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}