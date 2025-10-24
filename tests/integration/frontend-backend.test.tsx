import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../../store/store'
import { AuthProvider } from '../../contexts/AuthContext'
import Dashboard from '../../pages/dashboard'
import { server } from '../mocks/server'
import { rest } from 'msw'

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'AGENT',
  companyName: 'Test Company',
  contactNumber: '+1234567890',
  isActive: true
}

const mockAppointments = [
  {
    id: 'apt-1',
    doctorId: 'doc-1',
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    patientPhone: '+1234567890',
    status: 'CONFIRMED',
    appointmentType: 'CONSULTATION',
    createdAt: '2024-01-01T10:00:00Z',
    doctor: {
      name: 'Dr. Smith',
      specialization: 'Cardiology'
    },
    timeSlot: {
      date: '2024-01-15',
      startTime: '09:00:00',
      endTime: '09:30:00'
    }
  },
  {
    id: 'apt-2',
    doctorId: 'doc-2',
    patientName: 'Jane Doe',
    patientEmail: 'jane@example.com',
    patientPhone: '+1234567891',
    status: 'PENDING',
    appointmentType: 'FOLLOW_UP',
    createdAt: '2024-01-01T11:00:00Z',
    doctor: {
      name: 'Dr. Johnson',
      specialization: 'Dermatology'
    },
    timeSlot: {
      date: '2024-01-16',
      startTime: '10:00:00',
      endTime: '10:30:00'
    }
  }
]

const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Smith',
    specialization: 'Cardiology',
    qualifications: 'MD, FACC',
    experience: '15 years',
    rating: 4.8,
    totalReviews: 142,
    hospital: {
      name: 'General Hospital',
      city: 'New York'
    }
  },
  {
    id: 'doc-2',
    name: 'Dr. Johnson',
    specialization: 'Dermatology',
    qualifications: 'MD, FAAD',
    experience: '12 years',
    rating: 4.6,
    totalReviews: 98,
    hospital: {
      name: 'City Medical Center',
      city: 'Los Angeles'
    }
  }
]

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <AuthProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </AuthProvider>
  </Provider>
)

describe('Frontend-Backend Integration Tests', () => {
  beforeAll(() => {
    // Start MSW server
    server.listen()
  })

  afterEach(() => {
    // Reset handlers after each test
    server.resetHandlers()
  })

  afterAll(() => {
    // Close MSW server
    server.close()
  })

  describe('Dashboard Integration', () => {
    beforeEach(() => {
      // Mock localStorage for authentication
      Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'token') return 'mock-jwt-token'
        if (key === 'user') return JSON.stringify(mockUser)
        return null
      })

      // Mock API responses
      server.use(
        rest.get('/api/appointments', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Appointments retrieved successfully',
              data: mockAppointments,
              pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1
              }
            })
          )
        }),
        rest.get('/api/doctors', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Doctors retrieved successfully',
              data: mockDoctors
            })
          )
        }),
        rest.get('/api/dashboard/stats', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                totalAppointments: 150,
                confirmedAppointments: 120,
                pendingAppointments: 25,
                cancelledAppointments: 5,
                totalRevenue: 22500,
                monthlyRevenue: 4500,
                topDoctors: mockDoctors.slice(0, 3),
                recentAppointments: mockAppointments.slice(0, 5)
              }
            })
          )
        })
      )
    })

    test('should load dashboard with correct data', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Check if loading state is shown initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Check if stats are displayed
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // Total appointments
        expect(screen.getByText('120')).toBeInTheDocument() // Confirmed appointments
        expect(screen.getByText('$22,500')).toBeInTheDocument() // Total revenue
      })

      // Check if recent appointments are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    test('should handle appointment status updates', async () => {
      let updateCalled = false
      server.use(
        rest.put('/api/appointments/:id', (req, res, ctx) => {
          updateCalled = true
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Appointment updated successfully',
              data: {
                id: req.params.id,
                status: 'CONFIRMED',
                updatedAt: new Date().toISOString()
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Wait for appointments to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Find and click confirm button for pending appointment
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)

      // Wait for API call to complete
      await waitFor(() => {
        expect(updateCalled).toBe(true)
      })

      // Check if success message is displayed
      await waitFor(() => {
        expect(screen.getByText(/appointment updated successfully/i)).toBeInTheDocument()
      })
    })

    test('should handle bulk operations', async () => {
      let bulkUpdateCalled = false
      server.use(
        rest.post('/api/appointments/bulk-update', (req, res, ctx) => {
          bulkUpdateCalled = true
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Bulk update completed successfully',
              data: {
                updated: 2,
                failed: 0,
                results: [
                  { id: 'apt-1', status: 'success' },
                  { id: 'apt-2', status: 'success' }
                ]
              }
            })
          )
        })
      )

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Wait for appointments to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select multiple appointments
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])

      // Click bulk confirm button
      const bulkConfirmButton = screen.getByRole('button', { name: /bulk confirm/i })
      fireEvent.click(bulkConfirmButton)

      // Wait for API call to complete
      await waitFor(() => {
        expect(bulkUpdateCalled).toBe(true)
      })

      // Check if success message is displayed
      await waitFor(() => {
        expect(screen.getByText(/bulk update completed successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/appointments', (req, res, ctx) => {
          return res.networkError('Network error occurred')
        })
      )

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading appointments/i)).toBeInTheDocument()
      })

      // Check if retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    test('should handle server errors', async () => {
      server.use(
        rest.get('/api/appointments', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              message: 'Internal server error',
              error: 'INTERNAL_ERROR'
            })
          )
        })
      )

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })
    })

    test('should handle validation errors', async () => {
      server.use(
        rest.post('/api/appointments', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              message: 'Validation failed',
              errors: [
                {
                  field: 'patientEmail',
                  message: 'Invalid email format'
                },
                {
                  field: 'patientPhone',
                  message: 'Invalid phone number format'
                }
              ]
            })
          )
        })
      )

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Try to create an appointment with invalid data
      const createButton = screen.getByRole('button', { name: /create appointment/i })
      fireEvent.click(createButton)

      // Fill form with invalid data
      fireEvent.change(screen.getByLabelText(/patient email/i), {
        target: { value: 'invalid-email' }
      })
      fireEvent.change(screen.getByLabelText(/patient phone/i), {
        target: { value: 'invalid-phone' }
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      fireEvent.click(submitButton)

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Features Integration', () => {
    test('should handle WebSocket notifications', async () => {
      // Mock WebSocket
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn()
      }

      // Mock socket.io-client
      jest.mock('socket.io-client', () => ({
        io: jest.fn(() => mockSocket)
      }))

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Simulate WebSocket notification
      const notificationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'appointment_updated'
      )?.[1]

      if (notificationHandler) {
        notificationHandler({
          appointmentId: 'apt-1',
          status: 'CONFIRMED',
          patientName: 'John Doe'
        })
      }

      // Check if notification is displayed
      await waitFor(() => {
        expect(screen.getByText(/appointment for john doe has been confirmed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        ...mockAppointments[0],
        id: `apt-${index}`,
        patientName: `Patient ${index}`
      }))

      server.use(
        rest.get('/api/appointments', (req, res, ctx) => {
          const page = parseInt(req.url.searchParams.get('page') || '1')
          const limit = parseInt(req.url.searchParams.get('limit') || '10')
          const start = (page - 1) * limit
          const end = start + limit

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: largeDataset.slice(start, end),
              pagination: {
                page,
                limit,
                total: largeDataset.length,
                totalPages: Math.ceil(largeDataset.length / limit)
              }
            })
          )
        })
      )

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Ensure rendering completes within reasonable time (5 seconds)
      expect(renderTime).toBeLessThan(5000)

      // Check pagination
      expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument()
    })
  })
})