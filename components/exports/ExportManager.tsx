import React, { useState, useEffect } from 'react'
import { useDataExport, useExportTemplates, ExportConfig, ExportJob } from '../../hooks/useExport'
import { useAuth } from '../../contexts/AuthContext'

interface ExportManagerProps {
  entityType?: string
  defaultFilters?: Record<string, any>
  onExportComplete?: (result: any) => void
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  entityType = 'appointments',
  defaultFilters = {},
  onExportComplete
}) => {
  const { user } = useAuth()
  const {
    isExporting,
    exportJobs,
    error,
    exportData,
    getExportJobs,
    downloadExport,
    cancelExport,
    clearError
  } = useDataExport()
  
  const {
    templates,
    isLoading: templatesLoading,
    getTemplates,
    saveTemplate,
    deleteTemplate
  } = useExportTemplates()

  // State management
  const [activeTab, setActiveTab] = useState<'new' | 'jobs' | 'templates'>('new')
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    entityType,
    format: 'excel',
    filters: defaultFilters,
    columns: [],
    includeHeaders: true,
    customFileName: '',
    emailRecipients: []
  })
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Available columns for the selected entity type
  const availableColumns = getAvailableColumns(entityType)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns.slice(0, 10))

  // Initialize
  useEffect(() => {
    if (user?.id) {
      getExportJobs(user.id)
      getTemplates(entityType)
    }
  }, [user?.id, entityType, getExportJobs, getTemplates])

  // Update config when entity type changes
  useEffect(() => {
    setExportConfig(prev => ({
      ...prev,
      entityType,
      columns: selectedColumns,
      filters: defaultFilters
    }))
  }, [entityType, selectedColumns, defaultFilters])

  // Handle export submission
  const handleExport = async () => {
    if (!user?.id) return

    const config: ExportConfig = {
      ...exportConfig,
      columns: selectedColumns
    }

    try {
      const result = await exportData(config, user.id)
      if (result.success) {
        // Refresh export jobs
        await getExportJobs(user.id)
        
        // Reset form
        setExportConfig(prev => ({
          ...prev,
          customFileName: '',
          emailRecipients: []
        }))
        
        if (onExportComplete) {
          onExportComplete(result)
        }
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Handle template application
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setExportConfig(prev => ({
        ...prev,
        entityType: template.entityType,
        format: template.format as any,
        columns: template.columns,
        filters: { ...prev.filters, ...template.filters }
      }))
      setSelectedColumns(template.columns)
      setSelectedTemplate(templateId)
    }
  }

  // Handle column selection
  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Export Manager</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            New Export
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Export History
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Export Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <button
                  onClick={clearError}
                  className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'new' && (
        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Start with Template
            </label>
            <select
              value={selectedTemplate || ''}
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a template...</option>
              {templates
                .filter(t => t.entityType === entityType)
                .map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.format.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>

          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type
              </label>
              <select
                value={exportConfig.entityType}
                onChange={(e) => setExportConfig(prev => ({ ...prev, entityType: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="appointments">Appointments</option>
                <option value="patients">Patients</option>
                <option value="doctors">Doctors</option>
                <option value="hospitals">Hospitals</option>
                <option value="users">Users</option>
                <option value="payments">Payments</option>
                <option value="reports">Reports</option>
                <option value="audit_logs">Audit Logs</option>
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportConfig.format}
                onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Columns to Export ({selectedColumns.length} selected)
            </label>
            <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableColumns.map(column => (
                  <label key={column} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={() => handleColumnToggle(column)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{formatColumnName(column)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => setSelectedColumns(availableColumns)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedColumns([])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <span>{showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options</span>
            <svg
              className={`w-4 h-4 transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 border-t pt-4">
              {/* Custom Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Filename (optional)
                </label>
                <input
                  type="text"
                  value={exportConfig.customFileName || ''}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, customFileName: e.target.value }))}
                  placeholder="Leave empty for auto-generated filename"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients (optional)
                </label>
                <input
                  type="text"
                  value={exportConfig.emailRecipients?.join(', ') || ''}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    emailRecipients: e.target.value ? e.target.value.split(',').map(email => email.trim()) : []
                  }))}
                  placeholder="Enter email addresses separated by commas"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, the export will be sent to these email addresses
                </p>
              </div>

              {/* Include Headers */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeHeaders || true}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include column headers in export</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExporting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Export Jobs Tab */}
      {activeTab === 'jobs' && (
        <ExportJobsList
          jobs={exportJobs}
          onDownload={downloadExport}
          onCancel={cancelExport}
          onRefresh={() => user?.id && getExportJobs(user.id)}
        />
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <ExportTemplatesList
          templates={templates}
          isLoading={templatesLoading}
          onApply={applyTemplate}
          onSave={saveTemplate}
          onDelete={deleteTemplate}
        />
      )}
    </div>
  )
}

// Export Jobs List Component
interface ExportJobsListProps {
  jobs: ExportJob[]
  onDownload: (jobId: string) => Promise<boolean>
  onCancel: (jobId: string) => Promise<boolean>
  onRefresh: () => void
}

const ExportJobsList: React.FC<ExportJobsListProps> = ({
  jobs,
  onDownload,
  onCancel,
  onRefresh
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Export History</h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No export jobs found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.jobId.split('_')[1]?.substring(0, 8) || job.jobId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{job.entityType}</div>
                      <div className="text-xs text-gray-400">{job.format.toUpperCase()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.totalRecords.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(job.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {job.status === 'COMPLETED' && (
                      <button
                        onClick={() => onDownload(job.jobId)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                    )}
                    {job.status === 'PROCESSING' && (
                      <button
                        onClick={() => onCancel(job.jobId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Export Templates List Component (placeholder)
const ExportTemplatesList: React.FC<any> = ({ templates, isLoading, onApply }) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Export Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template: any) => (
          <div key={template.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {template.entityType} - {template.format.toUpperCase()}
              </span>
              <button
                onClick={() => onApply(template.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility functions
function getAvailableColumns(entityType: string): string[] {
  const columnMappings: Record<string, string[]> = {
    appointments: [
      'appointmentNumber', 'patientName', 'patientEmail', 'patientPhone', 'patientNIC',
      'patientGender', 'patientDateOfBirth', 'doctor.name', 'doctor.specialization',
      'hospital.name', 'hospital.city', 'appointmentDate', 'appointmentTime',
      'status', 'paymentStatus', 'consultationFee', 'totalAmount', 'medicalHistory',
      'currentMedications', 'allergies', 'insuranceProvider', 'createdAt'
    ],
    patients: [
      'patientName', 'patientEmail', 'patientPhone', 'patientNIC', 'patientGender',
      'patientDateOfBirth', 'emergencyContactName', 'emergencyContactPhone',
      'medicalHistory', 'currentMedications', 'allergies', 'insuranceProvider',
      'insurancePolicyNumber'
    ],
    doctors: [
      'name', 'email', 'specialization', 'qualification', 'experience',
      'consultationFee', 'rating', 'hospital.name', 'hospital.city', 'isActive', 'createdAt'
    ],
    hospitals: [
      'name', 'address', 'city', 'district', 'contactNumber', 'email',
      'website', 'facilities', 'isActive', 'createdAt'
    ],
    users: [
      'name', 'email', 'role', 'companyName', 'contactNumber', 'isActive',
      'isEmailVerified', 'lastLoginAt', 'createdAt'
    ],
    payments: [
      'amount', 'currency', 'paymentMethod', 'transactionId', 'status',
      'appointment.appointmentNumber', 'appointment.patientName', 'paidAt', 'createdAt'
    ]
  }

  return columnMappings[entityType] || []
}

function formatColumnName(column: string): string {
  return column
    .split('.')
    .pop()
    ?.replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase()) || column
}

export default ExportManager