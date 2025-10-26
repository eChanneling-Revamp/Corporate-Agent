import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../common/Select'
import { Badge } from '../common/Badge'
import { Progress } from '../common/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../common/Tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Activity, Clock, Database, Globe, Cpu, Zap, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceMetrics {
  id: string
  timestamp: number
  type: 'api' | 'render' | 'database' | 'cache' | 'network'
  name: string
  duration: number
  metadata?: Record<string, any>
}

interface PerformanceSummary {
  totalMetrics: number
  lastHourMetrics: number
  averageResponseTime: number
  slowRequests: number
  criticalIssues: number
  metricsByType: Record<string, { count: number; averageDuration: number }>
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    arrayBuffers: number
  } | null
  databaseMetrics: {
    queryCount: number
    totalDuration: number
    averageDuration: number
    slowQueries: Array<{
      query: string
      duration: number
      timestamp: number
    }>
  }
}

interface PerformanceAnalysis {
  count: number
  average: number
  median: number
  p95: number
  p99: number
  min: number
  max: number
  slowestEndpoints: Array<{
    name: string
    averageDuration: number
    maxDuration: number
    callCount: number
  }>
  errorRate: number
  throughput: number
}

const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null)
  const [timeRange, setTimeRange] = useState('1h')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [summaryRes, metricsRes] = await Promise.all([
        fetch('/api/performance/summary'),
        fetch(`/api/performance/metrics?timeRange=${timeRange}`)
      ])

      if (!summaryRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch performance data')
      }

      const summaryData = await summaryRes.json()
      const metricsData = await metricsRes.json()

      setSummary(summaryData.data)
      setMetrics(metricsData.data.metrics)
      setAnalysis(metricsData.data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!metrics.length) return []

    // Group metrics by hour for the timeline
    const hourlyData: Record<string, { timestamp: number; api: number; render: number; database: number; network: number; count: number }> = {}

    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp)
      hour.setMinutes(0, 0, 0)
      const hourKey = hour.getTime().toString()

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          timestamp: hour.getTime(),
          api: 0,
          render: 0,
          database: 0,
          network: 0,
          count: 0
        }
      }

      hourlyData[hourKey][metric.type] += metric.duration
      hourlyData[hourKey].count += 1
    })

    // Calculate averages
    return Object.values(hourlyData)
      .map(data => ({
        time: new Date(data.timestamp).toLocaleTimeString(),
        timestamp: data.timestamp,
        'API Calls': data.count > 0 ? Math.round(data.api / data.count) : 0,
        'Rendering': data.count > 0 ? Math.round(data.render / data.count) : 0,
        'Database': data.count > 0 ? Math.round(data.database / data.count) : 0,
        'Network': data.count > 0 ? Math.round(data.network / data.count) : 0,
        'Total Requests': data.count
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [metrics])

  // Type distribution data for pie chart
  const typeDistribution = useMemo(() => {
    if (!summary?.metricsByType) return []

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
    
    return Object.entries(summary.metricsByType).map(([type, data], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.count,
      duration: data.averageDuration,
      fill: colors[index % colors.length]
    }))
  }, [summary])

  // Performance status
  const getPerformanceStatus = () => {
    if (!analysis) return { status: 'unknown', color: 'gray' }
    
    if (analysis.p95 > 5000) return { status: 'critical', color: 'red' }
    if (analysis.p95 > 2000) return { status: 'warning', color: 'yellow' }
    return { status: 'good', color: 'green' }
  }

  const performanceStatus = getPerformanceStatus()

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading performance data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading performance data: {error}</span>
        </div>
        <Button onClick={fetchPerformanceData} className="mt-2" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor application performance and system health</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchPerformanceData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {performanceStatus.status === 'good' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {performanceStatus.status === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
              {performanceStatus.status === 'critical' && <XCircle className="h-6 w-6 text-red-500" />}
              <div>
                <div className="text-2xl font-bold capitalize">{performanceStatus.status}</div>
                <p className="text-xs text-muted-foreground">
                  {analysis ? `P95: ${Math.round(analysis.p95)}ms` : 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.averageResponseTime}ms` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary ? `${summary.lastHourMetrics} requests` : 'No requests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.databaseMetrics ? `${Math.round(summary.databaseMetrics.averageDuration)}ms` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.databaseMetrics ? `${summary.databaseMetrics.queryCount} queries` : 'No queries'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.memoryUsage ? `${summary.memoryUsage.heapUsed}MB` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.memoryUsage ? `${Math.round((summary.memoryUsage.heapUsed / summary.memoryUsage.heapTotal) * 100)}% of ${summary.memoryUsage.heapTotal}MB` : 'No data'}
            </p>
            {summary?.memoryUsage && (
              <Progress 
                value={(summary.memoryUsage.heapUsed / summary.memoryUsage.heapTotal) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="API Calls" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="Database" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="Rendering" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Request Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Request Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Statistics */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.average)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Median</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.median)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">P95</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.p95)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">P99</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.p99)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Throughput</p>
                    <p className="text-2xl font-bold">{analysis.throughput.toFixed(1)}/s</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold">{analysis.errorRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Volume Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Total Requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          {analysis?.slowestEndpoints && (
            <Card>
              <CardHeader>
                <CardTitle>Slowest Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.slowestEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="text-sm text-gray-600">{endpoint.callCount} calls</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Math.round(endpoint.averageDuration)}ms</p>
                        <p className="text-sm text-gray-600">avg</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-red-600">{Math.round(endpoint.maxDuration)}ms</p>
                        <p className="text-sm text-gray-600">max</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          {summary?.databaseMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Query Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.databaseMetrics.queryCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Average Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{Math.round(summary.databaseMetrics.averageDuration)}ms</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Slow Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.databaseMetrics.slowQueries.length}</div>
                  </CardContent>
                </Card>
              </div>

              {summary.databaseMetrics.slowQueries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Slow Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summary.databaseMetrics.slowQueries.slice(0, 10).map((query, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <code className="text-sm bg-white px-2 py-1 rounded flex-1 mr-4">
                              {query.query}
                            </code>
                            <div className="text-right">
                              <Badge variant="destructive">{Math.round(query.duration)}ms</Badge>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(query.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard