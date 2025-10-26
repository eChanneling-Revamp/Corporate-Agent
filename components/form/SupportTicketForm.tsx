import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Ticket, 
  User, 
  MessageSquare, 
  AlertCircle, 
  Calendar,
  Settings,
  Send,
  Save,
  X
} from 'lucide-react'
import { 
  supportTicketCreateSchema, 
  supportTicketUpdateSchema,
  type SupportTicketCreateData,
  type SupportTicketUpdateData 
} from '../../lib/validationSchemas'
import toast from 'react-hot-toast'

interface SupportTicket {
  id?: string
  ticketNumber?: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  title?: string
  description?: string
  category?: 'EMERGENCY' | 'GENERAL' | 'BILLING' | 'FEEDBACK' | 'COMPLAINT' | 'TECHNICAL' | 'APPOINTMENT'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  status?: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED'
  assignedAgentId?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  estimatedResolutionAt?: string
  resolvedAt?: string
  resolutionNotes?: string
  satisfactionRating?: number
  customerFeedback?: string
}

interface SupportTicketFormProps {
  ticket?: SupportTicket
  onSubmit: (data: SupportTicketCreateData | SupportTicketUpdateData) => Promise<void>
  onCancel?: () => void
  isEditMode?: boolean
}

export default function SupportTicketForm({ 
  ticket, 
  onSubmit, 
  onCancel, 
  isEditMode = false 
}: SupportTicketFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(false)

  const schema = isEditMode ? supportTicketUpdateSchema : supportTicketCreateSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SupportTicketCreateData | SupportTicketUpdateData>({
    resolver: zodResolver(schema),
    defaultValues: ticket ? {
      ...ticket,
      // Ensure required fields have defaults for create mode
      customerId: ticket.customerId || '',
      customerName: ticket.customerName || '',
      customerEmail: ticket.customerEmail || '',
      title: ticket.title || '',
      description: ticket.description || '',
      category: ticket.category || 'GENERAL',
      priority: ticket.priority || 'MEDIUM'
    } : {
      customerId: '',
      customerName: '',
      customerEmail: '',
      title: '',
      description: '',
      category: 'GENERAL' as const,
      priority: 'MEDIUM' as const
    }
  })

  const handleFormSubmit = async (data: SupportTicketCreateData | SupportTicketUpdateData) => {
    try {
      setLoading(true)
      await onSubmit(data)
      toast.success(isEditMode ? 'Ticket updated successfully!' : 'Ticket created successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save ticket')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Ticket },
    { id: 'customer', label: 'Customer Info', icon: User },
    { id: 'details', label: 'Details', icon: MessageSquare },
    { id: 'status', label: 'Status & Assignment', icon: Settings }
  ]

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Support Ticket' : 'Create New Support Ticket'}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="px-6 py-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Ticket Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Brief description of the issue"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Detailed description of the issue..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    {...register('category')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="BILLING">Billing</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="APPOINTMENT">Appointment</option>
                    <option value="COMPLAINT">Complaint</option>
                    <option value="FEEDBACK">Feedback</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority *
                  </label>
                  <select
                    {...register('priority')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Information Tab */}
          {activeTab === 'customer' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Customer ID *
                </label>
                <input
                  {...register('customerId')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Customer ID or number"
                />
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  Customer Name *
                </label>
                <input
                  {...register('customerName')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Full name of the customer"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                  Customer Email *
                </label>
                <input
                  {...register('customerEmail')}
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerEmail.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tags (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter tags separated by commas"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    setValue('tags', tags)
                  }}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Tags help categorize and search tickets (e.g., urgent, billing-issue, technical-support)
                </p>
              </div>

              <div>
                <label htmlFor="estimatedResolutionAt" className="block text-sm font-medium text-gray-700">
                  Estimated Resolution Date
                </label>
                <input
                  {...register('estimatedResolutionAt')}
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.estimatedResolutionAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedResolutionAt.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="assignedAgentId" className="block text-sm font-medium text-gray-700">
                  Assigned Agent (optional)
                </label>
                <input
                  {...register('assignedAgentId')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Agent ID"
                />
                {errors.assignedAgentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.assignedAgentId.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Status & Assignment Tab - Only show in edit mode */}
          {activeTab === 'status' && isEditMode && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    {...register('status' as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PENDING">Pending</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="satisfactionRating" className="block text-sm font-medium text-gray-700">
                    Satisfaction Rating (1-5)
                  </label>
                  <select
                    {...register('satisfactionRating' as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Not rated</option>
                    <option value={1}>1 - Very Poor</option>
                    <option value={2}>2 - Poor</option>
                    <option value={3}>3 - Fair</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700">
                  Resolution Notes
                </label>
                <textarea
                  {...register('resolutionNotes' as any)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Notes about how the issue was resolved..."
                />
              </div>
            </div>
          )}

          {/* Show message for status tab in create mode */}
          {activeTab === 'status' && !isEditMode && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Status Management</h3>
              <p className="mt-1 text-sm text-gray-500">
                Status and resolution options will be available after the ticket is created.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEditMode ? 'Update Ticket' : 'Create Ticket')}
          </button>
        </div>
      </form>
    </div>
  )
}