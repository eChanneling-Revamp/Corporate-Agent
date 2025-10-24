// ***********************************************************
// This file is processed and loaded automatically before test files
// ***********************************************************

import './commands'
import '@testing-library/cypress/add-commands'
import 'cypress-real-events/support'

// Code coverage support
import '@cypress/code-coverage/support'

// Custom error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Cannot read properties of null')) {
    return false
  }
  return true
})

// Network condition presets
export const networkConditions = {
  '3G': {
    downloadThroughput: 1.5 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 40
  },
  'Slow 3G': {
    downloadThroughput: 450 * 1024 / 8,
    uploadThroughput: 150 * 1024 / 8,
    latency: 400
  },
  'Fast 3G': {
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 20
  },
  '4G': {
    downloadThroughput: 4 * 1024 * 1024 / 8,
    uploadThroughput: 3 * 1024 * 1024 / 8,
    latency: 20
  },
  'Offline': {
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  }
}

// Device viewport presets
export const devices = {
  'iPhone 12': { width: 390, height: 844 },
  'iPhone 12 Pro Max': { width: 428, height: 926 },
  'Samsung Galaxy S21': { width: 384, height: 854 },
  'iPad': { width: 820, height: 1180 },
  'iPad Pro': { width: 1024, height: 1366 }
}

// Before each test
beforeEach(() => {
  // Clear local storage
  cy.clearLocalStorage()
  
  // Clear cookies
  cy.clearCookies()
  
  // Reset viewport
  cy.viewport(1280, 720)
})
