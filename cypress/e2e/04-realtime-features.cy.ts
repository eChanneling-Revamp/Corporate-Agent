/// <reference types="cypress" />

describe('Real-time Features E2E Tests', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'Password123!')
  })

  context('WebSocket Connection Tests', () => {
    it('TC_WS_001: Should establish WebSocket connection on login', () => {
      cy.visit('/dashboard')
      
      // Check WebSocket connection
      cy.window().then((win) => {
        cy.wrap(win).its('WebSocket').should('exist')
      })
      
      // Verify connection status
      cy.get('[data-testid="connection-status"]').should('have.class', 'connected')
      cy.get('[data-testid="connection-indicator"]').should('have.css', 'background-color', 'rgb(34, 197, 94)')
    })

    it('TC_WS_002: Should reconnect after connection loss', () => {
      cy.visit('/dashboard')
      
      // Simulate connection loss
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      // Check disconnected state
      cy.get('[data-testid="connection-status"]').should('have.class', 'disconnected')
      cy.get('[data-testid="reconnecting-message"]').should('be.visible')
      
      // Simulate reconnection
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })
      
      // Verify reconnection
      cy.get('[data-testid="connection-status"]', { timeout: 10000 }).should('have.class', 'connected')
      cy.get('[data-testid="reconnecting-message"]').should('not.exist')
    })

    it('TC_WS_003: Should handle multiple WebSocket connections', () => {
      // Open multiple tabs (simulated)
      cy.visit('/dashboard')
      
      // Open notifications panel
      cy.get('[data-testid="notifications-icon"]').click()
      
      // Open chat widget
      cy.get('[data-testid="chat-widget"]').click()
      
      // Check all connections are active
      cy.window().then((win) => {
        // Check main WebSocket
        expect(win.mainSocket).to.exist
        expect(win.mainSocket.readyState).to.equal(1) // OPEN state
        
        // Check notification WebSocket
        expect(win.notificationSocket).to.exist
        expect(win.notificationSocket.readyState).to.equal(1)
      })
    })

    it('TC_WS_004: Should queue messages when offline', () => {
      cy.visit('/dashboard')
      
      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      // Try to send a message
      cy.get('[data-testid="chat-input"]').type('Test message')
      cy.get('[data-testid="send-button"]').click()
      
      // Check message is queued
      cy.get('[data-testid="queued-indicator"]').should('be.visible')
      
      // Go back online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })
      
      // Verify message is sent
      cy.get('[data-testid="queued-indicator"]').should('not.exist')
      cy.get('[data-testid="message-sent"]').should('be.visible')
    })

    it('TC_WS_005: Should handle WebSocket stress test', () => {
      cy.visit('/dashboard')
      
      // Send multiple messages rapidly
      for (let i = 0; i < 100; i++) {
        cy.window().then((win) => {
          win.socket.send(JSON.stringify({
            type: 'stress_test',
            id: i,
            timestamp: Date.now()
          }))
        })
      }
      
      // Check no errors occurred
      cy.get('[data-testid="websocket-error"]').should('not.exist')
      
      // Verify all messages received
      cy.window().then((win) => {
        expect(win.receivedMessages).to.have.length(100)
      })
    })
  })

  context('Real-time Notifications', () => {
    it('TC_NOTIF_001: Should receive real-time notifications', () => {
      cy.visit('/dashboard')
      
      // Trigger a notification
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'notification',
          data: {
            title: 'Appointment Reminder',
            message: 'Your appointment is in 1 hour',
            timestamp: Date.now()
          }
        }))
      })
      
      // Check notification appears
      cy.get('[data-testid="notification-toast"]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-testid="notification-toast"]').should('contain', 'Appointment Reminder')
      
      // Check notification count updates
      cy.get('[data-testid="notification-badge"]').should('contain', '1')
    })

    it('TC_NOTIF_002: Should handle multiple simultaneous notifications', () => {
      cy.visit('/dashboard')
      
      // Send multiple notifications
      const notifications = [
        { title: 'Appointment Confirmed', message: 'APT-001 confirmed' },
        { title: 'Payment Received', message: 'Payment of Rs. 5,000 received' },
        { title: 'Doctor Update', message: 'Dr. Smith updated schedule' }
      ]
      
      notifications.forEach(notif => {
        cy.window().then((win) => {
          win.socket.send(JSON.stringify({
            type: 'notification',
            data: notif
          }))
        })
      })
      
      // Check all notifications appear
      cy.get('[data-testid="notification-stack"]').children().should('have.length', 3)
      
      // Check notification panel
      cy.get('[data-testid="notifications-icon"]').click()
      cy.get('[data-testid="notification-item"]').should('have.length', 3)
    })

    it('TC_NOTIF_003: Should persist notifications', () => {
      cy.visit('/dashboard')
      
      // Send notification
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'notification',
          data: {
            id: 'notif-001',
            title: 'Test Notification',
            message: 'This should persist'
          }
        }))
      })
      
      // Wait for notification
      cy.get('[data-testid="notification-toast"]').should('be.visible')
      
      // Refresh page
      cy.reload()
      
      // Check notification still exists
      cy.get('[data-testid="notifications-icon"]').click()
      cy.get('[data-testid="notification-item"]').should('contain', 'Test Notification')
    })

    it('TC_NOTIF_004: Should mark notifications as read', () => {
      cy.visit('/dashboard')
      
      // Send notifications
      for (let i = 1; i <= 3; i++) {
        cy.window().then((win) => {
          win.socket.send(JSON.stringify({
            type: 'notification',
            data: {
              id: `notif-${i}`,
              title: `Notification ${i}`,
              message: `Message ${i}`
            }
          }))
        })
      }
      
      // Check unread count
      cy.get('[data-testid="notification-badge"]').should('contain', '3')
      
      // Open notifications panel
      cy.get('[data-testid="notifications-icon"]').click()
      
      // Mark first as read
      cy.get('[data-testid="notification-item"]').first()
        .find('[data-testid="mark-read"]').click()
      
      // Check count updated
      cy.get('[data-testid="notification-badge"]').should('contain', '2')
      
      // Mark all as read
      cy.get('[data-testid="mark-all-read"]').click()
      cy.get('[data-testid="notification-badge"]').should('not.exist')
    })

    it('TC_NOTIF_005: Should filter notifications by type', () => {
      cy.visit('/dashboard')
      
      // Send different types of notifications
      const types = ['appointment', 'payment', 'system', 'promotion']
      types.forEach(type => {
        cy.window().then((win) => {
          win.socket.send(JSON.stringify({
            type: 'notification',
            data: {
              type,
              title: `${type} notification`,
              message: `This is a ${type} notification`
            }
          }))
        })
      })
      
      // Open notifications
      cy.get('[data-testid="notifications-icon"]').click()
      
      // Filter by appointment
      cy.get('[data-testid="filter-appointment"]').click()
      cy.get('[data-testid="notification-item"]').should('have.length', 1)
      cy.get('[data-testid="notification-item"]').should('contain', 'appointment')
      
      // Filter by payment
      cy.get('[data-testid="filter-payment"]').click()
      cy.get('[data-testid="notification-item"]').should('have.length', 1)
      cy.get('[data-testid="notification-item"]').should('contain', 'payment')
    })
  })

  context('Poor Network Conditions', () => {
    it('TC_NET_001: Should handle slow 3G connection', () => {
      cy.setNetworkCondition('Slow 3G')
      cy.visit('/dashboard')
      
      // Check for slow connection indicator
      cy.get('[data-testid="slow-connection-warning"]', { timeout: 10000 }).should('be.visible')
      
      // Test basic functionality still works
      cy.get('[data-testid="doctor-search"]').click()
      cy.get('[data-testid="search-results"]', { timeout: 20000 }).should('be.visible')
    })

    it('TC_NET_002: Should handle intermittent connectivity', () => {
      cy.visit('/dashboard')
      
      // Simulate intermittent connection
      let isOnline = true
      const interval = setInterval(() => {
        cy.window().then((win) => {
          isOnline = !isOnline
          win.dispatchEvent(new Event(isOnline ? 'online' : 'offline'))
        })
      }, 2000)
      
      // Perform actions during intermittent connectivity
      cy.get('[data-testid="search-doctors"]').type('Dr. Smith')
      cy.wait(5000)
      
      // Clear interval
      cy.then(() => clearInterval(interval))
      
      // Ensure system recovers
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })
      
      cy.get('[data-testid="connection-status"]').should('have.class', 'connected')
    })

    it('TC_NET_003: Should cache data for offline use', () => {
      cy.visit('/dashboard')
      
      // Load some data while online
      cy.get('[data-testid="appointments-tab"]').click()
      cy.get('[data-testid="appointment-list"]').should('be.visible')
      
      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      // Check cached data still visible
      cy.get('[data-testid="appointment-list"]').should('be.visible')
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
      cy.get('[data-testid="cached-data-notice"]').should('contain', 'Showing cached data')
    })

    it('TC_NET_004: Should sync data when connection restored', () => {
      cy.visit('/dashboard')
      
      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })
      
      // Make changes while offline
      cy.get('[data-testid="profile-settings"]').click()
      cy.get('input[name="phone"]').clear().type('0777777777')
      cy.get('[data-testid="save-profile"]').click()
      
      // Check pending sync indicator
      cy.get('[data-testid="pending-sync"]').should('be.visible')
      
      // Go back online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })
      
      // Verify sync completed
      cy.get('[data-testid="sync-complete"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="pending-sync"]').should('not.exist')
    })

    it('TC_NET_005: Should handle timeout gracefully', () => {
      // Set very slow network
      cy.intercept('**/*', (req) => {
        req.reply((res) => {
          res.delay(30000) // 30 second delay
        })
      })
      
      cy.visit('/dashboard')
      
      // Try to load data
      cy.get('[data-testid="load-appointments"]').click()
      
      // Should show timeout message
      cy.get('[data-testid="timeout-error"]', { timeout: 35000 }).should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })
  })

  context('Live Updates', () => {
    it('TC_LIVE_001: Should receive live appointment updates', () => {
      cy.visit('/appointments')
      
      // Simulate appointment status update via WebSocket
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'appointment_update',
          data: {
            id: 'APT-001',
            status: 'confirmed',
            doctor: 'Dr. Smith',
            time: '10:00 AM'
          }
        }))
      })
      
      // Check UI updates without refresh
      cy.get('[data-testid="appointment-APT-001"]')
        .find('[data-testid="status"]')
        .should('contain', 'Confirmed')
      
      // Check notification
      cy.get('[data-testid="notification-toast"]').should('contain', 'Appointment confirmed')
    })

    it('TC_LIVE_002: Should update doctor availability in real-time', () => {
      cy.visit('/doctor-search')
      
      // Search for doctor
      cy.get('input[placeholder*="Search"]').type('Dr. Smith')
      cy.get('[data-testid="doctor-card"]').should('be.visible')
      
      // Simulate availability update
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'doctor_availability',
          data: {
            doctorId: 'DOC-001',
            name: 'Dr. Smith',
            status: 'unavailable',
            nextAvailable: '2024-12-02'
          }
        }))
      })
      
      // Check UI updates
      cy.get('[data-testid="doctor-DOC-001"]')
        .find('[data-testid="availability"]')
        .should('contain', 'Unavailable')
      
      cy.get('[data-testid="doctor-DOC-001"]')
        .find('[data-testid="next-available"]')
        .should('contain', 'Next: Dec 2')
    })

    it('TC_LIVE_003: Should show live queue updates', () => {
      cy.visit('/appointments/APT-001')
      
      // Check initial queue position
      cy.get('[data-testid="queue-position"]').should('contain', 'Position: 5')
      
      // Simulate queue update
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'queue_update',
          data: {
            appointmentId: 'APT-001',
            position: 3,
            estimatedTime: '15 minutes'
          }
        }))
      })
      
      // Check updated position
      cy.get('[data-testid="queue-position"]').should('contain', 'Position: 3')
      cy.get('[data-testid="estimated-time"]').should('contain', '15 minutes')
    })

    it('TC_LIVE_004: Should receive payment status updates', () => {
      cy.visit('/payments/pending')
      
      // Check pending payment
      cy.get('[data-testid="payment-PAY-001"]')
        .should('contain', 'Processing')
      
      // Simulate payment completion
      cy.window().then((win) => {
        win.socket.send(JSON.stringify({
          type: 'payment_update',
          data: {
            paymentId: 'PAY-001',
            status: 'completed',
            amount: 5000,
            transactionId: 'TRX-123456'
          }
        }))
      })
      
      // Check UI updates
      cy.get('[data-testid="payment-PAY-001"]')
        .should('contain', 'Completed')
      
      // Check success notification
      cy.get('[data-testid="notification-toast"]')
        .should('contain', 'Payment successful')
    })
  })
})
