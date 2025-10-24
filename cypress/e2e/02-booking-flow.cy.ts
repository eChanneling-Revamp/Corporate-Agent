/// <reference types="cypress" />

describe('Appointment Booking Flow E2E Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user@example.com', 'Password123!')
  })

  context('Doctor Search', () => {
    it('TC_SEARCH_001: Should search doctors by name', () => {
      cy.visit('/doctor-search')
      
      // Search for doctor
      cy.get('input[placeholder*="Search"]').type('Dr. Smith')
      cy.get('button[data-testid="search-btn"]').click()
      
      // Verify search results
      cy.get('[data-testid="doctor-card"]').should('have.length.at.least', 1)
      cy.get('[data-testid="doctor-card"]').first().should('contain', 'Dr. Smith')
    })

    it('TC_SEARCH_002: Should filter doctors by specialization', () => {
      cy.visit('/doctor-search')
      
      // Select specialization
      cy.get('select[name="specialization"]').select('Cardiology')
      
      // Verify filtered results
      cy.get('[data-testid="doctor-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Cardiology')
      })
    })

    it('TC_SEARCH_003: Should filter doctors by hospital', () => {
      cy.visit('/doctor-search')
      
      // Select hospital
      cy.get('select[name="hospital"]').select('Asiri Hospital')
      
      // Verify filtered results
      cy.get('[data-testid="doctor-card"]').each(($card) => {
        cy.wrap($card).should('contain', 'Asiri Hospital')
      })
    })

    it('TC_SEARCH_004: Should show doctor details on card click', () => {
      cy.visit('/doctor-search')
      
      // Click on doctor card
      cy.get('[data-testid="doctor-card"]').first().click()
      
      // Verify doctor details modal/page
      cy.get('[data-testid="doctor-details"]').should('be.visible')
      cy.get('[data-testid="doctor-details"]').should('contain', 'Qualifications')
      cy.get('[data-testid="doctor-details"]').should('contain', 'Experience')
      cy.get('[data-testid="doctor-details"]').should('contain', 'Available Times')
    })

    it('TC_SEARCH_005: Should handle empty search results', () => {
      cy.visit('/doctor-search')
      
      // Search for non-existent doctor
      cy.get('input[placeholder*="Search"]').type('NonExistentDoctor123')
      cy.get('button[data-testid="search-btn"]').click()
      
      // Verify no results message
      cy.get('[data-testid="no-results"]').should('be.visible')
      cy.get('[data-testid="no-results"]').should('contain', 'No doctors found')
    })
  })

  context('Appointment Booking', () => {
    beforeEach(() => {
      // Navigate to doctor's booking page
      cy.visit('/doctor-search')
      cy.get('[data-testid="doctor-card"]').first().click()
      cy.get('button[data-testid="book-appointment"]').click()
    })

    it('TC_BOOK_001: Should complete appointment booking successfully', () => {
      // Select date
      cy.get('[data-testid="date-picker"]').type('2024-12-01')
      
      // Select time slot
      cy.get('[data-testid="time-slot"]').contains('10:00 AM').click()
      
      // Fill patient details
      cy.get('input[name="patientName"]').clear().type('John Doe')
      cy.get('input[name="patientPhone"]').clear().type('0771234567')
      cy.get('textarea[name="reason"]').type('Regular checkup')
      
      // Submit booking
      cy.get('button[data-testid="confirm-booking"]').click()
      
      // Verify booking confirmation
      cy.get('[data-testid="booking-success"]').should('be.visible')
      cy.get('[data-testid="appointment-number"]').should('exist')
      cy.get('[data-testid="appointment-details"]').should('contain', 'December 1, 2024')
      cy.get('[data-testid="appointment-details"]').should('contain', '10:00 AM')
    })

    it('TC_BOOK_002: Should validate required fields in booking form', () => {
      // Try to submit without filling required fields
      cy.get('button[data-testid="confirm-booking"]').click()
      
      // Check validation messages
      cy.get('[data-testid="date-error"]').should('contain', 'Please select a date')
      cy.get('[data-testid="time-error"]').should('contain', 'Please select a time')
      cy.get('[data-testid="patient-name-error"]').should('contain', 'Patient name is required')
    })

    it('TC_BOOK_003: Should show unavailable time slots', () => {
      // Select a date
      cy.get('[data-testid="date-picker"]').type('2024-12-01')
      
      // Check for disabled time slots
      cy.get('[data-testid="time-slot"].disabled').should('exist')
      cy.get('[data-testid="time-slot"].disabled').should('have.class', 'disabled')
      
      // Try to click disabled slot
      cy.get('[data-testid="time-slot"].disabled').first().click({ force: true })
      
      // Verify it's not selected
      cy.get('[data-testid="time-slot"].disabled').first().should('not.have.class', 'selected')
    })

    it('TC_BOOK_004: Should not allow booking past dates', () => {
      // Try to select past date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateStr = yesterday.toISOString().split('T')[0]
      
      cy.get('[data-testid="date-picker"]').type(dateStr)
      cy.get('[data-testid="date-picker"]').blur()
      
      // Check validation error
      cy.get('[data-testid="date-error"]').should('contain', 'cannot book past dates')
    })

    it('TC_BOOK_005: Should handle multiple bookings for same patient', () => {
      // First booking
      cy.get('[data-testid="date-picker"]').type('2024-12-01')
      cy.get('[data-testid="time-slot"]').contains('10:00 AM').click()
      cy.get('input[name="patientName"]').clear().type('John Doe')
      cy.get('input[name="patientPhone"]').clear().type('0771234567')
      cy.get('button[data-testid="confirm-booking"]').click()
      
      // Wait for confirmation
      cy.get('[data-testid="booking-success"]').should('be.visible')
      
      // Try another booking
      cy.get('button[data-testid="book-another"]').click()
      
      // Select different time
      cy.get('[data-testid="date-picker"]').type('2024-12-02')
      cy.get('[data-testid="time-slot"]').contains('2:00 PM').click()
      cy.get('button[data-testid="confirm-booking"]').click()
      
      // Verify second booking
      cy.get('[data-testid="booking-success"]').should('be.visible')
    })

    it('TC_BOOK_006: Should show doctor availability calendar', () => {
      // Check calendar view
      cy.get('[data-testid="availability-calendar"]').should('be.visible')
      
      // Navigate months
      cy.get('[data-testid="next-month"]').click()
      cy.get('[data-testid="calendar-month"]').should('contain', 'January')
      
      cy.get('[data-testid="prev-month"]').click()
      cy.get('[data-testid="calendar-month"]').should('contain', 'December')
      
      // Check for available/unavailable days
      cy.get('[data-testid="calendar-day"].available').should('exist')
      cy.get('[data-testid="calendar-day"].unavailable').should('exist')
    })
  })

  context('Appointment Modification', () => {
    beforeEach(() => {
      // Create a booking first
      cy.visit('/appointments')
    })

    it('TC_MOD_001: Should reschedule appointment', () => {
      // Click on existing appointment
      cy.get('[data-testid="appointment-card"]').first().click()
      
      // Click reschedule
      cy.get('button[data-testid="reschedule"]').click()
      
      // Select new date and time
      cy.get('[data-testid="date-picker"]').clear().type('2024-12-15')
      cy.get('[data-testid="time-slot"]').contains('3:00 PM').click()
      
      // Confirm reschedule
      cy.get('button[data-testid="confirm-reschedule"]').click()
      
      // Verify success
      cy.get('[data-testid="reschedule-success"]').should('be.visible')
      cy.get('[data-testid="appointment-details"]').should('contain', 'December 15')
    })

    it('TC_MOD_002: Should cancel appointment', () => {
      // Click on appointment
      cy.get('[data-testid="appointment-card"]').first().click()
      
      // Click cancel
      cy.get('button[data-testid="cancel-appointment"]').click()
      
      // Confirm cancellation
      cy.get('[data-testid="cancel-reason"]').type('Changed plans')
      cy.get('button[data-testid="confirm-cancel"]').click()
      
      // Verify cancellation
      cy.get('[data-testid="cancel-success"]').should('be.visible')
      cy.get('[data-testid="appointment-status"]').should('contain', 'Cancelled')
    })

    it('TC_MOD_003: Should not allow cancellation within 24 hours', () => {
      // Find appointment scheduled for today/tomorrow
      cy.get('[data-testid="appointment-card"][data-date="tomorrow"]').first().click()
      
      // Try to cancel
      cy.get('button[data-testid="cancel-appointment"]').click()
      
      // Check error message
      cy.get('[data-testid="cancel-error"]').should('be.visible')
      cy.get('[data-testid="cancel-error"]').should('contain', 'Cannot cancel within 24 hours')
    })
  })

  context('Appointment History', () => {
    it('TC_HIST_001: Should display appointment history', () => {
      cy.visit('/appointments')
      
      // Check tabs
      cy.get('[data-testid="tab-upcoming"]').should('be.visible')
      cy.get('[data-testid="tab-past"]').should('be.visible')
      cy.get('[data-testid="tab-cancelled"]').should('be.visible')
      
      // Click past appointments
      cy.get('[data-testid="tab-past"]').click()
      
      // Verify past appointments displayed
      cy.get('[data-testid="appointment-card"]').should('exist')
      cy.get('[data-testid="appointment-status"]').each(($status) => {
        cy.wrap($status).should('contain', 'Completed')
      })
    })

    it('TC_HIST_002: Should filter appointments by date range', () => {
      cy.visit('/appointments')
      
      // Set date range
      cy.get('input[name="fromDate"]').type('2024-01-01')
      cy.get('input[name="toDate"]').type('2024-12-31')
      cy.get('button[data-testid="apply-filter"]').click()
      
      // Verify filtered results
      cy.get('[data-testid="appointment-card"]').should('exist')
      cy.get('[data-testid="results-count"]').should('be.visible')
    })

    it('TC_HIST_003: Should download appointment details', () => {
      cy.visit('/appointments')
      
      // Click on appointment
      cy.get('[data-testid="appointment-card"]').first().click()
      
      // Click download
      cy.get('button[data-testid="download-details"]').click()
      
      // Verify download started
      cy.readFile('cypress/downloads/appointment-details.pdf').should('exist')
    })
  })

  context('Bulk Booking', () => {
    it('TC_BULK_001: Should handle bulk appointment booking', () => {
      cy.visit('/bulk-booking')
      
      // Add multiple patients
      const patients = [
        { name: 'Patient 1', phone: '0771234567' },
        { name: 'Patient 2', phone: '0771234568' },
        { name: 'Patient 3', phone: '0771234569' }
      ]
      
      patients.forEach((patient, index) => {
        if (index > 0) {
          cy.get('button[data-testid="add-patient"]').click()
        }
        cy.get(`input[name="patients[${index}].name"]`).type(patient.name)
        cy.get(`input[name="patients[${index}].phone"]`).type(patient.phone)
      })
      
      // Select doctor and time
      cy.get('select[name="doctor"]').select('Dr. Smith')
      cy.get('[data-testid="date-picker"]').type('2024-12-01')
      cy.get('[data-testid="starting-time"]').select('10:00 AM')
      
      // Submit bulk booking
      cy.get('button[data-testid="submit-bulk-booking"]').click()
      
      // Verify success
      cy.get('[data-testid="bulk-booking-success"]').should('be.visible')
      cy.get('[data-testid="booked-count"]').should('contain', '3')
    })

    it('TC_BULK_002: Should validate bulk booking conflicts', () => {
      cy.visit('/bulk-booking')
      
      // Add patients with same time slot
      cy.get('input[name="patients[0].name"]').type('Patient 1')
      cy.get('button[data-testid="add-patient"]').click()
      cy.get('input[name="patients[1].name"]').type('Patient 2')
      
      // Select same time for both
      cy.get('select[name="doctor"]').select('Dr. Smith')
      cy.get('[data-testid="date-picker"]').type('2024-12-01')
      cy.get('select[name="patients[0].time"]').select('10:00 AM')
      cy.get('select[name="patients[1].time"]').select('10:00 AM')
      
      // Try to submit
      cy.get('button[data-testid="submit-bulk-booking"]').click()
      
      // Check conflict error
      cy.get('[data-testid="conflict-error"]').should('be.visible')
      cy.get('[data-testid="conflict-error"]').should('contain', 'Time slot conflict')
    })
  })
})
