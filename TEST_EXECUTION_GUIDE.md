# 🧪 Comprehensive Test Execution Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Test Environment Setup](#test-environment-setup)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Debugging Failed Tests](#debugging-failed-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Performance Testing](#performance-testing)
8. [Mobile Testing](#mobile-testing)
9. [Test Reports](#test-reports)
10. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version

# Install dependencies
npm install

# Start the development server
npm run dev

# In another terminal, run tests
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode
```

## 🔧 Test Environment Setup

### 1. Install Dependencies
```bash
# Install all project dependencies
npm install

# Install Cypress and testing tools
npm install --save-dev cypress @testing-library/cypress cypress-real-events @cypress/code-coverage nyc start-server-and-test
```

### 2. Environment Configuration
Create `.env.test` file:
```env
# Test Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_test_database_url
NEXTAUTH_SECRET=test-secret-key
JWT_SECRET=test-jwt-secret
```

### 3. Database Setup
```bash
# Set up test database
npm run db:generate
npm run db:migrate
npm run db:seed  # Seed test data
```

## 🏃 Running Tests

### Interactive Mode (Recommended for Development)
```bash
# Open Cypress Test Runner
npm run cypress:open

# Select E2E Testing
# Choose a browser (Chrome recommended)
# Click on a test file to run
```

### Headless Mode (CI/CD)
```bash
# Run all tests headless
npm run cypress:run

# Run with specific browser
npm run cypress:run:chrome
npm run cypress:run:firefox
npm run cypress:run:edge
```

### Run Specific Test Suites
```bash
# Authentication tests
npm run test:auth

# Booking flow tests
npm run test:booking

# Payment tests
npm run test:payment

# Real-time features
npm run test:realtime

# Mobile & PWA tests
npm run test:mobile

# Run all test suites sequentially
npm run test:all
```

### Run with Server Auto-Start
```bash
# Automatically starts dev server and runs tests
npm run test:e2e

# Headless mode with server
npm run test:e2e:headless
```

## 📦 Test Suites

### 1. Authentication Flow (01-auth-flow.cy.ts)
Tests login, registration, password reset, and session management.
```bash
npm run test:auth
```
**Coverage:** 
- Login validation
- Registration process
- Password requirements
- Session persistence
- Logout functionality

### 2. Booking Flow (02-booking-flow.cy.ts)
Tests doctor search, appointment booking, and management.
```bash
npm run test:booking
```
**Coverage:**
- Doctor search & filtering
- Appointment scheduling
- Time slot selection
- Appointment modification
- Bulk booking

### 3. Payment Process (03-payment-flow.cy.ts)
Tests payment methods, validation, and refunds.
```bash
npm run test:payment
```
**Coverage:**
- Credit/debit card payments
- Bank transfers
- Mobile wallets
- Payment validation
- Refund processing

### 4. Real-time Features (04-realtime-features.cy.ts)
Tests WebSocket connections and live updates.
```bash
npm run test:realtime
```
**Coverage:**
- WebSocket connections
- Real-time notifications
- Connection recovery
- Poor network handling
- Live data updates

### 5. Mobile & PWA (05-mobile-pwa.cy.ts)
Tests responsive design and PWA features.
```bash
npm run test:mobile
```
**Coverage:**
- Responsive layouts
- Touch interactions
- PWA installation
- Offline functionality
- Mobile performance

## 🐛 Debugging Failed Tests

### 1. Using Cypress Debug Tools
```javascript
// Add debugger in test
cy.get('[data-testid="element"]').then(() => {
  debugger; // Execution will pause here
});

// Use cy.debug()
cy.get('[data-testid="element"]').debug();

// Use cy.pause()
cy.get('[data-testid="element"]').pause();
```

### 2. Screenshots & Videos
Failed tests automatically capture:
- Screenshots at failure point
- Video recordings of entire test run

Location: `cypress/screenshots/` and `cypress/videos/`

### 3. Verbose Logging
```bash
# Run with debug logging
DEBUG=cypress:* npm run cypress:run

# Specific debug namespace
DEBUG=cypress:server:request npm run cypress:run
```

### 4. Interactive Debugging
```bash
# Open Chrome DevTools during test
npm run cypress:open
# Then press F12 while test is running
```

## 🔄 CI/CD Integration

### GitHub Actions
Create `.github/workflows/cypress.yml`:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e:headless
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-videos
          path: cypress/videos
```

### Vercel Integration
```bash
# Add to vercel.json
{
  "build": {
    "env": {
      "CYPRESS_INSTALL_BINARY": "0"
    }
  },
  "functions": {
    "api/test-webhook.js": {
      "maxDuration": 60
    }
  }
}
```

## ⚡ Performance Testing

### 1. Measure Page Load
```bash
# Run performance tests
npm run cypress:run -- --spec "cypress/e2e/performance/**"
```

### 2. Network Throttling
```javascript
// In test file
cy.setNetworkCondition('3G'); // or 'Slow 3G', '4G'
```

### 3. Performance Metrics
```javascript
// Capture performance metrics
cy.measurePerformance('Dashboard Load');
```

## 📱 Mobile Testing

### 1. Mobile Viewport Testing
```bash
# Run with mobile viewport
npm run cypress:run:mobile

# Run with tablet viewport
npm run cypress:run:tablet
```

### 2. Device Emulation
```javascript
// In cypress.config.ts
{
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--user-agent="Mobile"');
          launchOptions.args.push('--window-size=375,667');
        }
        return launchOptions;
      });
    }
  }
}
```

### 3. Touch Events
```javascript
// Simulate touch events
cy.get('element')
  .trigger('touchstart')
  .trigger('touchmove', { touches: [{ pageX: 100, pageY: 200 }] })
  .trigger('touchend');
```

## 📊 Test Reports

### 1. Generate Coverage Report
```bash
# Run tests with coverage
npm run cypress:coverage

# Generate HTML report
npm run cypress:report

# View report
open coverage/index.html
```

### 2. Custom Reporters
```bash
# Install mochawesome reporter
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator

# Configure in cypress.config.ts
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'cypress/results',
  overwrite: false,
  html: true,
  json: true
}
```

### 3. Test Summary
```bash
# Generate test summary
npm run cypress:run -- --reporter json > test-results.json
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Tests Failing Locally but Passing in CI
```bash
# Clear Cypress cache
npx cypress cache clear
npx cypress install

# Reset test database
npm run db:migrate:reset
npm run db:seed
```

#### 2. Timeout Errors
```javascript
// Increase timeout in cypress.config.ts
defaultCommandTimeout: 10000,  // 10 seconds
pageLoadTimeout: 30000,       // 30 seconds
requestTimeout: 10000,        // 10 seconds
responseTimeout: 10000        // 10 seconds
```

#### 3. Element Not Found
```javascript
// Add data-testid attributes
<button data-testid="submit-button">Submit</button>

// Use in test
cy.get('[data-testid="submit-button"]').click();
```

#### 4. Flaky Tests
```javascript
// Add retries in cypress.config.ts
retries: {
  runMode: 2,    // Retry failed tests twice in CI
  openMode: 0    // No retries in interactive mode
}
```

#### 5. WebSocket Connection Issues
```javascript
// Mock WebSocket in tests
cy.window().then((win) => {
  win.WebSocket = MockWebSocket;
});
```

## 📝 Best Practices

### 1. Test Structure
```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    cy.visit('/page');
    
    // Act
    cy.get('[data-testid="button"]').click();
    
    // Assert
    cy.get('[data-testid="result"]').should('be.visible');
  });

  afterEach(() => {
    // Cleanup
  });
});
```

### 2. Custom Commands
```javascript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="submit"]').click();
});

// Use in tests
cy.login('user@example.com', 'password');
```

### 3. Page Objects
```javascript
// cypress/support/pages/LoginPage.ts
class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email: string) {
    cy.get('[data-testid="email"]').type(email);
  }

  fillPassword(password: string) {
    cy.get('[data-testid="password"]').type(password);
  }

  submit() {
    cy.get('[data-testid="submit"]').click();
  }
}

export default new LoginPage();
```

### 4. Test Data Management
```javascript
// cypress/fixtures/users.json
{
  "validUser": {
    "email": "test@example.com",
    "password": "Password123!"
  },
  "invalidUser": {
    "email": "invalid@example.com",
    "password": "wrong"
  }
}

// Use in tests
cy.fixture('users').then((users) => {
  cy.login(users.validUser.email, users.validUser.password);
});
```

## 📞 Support & Resources

### Documentation
- [Cypress Documentation](https://docs.cypress.io)
- [Testing Best Practices](https://testingjavascript.com)
- [Project Test Cases](./test-documentation)

### Contact
- **QA Team:** qa@echannelling.com
- **Dev Support:** dev@echannelling.com
- **Slack Channel:** #testing-support

### Useful Commands Reference
```bash
# Quick command reference
npm run cypress:open          # Open Cypress GUI
npm run cypress:run           # Run all tests headless
npm run test:e2e              # Run with auto server start
npm run test:auth             # Run auth tests only
npm run test:booking          # Run booking tests only
npm run test:payment          # Run payment tests only
npm run test:realtime         # Run realtime tests only
npm run test:mobile           # Run mobile tests only
npm run test:all              # Run all test suites
npm run cypress:coverage      # Run with code coverage
npm run cypress:report        # Generate coverage report
```

---

**Last Updated:** October 24, 2024
**Version:** 1.0.0
**Maintainer:** Frontend QA Team
