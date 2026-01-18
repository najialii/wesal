# Maintenance Workflow API Documentation

## Overview

This document provides comprehensive API documentation for the maintenance workflow system, including contract management, visit scheduling, and analytics endpoints.

## Base URL

```
/api/business/maintenance
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer {token}
```

## Contract Management

### Get Contracts

**GET** `/contracts`

Retrieve a paginated list of maintenance contracts.

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `status` (string, optional): Filter by status (`active`, `expired`, `cancelled`, `renewed`)
- `customer_id` (integer, optional): Filter by customer ID
- `technician_id` (integer, optional): Filter by assigned technician ID
- `search` (string, optional): Search in customer name, phone, or email

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "customer_email": "john@example.com",
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "frequency": "monthly",
      "total_visits": 12,
      "completed_visits": 8,
      "contract_value": 1200.00,
      "assigned_technician": {
        "id": 5,
        "name": "Tech Smith"
      },
      "health_status": "good"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50,
    "per_page": 15,
    "last_page": 4
  }
}
```

### Create Contract

**POST** `/contracts`

Create a new maintenance contract.

**Request Body:**
```json
{
  "customer_id": 123,
  "product_id": 456,
  "assigned_technician_id": 789,
  "frequency": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "contract_value": 1200.00,
  "special_instructions": "Handle with care",
  "items": [
    {
      "maintenance_product_id": 1,
      "quantity": 2,
      "unit_cost": 50.00,
      "is_included": true
    }
  ]
}
```

**Validation Rules:**
- `customer_id`: required, exists in customers table
- `product_id`: required, exists in products table
- `assigned_technician_id`: optional, exists in users table with role 'technician'
- `frequency`: required, one of: daily, weekly, bi_weekly, monthly, quarterly, semi_annual, annual
- `start_date`: required, date, after or equal to today
- `end_date`: optional, date, after start_date
- `contract_value`: required, numeric, min: 0
- `special_instructions`: optional, string, max: 1000 characters

### Get Contract Details

**GET** `/contracts/{id}`

Retrieve detailed information about a specific contract.

**Response:**
```json
{
  "id": 1,
  "customer": {
    "id": 123,
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "address": "123 Main St"
  },
  "product": {
    "id": 456,
    "name": "Air Conditioner Service"
  },
  "assigned_technician": {
    "id": 789,
    "name": "Tech Smith",
    "phone": "+1987654321"
  },
  "status": "active",
  "frequency": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "total_visits": 12,
  "completed_visits": 8,
  "remaining_visits": 4,
  "contract_value": 1200.00,
  "special_instructions": "Handle with care",
  "health_metrics": {
    "completion_rate": 66.67,
    "days_until_expiry": 45,
    "is_expiring_soon": false,
    "is_expired": false,
    "health_status": "good"
  },
  "items": [
    {
      "id": 1,
      "maintenance_product_id": 1,
      "product_name": "Filter Replacement",
      "quantity": 2,
      "unit_cost": 50.00,
      "is_included": true
    }
  ],
  "recent_visits": [
    {
      "id": 101,
      "scheduled_date": "2024-01-15",
      "status": "completed",
      "total_cost": 100.00
    }
  ]
}
```

### Update Contract

**PUT** `/contracts/{id}`

Update an existing maintenance contract.

**Request Body:** Same as create contract, all fields optional.

### Delete Contract

**DELETE** `/contracts/{id}`

Soft delete a maintenance contract (sets status to 'cancelled').

### Contract Expiration Management

#### Handle Contract Expiration

**POST** `/contracts/{id}/handle-expiration`

Manually trigger expiration handling for a contract.

**Response:**
```json
{
  "message": "Contract expiration handled successfully",
  "results": {
    "contract_id": 1,
    "cancelled_visits": 3,
    "notifications_sent": 1,
    "status_updated": true
  }
}
```

#### Create Contract Renewal

**POST** `/contracts/{id}/renew`

Create a renewal for an existing contract.

**Request Body:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "frequency": "monthly",
  "contract_value": 1300.00,
  "special_instructions": "Updated instructions"
}
```

#### Get Expiring Contracts

**GET** `/contracts/expiring`

Get contracts that are expiring within a specified number of days.

**Query Parameters:**
- `days` (integer, optional): Number of days to look ahead (default: 30)

## Visit Management

### Get Visits

**GET** `/visits`

Retrieve a paginated list of maintenance visits.

**Query Parameters:**
- `page` (integer, optional): Page number
- `per_page` (integer, optional): Items per page
- `status` (string, optional): Filter by status
- `technician_id` (integer, optional): Filter by technician
- `contract_id` (integer, optional): Filter by contract
- `date_from` (date, optional): Filter visits from date
- `date_to` (date, optional): Filter visits to date

### Create Visit

**POST** `/visits`

Create a new maintenance visit.

**Request Body:**
```json
{
  "maintenance_contract_id": 1,
  "scheduled_date": "2024-02-15",
  "scheduled_time": "10:00:00",
  "assigned_technician_id": 789,
  "notes": "Regular maintenance check"
}
```

### Update Visit Status

**PUT** `/visits/{id}/status`

Update the status of a visit.

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started maintenance work"
}
```

### Complete Visit

**POST** `/visits/{id}/complete`

Mark a visit as completed with details.

**Request Body:**
```json
{
  "completion_notes": "All systems checked and working properly",
  "customer_signature": "base64_encoded_signature",
  "total_cost": 150.00,
  "items_used": [
    {
      "maintenance_product_id": 1,
      "quantity_used": 2,
      "unit_cost": 25.00
    }
  ],
  "photos": [
    "base64_encoded_photo1",
    "base64_encoded_photo2"
  ]
}
```

## Analytics and Reporting

### Contract Health Metrics

**GET** `/analytics/contract-health`

Get overall contract health metrics.

**Response:**
```json
{
  "total_contracts": 150,
  "active_contracts": 120,
  "expiring_soon": 15,
  "expired_contracts": 10,
  "health_distribution": {
    "excellent": 45,
    "good": 60,
    "warning": 10,
    "critical": 5
  },
  "completion_rates": {
    "average": 85.5,
    "above_90": 80,
    "below_70": 15
  }
}
```

### SLA Metrics

**GET** `/analytics/sla-metrics`

Get Service Level Agreement performance metrics.

**Query Parameters:**
- `start_date` (date, optional): Start date for metrics
- `end_date` (date, optional): End date for metrics

**Response:**
```json
{
  "metrics": {
    "completion_rate": 92.5,
    "on_time_rate": 88.3,
    "average_response_time_hours": 2.5,
    "average_visit_duration_minutes": 45
  },
  "visits": {
    "total": 500,
    "completed": 462,
    "on_time": 441,
    "overdue": 23
  },
  "trends": {
    "completion_rate_trend": "up",
    "response_time_trend": "down"
  }
}
```

### Technician Performance

**GET** `/analytics/technician-performance`

Get technician performance metrics.

**Response:**
```json
{
  "summary": {
    "total_technicians": 25,
    "active_technicians": 22,
    "average_completion_rate": 89.2,
    "total_revenue": 125000.00
  },
  "technicians": [
    {
      "id": 789,
      "name": "Tech Smith",
      "visits_completed": 45,
      "completion_rate": 95.7,
      "average_rating": 4.8,
      "total_revenue": 6750.00,
      "efficiency_score": 92.3
    }
  ]
}
```

### Revenue Analytics

**GET** `/analytics/revenue`

Get revenue analytics and trends.

**Response:**
```json
{
  "summary": {
    "total_revenue": 125000.00,
    "monthly_recurring_revenue": 8500.00,
    "average_visit_value": 150.00,
    "revenue_growth_rate": 12.5
  },
  "by_period": [
    {
      "period": "2024-01",
      "revenue": 10500.00,
      "visits": 70,
      "contracts": 15
    }
  ],
  "by_service_type": [
    {
      "service": "Air Conditioning",
      "revenue": 45000.00,
      "percentage": 36.0
    }
  ]
}
```

## Calendar and Scheduling

### Get Calendar Data

**GET** `/calendar`

Get calendar view of scheduled visits.

**Query Parameters:**
- `start_date` (date, required): Calendar start date
- `end_date` (date, required): Calendar end date
- `technician_id` (integer, optional): Filter by technician
- `view` (string, optional): Calendar view type (month, week, day)

**Response:**
```json
{
  "events": [
    {
      "id": 101,
      "title": "Maintenance Visit - John Doe",
      "start": "2024-02-15T10:00:00Z",
      "end": "2024-02-15T11:00:00Z",
      "status": "scheduled",
      "technician": "Tech Smith",
      "customer": "John Doe",
      "address": "123 Main St",
      "color": "#3B82F6"
    }
  ],
  "summary": {
    "total_visits": 25,
    "scheduled": 15,
    "completed": 8,
    "overdue": 2
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied to specified branch"
}
```

### 404 Not Found
```json
{
  "message": "Maintenance contract with ID 123 not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "The given data was invalid",
  "errors": {
    "start_date": ["The start date must be a date after or equal to today."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error_id": "uuid-correlation-id"
}
```

## Rate Limiting

API endpoints are rate limited to:
- 60 requests per minute for authenticated users
- 10 requests per minute for unauthenticated requests

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Pagination

Paginated endpoints return data in the following format:

```json
{
  "data": [...],
  "links": {
    "first": "http://api.example.com/contracts?page=1",
    "last": "http://api.example.com/contracts?page=10",
    "prev": null,
    "next": "http://api.example.com/contracts?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "path": "http://api.example.com/contracts",
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

## Webhooks

The system supports webhooks for real-time notifications:

### Available Events
- `contract.created`
- `contract.updated`
- `contract.expired`
- `visit.scheduled`
- `visit.started`
- `visit.completed`
- `visit.cancelled`

### Webhook Payload Example
```json
{
  "event": "visit.completed",
  "timestamp": "2024-02-15T10:30:00Z",
  "data": {
    "visit_id": 101,
    "contract_id": 1,
    "technician_id": 789,
    "total_cost": 150.00,
    "completion_time": "2024-02-15T10:30:00Z"
  }
}
```

## SDK and Libraries

Official SDKs are available for:
- JavaScript/TypeScript
- PHP
- Python
- C#

Example usage (JavaScript):
```javascript
import { MaintenanceAPI } from '@wesaltech/maintenance-sdk';

const api = new MaintenanceAPI({
  baseURL: 'https://api.wesaltech.com',
  token: 'your-api-token'
});

const contracts = await api.contracts.list({
  status: 'active',
  page: 1
});
```