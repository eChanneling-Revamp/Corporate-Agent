import React, { useState, useEffect } from 'react'

interface ApiClient {
  id: string
  name: string
  apiKey: string
  status: 'active' | 'suspended' | 'revoked'
  permissions: string[]
  rateLimit: number
  usage: {
    totalCalls: number
    todayCalls: number
    successRate: number
    avgResponseTime: number
  }
  createdAt: string
  lastUsed: string
}

interface ApiCall {
  id: string
  clientId: string
  clientName: string
  method: string
  endpoint: string
  status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED'
  responseTime: number
  timestamp: string
  errorMessage?: string
}

export const ApiManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'logs' | 'analytics'>('overview')
  const [clients, setClients] = useState<ApiClient[]>([])
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateClient, setShowCreateClient] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    setClients([
      {
        id: 'client_001',
        name: 'General Hospital System',
        apiKey: 'demo_hospital_api_key_001',
        status: 'active',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        usage: {
          totalCalls: 15420,
          todayCalls: 234,
          successRate: 99.2,
          avgResponseTime: 145
        },
        createdAt: '2024-01-01T00:00:00Z',
        lastUsed: '2024-01-15T14:30:00Z'
      },
      {
        id: 'client_002',
        name: 'Payment Gateway Integration',
        apiKey: 'demo_payment_gateway_002',
        status: 'active',
        permissions: ['read'],
        rateLimit: 500,
        usage: {
          totalCalls: 8520,
          todayCalls: 89,
          successRate: 98.8,
          avgResponseTime: 89
        },
        createdAt: '2024-01-05T00:00:00Z',
        lastUsed: '2024-01-15T13:45:00Z'
      },
      {
        id: 'client_003',
        name: 'Mobile App Backend',
        apiKey: 'demo_mobile_app_003',
        status: 'suspended',
        permissions: ['read', 'write'],
        rateLimit: 2000,
        usage: {
          totalCalls: 45210,
          todayCalls: 0,
          successRate: 97.5,
          avgResponseTime: 198
        },
        createdAt: '2023-12-15T00:00:00Z',
        lastUsed: '2024-01-10T09:20:00Z'
      }
    ])

    setApiCalls([
      {
        id: 'call_001',
        clientId: 'client_001',
        clientName: 'General Hospital System',
        method: 'GET',
        endpoint: '/api/integration/appointments',
        status: 'SUCCESS',
        responseTime: 142,
        timestamp: '2024-01-15T14:30:00Z'
      },
      {
        id: 'call_002',
        clientId: 'client_002',
        clientName: 'Payment Gateway Integration',
        method: 'POST',
        endpoint: '/api/integration/appointments',
        status: 'SUCCESS',
        responseTime: 89,
        timestamp: '2024-01-15T14:29:00Z'
      },
      {
        id: 'call_003',
        clientId: 'client_001',
        clientName: 'General Hospital System',
        method: 'PUT',
        endpoint: '/api/integration/appointments/apt_123',
        status: 'ERROR',
        responseTime: 0,
        timestamp: '2024-01-15T14:28:00Z',
        errorMessage: 'Appointment not found'
      },
      {
        id: 'call_004',
        clientId: 'client_003',
        clientName: 'Mobile App Backend',
        method: 'GET',
        endpoint: '/api/integration/doctors',
        status: 'RATE_LIMITED',
        responseTime: 0,
        timestamp: '2024-01-15T14:27:00Z',
        errorMessage: 'Rate limit exceeded'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'suspended': return 'bg-yellow-100 text-yellow-800'
      case 'revoked': return 'bg-red-100 text-red-800'
      case 'SUCCESS': return 'bg-green-100 text-green-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
      case 'RATE_LIMITED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalApiCalls = clients.reduce((sum, client) => sum + client.usage.totalCalls, 0)
  const todayApiCalls = clients.reduce((sum, client) => sum + client.usage.todayCalls, 0)
  const avgSuccessRate = clients.reduce((sum, client) => sum + client.usage.successRate, 0) / clients.length
  const activeClients = clients.filter(client => client.status === 'active').length

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">API Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            API Clients
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            API Logs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-blue-100">Total API Calls</p>
                  <p className="text-3xl font-bold">{totalApiCalls.toLocaleString()}</p>
                </div>
                <div className="bg-blue-400 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-green-100">Today's Calls</p>
                  <p className="text-3xl font-bold">{todayApiCalls.toLocaleString()}</p>
                </div>
                <div className="bg-green-400 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-purple-100">Active Clients</p>
                  <p className="text-3xl font-bold">{activeClients}</p>
                </div>
                <div className="bg-purple-400 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-orange-100">Success Rate</p>
                  <p className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-400 rounded-full p-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateClient(true)}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create API Client</span>
              </button>
              <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Documentation</span>
              </button>
              <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5H8z" />
                </svg>
                <span>Export Logs</span>
              </button>
            </div>
          </div>

          {/* Recent API Calls */}
          <div>
            <h3 className="text-lg font-medium mb-4">Recent API Calls</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method & Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiCalls.slice(0, 5).map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {call.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                            {call.method}
                          </span>
                          {call.endpoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.responseTime > 0 ? `${call.responseTime}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* API Clients Tab */}
      {activeTab === 'clients' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">API Clients</h3>
            <button
              onClick={() => setShowCreateClient(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{client.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">API Key</p>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {client.apiKey.substring(0, 20)}...
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Permissions</p>
                    <div className="flex space-x-1 mt-1">
                      {client.permissions.map(permission => (
                        <span key={permission} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-gray-500">Total Calls</p>
                      <p className="text-lg font-semibold">{client.usage.totalCalls.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-lg font-semibold">{client.usage.successRate}%</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last used: {new Date(client.lastUsed).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-200">
                      Edit
                    </button>
                    <button className="flex-1 bg-red-100 text-red-700 px-3 py-2 text-sm rounded hover:bg-red-200">
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">API Call Logs</h3>
            <div className="flex space-x-2">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option>All Clients</option>
                <option>General Hospital System</option>
                <option>Payment Gateway Integration</option>
                <option>Mobile App Backend</option>
              </select>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option>All Status</option>
                <option>SUCCESS</option>
                <option>ERROR</option>
                <option>RATE_LIMITED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method & Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiCalls.map((call) => (
                  <tr key={call.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(call.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {call.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                          {call.method}
                        </span>
                        {call.endpoint}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.responseTime > 0 ? `${call.responseTime}ms` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {call.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">API Analytics</h3>
          
          {/* Placeholder for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-medium mb-4">API Calls Over Time</h4>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart placeholder - API calls timeline</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-medium mb-4">Response Time Distribution</h4>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart placeholder - Response time histogram</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-medium mb-4">Top Endpoints</h4>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart placeholder - Endpoint usage bar chart</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-medium mb-4">Error Rate by Client</h4>
              <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                <p className="text-gray-500">Chart placeholder - Error rate pie chart</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create New API Client</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm">Read permissions</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm">Write permissions</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Limit (requests/hour)
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>500</option>
                  <option>1000</option>
                  <option>2000</option>
                  <option>5000</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateClient(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateClient(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiManagementDashboard