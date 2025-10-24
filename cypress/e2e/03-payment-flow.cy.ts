/// <reference types="cypress" />

describe('Payment Process E2E Tests', () => {
  beforeEach(() => {
    // Login and create an appointment
    cy.login('user@example.com', 'Password123!')
    
    // Mock appointment data
    cy.mockAPIResponse('appointments/pending', {
      id: 'APT-001',
      doctor: 'Dr. Smith',
      date: '2024-12-01',
      time: '10:00 AM',
      amount: 5000,
      status: 'pending_payment'
    })
  })

  context('Payment Methods', () => {
    beforeEach(() => {
      cy.visit('/payments/APT-001')
    })

    it('TC_PAY_001: Should process credit card payment successfully', () => {
      // Select credit card payment
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Fill card details
      cy.get('input[name="cardNumber"]').type('4111111111111111')
      cy.get('input[name="cardName"]').type('John Doe')
      cy.get('input[name="expiryMonth"]').select('12')
      cy.get('input[name="expiryYear"]').select('2025')
      cy.get('input[name="cvv"]').type('123')
      
      // Submit payment
      cy.get('button[data-testid="pay-now"]').click()
      
      // Verify 3D Secure (if applicable)
      cy.get('[data-testid="3ds-frame"]', { timeout: 10000 }).then($frame => {
        if ($frame.length) {
          cy.get('[data-testid="3ds-confirm"]').click()
        }
      })
      
      // Verify payment success
      cy.get('[data-testid="payment-success"]', { timeout: 15000 }).should('be.visible')
      cy.get('[data-testid="transaction-id"]').should('exist')
      cy.get('[data-testid="payment-amount"]').should('contain', '5,000')
      
      // Verify receipt generation
      cy.get('button[data-testid="download-receipt"]').should('be.visible')
    })

    it('TC_PAY_002: Should validate credit card number', () => {
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Test invalid card number
      cy.get('input[name="cardNumber"]').type('1234567890123456')
      cy.get('input[name="cardNumber"]').blur()
      
      // Check validation error
      cy.get('[data-testid="card-error"]').should('contain', 'Invalid card number')
      
      // Test valid card number
      cy.get('input[name="cardNumber"]').clear().type('4111111111111111')
      cy.get('input[name="cardNumber"]').blur()
      cy.get('[data-testid="card-error"]').should('not.exist')
      
      // Check card type detection
      cy.get('[data-testid="card-type"]').should('contain', 'Visa')
    })

    it('TC_PAY_003: Should handle debit card payment', () => {
      cy.get('[data-testid="payment-method-debit"]').click()
      
      // Fill debit card details
      cy.get('input[name="cardNumber"]').type('5555555555554444')
      cy.get('input[name="cardName"]').type('Jane Doe')
      cy.get('input[name="expiryMonth"]').select('06')
      cy.get('input[name="expiryYear"]').select('2026')
      cy.get('input[name="cvv"]').type('456')
      
      // Add billing address
      cy.get('input[name="billingAddress"]').type('123 Main St')
      cy.get('input[name="city"]').type('Colombo')
      cy.get('input[name="postalCode"]').type('00100')
      
      // Submit payment
      cy.get('button[data-testid="pay-now"]').click()
      
      // Verify success
      cy.get('[data-testid="payment-success"]', { timeout: 10000 }).should('be.visible')
    })

    it('TC_PAY_004: Should process bank transfer', () => {
      cy.get('[data-testid="payment-method-bank"]').click()
      
      // Select bank
      cy.get('select[name="bank"]').select('Commercial Bank')
      
      // View transfer instructions
      cy.get('[data-testid="transfer-instructions"]').should('be.visible')
      cy.get('[data-testid="reference-number"]').should('exist')
      cy.get('[data-testid="account-number"]').should('contain', '1234567890')
      cy.get('[data-testid="account-name"]').should('contain', 'eChannelling')
      
      // Upload payment slip
      cy.get('input[type="file"]').selectFile('cypress/fixtures/payment-slip.jpg')
      
      // Submit transfer details
      cy.get('input[name="transactionRef"]').type('TRX123456789')
      cy.get('button[data-testid="confirm-transfer"]').click()
      
      // Verify pending status
      cy.get('[data-testid="transfer-pending"]').should('be.visible')
      cy.get('[data-testid="status-message"]').should('contain', 'awaiting confirmation')
    })

    it('TC_PAY_005: Should handle mobile wallet payment', () => {
      cy.get('[data-testid="payment-method-wallet"]').click()
      
      // Select wallet provider
      cy.get('[data-testid="wallet-dialog"]').should('be.visible')
      cy.get('[data-testid="wallet-ez-cash"]').click()
      
      // Enter mobile number
      cy.get('input[name="mobileNumber"]').type('0771234567')
      cy.get('button[data-testid="send-otp"]').click()
      
      // Enter OTP
      cy.get('[data-testid="otp-input"]').should('be.visible')
      cy.get('input[name="otp"]').type('123456')
      cy.get('button[data-testid="verify-otp"]').click()
      
      // Confirm payment
      cy.get('[data-testid="wallet-confirm"]').click()
      
      // Verify success
      cy.get('[data-testid="payment-success"]').should('be.visible')
    })
  })

  context('Payment Validation', () => {
    beforeEach(() => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
    })

    it('TC_PAY_006: Should validate CVV format', () => {
      // Test 3-digit CVV
      cy.get('input[name="cvv"]').type('12')
      cy.get('input[name="cvv"]').blur()
      cy.get('[data-testid="cvv-error"]').should('contain', 'CVV must be 3 digits')
      
      // Test valid CVV
      cy.get('input[name="cvv"]').clear().type('123')
      cy.get('input[name="cvv"]').blur()
      cy.get('[data-testid="cvv-error"]').should('not.exist')
      
      // Test 4-digit CVV for Amex
      cy.get('input[name="cardNumber"]').clear().type('378282246310005')
      cy.get('input[name="cvv"]').clear().type('1234')
      cy.get('input[name="cvv"]').blur()
      cy.get('[data-testid="cvv-error"]').should('not.exist')
    })

    it('TC_PAY_007: Should validate expiry date', () => {
      // Test past expiry date
      cy.get('input[name="expiryMonth"]').select('01')
      cy.get('input[name="expiryYear"]').select('2020')
      cy.get('input[name="expiryYear"]').blur()
      
      cy.get('[data-testid="expiry-error"]').should('contain', 'Card has expired')
      
      // Test valid expiry
      cy.get('input[name="expiryMonth"]').select('12')
      cy.get('input[name="expiryYear"]').select('2025')
      cy.get('[data-testid="expiry-error"]').should('not.exist')
    })

    it('TC_PAY_008: Should enforce payment amount limits', () => {
      // Mock high amount appointment
      cy.mockAPIResponse('appointments/pending', {
        id: 'APT-002',
        amount: 1000000
      })
      
      cy.visit('/payments/APT-002')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Check for amount warning
      cy.get('[data-testid="amount-warning"]').should('be.visible')
      cy.get('[data-testid="amount-warning"]').should('contain', 'exceeds limit')
      
      // Should require additional verification
      cy.get('[data-testid="additional-verification"]').should('be.visible')
    })
  })

  context('Payment Failures', () => {
    it('TC_PAY_009: Should handle declined card', () => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Use test card that triggers decline
      cy.get('input[name="cardNumber"]').type('4000000000000002')
      cy.get('input[name="cardName"]').type('John Doe')
      cy.get('input[name="expiryMonth"]').select('12')
      cy.get('input[name="expiryYear"]').select('2025')
      cy.get('input[name="cvv"]').type('123')
      
      cy.get('button[data-testid="pay-now"]').click()
      
      // Verify decline message
      cy.get('[data-testid="payment-failed"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Card was declined')
      
      // Check retry option
      cy.get('button[data-testid="retry-payment"]').should('be.visible')
    })

    it('TC_PAY_010: Should handle insufficient funds', () => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Use test card for insufficient funds
      cy.get('input[name="cardNumber"]').type('4000000000009995')
      cy.get('input[name="cardName"]').type('John Doe')
      cy.get('input[name="expiryMonth"]').select('12')
      cy.get('input[name="expiryYear"]').select('2025')
      cy.get('input[name="cvv"]').type('123')
      
      cy.get('button[data-testid="pay-now"]').click()
      
      // Verify error
      cy.get('[data-testid="payment-failed"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Insufficient funds')
    })

    it('TC_PAY_011: Should handle network timeout', () => {
      // Simulate slow network
      cy.setNetworkCondition('Slow 3G')
      
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Fill card details
      cy.get('input[name="cardNumber"]').type('4111111111111111')
      cy.get('input[name="cardName"]').type('John Doe')
      cy.get('input[name="expiryMonth"]').select('12')
      cy.get('input[name="expiryYear"]').select('2025')
      cy.get('input[name="cvv"]').type('123')
      
      // Mock timeout response
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 408,
        body: { error: 'Request timeout' },
        delay: 30000
      })
      
      cy.get('button[data-testid="pay-now"]').click()
      
      // Check timeout message
      cy.get('[data-testid="timeout-error"]', { timeout: 35000 }).should('be.visible')
      cy.get('[data-testid="retry-payment"]').should('be.visible')
    })
  })

  context('Refunds and Cancellations', () => {
    it('TC_PAY_012: Should process refund for cancelled appointment', () => {
      // Navigate to completed payment
      cy.visit('/appointments')
      cy.get('[data-testid="appointment-card"][data-status="paid"]').first().click()
      
      // Request cancellation
      cy.get('button[data-testid="cancel-appointment"]').click()
      cy.get('textarea[name="reason"]').type('Unable to attend')
      cy.get('button[data-testid="confirm-cancel"]').click()
      
      // Check refund initiation
      cy.get('[data-testid="refund-initiated"]').should('be.visible')
      cy.get('[data-testid="refund-amount"]').should('exist')
      cy.get('[data-testid="refund-timeline"]').should('contain', '3-5 business days')
    })

    it('TC_PAY_013: Should handle partial refunds', () => {
      cy.visit('/appointments')
      cy.get('[data-testid="appointment-card"][data-status="paid"]').first().click()
      
      // Request rescheduling with fee difference
      cy.get('button[data-testid="reschedule"]').click()
      
      // Select cheaper time slot
      cy.get('[data-testid="time-slot"][data-price="3000"]').click()
      cy.get('button[data-testid="confirm-reschedule"]').click()
      
      // Verify partial refund
      cy.get('[data-testid="partial-refund"]').should('be.visible')
      cy.get('[data-testid="refund-amount"]').should('contain', '2,000')
    })
  })

  context('Payment History', () => {
    it('TC_PAY_014: Should display payment history', () => {
      cy.visit('/payments')
      
      // Check payment list
      cy.get('[data-testid="payment-history"]').should('be.visible')
      cy.get('[data-testid="payment-item"]').should('have.length.at.least', 1)
      
      // Check payment details
      cy.get('[data-testid="payment-item"]').first().within(() => {
        cy.get('[data-testid="payment-date"]').should('exist')
        cy.get('[data-testid="payment-amount"]').should('exist')
        cy.get('[data-testid="payment-status"]').should('exist')
        cy.get('[data-testid="payment-method"]').should('exist')
      })
    })

    it('TC_PAY_015: Should download payment receipts', () => {
      cy.visit('/payments')
      
      // Click on payment
      cy.get('[data-testid="payment-item"]').first().click()
      
      // Download receipt
      cy.get('button[data-testid="download-receipt"]').click()
      
      // Verify download
      cy.readFile('cypress/downloads/receipt-APT-001.pdf').should('exist')
    })

    it('TC_PAY_016: Should filter payment history', () => {
      cy.visit('/payments')
      
      // Filter by date range
      cy.get('input[name="fromDate"]').type('2024-01-01')
      cy.get('input[name="toDate"]').type('2024-12-31')
      
      // Filter by status
      cy.get('select[name="status"]').select('Completed')
      
      // Apply filters
      cy.get('button[data-testid="apply-filters"]').click()
      
      // Verify filtered results
      cy.get('[data-testid="payment-item"]').each($item => {
        cy.wrap($item).find('[data-testid="payment-status"]').should('contain', 'Completed')
      })
    })
  })

  context('Payment Security', () => {
    it('TC_PAY_017: Should mask sensitive card information', () => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Enter card number
      cy.get('input[name="cardNumber"]').type('4111111111111111')
      cy.get('input[name="cardNumber"]').blur()
      
      // Check if card is masked
      cy.get('input[name="cardNumber"]').should('have.value', '4111 **** **** 1111')
      
      // CVV should always be masked
      cy.get('input[name="cvv"]').type('123')
      cy.get('input[name="cvv"]').should('have.attr', 'type', 'password')
    })

    it('TC_PAY_018: Should enforce SSL/TLS on payment page', () => {
      cy.visit('/payments/APT-001')
      
      // Check for secure connection indicator
      cy.location('protocol').should('eq', 'https:')
      cy.get('[data-testid="secure-badge"]').should('be.visible')
      cy.get('[data-testid="secure-badge"]').should('contain', 'Secure Payment')
    })

    it('TC_PAY_019: Should timeout inactive payment sessions', () => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Fill partial details
      cy.get('input[name="cardNumber"]').type('4111111111111111')
      
      // Wait for session timeout (mock with shorter time)
      cy.clock()
      cy.tick(900000) // 15 minutes
      
      // Try to submit
      cy.get('button[data-testid="pay-now"]').click()
      
      // Should show session expired
      cy.get('[data-testid="session-expired"]').should('be.visible')
      cy.url().should('include', '/auth/login')
    })
  })
})
