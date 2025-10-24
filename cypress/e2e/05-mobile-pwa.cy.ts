/// <reference types="cypress" />

describe('Mobile & PWA E2E Tests', () => {
  context('Mobile Responsive Design', () => {
    const devices = [
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'Samsung Galaxy S21', width: 384, height: 854 },
      { name: 'iPad', width: 820, height: 1180 },
      { name: 'iPad Pro', width: 1024, height: 1366 }
    ]

    devices.forEach(device => {
      it(`TC_MOB_001: Should display correctly on ${device.name}`, () => {
        cy.viewport(device.width, device.height)
        cy.visit('/dashboard')
        
        // Check mobile menu
        if (device.width < 768) {
          cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible')
          cy.get('[data-testid="desktop-nav"]').should('not.be.visible')
          
          // Test hamburger menu
          cy.get('[data-testid="mobile-menu-toggle"]').click()
          cy.get('[data-testid="mobile-menu"]').should('be.visible')
        } else {
          cy.get('[data-testid="desktop-nav"]').should('be.visible')
          cy.get('[data-testid="mobile-menu-toggle"]').should('not.exist')
        }
        
        // Check layout adjustments
        cy.get('[data-testid="main-content"]').should('be.visible')
        cy.screenshot(`mobile-${device.name}-dashboard`)
      })
    })

    it('TC_MOB_002: Should handle orientation changes', () => {
      // Portrait
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      cy.get('[data-testid="layout"]').should('have.class', 'portrait')
      
      // Landscape
      cy.viewport(667, 375)
      cy.get('[data-testid="layout"]').should('have.class', 'landscape')
      
      // Check content reflow
      cy.get('[data-testid="dashboard-cards"]').should('be.visible')
      cy.screenshot('orientation-landscape')
    })

    it('TC_MOB_003: Should have mobile-optimized touch targets', () => {
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      
      // Check button sizes (minimum 44x44 pixels for touch)
      cy.get('button').each($button => {
        cy.wrap($button).then($el => {
          const width = $el.width()
          const height = $el.height()
          expect(width).to.be.at.least(44)
          expect(height).to.be.at.least(44)
        })
      })
      
      // Check link spacing
      cy.get('a').each($link => {
        cy.wrap($link).should('have.css', 'padding')
      })
    })

    it('TC_MOB_004: Should have mobile-optimized forms', () => {
      cy.viewport(375, 667)
      cy.visit('/auth/login')
      
      // Check input field sizes
      cy.get('input').each($input => {
        cy.wrap($input).then($el => {
          const height = $el.height()
          expect(height).to.be.at.least(44)
        })
      })
      
      // Check autocapitalize and autocorrect attributes
      cy.get('input[type="email"]').should('have.attr', 'autocapitalize', 'off')
      cy.get('input[type="email"]').should('have.attr', 'autocorrect', 'off')
      
      // Check numeric keyboard for phone input
      cy.visit('/auth/register')
      cy.get('input[name="phone"]').should('have.attr', 'inputmode', 'numeric')
    })

    it('TC_MOB_005: Should handle mobile navigation', () => {
      cy.viewport(375, 667)
      cy.visit('/dashboard')
      
      // Open mobile menu
      cy.get('[data-testid="mobile-menu-toggle"]').click()
      
      // Navigate to different sections
      cy.get('[data-testid="mobile-menu-item"]').contains('Appointments').click()
      cy.url().should('include', '/appointments')
      
      // Check back navigation
      cy.go('back')
      cy.url().should('include', '/dashboard')
      
      // Test swipe gestures (simulated)
      cy.get('[data-testid="swipeable-content"]')
        .trigger('touchstart', { touches: [{ pageX: 300, pageY: 100 }] })
        .trigger('touchmove', { touches: [{ pageX: 50, pageY: 100 }] })
        .trigger('touchend')
      
      // Check if menu opened via swipe
      cy.get('[data-testid="mobile-menu"]').should('be.visible')
    })
  })

  context('Touch Interactions', () => {
    beforeEach(() => {
      cy.viewport(375, 667)
    })

    it('TC_TOUCH_001: Should handle touch events on buttons', () => {
      cy.visit('/dashboard')
      
      // Test touch on button
      cy.get('[data-testid="primary-action"]')
        .trigger('touchstart')
        .should('have.class', 'active')
        .trigger('touchend')
        .should('not.have.class', 'active')
      
      // Check for touch feedback
      cy.get('[data-testid="primary-action"]').should('have.css', 'transition')
    })

    it('TC_TOUCH_002: Should support swipe gestures', () => {
      cy.visit('/doctor-search')
      
      // Swipe through doctor cards
      cy.get('[data-testid="doctor-carousel"]')
        .trigger('touchstart', { touches: [{ pageX: 300, pageY: 200 }] })
        .trigger('touchmove', { touches: [{ pageX: 100, pageY: 200 }] })
        .trigger('touchend')
      
      // Check next card is visible
      cy.get('[data-testid="doctor-card"][data-index="1"]').should('be.visible')
      
      // Swipe back
      cy.get('[data-testid="doctor-carousel"]')
        .trigger('touchstart', { touches: [{ pageX: 100, pageY: 200 }] })
        .trigger('touchmove', { touches: [{ pageX: 300, pageY: 200 }] })
        .trigger('touchend')
      
      cy.get('[data-testid="doctor-card"][data-index="0"]').should('be.visible')
    })

    it('TC_TOUCH_003: Should handle pinch-to-zoom', () => {
      cy.visit('/appointments/APT-001')
      
      // Open document/image
      cy.get('[data-testid="prescription-image"]').click()
      
      // Simulate pinch-to-zoom
      cy.get('[data-testid="image-viewer"]')
        .trigger('touchstart', {
          touches: [
            { identifier: 1, pageX: 150, pageY: 200 },
            { identifier: 2, pageX: 250, pageY: 200 }
          ]
        })
        .trigger('touchmove', {
          touches: [
            { identifier: 1, pageX: 100, pageY: 200 },
            { identifier: 2, pageX: 300, pageY: 200 }
          ]
        })
        .trigger('touchend')
      
      // Check zoom applied
      cy.get('[data-testid="image-viewer"]').should('have.css', 'transform')
    })

    it('TC_TOUCH_004: Should handle long press', () => {
      cy.visit('/appointments')
      
      // Long press on appointment card
      cy.get('[data-testid="appointment-card"]').first()
        .trigger('touchstart')
        .wait(1000) // Hold for 1 second
        .trigger('touchend')
      
      // Check context menu appears
      cy.get('[data-testid="context-menu"]').should('be.visible')
      cy.get('[data-testid="context-menu-option"]').should('have.length.at.least', 3)
    })

    it('TC_TOUCH_005: Should prevent accidental touches', () => {
      cy.visit('/payments/APT-001')
      cy.get('[data-testid="payment-method-card"]').click()
      
      // Fill payment form
      cy.get('input[name="cardNumber"]').type('4111111111111111')
      cy.get('input[name="cvv"]').type('123')
      
      // Try double-tap on submit (should prevent duplicate submission)
      cy.get('[data-testid="pay-now"]')
        .trigger('touchstart')
        .trigger('touchend')
        .trigger('touchstart')
        .trigger('touchend')
      
      // Should only process once
      cy.get('[data-testid="processing-payment"]').should('have.length', 1)
    })
  })

  context('PWA Installation & Features', () => {
    it('TC_PWA_001: Should show install prompt', () => {
      cy.visit('/')
      
      // Check for install banner
      cy.window().then((win) => {
        // Trigger beforeinstallprompt event
        const event = new Event('beforeinstallprompt')
        event.preventDefault = cy.stub()
        event.prompt = cy.stub()
        win.dispatchEvent(event)
      })
      
      // Check install UI appears
      cy.get('[data-testid="pwa-install-banner"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-testid="install-button"]').should('be.visible')
      cy.get('[data-testid="dismiss-button"]').should('be.visible')
    })

    it('TC_PWA_002: Should install PWA', () => {
      cy.visit('/')
      
      // Mock install event
      cy.window().then((win) => {
        win.mockInstallPrompt = {
          prompt: cy.stub().resolves({ outcome: 'accepted' }),
          userChoice: Promise.resolve({ outcome: 'accepted' })
        }
      })
      
      // Click install
      cy.get('[data-testid="pwa-install-banner"]').should('be.visible')
      cy.get('[data-testid="install-button"]').click()
      
      // Verify installation
      cy.get('[data-testid="install-success"]').should('be.visible')
      cy.get('[data-testid="pwa-install-banner"]').should('not.exist')
    })

    it('TC_PWA_003: Should work offline', () => {
      cy.visit('/')
      
      // Cache some pages
      cy.visit('/dashboard')
      cy.visit('/appointments')
      
      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      // Navigate to cached pages
      cy.visit('/dashboard')
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
      cy.get('[data-testid="main-content"]').should('be.visible')
      
      // Try uncached page
      cy.visit('/doctor-search', { failOnStatusCode: false })
      cy.get('[data-testid="offline-page"]').should('be.visible')
      cy.get('[data-testid="offline-message"]').should('contain', 'You are offline')
    })

    it('TC_PWA_004: Should sync in background', () => {
      cy.visit('/dashboard')
      
      // Register background sync
      cy.window().then((win) => {
        if ('serviceWorker' in win.navigator && 'SyncManager' in win) {
          win.navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('data-sync')
          })
        }
      })
      
      // Go offline and make changes
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      cy.get('[data-testid="edit-profile"]').click()
      cy.get('input[name="phone"]').clear().type('0771234567')
      cy.get('[data-testid="save-changes"]').click()
      
      // Check pending sync
      cy.get('[data-testid="pending-sync"]').should('be.visible')
      
      // Go online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })
      
      // Verify sync completed
      cy.get('[data-testid="sync-success"]', { timeout: 10000 }).should('be.visible')
    })

    it('TC_PWA_005: Should handle push notifications', () => {
      cy.visit('/dashboard')
      
      // Request permission
      cy.window().then((win) => {
        // Mock Notification API
        win.Notification = {
          permission: 'default',
          requestPermission: cy.stub().resolves('granted')
        }
      })
      
      // Enable notifications
      cy.get('[data-testid="enable-notifications"]').click()
      
      // Check permission requested
      cy.window().its('Notification.requestPermission').should('have.been.called')
      
      // Verify subscription
      cy.get('[data-testid="notifications-enabled"]').should('be.visible')
      
      // Test receiving push notification
      cy.window().then((win) => {
        // Simulate push event
        const event = new Event('push')
        event.data = {
          json: () => ({
            title: 'Appointment Reminder',
            body: 'Your appointment is tomorrow at 10:00 AM',
            icon: '/icon-192.png'
          })
        }
        
        if (win.swRegistration) {
          win.swRegistration.dispatchEvent(event)
        }
      })
      
      // Check notification displayed
      cy.get('[data-testid="notification-toast"]').should('contain', 'Appointment Reminder')
    })
  })

  context('Mobile Performance', () => {
    beforeEach(() => {
      cy.viewport(375, 667)
    })

    it('TC_PERF_001: Should load within acceptable time on mobile', () => {
      cy.visit('/dashboard', {
        onBeforeLoad: (win) => {
          win.performance.mark('page-start')
        },
        onLoad: (win) => {
          win.performance.mark('page-end')
          win.performance.measure('page-load', 'page-start', 'page-end')
        }
      })
      
      cy.window().then((win) => {
        const measure = win.performance.getEntriesByName('page-load')[0]
        expect(measure.duration).to.be.lessThan(3000) // 3 seconds
      })
    })

    it('TC_PERF_002: Should lazy load images on mobile', () => {
      cy.visit('/doctor-search')
      
      // Check images have lazy loading
      cy.get('img[data-testid="doctor-image"]').each($img => {
        cy.wrap($img).should('have.attr', 'loading', 'lazy')
      })
      
      // Scroll and check images load
      cy.scrollTo('bottom')
      cy.get('img[data-testid="doctor-image"]').last().should('be.visible')
    })

    it('TC_PERF_003: Should minimize reflows on mobile', () => {
      cy.visit('/appointments')
      
      // Measure layout shifts
      cy.window().then((win) => {
        let cls = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              cls += entry.value
            }
          }
        })
        observer.observe({ entryTypes: ['layout-shift'] })
        
        // Perform actions
        cy.get('[data-testid="filter-button"]').click()
        cy.get('[data-testid="date-filter"]').type('2024-12-01')
        cy.get('[data-testid="apply-filter"]').click()
        
        // Check CLS is acceptable
        cy.wait(1000).then(() => {
          expect(cls).to.be.lessThan(0.1) // Good CLS score
        })
      })
    })

    it('TC_PERF_004: Should cache static assets', () => {
      cy.visit('/dashboard')
      
      // Check service worker caching
      cy.window().then((win) => {
        if ('caches' in win) {
          return win.caches.keys().then(cacheNames => {
            expect(cacheNames.length).to.be.greaterThan(0)
            expect(cacheNames.some(name => name.includes('static'))).to.be.true
          })
        }
      })
      
      // Verify cached resources
      cy.intercept('GET', '**/*.js', (req) => {
        req.reply((res) => {
          expect(res.headers['cache-control']).to.include('max-age')
        })
      })
    })

    it('TC_PERF_005: Should optimize bundle size for mobile', () => {
      cy.visit('/')
      
      // Check critical resources size
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource')
        const jsResources = resources.filter(r => r.name.includes('.js'))
        const cssResources = resources.filter(r => r.name.includes('.css'))
        
        // Check JS bundle sizes
        jsResources.forEach(resource => {
          expect(resource.transferSize).to.be.lessThan(500000) // 500KB per file
        })
        
        // Check CSS bundle sizes
        cssResources.forEach(resource => {
          expect(resource.transferSize).to.be.lessThan(100000) // 100KB per file
        })
      })
    })
  })

  context('iOS Specific Tests', () => {
    beforeEach(() => {
      cy.viewport(390, 844) // iPhone 12
    })

    it('TC_IOS_001: Should handle Safari safe areas', () => {
      cy.visit('/dashboard')
      
      // Check for safe area padding
      cy.get('[data-testid="main-container"]')
        .should('have.css', 'padding-top')
        .and('not.equal', '0px')
      
      cy.get('[data-testid="bottom-nav"]')
        .should('have.css', 'padding-bottom')
        .and('not.equal', '0px')
    })

    it('TC_IOS_002: Should handle iOS scroll bounce', () => {
      cy.visit('/appointments')
      
      // Check for scroll behavior
      cy.get('[data-testid="scrollable-content"]')
        .should('have.css', '-webkit-overflow-scrolling', 'touch')
      
      // Test overscroll behavior
      cy.get('[data-testid="scrollable-content"]')
        .scrollTo('top')
        .trigger('touchstart', { touches: [{ pageY: 100 }] })
        .trigger('touchmove', { touches: [{ pageY: 200 }] })
        .trigger('touchend')
    })
  })

  context('Android Specific Tests', () => {
    beforeEach(() => {
      cy.viewport(384, 854) // Samsung Galaxy S21
    })

    it('TC_ANDROID_001: Should handle Android back button', () => {
      cy.visit('/dashboard')
      cy.visit('/appointments')
      
      // Simulate back button
      cy.window().then((win) => {
        win.history.back()
      })
      
      cy.url().should('include', '/dashboard')
    })

    it('TC_ANDROID_002: Should handle Android app links', () => {
      cy.visit('/')
      
      // Check for app banner
      cy.get('[data-testid="smart-app-banner"]').should('be.visible')
      
      // Check deep linking
      cy.window().then((win) => {
        const link = win.document.querySelector('link[rel="manifest"]')
        expect(link).to.exist
      })
    })
  })
})
