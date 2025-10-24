import React, { useState } from 'react'
import Head from 'next/head'
import { useZodForm } from '../hooks/useZodForm'
import { registerFormSchema, appointmentBookingSchema } from '../lib/validationSchemas'
import { 
  InputField, 
  TextareaField, 
  SelectField, 
  CheckboxField, 
  RadioGroup 
} from '../components/form/FormField'
import { 
  TouchButton, 
  MobileDrawer, 
  ResponsiveContainer,
  SwipeableCarousel
} from '../components/mobile/MobileOptimized'
import { useBreakpoint, useDeviceDetection } from '../hooks/useMobile'
import OptimizedImage from '../components/common/OptimizedImage'
import { showToast } from '../components/common/ToastProvider'
import { User, Calendar, Phone, Mail, Building, Shield, ChevronRight } from 'lucide-react'

const DemoFormPage: React.FC = () => {
  const [showDrawer, setShowDrawer] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const breakpoint = useBreakpoint()
  const device = useDeviceDetection()

  // Registration Form
  const registrationForm = useZodForm({
    schema: registerFormSchema,
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      companyRegistrationNumber: '',
      designation: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      subscribeToNewsletter: false
    },
    onSubmit: async (values) => {
      console.log('Registration form submitted:', values)
      showToast.promise(
        new Promise((resolve) => setTimeout(resolve, 2000)),
        {
          loading: 'Creating your account...',
          success: 'Account created successfully!',
          error: 'Failed to create account'
        }
      )
    },
    mode: 'all',
    showToastOnError: true,
    focusOnError: true
  })

  // Appointment Form
  const appointmentForm = useZodForm({
    schema: appointmentBookingSchema.pick({
      patientName: true,
      patientEmail: true,
      patientPhone: true,
      patientGender: true,
      visitReason: true
    }),
    initialValues: {
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      patientGender: 'MALE' as const,
      visitReason: ''
    },
    onSubmit: async (values) => {
      console.log('Appointment form submitted:', values)
      showToast.success('Appointment booked successfully!')
      setShowDrawer(false)
    }
  })

  const totalSteps = 3
  const progress = (formStep / totalSteps) * 100

  return (
    <>
      <Head>
        <title>Form Validation & Mobile Demo - eChanneling</title>
      </Head>

      <ResponsiveContainer maxWidth="xl" className="min-h-screen bg-gray-50 py-8">
        {/* Device Info Banner */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Device Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium">
                {device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Touch:</span>
              <span className="ml-2 font-medium">{device.isTouchDevice ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-500">OS:</span>
              <span className="ml-2 font-medium">
                {device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Breakpoint:</span>
              <span className="ml-2 font-medium">{breakpoint.breakpoint}</span>
            </div>
          </div>
        </div>

        {/* Hero Section with Carousel */}
        <div className="mb-8">
          <SwipeableCarousel
            items={[
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Advanced Form Validation</h2>
                <p>Real-time validation with Zod schemas</p>
              </div>,
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Mobile Optimized</h2>
                <p>Touch-friendly components for all devices</p>
              </div>,
              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Performance First</h2>
                <p>Code splitting and lazy loading</p>
              </div>
            ]}
            showIndicators
            autoPlay
            autoPlayInterval={5000}
            className="h-48"
          />
        </div>

        {/* Multi-Step Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6">Multi-Step Registration Form</h1>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {formStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <form onSubmit={registrationForm.handleSubmit}>
            {/* Step 1: Personal Information */}
            {formStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    {...registrationForm.register('firstName')}
                    label="First Name"
                    placeholder="John"
                    required
                    leftIcon={<User className="w-4 h-4 text-gray-400" />}
                  />
                  
                  <InputField
                    {...registrationForm.register('lastName')}
                    label="Last Name"
                    placeholder="Doe"
                    required
                  />
                </div>

                <InputField
                  {...registrationForm.register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="john.doe@company.com"
                  required
                  leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                  autoComplete="email"
                />

                <InputField
                  {...registrationForm.register('phone')}
                  type="tel"
                  label="Phone Number"
                  placeholder="0771234567"
                  required
                  leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                  autoComplete="tel"
                />
              </div>
            )}

            {/* Step 2: Company Information */}
            {formStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Company Information
                </h2>
                
                <InputField
                  {...registrationForm.register('companyName')}
                  label="Company Name"
                  placeholder="Acme Corporation"
                  required
                  leftIcon={<Building className="w-4 h-4 text-gray-400" />}
                />

                <InputField
                  {...registrationForm.register('companyRegistrationNumber')}
                  label="Registration Number"
                  placeholder="PV12345"
                  helpText="Optional: Company registration number"
                />

                <InputField
                  {...registrationForm.register('designation')}
                  label="Your Designation"
                  placeholder="HR Manager"
                  required
                />
              </div>
            )}

            {/* Step 3: Security */}
            {formStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Account Security
                </h2>
                
                <InputField
                  {...registrationForm.register('password')}
                  type="password"
                  label="Password"
                  placeholder="Enter a strong password"
                  required
                  helpText="Must contain uppercase, lowercase, number and special character"
                  showPasswordToggle
                />

                <InputField
                  {...registrationForm.register('confirmPassword')}
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  required
                  showPasswordToggle
                />

                <div className="space-y-3 pt-4">
                  <CheckboxField
                    {...registrationForm.register('agreeToTerms')}
                    label="I agree to the Terms of Service and Privacy Policy"
                    required
                  />

                  <CheckboxField
                    {...registrationForm.register('subscribeToNewsletter')}
                    label="Subscribe to newsletter for updates and offers"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {formStep > 1 && (
                <TouchButton
                  type="button"
                  variant="outline"
                  onClick={() => setFormStep(formStep - 1)}
                >
                  Previous
                </TouchButton>
              )}

              {formStep < totalSteps ? (
                <TouchButton
                  type="button"
                  variant="primary"
                  onClick={() => {
                    // Validate current step before proceeding
                    const fieldsToValidate = 
                      formStep === 1 ? ['firstName', 'lastName', 'email', 'phone'] :
                      formStep === 2 ? ['companyName', 'designation'] :
                      []
                    
                    let hasErrors = false
                    fieldsToValidate.forEach(field => {
                      if (!registrationForm.values[field as keyof typeof registrationForm.values]) {
                        registrationForm.setFieldError(
                          field as keyof typeof registrationForm.values,
                          'This field is required'
                        )
                        hasErrors = true
                      }
                    })
                    
                    if (!hasErrors) {
                      setFormStep(formStep + 1)
                    }
                  }}
                  className={formStep === 1 ? 'ml-auto' : ''}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </TouchButton>
              ) : (
                <TouchButton
                  type="submit"
                  variant="primary"
                  loading={registrationForm.isSubmitting}
                  disabled={!registrationForm.isValid}
                >
                  Complete Registration
                </TouchButton>
              )}
            </div>
          </form>
        </div>

        {/* Quick Booking Button for Mobile */}
        {breakpoint.isMobile && (
          <div className="fixed bottom-4 right-4 z-30">
            <TouchButton
              variant="primary"
              size="lg"
              onClick={() => setShowDrawer(true)}
              className="shadow-lg rounded-full px-6"
            >
              Quick Booking
            </TouchButton>
          </div>
        )}

        {/* Mobile Drawer for Quick Appointment */}
        <MobileDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          title="Quick Appointment Booking"
          position="bottom"
        >
          <form onSubmit={appointmentForm.handleSubmit} className="p-4 space-y-4">
            <InputField
              {...appointmentForm.register('patientName')}
              label="Patient Name"
              placeholder="Enter patient name"
              required
            />

            <InputField
              {...appointmentForm.register('patientEmail')}
              type="email"
              label="Email"
              placeholder="patient@email.com"
              required
            />

            <InputField
              {...appointmentForm.register('patientPhone')}
              type="tel"
              label="Phone"
              placeholder="0771234567"
              required
            />

            <RadioGroup
              {...appointmentForm.getFieldProps('patientGender')}
              label="Gender"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' }
              ]}
              orientation="horizontal"
            />

            <TextareaField
              {...appointmentForm.register('visitReason')}
              label="Reason for Visit"
              placeholder="Describe your symptoms or reason for appointment..."
              rows={3}
              required
              maxLength={500}
              showCharCount
            />

            <TouchButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={appointmentForm.isSubmitting}
            >
              Book Appointment
            </TouchButton>
          </form>
        </MobileDrawer>

        {/* Feature List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Real-time Validation', desc: 'Instant feedback as you type' },
            { title: 'Mobile Optimized', desc: 'Touch-friendly on all devices' },
            { title: 'Multi-step Forms', desc: 'Break complex forms into steps' },
            { title: 'Error Recovery', desc: 'Graceful error handling' },
            { title: 'Accessibility', desc: 'WCAG compliant components' },
            { title: 'Performance', desc: 'Optimized bundle size' }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </ResponsiveContainer>
    </>
  )
}

export default DemoFormPage
