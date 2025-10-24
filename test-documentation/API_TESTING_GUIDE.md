# API Endpoint Testing Guide

## Test Configuration

### Environment Setup
```bash
# Install testing dependencies
npm install --save-dev jest supertest @types/jest @types/supertest

# Create test database (for integration tests)
cp .env .env.test
# Update DATABASE_URL in .env.test to point to test database
```

### Test Structure
- Unit Tests: `/tests/unit/`
- Integration Tests: `/tests/integration/`
- E2E Tests: `/tests/e2e/`

## Authentication Endpoints

### POST /api/auth/login
```javascript
// Test 1: Successful Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

Expected Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "Test User",
      "role": "AGENT",
      "companyName": "Test Company",
      "contactNumber": "+1234567890",
      "isActive": true
    }
  }
}

// Test 2: Invalid Credentials
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "wrongpassword"
}

Expected Response (401):
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}

// Test 3: Validation Error
POST /api/auth/login
{
  "email": "invalid-email",
  "password": "123"
}

Expected Response (400):
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### POST /api/auth/register
```javascript
// Test 1: Successful Registration
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User",
  "companyName": "New Company",
  "contactNumber": "+1234567890"
}

Expected Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "New User",
      "companyName": "New Company",
      "contactNumber": "+1234567890",
      "isActive": true,
      "role": "AGENT"
    }
  }
}
```

## Appointment Endpoints

### GET /api/appointments
```javascript
// Test 1: Get All Appointments (with pagination)
GET /api/appointments?page=1&limit=10&status=CONFIRMED
Authorization: Bearer jwt_token

Expected Response (200):
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "timeSlotId": "uuid",
      "patientName": "John Doe",
      "patientEmail": "john@example.com",
      "patientPhone": "+1234567890",
      "status": "CONFIRMED",
      "appointmentType": "CONSULTATION",
      "createdAt": "2024-01-01T00:00:00Z",
      "doctor": {
        "name": "Dr. Smith",
        "specialization": "Cardiology"
      },
      "timeSlot": {
        "date": "2024-01-15",
        "startTime": "09:00:00",
        "endTime": "09:30:00"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}

// Test 2: Filter by Date Range
GET /api/appointments?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token
```

### POST /api/appointments
```javascript
// Test 1: Create New Appointment
POST /api/appointments
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "doctorId": "uuid",
  "timeSlotId": "uuid",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+1234567890",
  "patientAge": 35,
  "patientGender": "MALE",
  "appointmentType": "CONSULTATION",
  "medicalHistory": "No known allergies",
  "currentMedications": "None",
  "allergies": "None"
}

Expected Response (201):
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "new_uuid",
    "doctorId": "uuid",
    "timeSlotId": "uuid",
    "patientName": "John Doe",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/appointments/[id]
```javascript
// Test 1: Update Appointment Status
PUT /api/appointments/uuid-here
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "status": "CONFIRMED",
  "notes": "Appointment confirmed via phone"
}

Expected Response (200):
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "id": "uuid-here",
    "status": "CONFIRMED",
    "notes": "Appointment confirmed via phone",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/appointments/[id]
```javascript
// Test 1: Cancel Appointment
DELETE /api/appointments/uuid-here
Authorization: Bearer jwt_token

Expected Response (200):
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

## Doctor Endpoints

### GET /api/doctors
```javascript
// Test 1: Get All Doctors
GET /api/doctors?specialization=Cardiology&available=true
Authorization: Bearer jwt_token

Expected Response (200):
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Dr. John Smith",
      "email": "dr.smith@hospital.com",
      "specialization": "Cardiology",
      "qualifications": "MD, FACC",
      "experience": "15 years",
      "consultationTypes": ["IN_PERSON", "VIDEO_CALL"],
      "languages": ["English", "Spanish"],
      "rating": 4.8,
      "totalReviews": 142,
      "hospital": {
        "name": "General Hospital",
        "city": "New York"
      }
    }
  ]
}
```

### GET /api/doctors/[id]
```javascript
// Test 1: Get Doctor Profile
GET /api/doctors/uuid-here
Authorization: Bearer jwt_token

Expected Response (200):
{
  "success": true,
  "message": "Doctor profile retrieved successfully",
  "data": {
    "id": "uuid-here",
    "name": "Dr. John Smith",
    "email": "dr.smith@hospital.com",
    "specialization": "Cardiology",
    "qualifications": "MD, FACC",
    "experience": "15 years",
    "consultationTypes": ["IN_PERSON", "VIDEO_CALL"],
    "languages": ["English", "Spanish"],
    "availableDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "rating": 4.8,
    "totalReviews": 142,
    "totalAppointments": 1250,
    "hospital": {
      "id": "uuid",
      "name": "General Hospital",
      "address": "123 Main St",
      "city": "New York",
      "contactNumber": "+1234567890"
    },
    "timeSlots": [
      {
        "id": "uuid",
        "date": "2024-01-15",
        "startTime": "09:00:00",
        "endTime": "09:30:00",
        "isAvailable": true,
        "consultationFee": 150.00
      }
    ]
  }
}
```

## Payment Endpoints

### POST /api/payments/stripe/process
```javascript
// Test 1: Process Payment
POST /api/payments/stripe/process
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "appointmentId": "uuid",
  "amount": 150.00,
  "currency": "USD",
  "paymentMethodId": "pm_1234567890",
  "description": "Consultation fee for Dr. Smith"
}

Expected Response (200):
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "paymentId": "uuid",
    "transactionId": "txn_1234567890",
    "amount": 150.00,
    "status": "COMPLETED",
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/payments/stripe/process-refund
```javascript
// Test 1: Process Refund
POST /api/payments/stripe/process-refund
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "paymentId": "uuid",
  "amount": 150.00,
  "reason": "CUSTOMER_REQUEST"
}

Expected Response (200):
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refundId": "uuid",
    "amount": 150.00,
    "status": "COMPLETED",
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Bulk Operations

### POST /api/appointments/bulk-update
```javascript
// Test 1: Bulk Status Update
POST /api/appointments/bulk-update
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "appointmentIds": ["uuid1", "uuid2", "uuid3"],
  "action": "CONFIRM",
  "notes": "Bulk confirmation via system"
}

Expected Response (200):
{
  "success": true,
  "message": "Bulk update completed successfully",
  "data": {
    "updated": 3,
    "failed": 0,
    "results": [
      {
        "id": "uuid1",
        "status": "success"
      },
      {
        "id": "uuid2",
        "status": "success"
      },
      {
        "id": "uuid3",
        "status": "success"
      }
    ]
  }
}
```

## Error Response Formats

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "FORBIDDEN"
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

### Rate Limit Errors (429)
```json
{
  "success": false,
  "message": "Too many requests",
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### Server Errors (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

## Testing Checklist

### Functional Tests
- [ ] Authentication (login, register, logout, token refresh)
- [ ] CRUD operations for all entities (appointments, doctors, hospitals)
- [ ] Data validation and error handling
- [ ] Pagination and filtering
- [ ] Search functionality
- [ ] File upload/download
- [ ] Payment processing
- [ ] Bulk operations

### Security Tests
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Authorization checks
- [ ] Token validation
- [ ] Password security

### Performance Tests
- [ ] Response time under load
- [ ] Concurrent user handling
- [ ] Database query optimization
- [ ] Memory usage
- [ ] Error rate monitoring
- [ ] Cache effectiveness

### Integration Tests
- [ ] Database connectivity
- [ ] Third-party API integration (Stripe, email)
- [ ] WebSocket connections
- [ ] File storage integration
- [ ] Email notifications
- [ ] SMS notifications (if applicable)

## Automated Test Execution

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```