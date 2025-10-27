import React, { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Clock,
  FileText,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  MessageCircle,
  Video,
  Paperclip,
  Star,
  MoreVertical,
  TrendingUp,
  Activity
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Interaction {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  type: 'call' | 'email' | 'chat' | 'appointment' | 'complaint' | 'feedback'
  direction: 'inbound' | 'outbound'
  status: 'completed' | 'pending' | 'failed' | 'missed'
  subject: string
  description: string
  duration?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  priority: 'high' | 'medium' | 'low'
  timestamp: Date
  agentId: string
  agentName: string
  attachments?: string[]
  tags: string[]
  resolution?: string
  followUpRequired: boolean
  relatedTicketId?: string
  recording?: string
  transcript?: string
  rating?: number
  metadata?: {
    appointmentId?: string
    doctorName?: string
    department?: string
    waitTime?: string
    resolvedTime?: string
  }
}

interface CustomerInteractionHistoryProps {
  customerId?: string
  agentId?: string
  userRole: 'agent' | 'supervisor' | 'admin'
  onInteractionClick?: (interaction: Interaction) => void
}

const CustomerInteractionHistory: React.FC<CustomerInteractionHistoryProps> = ({
  customerId,
  agentId,
  userRole,
  onInteractionClick
}) => {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([])
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDateRange, setFilterDateRange] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'timeline' | 'list' | 'analytics'>('timeline')

  // Mock data
  useEffect(() => {
    const mockInteractions: Interaction[] = [
      {
        id: 'INT001',
        customerId: 'CUST001',
        customerName: 'John Silva',
        customerEmail: 'john.silva@email.com',
        customerPhone: '+94771234567',
        type: 'call',
        direction: 'inbound',
        status: 'completed',
        subject: 'Appointment Inquiry',
        description: 'Customer called to inquire about available appointment slots for cardiology',
        duration: '5:23',
        sentiment: 'positive',
        priority: 'medium',
        timestamp: new Date('2024-01-15T10:30:00'),
        agentId: 'AGT001',
        agentName: 'Sarah Agent',
        tags: ['appointment', 'cardiology', 'inquiry'],
        resolution: 'Appointment booked for next Tuesday',
        followUpRequired: false,
        rating: 5,
        metadata: {
          appointmentId: 'APT-2024-001',
          doctorName: 'Dr. Sarah Johnson',
          department: 'Cardiology'
        }
      },
      {
        id: 'INT002',
        customerId: 'CUST001',
        customerName: 'John Silva',
        customerEmail: 'john.silva@email.com',
        customerPhone: '+94771234567',
        type: 'email',
        direction: 'outbound',
        status: 'completed',
        subject: 'Appointment Confirmation',
        description: 'Sent appointment confirmation email with details and instructions',
        sentiment: 'neutral',
        priority: 'low',
        timestamp: new Date('2024-01-15T11:00:00'),
        agentId: 'AGT001',
        agentName: 'Sarah Agent',
        tags: ['confirmation', 'automated'],
        followUpRequired: false,
        attachments: ['appointment_details.pdf', 'directions.pdf']
      },
      {
        id: 'INT003',
        customerId: 'CUST002',
        customerName: 'Mary Fernando',
        customerEmail: 'mary.f@email.com',
        customerPhone: '+94777654321',
        type: 'chat',
        direction: 'inbound',
        status: 'completed',
        subject: 'Payment Issue',
        description: 'Customer reported payment failure for appointment booking',
        sentiment: 'negative',
        priority: 'high',
        timestamp: new Date('2024-01-14T14:20:00'),
        agentId: 'AGT002',
        agentName: 'Mike Support',
        tags: ['payment', 'issue', 'urgent'],
        resolution: 'Payment processed manually, issue escalated to technical team',
        followUpRequired: true,
        relatedTicketId: 'TKT-2024-045',
        transcript: 'Full chat transcript available',
        rating: 3
      },
      {
        id: 'INT004',
        customerId: 'CUST003',
        customerName: 'David Perera',
        customerEmail: 'david.p@email.com',
        customerPhone: '+94779876543',
        type: 'complaint',
        direction: 'inbound',
        status: 'pending',
        subject: 'Long Wait Time',
        description: 'Customer complained about 2-hour wait despite having appointment',
        sentiment: 'negative',
        priority: 'high',
        timestamp: new Date('2024-01-13T16:45:00'),
        agentId: 'AGT001',
        agentName: 'Sarah Agent',
        tags: ['complaint', 'wait-time', 'escalated'],
        followUpRequired: true,
        relatedTicketId: 'TKT-2024-046',
        metadata: {
          appointmentId: 'APT-2024-002',
          doctorName: 'Dr. Michael Chen',
          department: 'Neurology',
          waitTime: '2 hours 15 minutes'
        }
      },
      {
        id: 'INT005',
        customerId: 'CUST001',
        customerName: 'John Silva',
        customerEmail: 'john.silva@email.com',
        customerPhone: '+94771234567',
        type: 'feedback',
        direction: 'inbound',
        status: 'completed',
        subject: 'Service Feedback',
        description: 'Positive feedback about the appointment experience',
        sentiment: 'positive',
        priority: 'low',
        timestamp: new Date('2024-01-12T09:15:00'),
        agentId: 'AGT003',
        agentName: 'Lisa Care',
        tags: ['feedback', 'positive', 'testimonial'],
        followUpRequired: false,
        rating: 5,
        metadata: {
          appointmentId: 'APT-2024-001',
          doctorName: 'Dr. Sarah Johnson',
          department: 'Cardiology'
        }
      }
    ]

    // Filter based on customerId or agentId if provided
    let filtered = mockInteractions
    if (customerId) {
      filtered = filtered.filter(i => i.customerId === customerId)
    }
    if (agentId) {
      filtered = filtered.filter(i => i.agentId === agentId)
    }

    setInteractions(filtered)
    setFilteredInteractions(filtered)
  }, [customerId, agentId])

  // Apply filters
  useEffect(() => {
    let filtered = [...interactions]

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus)
    }

    // Date range filter
    const now = new Date()
    switch (filterDateRange) {
      case 'today':
        filtered = filtered.filter(i => {
          const date = new Date(i.timestamp)
          return date.toDateString() === now.toDateString()
        })
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(i => new Date(i.timestamp) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(i => new Date(i.timestamp) >= monthAgo)
        break
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter(i =>
        i.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredInteractions(filtered)
  }, [interactions, filterType, filterStatus, filterDateRange, searchQuery])

  // Statistics
  const statistics = useMemo(() => {
    const total = interactions.length
    const byType = {
      call: interactions.filter(i => i.type === 'call').length,
      email: interactions.filter(i => i.type === 'email').length,
      chat: interactions.filter(i => i.type === 'chat').length,
      complaint: interactions.filter(i => i.type === 'complaint').length
    }
    const bySentiment = {
      positive: interactions.filter(i => i.sentiment === 'positive').length,
      neutral: interactions.filter(i => i.sentiment === 'neutral').length,
      negative: interactions.filter(i => i.sentiment === 'negative').length
    }
    const avgRating = interactions
      .filter(i => i.rating)
      .reduce((acc, i) => acc + (i.rating || 0), 0) / interactions.filter(i => i.rating).length || 0

    const responseTime = interactions
      .filter(i => i.metadata?.resolvedTime)
      .map(i => parseInt(i.metadata?.resolvedTime || '0'))
      .reduce((acc, time, _, arr) => acc + time / arr.length, 0)

    return {
      total,
      byType,
      bySentiment,
      avgRating,
      responseTime,
      pendingFollowUps: interactions.filter(i => i.followUpRequired).length
    }
  }, [interactions])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'chat': return <MessageSquare className="h-4 w-4" />
      case 'appointment': return <Calendar className="h-4 w-4" />
      case 'complaint': return <AlertCircle className="h-4 w-4" />
      case 'feedback': return <Star className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-600'
      case 'email': return 'bg-green-100 text-green-600'
      case 'chat': return 'bg-purple-100 text-purple-600'
      case 'appointment': return 'bg-indigo-100 text-indigo-600'
      case 'complaint': return 'bg-red-100 text-red-600'
      case 'feedback': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😞'
      default: return '😐'
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.avgRating.toFixed(1)}
                <span className="text-yellow-500 ml-1">★</span>
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Positive</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.bySentiment.positive}
              </p>
            </div>
            <span className="text-2xl">😊</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negative</p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.bySentiment.negative}
              </p>
            </div>
            <span className="text-2xl">😞</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Follow-ups</p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.pendingFollowUps}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
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
                placeholder="Search interactions..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[250px]"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="chat">Chats</option>
              <option value="appointment">Appointments</option>
              <option value="complaint">Complaints</option>
              <option value="feedback">Feedback</option>
            </select>

            {/* Date Range */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-2 ${view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 ${view === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-4">
          {filteredInteractions.map((interaction, index) => (
            <div key={interaction.id} className="relative">
              {index < filteredInteractions.length - 1 && (
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${getTypeColor(interaction.type)}`}>
                  {getTypeIcon(interaction.type)}
                </div>
                
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{interaction.subject}</h4>
                        <span className="text-2xl">{getSentimentIcon(interaction.sentiment)}</span>
                        {interaction.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            High Priority
                          </span>
                        )}
                        {interaction.followUpRequired && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Follow-up Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{interaction.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {interaction.customerName}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                        </span>
                        {interaction.duration && (
                          <span className="flex items-center">
                            <PhoneCall className="h-3 w-3 mr-1" />
                            {interaction.duration}
                          </span>
                        )}
                        {interaction.rating && (
                          <span className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < (interaction.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      
                      {interaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {interaction.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleExpanded(interaction.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      {expandedItems.has(interaction.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {expandedItems.has(interaction.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {interaction.resolution && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Resolution:</p>
                          <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                            {interaction.resolution}
                          </p>
                        </div>
                      )}
                      
                      {interaction.metadata && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Additional Details:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {interaction.metadata.appointmentId && (
                              <div>
                                <span className="text-gray-500">Appointment ID:</span>
                                <span className="ml-2 text-gray-900">{interaction.metadata.appointmentId}</span>
                              </div>
                            )}
                            {interaction.metadata.doctorName && (
                              <div>
                                <span className="text-gray-500">Doctor:</span>
                                <span className="ml-2 text-gray-900">{interaction.metadata.doctorName}</span>
                              </div>
                            )}
                            {interaction.metadata.department && (
                              <div>
                                <span className="text-gray-500">Department:</span>
                                <span className="ml-2 text-gray-900">{interaction.metadata.department}</span>
                              </div>
                            )}
                            {interaction.metadata.waitTime && (
                              <div>
                                <span className="text-gray-500">Wait Time:</span>
                                <span className="ml-2 text-gray-900">{interaction.metadata.waitTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>Handled by: {interaction.agentName}</span>
                          {interaction.relatedTicketId && (
                            <span>• Ticket: {interaction.relatedTicketId}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {interaction.attachments && interaction.attachments.length > 0 && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <Paperclip className="h-4 w-4 mr-1" />
                              {interaction.attachments.length} Files
                            </button>
                          )}
                          {interaction.transcript && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              Transcript
                            </button>
                          )}
                          {interaction.recording && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              Recording
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerInteractionHistory
