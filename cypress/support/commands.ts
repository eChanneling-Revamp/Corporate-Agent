/// <reference types="cypress" />

// Custom command declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      mockAPIResponse(endpoint: string, response: any, method?: string): Chainable<void>
      checkA11y(context?: any, options?: any): Chainable<void>
      setNetworkCondition(condition: string): Chainable<void>
      waitForPageLoad(): Chainable<void>
      selectDoctor(doctorName: string): Chainable<void>
      bookAppointment(date: string, timeSlot: string): Chainable<void>
      makePayment(cardNumber: string, cvv: string): Chainable<void>
      checkNotification(message: string): Chainable<void>
      testResponsive(): Chainable<void>
      installPWA(): Chainable<void>
      checkWebSocket(): Chainable<void>
      measurePerformance(name: string): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
  cy.window().its('localStorage').should('have.property', 'token')
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
  cy.visit('/auth/login')
})

// Mock API response
Cypress.Commands.add('mockAPIResponse', (endpoint: string, response: any, method = 'GET') => {
  cy.intercept(method, `**/api/${endpoint}`, {
    statusCode: 200,
    body: response,
    delay: 100
  }).as(`${method}_${endpoint}`)
})

// Accessibility check (requires cypress-axe)
Cypress.Commands.add('checkA11y', (context?: any, options?: any) => {
  cy.injectAxe()
  cy.checkA11y(context, options, (violations) => {
    if (violations.length) {
      cy.task('table', violations)
    }
  })
})

// Set network condition
Cypress.Commands.add('setNetworkCondition', (condition: string) => {
  cy.log(`Setting network condition to: ${condition}`)
  
  const conditions: Record<string, any> = {
    '3G': { downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 40 },
    'Slow 3G': { downloadThroughput: 450 * 1024 / 8, uploadThroughput: 150 * 1024 / 8, latency: 400 },
    'Fast 3G': { downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 20 },
    '4G': { downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 20 },
    'Offline': { offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
  }

  if (condition === 'Offline') {
    cy.intercept('*', { forceNetworkError: true })
  } else if (conditions[condition]) {
    // Simulate network delay
    cy.intercept('**/*', (req) => {
      req.reply((res) => {
        res.delay(conditions[condition].latency)
      })
    })
  }
})

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.document().its('readyState').should('eq', 'complete')
  cy.get('[data-loading]').should('not.exist')
  cy.wait(500) // Additional wait for dynamic content
})

// Select doctor for appointment
Cypress.Commands.add('selectDoctor', (doctorName: string) => {
  cy.visit('/doctor-search')
  cy.get('input[placeholder*="Search"]').type(doctorName)
  cy.get('[data-testid="doctor-card"]').contains(doctorName).click()
  cy.url().should('include', '/appointment-booking')
})

// Book appointment
Cypress.Commands.add('bookAppointment', (date: string, timeSlot: string) => {
  cy.get('[data-testid="date-picker"]').type(date)
  cy.get('[data-testid="time-slot"]').contains(timeSlot).click()
  cy.get('[data-testid="book-appointment-btn"]').click()
  cy.get('[data-testid="confirmation-modal"]').should('be.visible')
})

// Make payment
Cypress.Commands.add('makePayment', (cardNumber: string, cvv: string) => {
  cy.get('input[name="cardNumber"]').type(cardNumber)
  cy.get('input[name="cvv"]').type(cvv)
  cy.get('input[name="expiryDate"]').type('12/25')
  cy.get('button[data-testid="pay-now"]').click()
  cy.get('[data-testid="payment-success"]', { timeout: 10000 }).should('be.visible')
})

// Check notification
Cypress.Commands.add('checkNotification', (message: string) => {
  cy.get('[data-testid="notification"]', { timeout: 5000 })
    .should('be.visible')
    .and('contain', message)
})

// Test responsive design
Cypress.Commands.add('testResponsive', () => {
  const viewports: Array<[number, number, string]> = [
    [375, 667, 'iPhone 8'],
    [414, 896, 'iPhone 11'],
    [768, 1024, 'iPad'],
    [1024, 768, 'Desktop Small'],
    [1920, 1080, 'Desktop Large']
  ]

  viewports.forEach(([width, height, device]) => {
    cy.viewport(width, height)
    cy.wait(500)
    cy.screenshot(`responsive-${device}`)
  })
})

// Install PWA
Cypress.Commands.add('installPWA', () => {
  cy.window().then((win) => {
    // Check if PWA can be installed
    cy.wrap(win).its('navigator.serviceWorker').should('exist')
    
    // Trigger install event
    win.dispatchEvent(new Event('beforeinstallprompt'))
    
    // Check for install button
    cy.get('[data-testid="pwa-install-btn"]').should('be.visible').click()
  })
})

// Check WebSocket connection
Cypress.Commands.add('checkWebSocket', () => {
  cy.window().then((win) => {
    const ws = new WebSocket('ws://localhost:3000')
    
    cy.wrap(new Promise((resolve, reject) => {
      ws.onopen = () => resolve('connected')
      ws.onerror = (error) => reject(error)
      
      setTimeout(() => reject('timeout'), 5000)
    })).should('eq', 'connected')
    
    ws.close()
  })
})

// Measure performance
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    const perfData = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const metrics = {
      name,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive,
      firstPaint: 0,
      firstContentfulPaint: 0
    }
    
    // Get paint timings
    const paintEntries = win.performance.getEntriesByType('paint')
    paintEntries.forEach((entry: any) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime
      }
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime
      }
    })
    
    cy.task('log', `Performance Metrics for ${name}:`)
    cy.task('table', metrics)
    
    return cy.wrap(metrics)
  })
})

export {}
