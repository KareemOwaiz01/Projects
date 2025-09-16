# ScreenGuard Pro - API Documentation

This document provides comprehensive API documentation for the ScreenGuard Pro backend services.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [WebSocket API](#websocket-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Overview

The ScreenGuard Pro API provides RESTful endpoints and WebSocket connections for:

- Real-time screen peeking detection
- Alert management and notifications
- Device management and configuration
- Analytics and reporting
- User management and authentication

### Base URLs

- **Development**: `http://localhost:8000`
- **Production**: `https://api.screenguardpro.com`

### API Version

Current version: `v1.0.0`

## Authentication

The API uses JWT (JSON Web Token) for authentication.

### Getting an Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using the Access Token

Include the token in the Authorization header:

```http
Authorization: Bearer your_access_token_here
```

## Endpoints

### Detection API

#### Process Detection

```http
POST /api/detection/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "user123",
  "image_data": "base64_encoded_image",
  "timestamp": 1640995200.0,
  "screen_region": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  }
}
```

**Response:**
```json
{
  "detection_id": "det_1640995200_123",
  "user_id": "user123",
  "is_peeking": true,
  "confidence": 0.87,
  "face_count": 2,
  "gaze_angles": [[15.2, -8.5], [12.1, 5.3]],
  "timestamp": 1640995200.0,
  "alerts_sent": ["visual", "audio", "haptic"]
}
```

#### Get Detection Status

```http
GET /api/detection/status/{user_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user_id": "user123",
  "is_active": true,
  "detection_config": {
    "confidence_threshold": 0.7,
    "gaze_threshold": 0.3,
    "screen_region": [0, 0, 1920, 1080],
    "model_status": "active"
  },
  "alert_stats": {
    "total_alerts": 45,
    "alerts_by_type": {
      "visual": 20,
      "audio": 15,
      "haptic": 10
    },
    "average_confidence": 0.82,
    "recent_alerts": 3
  },
  "last_update": 1640995200.0
}
```

#### Update Detection Configuration

```http
PUT /api/detection/config/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "confidence_threshold": 0.8,
  "gaze_threshold": 0.4,
  "screen_region": {
    "x": 100,
    "y": 100,
    "width": 1720,
    "height": 880
  },
  "alert_types": ["visual", "audio"]
}
```

**Response:**
```json
{
  "user_id": "user123",
  "config_updated": true,
  "new_config": {
    "confidence_threshold": 0.8,
    "gaze_threshold": 0.4,
    "screen_region": {
      "x": 100,
      "y": 100,
      "width": 1720,
      "height": 880
    },
    "alert_types": ["visual", "audio"]
  }
}
```

#### Get Detection Statistics

```http
GET /api/detection/stats/{user_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total_detections": 156,
  "peeking_detections": 23,
  "false_positives": 2,
  "average_confidence": 0.89,
  "detection_rate": 0.15,
  "last_detection": 1640995200.0
}
```

### Alert API

#### Get Alerts

```http
GET /api/alerts/
Authorization: Bearer {token}
Query Parameters:
  - limit: 20 (default)
  - offset: 0 (default)
  - level: low|medium|high|critical
  - type: visual|audio|haptic|notification
  - unread_only: true|false
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_1640995200_123",
      "user_id": "user123",
      "type": "visual",
      "level": "medium",
      "message": "Screen peeking detected!",
      "timestamp": "2024-01-15T14:30:25Z",
      "confidence": 0.87,
      "device_name": "iPhone 13",
      "is_read": false,
      "metadata": {
        "face_count": 2,
        "gaze_angles": [15.2, -8.5]
      }
    }
  ],
  "total_count": 45,
  "unread_count": 12,
  "has_more": true
}
```

#### Mark Alert as Read

```http
POST /api/alerts/{alert_id}/read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Alert marked as read",
  "alert_id": "alert_1640995200_123"
}
```

#### Mark All Alerts as Read

```http
POST /api/alerts/read-all
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "5 alerts marked as read",
  "updated_count": 5
}
```

### Device API

#### Get Devices

```http
GET /api/devices/
Authorization: Bearer {token}
```

**Response:**
```json
{
  "devices": [
    {
      "id": 1,
      "name": "iPhone 13",
      "type": "mobile",
      "os": "iOS 17.0",
      "status": "connected",
      "last_seen": "2024-01-15T14:30:25Z",
      "detection_active": true,
      "settings": {
        "sensitivity": 0.7,
        "alert_types": ["visual", "audio", "haptic"],
        "screen_region": {
          "x": 0,
          "y": 0,
          "width": 375,
          "height": 812
        }
      }
    }
  ],
  "total_count": 2
}
```

#### Get Device Details

```http
GET /api/devices/{device_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "name": "iPhone 13",
  "type": "mobile",
  "os": "iOS 17.0",
  "status": "connected",
  "last_seen": "2024-01-15T14:30:25Z",
  "detection_active": true,
  "settings": {
    "sensitivity": 0.7,
    "alert_types": ["visual", "audio", "haptic"],
    "screen_region": {
      "x": 0,
      "y": 0,
      "width": 375,
      "height": 812
    }
  },
  "statistics": {
    "total_detections": 45,
    "peeking_detections": 8,
    "accuracy": 0.92,
    "uptime": 3600
  }
}
```

#### Connect Device

```http
POST /api/devices/{device_id}/connect
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Device connected successfully",
  "device_id": 1,
  "status": "connected"
}
```

#### Disconnect Device

```http
POST /api/devices/{device_id}/disconnect
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Device disconnected successfully",
  "device_id": 1,
  "status": "disconnected"
}
```

### Analytics API

#### Get Analytics Overview

```http
GET /api/analytics/overview
Authorization: Bearer {token}
Query Parameters:
  - days: 7|30|90 (default: 30)
  - device_id: optional device filter
```

**Response:**
```json
{
  "total_detections": 156,
  "peeking_detections": 23,
  "false_positives": 2,
  "accuracy_rate": 0.91,
  "average_confidence": 0.89,
  "detection_trends": [
    {
      "date": "2024-01-15",
      "count": 12
    },
    {
      "date": "2024-01-14",
      "count": 8
    }
  ],
  "device_usage": [
    {
      "device": "iPhone 13",
      "detections": 45,
      "percentage": 28.8
    }
  ],
  "alert_distribution": {
    "visual": 20,
    "audio": 15,
    "haptic": 10
  }
}
```

#### Get Detection Analytics

```http
GET /api/analytics/detections
Authorization: Bearer {token}
Query Parameters:
  - days: 7|30|90 (default: 30)
  - granularity: hour|day|week (default: day)
```

**Response:**
```json
{
  "hourly_distribution": [
    {
      "hour": 9,
      "detections": 5
    },
    {
      "hour": 10,
      "detections": 8
    }
  ],
  "confidence_distribution": [
    {
      "range": "0.9-1.0",
      "count": 45
    },
    {
      "range": "0.8-0.9",
      "count": 67
    }
  ],
  "accuracy_over_time": [
    {
      "date": "2024-01-15",
      "accuracy": 0.91
    }
  ]
}
```

#### Get Alert Analytics

```http
GET /api/analytics/alerts
Authorization: Bearer {token}
Query Parameters:
  - days: 7|30|90 (default: 30)
```

**Response:**
```json
{
  "alert_types": [
    {
      "type": "Visual",
      "count": 45,
      "percentage": 35.7
    }
  ],
  "alert_trends": [
    {
      "date": "2024-01-15",
      "count": 12
    }
  ],
  "response_times": {
    "average": 0.25,
    "min": 0.12,
    "max": 0.45
  }
}
```

## WebSocket API

### Connection

Connect to WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/detection/user123');
```

### Message Types

#### Detection Updates

```json
{
  "type": "detection_update",
  "data": {
    "detection_id": "det_1640995200_123",
    "is_peeking": true,
    "confidence": 0.87,
    "timestamp": 1640995200.0
  }
}
```

#### Alert Notifications

```json
{
  "type": "alert_notification",
  "data": {
    "alert_id": "alert_1640995200_123",
    "type": "visual",
    "level": "medium",
    "message": "Screen peeking detected!",
    "timestamp": "2024-01-15T14:30:25Z"
  }
}
```

#### System Status Updates

```json
{
  "type": "system_status_update",
  "data": {
    "service": "detection_api",
    "status": "healthy",
    "response_time": 45.2,
    "timestamp": 1640995200.0
  }
}
```

### Sending Messages

#### Start Detection

```json
{
  "type": "start_detection",
  "config": {
    "confidence_threshold": 0.7,
    "gaze_threshold": 0.3
  }
}
```

#### Stop Detection

```json
{
  "type": "stop_detection"
}
```

#### Update Configuration

```json
{
  "type": "update_config",
  "config": {
    "confidence_threshold": 0.8,
    "alert_types": ["visual", "audio"]
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "confidence_threshold",
      "issue": "Value must be between 0.1 and 1.0"
    },
    "timestamp": "2024-01-15T14:30:25Z",
    "request_id": "req_1640995200_123"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DETECTION_ERROR` | Detection processing failed |
| `ALERT_ERROR` | Alert processing failed |
| `DEVICE_ERROR` | Device operation failed |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

### Limits

- **Detection API**: 100 requests per minute per user
- **Alert API**: 200 requests per minute per user
- **Device API**: 50 requests per minute per user
- **Analytics API**: 30 requests per minute per user

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

### Exceeding Limits

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

## Examples

### Complete Detection Flow

```javascript
// 1. Authenticate
const authResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user123',
    password: 'password123'
  })
});
const { access_token } = await authResponse.json();

// 2. Start detection
const detectionResponse = await fetch('/api/detection/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user123',
    image_data: 'base64_encoded_image_data',
    timestamp: Date.now() / 1000,
    screen_region: { x: 0, y: 0, width: 1920, height: 1080 }
  })
});
const detection = await detectionResponse.json();

// 3. Handle alerts
if (detection.is_peeking && detection.alerts_sent.length > 0) {
  console.log('Peeking detected! Alerts sent:', detection.alerts_sent);
}

// 4. Get statistics
const statsResponse = await fetch('/api/detection/stats/user123', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const stats = await statsResponse.json();
console.log('Detection stats:', stats);
```

### WebSocket Integration

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/detection/user123');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Start detection
  ws.send(JSON.stringify({
    type: 'start_detection',
    config: {
      confidence_threshold: 0.7,
      gaze_threshold: 0.3
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'detection_update':
      console.log('Detection update:', message.data);
      break;
    case 'alert_notification':
      console.log('Alert:', message.data);
      break;
    case 'system_status_update':
      console.log('System status:', message.data);
      break;
  }
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Error Handling Example

```javascript
async function makeAPIRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error.message);
    throw error;
  }
}

// Usage
try {
  const result = await makeAPIRequest('/api/detection/process', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  console.log('Success:', result);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install screenguard-pro-sdk
```

```javascript
import { ScreenGuardClient } from 'screenguard-pro-sdk';

const client = new ScreenGuardClient({
  baseURL: 'http://localhost:8000',
  apiKey: 'your_api_key'
});

// Start detection
await client.detection.start({
  confidenceThreshold: 0.7,
  gazeThreshold: 0.3
});

// Listen for alerts
client.on('alert', (alert) => {
  console.log('Alert received:', alert);
});
```

### Python

```bash
pip install screenguard-pro-sdk
```

```python
from screenguard_pro import ScreenGuardClient

client = ScreenGuardClient(
    base_url='http://localhost:8000',
    api_key='your_api_key'
)

# Start detection
client.detection.start(
    confidence_threshold=0.7,
    gaze_threshold=0.3
)

# Listen for alerts
@client.on_alert
def handle_alert(alert):
    print(f'Alert received: {alert}')
```

## Support

For API support and questions:

- **Documentation**: [https://docs.screenguardpro.com](https://docs.screenguardpro.com)
- **Support Email**: support@screenguardpro.com
- **GitHub Issues**: [https://github.com/screenguardpro/api-issues](https://github.com/screenguardpro/api-issues)
