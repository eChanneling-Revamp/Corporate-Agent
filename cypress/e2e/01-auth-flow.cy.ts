/// <reference types="cypress" />

describe('Authentication Flow E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  context('Login Flow', () => {
    it('TC_AUTH_001: Should successfully login with valid credentials', () => {
      cy.visit('/auth/login')
      
      // Check page elements
      cy.get('h1').should('contain', 'Login')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      
      // Enter credentials
      cy.get('input[name="email"]').type('user@example.com')
      cy.get('input[name="password"]').type('Password123!')
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Verify successful login
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome')
      
      // Check localStorage for token
      cy.window().its('localStorage.token').should('exist')
    })

    it('TC_AUTH_002: Should show error for invalid credentials', () => {
      cy.visit('/auth/login')
      
      cy.get('input[name="email"]').type('invalid@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Check error message
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials')
      
      // Should stay on login page
      cy.url().should('include', '/auth/login')
    })

    it('TC_AUTH_003: Should validate required fields', () => {
      cy.visit('/auth/login')
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click()
      
      // Check validation messages
      cy.get('input[name="email"]').parent().find('.error-message')
        .should('contain', 'Email is required')
      cy.get('input[name="password"]').parent().find('.error-message')
        .should('contain', 'Password is required')
    })

    it('TC_AUTH_004: Should validate email format', () => {
      cy.visit('/auth/login')
      
      // Enter invalid email format
      cy.get('input[name="email"]').type('invalidemail')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('button[type="submit"]').click()
      
      // Check validation message
      cy.get('input[name="email"]').parent().find('.error-message')
        .should('contain', 'valid email')
    })

    it('TC_AUTH_005: Should handle password visibility toggle', () => {
      cy.visit('/auth/login')
      
      // Check initial state
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
      
      // Toggle visibility
      cy.get('[data-testid="toggle-password"]').click()
      cy.get('input[name="password"]').should('have.attr', 'type', 'text')
      
      // Toggle back
      cy.get('[data-testid="toggle-password"]').click()
      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
    })

    it('TC_AUTH_006: Should handle remember me functionality', () => {
      cy.visit('/auth/login')
      
      // Check remember me
      cy.get('input[name="rememberMe"]').check()
      
      // Login
      cy.get('input[name="email"]').type('user@example.com')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('button[type="submit"]').click()
      
      // Check if credentials are stored
      cy.window().its('localStorage.rememberMe').should('equal', 'true')
    })
  })

  context('Registration Flow', () => {
    it('TC_REG_001: Should successfully register new user', () => {
      cy.visit('/auth/register')
      
      // Fill registration form
      cy.get('input[name="firstName"]').type('John')
      cy.get('input[name="lastName"]').type('Doe')
      cy.get('input[name="email"]').type('newuser@example.com')
      cy.get('input[name="phone"]').type('0771234567')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('Password123!')
      cy.get('input[name="terms"]').check()
      
      // Submit form
      cy.get('button[type="submit"]').click()
      
      // Verify successful registration
      cy.url().should('include', '/auth/login')
      cy.get('[data-testid="success-message"]').should('contain', 'Registration successful')
    })

    it('TC_REG_002: Should validate password requirements', () => {
      cy.visit('/auth/register')
      
      // Enter weak password
      cy.get('input[name="password"]').type('weak')
      cy.get('input[name="password"]').blur()
      
      // Check password requirements
      cy.get('[data-testid="password-requirements"]').should('be.visible')
      cy.get('[data-testid="requirement-length"]').should('have.class', 'error')
      cy.get('[data-testid="requirement-uppercase"]').should('have.class', 'error')
      cy.get('[data-testid="requirement-number"]').should('have.class', 'error')
      cy.get('[data-testid="requirement-special"]').should('have.class', 'error')
    })

    it('TC_REG_003: Should validate password confirmation match', () => {
      cy.visit('/auth/register')
      
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('DifferentPassword123!')
      cy.get('input[name="confirmPassword"]').blur()
      
      // Check error message
      cy.get('input[name="confirmPassword"]').parent().find('.error-message')
        .should('contain', 'Passwords don\'t match')
    })

    it('TC_REG_004: Should validate phone number format', () => {
      cy.visit('/auth/register')
      
      // Test invalid phone formats
      cy.get('input[name="phone"]').type('123')
      cy.get('input[name="phone"]').blur()
      cy.get('input[name="phone"]').parent().find('.error-message')
        .should('contain', 'Invalid phone')
      
      // Test valid format
      cy.get('input[name="phone"]').clear().type('0771234567')
      cy.get('input[name="phone"]').blur()
      cy.get('input[name="phone"]').parent().find('.error-message').should('not.exist')
    })
  })

  context('Logout Flow', () => {
    beforeEach(() => {
      // Login first
      cy.login('user@example.com', 'Password123!')
    })

    it('TC_LOGOUT_001: Should successfully logout', () => {
      // Click logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-btn"]').click()
      
      // Verify logout
      cy.url().should('include', '/auth/login')
      cy.window().its('localStorage.token').should('not.exist')
    })

    it('TC_LOGOUT_002: Should clear all session data on logout', () => {
      // Store some data
      cy.window().then(win => {
        win.localStorage.setItem('userData', 'test')
        win.sessionStorage.setItem('sessionData', 'test')
      })
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-btn"]').click()
      
      // Verify all data cleared
      cy.window().its('localStorage.userData').should('not.exist')
      cy.window().its('sessionStorage.sessionData').should('not.exist')
    })
  })

  context('Password Reset Flow', () => {
    it('TC_RESET_001: Should request password reset', () => {
      cy.visit('/auth/login')
      
      // Click forgot password
      cy.get('a[href*="forgot-password"]').click()
      
      // Enter email
      cy.get('input[name="email"]').type('user@example.com')
      cy.get('button[type="submit"]').click()
      
      // Verify success message
      cy.get('[data-testid="success-message"]')
        .should('contain', 'Password reset link sent')
    })

    it('TC_RESET_002: Should validate email exists for reset', () => {
      cy.visit('/auth/forgot-password')
      
      // Enter non-existent email
      cy.get('input[name="email"]').type('nonexistent@example.com')
      cy.get('button[type="submit"]').click()
      
      // Check error message
      cy.get('[data-testid="error-message"]')
        .should('contain', 'Email not found')
    })
  })

  context('Session Management', () => {
    it('TC_SESSION_001: Should maintain session on page refresh', () => {
      // Login
      cy.login('user@example.com', 'Password123!')
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="welcome-message"]').should('be.visible')
    })

    it('TC_SESSION_002: Should redirect to login when token expires', () => {
      // Login
      cy.login('user@example.com', 'Password123!')
      
      // Simulate token expiry
      cy.window().then(win => {
        win.localStorage.setItem('token', 'expired-token')
      })
      
      // Try to access protected route
      cy.visit('/appointments')
      
      // Should redirect to login
      cy.url().should('include', '/auth/login')
      cy.get('[data-testid="error-message"]').should('contain', 'Session expired')
    })
  })
})
