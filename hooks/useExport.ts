import { useState, useCallback } from 'react'

// Types for export functionality
export interface ExportConfig {
  entityType: string
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filters?: Record<string, any>
  columns?: string[]
  includeHeaders?: boolean
  customFileName?: string
  emailRecipients?: string[]
  scheduledExport?: boolean
}

export interface ExportJob {
  id: string
  jobId: string
  entityType: string
  format: string
  fileName: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  totalRecords: number
  processedRecords: number
  filePath?: string
  fileSize?: number
  downloadUrl?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface ExportResult {
  success: boolean
  exportId?: string
  downloadUrl?: string
  data?: any
  message?: string
}

// Hook for managing data exports
export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<Record<string, number>>({})
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [error, setError] = useState<string | null>(null)

  // Export data
  const exportData = useCallback(async (config: ExportConfig, exportedBy: string): Promise<ExportResult> => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/export/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          exportedBy
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Export failed')
      }

      // Handle different response types based on format
      if (config.format === 'json') {
        const result = await response.json()
        return result
      } else {
        // For file downloads, create a blob and trigger download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Get filename from content-disposition header or use default
        const contentDisposition = response.headers.get('content-disposition')
        let fileName = config.customFileName || `export_${Date.now()}`
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="([^"]*)"/)
          if (fileNameMatch) {
            fileName = fileNameMatch[1]
          }
        } else {
          fileName += `.${config.format}`
        }

        // Create download link and trigger download
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return {
          success: true,
          downloadUrl: url,
          message: 'Export completed successfully'
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setIsExporting(false)
    }
  }, [])

  // Get export jobs
  const getExportJobs = useCallback(async (userId: string): Promise<ExportJob[]> => {
    try {
      const response = await fetch(`/api/export/jobs?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch export jobs')
      }
      
      const data = await response.json()
      setExportJobs(data.jobs || [])
      return data.jobs || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch export jobs')
      return []
    }
  }, [])

  // Download export file
  const downloadExport = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/export/download/${jobId}`)
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition')
      let fileName = `export_${jobId}`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="([^"]*)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }

      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      return false
    }
  }, [])

  // Cancel export job
  const cancelExport = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/export/cancel/${jobId}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Cancel failed')
      }

      // Update local job status
      setExportJobs(prev => 
        prev.map(job => 
          job.jobId === jobId 
            ? { ...job, status: 'CANCELLED' }
            : job
        )
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed')
      return false
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isExporting,
    exportProgress,
    exportJobs,
    error,
    exportData,
    getExportJobs,
    downloadExport,
    cancelExport,
    clearError
  }
}

// Hook for export templates and presets
export function useExportTemplates() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Export template interface
  interface ExportTemplate {
    id: string
    name: string
    description?: string
    entityType: string
    format: string
    columns: string[]
    filters: Record<string, any>
    isDefault: boolean
    createdBy: string
    createdAt: string
  }

  // Get export templates
  const getTemplates = useCallback(async (entityType?: string): Promise<ExportTemplate[]> => {
    setIsLoading(true)
    try {
      const url = entityType 
        ? `/api/export/templates?entityType=${entityType}`
        : '/api/export/templates'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
      return data.templates || []
    } catch (err) {
      console.error('Failed to fetch export templates:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save export template
  const saveTemplate = useCallback(async (template: Omit<ExportTemplate, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/export/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      const savedTemplate = await response.json()
      setTemplates(prev => [...prev, savedTemplate.template])
      return true
    } catch (err) {
      console.error('Failed to save export template:', err)
      return false
    }
  }, [])

  // Delete export template
  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/export/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId))
      return true
    } catch (err) {
      console.error('Failed to delete export template:', err)
      return false
    }
  }, [])

  return {
    templates,
    isLoading,
    getTemplates,
    saveTemplate,
    deleteTemplate
  }
}

// Hook for bulk exports
export function useBulkExport() {
  const [bulkJobs, setBulkJobs] = useState<ExportJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Execute bulk export
  const executeBulkExport = useCallback(async (
    configs: ExportConfig[], 
    exportedBy: string
  ): Promise<ExportResult[]> => {
    setIsProcessing(true)
    const results: ExportResult[] = []

    try {
      // Process exports sequentially to avoid overwhelming the server
      for (const config of configs) {
        const response = await fetch('/api/export/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...config,
            exportedBy,
            bulkExport: true
          }),
        })

        if (response.ok) {
          const result = await response.json()
          results.push(result)
        } else {
          const errorData = await response.json()
          results.push({
            success: false,
            message: errorData.message || 'Export failed'
          })
        }
      }
    } catch (err) {
      console.error('Bulk export failed:', err)
    } finally {
      setIsProcessing(false)
    }

    return results
  }, [])

  // Schedule bulk export
  const scheduleBulkExport = useCallback(async (
    configs: ExportConfig[],
    schedule: { date: string; time: string; frequency?: string },
    exportedBy: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/export/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configs,
          schedule,
          exportedBy
        }),
      })

      return response.ok
    } catch (err) {
      console.error('Failed to schedule bulk export:', err)
      return false
    }
  }, [])

  return {
    bulkJobs,
    isProcessing,
    executeBulkExport,
    scheduleBulkExport
  }
}

// Utility functions for export formatting
export const exportUtils = {
  // Get available columns for entity type
  getAvailableColumns: (entityType: string): string[] => {
    const columnMappings: Record<string, string[]> = {
      appointments: [
        'appointmentNumber', 'patientName', 'patientEmail', 'patientPhone',
        'doctor.name', 'hospital.name', 'appointmentDate', 'appointmentTime',
        'status', 'paymentStatus', 'consultationFee', 'totalAmount', 'createdAt'
      ],
      patients: [
        'patientName', 'patientEmail', 'patientPhone', 'patientNIC',
        'patientGender', 'patientDateOfBirth', 'emergencyContactName',
        'emergencyContactPhone', 'medicalHistory', 'currentMedications',
        'allergies', 'insuranceProvider', 'insurancePolicyNumber'
      ],
      doctors: [
        'name', 'email', 'specialization', 'qualification', 'experience',
        'consultationFee', 'rating', 'hospital.name', 'isActive', 'createdAt'
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
        'appointment.appointmentNumber', 'appointment.patientName',
        'paidAt', 'createdAt'
      ]
    }

    return columnMappings[entityType] || []
  },

  // Format column name for display
  formatColumnName: (column: string): string => {
    return column
      .split('.')
      .pop()
      ?.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase()) || column
  },

  // Get default export config for entity type
  getDefaultConfig: (entityType: string): Partial<ExportConfig> => {
    return {
      entityType,
      format: 'excel',
      includeHeaders: true,
      columns: exportUtils.getAvailableColumns(entityType)
    }
  },

  // Validate export config
  validateConfig: (config: ExportConfig): string[] => {
    const errors: string[] = []

    if (!config.entityType) {
      errors.push('Entity type is required')
    }

    if (!config.format) {
      errors.push('Export format is required')
    }

    const supportedFormats = ['csv', 'excel', 'pdf', 'json']
    if (config.format && !supportedFormats.includes(config.format)) {
      errors.push(`Unsupported format: ${config.format}`)
    }

    if (config.emailRecipients && config.emailRecipients.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = config.emailRecipients.filter(email => !emailRegex.test(email))
      if (invalidEmails.length > 0) {
        errors.push(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      }
    }

    return errors
  }
}