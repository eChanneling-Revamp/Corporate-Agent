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
  Trash2,
  Download,
  RefreshCw,
  MoreVertical,
  Send
} from 'lucide-react'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import DashboardLayout from '../components/layout/DashboardLayout'
import SupportTicketForm from '../components/form/SupportTicketForm'
import toast from 'react-hot-toast'
import { RootState } from '../store/store'
import { 
  SupportTicketCreateData, 
  SupportTicketUpdateData, 
  TicketMessageCreateData 
} from '../lib/validationSchemas'

interface SupportTicket {
  id: string
  ticketNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  title: string
  description: string
  category: 'TECHNICAL' | 'BILLING' | 'APPOINTMENT' | 'COMPLAINT' | 'GENERAL' | 'EMERGENCY' | 'FEEDBACK'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED'
  assignedAgentId?: string
  assignedAgentName?: string
  tags: string[]
  estimatedResolutionAt?: string
  resolutionNotes?: string
  satisfactionRating?: number
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  senderName: string
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'ADMIN'
  message: string
  createdAt: string
  isInternal: boolean
}

interface Customer {
  id: string
  customerNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Agent {
  id: string
  name: string
  email: string
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
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [isEditingTicket, setIsEditingTicket] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    priority: '',
    category: '',
    assignedAgent: '',
    dateRange: ''
  })

  // API Functions
  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/support-tickets')
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const createTicket = async (ticketData: SupportTicketCreateData) => {
    try {
      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      })

      if (!response.ok) throw new Error('Failed to create ticket')
      
      const newTicket = await response.json()
      setTickets(prev => [newTicket, ...prev])
      toast.success('Support ticket created successfully')
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create support ticket')
      throw error
    }
  }

  const updateTicket = async (ticketData: SupportTicketUpdateData) => {
    try {
      if (!selectedTicket?.id) throw new Error('No ticket selected')

      const response = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      })

      if (!response.ok) throw new Error('Failed to update ticket')
      
      const updatedTicket = await response.json()
      setTickets(prev => prev.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      ))
      setSelectedTicket(updatedTicket)
      toast.success('Ticket updated successfully')
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket')
      throw error
    }
  }

  const deleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return

    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete ticket')
      
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
      toast.success('Ticket deleted successfully')
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    }
  }

  const sendMessage = async (messageData: TicketMessageCreateData) => {
    try {
      const response = await fetch(`/api/support-tickets/${messageData.ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      // Refresh the ticket to get updated messages
      await fetchTickets()
      toast.success('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }

  const handleExportTickets = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.category && { category: filters.category }),
        ...(filters.assignedAgent && { assignedAgent: filters.assignedAgent }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/support-tickets/export?${queryParams}`)
      if (!response.ok) throw new Error('Failed to export tickets')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `support-tickets-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Support tickets exported successfully')
    } catch (error) {
      console.error('Error exporting tickets:', error)
      toast.error('Failed to export support tickets')
    }
  }

  // Load initial data
  useEffect(() => {
    fetchTickets()
    fetchCustomers()
    // Mock agents data for now
    setAgents([
      { id: 'agent1', name: 'Agent Sarah', email: 'sarah@echanneling.com' },
      { id: 'agent2', name: 'Agent Mike', email: 'mike@echanneling.com' },
      { id: 'agent3', name: 'Agent Lisa', email: 'lisa@echanneling.com' }
    ])
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
      (!filters.assignedAgent || ticket.assignedAgentName === filters.assignedAgent)

    return matchesSearch && matchesFilters
  })

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // UI Handler Functions
  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowTicketModal(true)
  }

  const handleEditTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setIsEditingTicket(true)
    setShowTicketForm(true)
  }

  const handleAddTicket = () => {
    setSelectedTicket(null)
    setIsEditingTicket(false)
    setShowTicketForm(true)
  }

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update ticket status')
      
      const updatedTicket = await response.json()
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? updatedTicket : ticket
      ))
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(updatedTicket)
      }
      
      toast.success(`Ticket status updated to ${newStatus.replace('_', ' ').toLowerCase()}`)
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'PENDING': return 'bg-purple-100 text-purple-800'

      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'

      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HIGH': return 'text-orange-600'
      case 'URGENT': return 'text-red-600'
      case 'CRITICAL': return 'text-red-800'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return <ArrowDown className="h-4 w-4" />
      case 'MEDIUM': return <Minus className="h-4 w-4" />
      case 'HIGH': return <ArrowUp className="h-4 w-4" />
      case 'URGENT': return <AlertCircle className="h-4 w-4" />
      case 'CRITICAL': return <AlertCircle className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
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
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <button
                onClick={handleExportTickets}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={fetchTickets}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleAddTicket}
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
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="PENDING">Pending</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
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
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                      <option value="CRITICAL">Critical</option>
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
                      <option value="TECHNICAL">Technical</option>
                      <option value="BILLING">Billing</option>
                      <option value="APPOINTMENT">Appointment</option>
                      <option value="COMPLAINT">Complaint</option>
                      <option value="GENERAL">General</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="FEEDBACK">Feedback</option>
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
                          {ticket.assignedAgentName || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTicket(ticket)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Ticket"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Ticket"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTicket(ticket.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Ticket"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

        {/* Support Ticket Form Modal */}
        {showTicketForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <SupportTicketForm
                  ticket={selectedTicket || undefined}
                  onSubmit={isEditingTicket ? updateTicket : createTicket}
                  onCancel={() => {
                    setShowTicketForm(false)
                    setSelectedTicket(null)
                    setIsEditingTicket(false)
                  }}
                  isEditMode={isEditingTicket}
                />
              </div>
            </div>
          </div>
        )}

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
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as SupportTicket['status'])}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="PENDING">Pending</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
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
                      <div><span className="font-medium">Assigned Agent:</span> {selectedTicket.assignedAgentName || 'Unassigned'}</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Conversation</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages.map((message, index) => (
                        <div key={index} className={`flex ${message.senderType === 'AGENT' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'AGENT' 
                              ? 'bg-blue-600 text-white' 
                              : message.senderType === 'SYSTEM'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="text-sm">
                              <div className="font-medium mb-1">{message.senderName}</div>
                              <div>{message.message}</div>
                              <div className={`text-xs mt-1 ${
                                message.senderType === 'AGENT' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEditTicket(selectedTicket)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit & Reply
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