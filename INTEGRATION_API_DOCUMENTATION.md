# eChanneling Integration API Documentation

## Overview

The eChanneling Integration API provides RESTful endpoints for third-party systems to integrate with our appointment booking platform. This API enables external hospital management systems, payment gateways, and other healthcare platforms to seamlessly interact with our services.

## Base URL

```
Production: https://your-domain.com/api/integration
Development: http://localhost:3000/api/integration
```

## Authentication

All API requests require authentication using an API key. Include your API key in the request headers:

```http
X-API-Key: your_api_key_here
```

or as a Bearer token:

```http
Authorization: Bearer your_api_key_here
```

### Getting API Keys

Contact our integration team to obtain API keys for your organization. Different API keys may have different permission levels and rate limits.

## Rate Limiting

API calls are rate-limited based on your subscription plan:
- Standard: 1000 requests per hour
- Premium: 5000 requests per hour  
- Enterprise: 10000 requests per hour

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Response Format

All API responses follow a consistent JSON structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `API_KEY_REQUIRED` | API key is missing from request |
| `INVALID_API_KEY` | Provided API key is invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests sent |
| `INVALID_RESOURCE` | Unsupported resource type |
| `MISSING_REQUIRED_FIELDS` | Required fields missing from request body |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `INTERNAL_SERVER_ERROR` | Server encountered an error |

## Endpoints

### 1. Appointments

#### Get Appointments
Retrieve a list of appointments with optional filtering.

```http
GET /appointments?page=1&limit=20&status=CONFIRMED&doctorId=doc123
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (`CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`)
- `doctorId` (optional): Filter by doctor ID
- `hospitalId` (optional): Filter by hospital ID
- `dateFrom` (optional): Start date filter (YYYY-MM-DD)
- `dateTo` (optional): End date filter (YYYY-MM-DD)
- `patientEmail` (optional): Filter by patient email

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "apt_123",
        "appointmentNumber": "APT-1640995200-AB12",
        "patientName": "John Doe",
        "patientEmail": "john@example.com",
        "patientPhone": "+94701234567",
        "appointmentDate": "2024-01-15",
        "appointmentTime": "2024-01-15T10:00:00Z",
        "status": "CONFIRMED",
        "paymentStatus": "PENDING",
        "consultationFee": 2500.00,
        "totalAmount": 2500.00,
        "doctor": {
          "id": "doc_123",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        },
        "hospital": {
          "id": "hosp_123",
          "name": "General Hospital",
          "city": "Colombo"
        },
        "createdAt": "2024-01-10T09:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "limit": 20
    }
  }
}
```

#### Create Appointment
Create a new appointment booking.

```http
POST /appointments
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientPhone": "+94701234567",
  "patientNIC": "123456789V",
  "doctorId": "doc_123",
  "hospitalId": "hosp_123",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00:00",
  "medicalHistory": "No significant history",
  "currentMedications": "None",
  "allergies": "No known allergies"
}
```

**Required Fields:** `patientName`, `patientEmail`, `patientPhone`, `doctorId`, `hospitalId`, `appointmentDate`, `appointmentTime`

**Response:**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointment": {
      "id": "apt_124",
      "appointmentNumber": "APT-1640995300-CD34",
      // ... appointment details
    }
  }
}
```

#### Update Appointment
Update an existing appointment.

```http
PUT /appointments/{appointmentId}
```

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "patientName": "John Smith",
  "patientEmail": "johnsmith@example.com",
  "medicalHistory": "Updated medical history"
}
```

#### Cancel Appointment
Cancel an appointment.

```http
DELETE /appointments/{appointmentId}
```

**Request Body:**
```json
{
  "cancellationReason": "Patient requested cancellation"
}
```

### 2. Doctors

#### Get Doctors
Retrieve a list of available doctors.

```http
GET /doctors?page=1&limit=20&specialization=cardiology&hospitalId=hosp_123
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `specialization` (optional): Filter by specialization
- `hospitalId` (optional): Filter by hospital
- `isActive` (optional): Filter active doctors (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doc_123",
        "name": "Dr. John Smith",
        "email": "dr.smith@hospital.com",
        "specialization": "Cardiology",
        "qualification": "MBBS, MD",
        "experience": 15,
        "consultationFee": 2500.00,
        "rating": 4.8,
        "isActive": true,
        "hospital": {
          "id": "hosp_123",
          "name": "General Hospital",
          "city": "Colombo"
        }
      }
    ]
  }
}
```

### 3. Hospitals

#### Get Hospitals
Retrieve a list of hospitals.

```http
GET /hospitals?city=colombo&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page  
- `city` (optional): Filter by city
- `district` (optional): Filter by district
- `isActive` (optional): Filter active hospitals

**Response:**
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "id": "hosp_123",
        "name": "General Hospital",
        "address": "123 Main Street",
        "city": "Colombo",
        "district": "Colombo",
        "contactNumber": "+94112345678",
        "email": "info@generalhospital.lk",
        "website": "https://generalhospital.lk",
        "facilities": ["ICU", "Emergency", "Surgery"],
        "isActive": true,
        "_count": {
          "doctors": 45,
          "appointments": 1250
        }
      }
    ]
  }
}
```

### 4. Time Slots

#### Get Available Time Slots
Retrieve available appointment slots for doctors.

```http
GET /timeslots?doctorId=doc_123&date=2024-01-15&availableOnly=true
```

**Query Parameters:**
- `doctorId` (required if no hospitalId): Filter by doctor
- `hospitalId` (required if no doctorId): Filter by hospital
- `date` (optional): Specific date (YYYY-MM-DD)
- `availableOnly` (optional): Only show available slots (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "timeSlots": [
      {
        "id": "slot_123",
        "date": "2024-01-15",
        "startTime": "09:00:00",
        "endTime": "09:30:00",
        "maxAppointments": 20,
        "currentBookings": 5,
        "consultationFee": 2500.00,
        "isActive": true,
        "doctor": {
          "id": "doc_123",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        }
      }
    ]
  }
}
```

## Webhooks

Subscribe to receive real-time notifications when events occur in the system.

### Supported Events

- `appointment.created` - New appointment booking
- `appointment.updated` - Appointment status change
- `appointment.cancelled` - Appointment cancellation
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed

### Webhook Payload Example

```json
{
  "event": "appointment.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "appointment": {
      "id": "apt_123",
      "appointmentNumber": "APT-1640995200-AB12",
      // ... full appointment details
    }
  }
}
```

## SDKs and Libraries

We provide SDKs for popular programming languages:

### JavaScript/Node.js
```bash
npm install echanneling-api-client
```

```javascript
const eChanneling = require('echanneling-api-client');

const client = new eChanneling({
  apiKey: 'your_api_key',
  environment: 'production' // or 'development'
});

// Get appointments
const appointments = await client.appointments.list({
  status: 'CONFIRMED',
  limit: 10
});

// Create appointment
const newAppointment = await client.appointments.create({
  patientName: 'John Doe',
  patientEmail: 'john@example.com',
  // ... other required fields
});
```

### PHP
```bash
composer require echanneling/api-client
```

```php
<?php
use eChanneling\ApiClient;

$client = new ApiClient([
    'api_key' => 'your_api_key',
    'environment' => 'production'
]);

// Get appointments
$appointments = $client->appointments()->list([
    'status' => 'CONFIRMED',
    'limit' => 10
]);

// Create appointment  
$newAppointment = $client->appointments()->create([
    'patientName' => 'John Doe',
    'patientEmail' => 'john@example.com',
    // ... other required fields
]);
?>
```

### Python
```bash
pip install echanneling-api-client
```

```python
from echanneling import ApiClient

client = ApiClient(
    api_key='your_api_key',
    environment='production'
)

# Get appointments
appointments = client.appointments.list(
    status='CONFIRMED',
    limit=10
)

# Create appointment
new_appointment = client.appointments.create(
    patient_name='John Doe',
    patient_email='john@example.com',
    # ... other required fields
)
```

## Testing

### Test Environment
Use our sandbox environment for testing:
```
Base URL: https://sandbox.echanneling.com/api/integration
Test API Key: test_key_123456789
```

### Sample Test Data
The test environment includes sample data:
- 10 doctors across different specializations
- 5 hospitals in different cities
- Pre-configured time slots
- Test patient data

## Best Practices

### 1. Error Handling
Always handle API errors gracefully:

```javascript
try {
  const appointments = await client.appointments.list();
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    setTimeout(() => retry(), error.retryAfter * 1000);
  } else {
    console.error('API Error:', error.message);
  }
}
```

### 2. Pagination
Always handle pagination for list endpoints:

```javascript
let page = 1;
let allAppointments = [];

while (true) {
  const response = await client.appointments.list({ page, limit: 100 });
  allAppointments.push(...response.data.appointments);
  
  if (page >= response.data.pagination.totalPages) break;
  page++;
}
```

### 3. Webhooks Security
Verify webhook signatures to ensure authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  
  return signature === computed;
}
```

### 4. Rate Limiting
Implement proper retry logic with exponential backoff:

```javascript
async function apiCallWithRetry(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## Support

For integration support, contact:
- Email: integration-support@echanneling.com
- Phone: +94 11 234 5678
- Slack: #integration-support (for partners)

## Changelog

### Version 1.2.0 (2024-01-15)
- Added webhook support
- New patient lookup endpoints
- Enhanced error messages
- Rate limiting improvements

### Version 1.1.0 (2023-12-01)
- Added time slots endpoint
- Improved pagination
- New filtering options
- Bug fixes

### Version 1.0.0 (2023-10-01)
- Initial API release
- Basic CRUD operations for appointments
- Doctor and hospital endpoints
- Authentication and rate limiting