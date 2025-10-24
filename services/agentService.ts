import apiClient from './authService'

export interface Agent {
  id: string
  agentCode: string
  name: string
  email: string
  phone: string
  companyName: string
  companyId?: string
  department?: string
  role: 'ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  permissions: string[]
  avatar?: string
  lastActive?: string
  createdAt: string
  updatedAt: string
  metrics?: AgentMetrics
}

export interface AgentMetrics {
  totalBookings: number
  todayBookings: number
  weekBookings: number
  monthBookings: number
  averageResponseTime: number
  customerSatisfaction: number
  completionRate: number
  cancellationRate: number
}

export interface AgentActivity {
  id: string
  agentId: string
  action: string
  entityType: 'APPOINTMENT' | 'PATIENT' | 'DOCTOR' | 'PAYMENT' | 'SYSTEM'
  entityId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface AgentSession {
  id: string
  agentId: string
  startTime: string
  endTime?: string
  duration?: number
  bookingCount: number
  status: 'ACTIVE' | 'IDLE' | 'ENDED'
}

export interface AgentFilters {
  search?: string
  status?: string
  role?: string
  department?: string
  companyId?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateAgentData {
  name: string
  email: string
  phone: string
  companyName: string
  role: 'ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER'
  department?: string
  permissions?: string[]
}

export interface UpdateAgentData {
  name?: string
  phone?: string
  department?: string
  role?: string
  permissions?: string[]
  status?: string
}

export const agentAPI = {
  // Get all agents with optional filters
  getAgents: async (filters: AgentFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/agents?${params.toString()}`)
    return response.data
  },

  // Get agent by ID
  getAgentById: async (id: string) => {
    const response = await apiClient.get(`/agents/${id}`)
    return response.data
  },

  // Get current agent profile
  getCurrentAgent: async () => {
    const response = await apiClient.get('/agents/me')
    return response.data
  },

  // Create new agent
  createAgent: async (agentData: CreateAgentData) => {
    const response = await apiClient.post('/agents', agentData)
    return response.data
  },

  // Update agent
  updateAgent: async (id: string, agentData: UpdateAgentData) => {
    const response = await apiClient.patch(`/agents/${id}`, agentData)
    return response.data
  },

  // Update agent status
  updateAgentStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    const response = await apiClient.patch(`/agents/${id}/status`, { status })
    return response.data
  },

  // Delete agent
  deleteAgent: async (id: string) => {
    const response = await apiClient.delete(`/agents/${id}`)
    return response.data
  },

  // Get agent metrics
  getAgentMetrics: async (id: string, period?: 'day' | 'week' | 'month' | 'year') => {
    const params = period ? `?period=${period}` : ''
    const response = await apiClient.get(`/agents/${id}/metrics${params}`)
    return response.data
  },

  // Get agent activity history
  getAgentActivity: async (id: string, filters: { limit?: number; offset?: number; dateFrom?: string; dateTo?: string } = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/agents/${id}/activity?${params.toString()}`)
    return response.data
  },

  // Get agent sessions
  getAgentSessions: async (id: string, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    const response = await apiClient.get(`/agents/${id}/sessions?${params.toString()}`)
    return response.data
  },

  // Start new agent session
  startSession: async () => {
    const response = await apiClient.post('/agents/sessions/start')
    return response.data
  },

  // End current agent session
  endSession: async () => {
    const response = await apiClient.post('/agents/sessions/end')
    return response.data
  },

  // Update agent session status
  updateSessionStatus: async (status: 'ACTIVE' | 'IDLE') => {
    const response = await apiClient.patch('/agents/sessions/status', { status })
    return response.data
  },

  // Log agent activity
  logActivity: async (activity: {
    action: string
    entityType: string
    entityId?: string
    details?: any
  }) => {
    const response = await apiClient.post('/agents/activity', activity)
    return response.data
  },

  // Get agent permissions
  getAgentPermissions: async (id: string) => {
    const response = await apiClient.get(`/agents/${id}/permissions`)
    return response.data
  },

  // Update agent permissions
  updateAgentPermissions: async (id: string, permissions: string[]) => {
    const response = await apiClient.patch(`/agents/${id}/permissions`, { permissions })
    return response.data
  },

  // Bulk update agents
  bulkUpdateAgents: async (agentIds: string[], updates: UpdateAgentData) => {
    const response = await apiClient.patch('/agents/bulk-update', {
      agentIds,
      updates
    })
    return response.data
  },

  // Get team performance
  getTeamPerformance: async (filters: {
    departmentId?: string
    period?: 'day' | 'week' | 'month' | 'year'
    dateFrom?: string
    dateTo?: string
  } = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/agents/team/performance?${params.toString()}`)
    return response.data
  },

  // Get agent leaderboard
  getLeaderboard: async (period: 'day' | 'week' | 'month' = 'month', limit: number = 10) => {
    const response = await apiClient.get(`/agents/leaderboard?period=${period}&limit=${limit}`)
    return response.data
  },

  // Export agents data
  exportAgents: async (filters: AgentFilters = {}, format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    params.append('format', format)

    const response = await apiClient.get(`/agents/export?${params.toString()}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Agent availability management
  setAgentAvailability: async (available: boolean) => {
    const response = await apiClient.patch('/agents/availability', { available })
    return response.data
  },

  // Get online agents
  getOnlineAgents: async () => {
    const response = await apiClient.get('/agents/online')
    return response.data
  },

  // Assign agent to task/appointment
  assignAgent: async (taskId: string, agentId: string) => {
    const response = await apiClient.post('/agents/assign', { taskId, agentId })
    return response.data
  },

  // Transfer task to another agent
  transferTask: async (taskId: string, fromAgentId: string, toAgentId: string, reason?: string) => {
    const response = await apiClient.post('/agents/transfer', {
      taskId,
      fromAgentId,
      toAgentId,
      reason
    })
    return response.data
  }
}
