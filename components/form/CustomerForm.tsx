import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Heart, 
  Shield, 
  Settings,
  Save,
  X
} from 'lucide-react'
import { 
  customerCreateSchema, 
  customerUpdateSchema, 
  type CustomerCreateData, 
  type CustomerUpdateData 
} from '../../lib/validationSchemas'
import toast from 'react-hot-toast'

interface Customer {
  id?: string
  customerNumber?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  
  // Address Information
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  
  // Emergency Contact
  emergencyContactName?: string
  emergencyContactRelationship?: string
  emergencyContactPhone?: string
  
  // Medical Information
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
  currentMedications?: string[]
  
  // Insurance Information
  insuranceProvider?: string
  insurancePolicyNumber?: string
  insuranceGroupNumber?: string
  insuranceValidUntil?: string
  
  // Communication Preferences
  preferredLanguage?: string
  communicationMethod?: 'EMAIL' | 'SMS' | 'PHONE' | 'WHATSAPP'
  appointmentReminders?: boolean

  
  // Agent Assignment
  assignedAgentId?: string
}

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CustomerCreateData | CustomerUpdateData) => Promise<void>
  onCancel?: () => void
  isEditMode?: boolean
}

export default function CustomerForm({ 
  customer, 
  onSubmit, 
  onCancel, 
  isEditMode = false 
}: CustomerFormProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)

  const schema = isEditMode ? customerUpdateSchema : customerCreateSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: customer ? {
      ...customer,
      // Ensure required fields have defaults
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      country: customer.country || '',
      preferredLanguage: customer.preferredLanguage || 'English',
      communicationMethod: customer.communicationMethod || 'EMAIL',
      appointmentReminders: customer.appointmentReminders || false
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      preferredLanguage: 'English',
      communicationMethod: 'EMAIL' as const,
      appointmentReminders: false,
      newsletterSubscription: false
    }
  })

  const handleFormSubmit = async (data: CustomerCreateData | CustomerUpdateData) => {
    try {
      setLoading(true)
      await onSubmit(data)
      toast.success(isEditMode ? 'Customer updated successfully!' : 'Customer created successfully!')
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save customer')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
    { id: 'emergency', label: 'Emergency Contact', icon: Phone },
    { id: 'medical', label: 'Medical Info', icon: Heart },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ]

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
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
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    {...register('street')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State/Province
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                      ZIP/Postal Code
                    </label>
                    <input
                      {...register('zipCode')}
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <select
                    {...register('country')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="LK">Sri Lanka</option>
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                    Emergency Contact Name
                  </label>
                  <input
                    {...register('emergencyContactName')}
                    type="text"
                    placeholder="Full Name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                    Emergency Contact Phone
                  </label>
                  <input
                    {...register('emergencyContactPhone')}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <select
                    {...register('emergencyContactRelationship')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.emergencyContactRelationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Medical Information Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                    Blood Type
                  </label>
                  <input
                    {...register('bloodType')}
                    type="text"
                    placeholder="e.g., A+, O-, AB+"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.bloodType && (
                    <p className="mt-1 text-sm text-red-600">{errors.bloodType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Allergies (if any)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter allergies separated by commas"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={(e) => {
                      const allergies = e.target.value.split(',').map(a => a.trim()).filter(a => a)
                      setValue('allergies', allergies)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    placeholder="Enter conditions separated by commas"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={(e) => {
                      const conditions = e.target.value.split(',').map(c => c.trim()).filter(c => c)
                      setValue('chronicConditions', conditions)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Current Medications
                  </label>
                  <input
                    type="text"
                    placeholder="Enter medications separated by commas"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onChange={(e) => {
                      const medications = e.target.value.split(',').map(m => m.trim()).filter(m => m)
                      setValue('currentMedications', medications)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700">
                    Insurance Provider
                  </label>
                  <input
                    {...register('insuranceProvider')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.insuranceProvider && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuranceProvider.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-gray-700">
                    Policy Number
                  </label>
                  <input
                    {...register('insurancePolicyNumber')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.insurancePolicyNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.insurancePolicyNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="insuranceGroupNumber" className="block text-sm font-medium text-gray-700">
                    Group Number
                  </label>
                  <input
                    {...register('insuranceGroupNumber')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.insuranceGroupNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuranceGroupNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="insuranceValidUntil" className="block text-sm font-medium text-gray-700">
                    Valid Until
                  </label>
                  <input
                    {...register('insuranceValidUntil')}
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.insuranceValidUntil && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuranceValidUntil.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
                    Preferred Language *
                  </label>
                  <select
                    {...register('preferredLanguage')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                  {errors.preferredLanguage && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="communicationMethod" className="block text-sm font-medium text-gray-700">
                    Preferred Communication Method *
                  </label>
                  <select
                    {...register('communicationMethod')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="PHONE">Phone</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                  {errors.communicationMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.communicationMethod.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    {...register('appointmentReminders')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="appointmentReminders" className="text-sm font-medium text-gray-700">
                    Enable appointment reminders
                  </label>
                </div>



                <div className="md:col-span-2">
                  <label htmlFor="assignedAgentId" className="block text-sm font-medium text-gray-700">
                    Assigned Agent
                  </label>
                  <input
                    {...register('assignedAgentId')}
                    type="text"
                    placeholder="Agent ID (optional)"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.assignedAgentId && (
                    <p className="mt-1 text-sm text-red-600">{errors.assignedAgentId.message}</p>
                  )}
                </div>
              </div>
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
            {loading ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>
    </div>
  )
}