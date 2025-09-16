# ScreenGuard Pro - Testing Guide

This document provides comprehensive testing guidelines and procedures for the ScreenGuard Pro application.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Backend Testing](#backend-testing)
4. [Web Dashboard Testing](#web-dashboard-testing)
5. [Mobile App Testing](#mobile-app-testing)
6. [Integration Testing](#integration-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Automation](#test-automation)
10. [Test Data Management](#test-data-management)

## Testing Overview

### Testing Strategy

ScreenGuard Pro follows a comprehensive testing strategy including:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Complete user workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability and penetration testing
- **Usability Tests**: User experience validation

### Test Coverage Goals

- **Code Coverage**: Minimum 80%
- **API Coverage**: 100% of endpoints
- **UI Coverage**: All critical user paths
- **Security Coverage**: All attack vectors

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
pip install pytest pytest-cov pytest-asyncio httpx
npm install --save-dev jest @testing-library/react-native
```

### Test Database Setup

```bash
# Create test database
createdb screenguard_test_db

# Set test environment variables
export TEST_DATABASE_URL=postgresql://user:pass@localhost/screenguard_test_db
export TEST_REDIS_URL=redis://localhost:6379/15
```

### Test Configuration

```python
# backend/tests/conftest.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from api.main import app
from database.models import Base

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///./test.db")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    return TestClient(app)
```

## Backend Testing

### Unit Tests

#### Detection Service Tests

```python
# backend/tests/test_detection_service.py
import pytest
from unittest.mock import Mock, patch
from services.detection_service import DetectionService

class TestDetectionService:
    def setup_method(self):
        self.detection_service = DetectionService()
    
    def test_initialize(self):
        assert self.detection_service.initialize() is None
    
    @patch('services.detection_service.cv2')
    def test_detect_faces(self, mock_cv2):
        # Mock OpenCV
        mock_cv2.cvtColor.return_value = "rgb_frame"
        mock_cv2.COLOR_BGR2RGB = 1
        
        # Mock MediaPipe
        with patch('services.detection_service.mp.solutions.face_detection') as mock_mp:
            mock_face_detection = Mock()
            mock_face_detection.process.return_value.detections = [
                Mock(location_data=Mock(relative_bounding_box=Mock(xmin=0.1, ymin=0.1, width=0.2, height=0.2)), score=[0.8])
            ]
            mock_mp.FaceDetection.return_value = mock_face_detection
            
            result = self.detection_service.detect_faces("mock_frame")
            assert len(result) == 1
            assert result[0]['confidence'] == 0.8
    
    def test_estimate_gaze_direction(self):
        # Test gaze estimation logic
        face_bbox = {
            'bbox': Mock(xmin=0.1, ymin=0.1, width=0.2, height=0.2)
        }
        
        with patch('services.detection_service.cv2') as mock_cv2:
            mock_cv2.cvtColor.return_value = "rgb_face"
            mock_cv2.COLOR_BGR2RGB = 1
            
            result = self.detection_service.estimate_gaze_direction("mock_frame", face_bbox)
            assert isinstance(result, tuple)
            assert len(result) == 2
    
    def test_is_looking_at_screen(self):
        # Test gaze threshold logic
        assert self.detection_service.is_looking_at_screen((10.0, 15.0)) == True
        assert self.detection_service.is_looking_at_screen((30.0, 40.0)) == False
    
    def test_process_frame(self):
        with patch.object(self.detection_service, 'detect_faces') as mock_detect:
            mock_detect.return_value = []
            
            result = self.detection_service.process_frame("mock_frame")
            assert result.is_peeking == False
            assert result.confidence == 0.0
            assert result.face_count == 0
```

#### Alert Service Tests

```python
# backend/tests/test_alert_service.py
import pytest
from services.alert_service import AlertService, AlertType, AlertLevel

class TestAlertService:
    def setup_method(self):
        self.alert_service = AlertService()
    
    def test_initialize(self):
        assert self.alert_service.initialize() is None
    
    def test_register_callback(self):
        callback = Mock()
        self.alert_service.register_callback(AlertType.VISUAL, callback)
        assert callback in self.alert_service.alert_callbacks[AlertType.VISUAL]
    
    def test_send_alert(self):
        # Test alert sending
        result = await self.alert_service.send_alert(
            user_id="test_user",
            alert_type=AlertType.VISUAL,
            level=AlertLevel.MEDIUM,
            message="Test alert",
            confidence=0.8
        )
        assert result == True
    
    def test_rate_limiting(self):
        # Test rate limiting
        for i in range(15):  # Exceed rate limit
            result = await self.alert_service.send_alert(
                user_id="test_user",
                alert_type=AlertType.VISUAL,
                level=AlertLevel.MEDIUM,
                message=f"Test alert {i}",
                confidence=0.8
            )
        
        # Should be rate limited
        result = await self.alert_service.send_alert(
            user_id="test_user",
            alert_type=AlertType.VISUAL,
            level=AlertLevel.MEDIUM,
            message="Rate limited alert",
            confidence=0.8
        )
        assert result == False
```

### API Tests

```python
# backend/tests/test_api.py
import pytest
from fastapi.testclient import TestClient

class TestDetectionAPI:
    def test_process_detection_success(self, client):
        response = client.post(
            "/api/detection/process",
            json={
                "user_id": "test_user",
                "image_data": "base64_encoded_image",
                "timestamp": 1640995200.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "detection_id" in data
        assert "is_peeking" in data
        assert "confidence" in data
    
    def test_process_detection_invalid_data(self, client):
        response = client.post(
            "/api/detection/process",
            json={
                "user_id": "",  # Invalid user_id
                "image_data": "invalid_base64"
            }
        )
        assert response.status_code == 400
    
    def test_get_detection_status(self, client):
        response = client.get("/api/detection/status/test_user")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "is_active" in data
    
    def test_update_detection_config(self, client):
        response = client.put(
            "/api/detection/config/test_user",
            json={
                "confidence_threshold": 0.8,
                "gaze_threshold": 0.4
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["config_updated"] == True
```

### WebSocket Tests

```python
# backend/tests/test_websocket.py
import pytest
import asyncio
from fastapi.testclient import TestClient

class TestWebSocketAPI:
    def test_websocket_connection(self, client):
        with client.websocket_connect("/ws/detection/test_user") as websocket:
            data = websocket.receive_json()
            assert "type" in data
    
    def test_websocket_detection_update(self, client):
        with client.websocket_connect("/ws/detection/test_user") as websocket:
            # Send start detection message
            websocket.send_json({
                "type": "start_detection",
                "config": {
                    "confidence_threshold": 0.7
                }
            })
            
            # Receive response
            data = websocket.receive_json()
            assert data["type"] == "detection_started"
```

## Web Dashboard Testing

### Unit Tests

```python
# web/tests/test_views.py
import pytest
from django.test import Client
from django.contrib.auth.models import User
from django.urls import reverse

class TestDashboardViews:
    def setup_method(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_dashboard_overview(self):
        response = self.client.get(reverse('dashboard:overview'))
        assert response.status_code == 200
        assert 'total_devices' in response.context
    
    def test_dashboard_data_api(self):
        response = self.client.get('/api/dashboard/data/')
        assert response.status_code == 200
        data = response.json()
        assert 'user' in data
        assert 'stats' in data
    
    def test_system_status_api(self):
        response = self.client.get('/api/dashboard/system-status/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
```

### Integration Tests

```python
# web/tests/test_integration.py
import pytest
from django.test import Client, TransactionTestCase
from django.contrib.auth.models import User
from channels.testing import WebsocketCommunicator
from screenguard_dashboard.asgi import application

class TestWebDashboardIntegration(TransactionTestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    async def test_websocket_dashboard_updates(self):
        communicator = WebsocketCommunicator(
            application,
            "/ws/dashboard/testuser/"
        )
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Send test message
        await communicator.send_json_to({
            "type": "ping",
            "timestamp": 1640995200
        })
        
        # Receive response
        response = await communicator.receive_json_from()
        assert response["type"] == "pong"
        
        await communicator.disconnect()
```

## Mobile App Testing

### Unit Tests

```javascript
// mobile/src/__tests__/DetectionService.test.js
import { DetectionService } from '../services/DetectionService';

describe('DetectionService', () => {
  let detectionService;

  beforeEach(() => {
    detectionService = new DetectionService();
  });

  test('should initialize correctly', async () => {
    await expect(detectionService.initialize()).resolves.toBeUndefined();
  });

  test('should request permissions', async () => {
    const hasPermission = await detectionService.requestPermissions();
    expect(typeof hasPermission).toBe('boolean');
  });

  test('should start detection', async () => {
    await detectionService.initialize();
    await expect(detectionService.startDetection()).resolves.toBeUndefined();
    expect(detectionService.isDetectionActive()).toBe(true);
  });

  test('should stop detection', async () => {
    await detectionService.initialize();
    await detectionService.startDetection();
    await detectionService.stopDetection();
    expect(detectionService.isDetectionActive()).toBe(false);
  });

  test('should process frame', async () => {
    await detectionService.initialize();
    const result = await detectionService.process_frame('mock_frame');
    expect(result).toHaveProperty('is_peeking');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('face_count');
  });
});
```

### Component Tests

```javascript
// mobile/src/__tests__/HomeScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';

// Mock services
jest.mock('../services/DetectionService');
jest.mock('../services/AlertService');
jest.mock('../services/StorageService');

describe('HomeScreen', () => {
  test('renders correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('ScreenGuard Pro')).toBeTruthy();
  });

  test('toggles detection when button pressed', async () => {
    const { getByText } = render(<HomeScreen />);
    const toggleButton = getByText('Start Detection');
    
    fireEvent.press(toggleButton);
    
    await waitFor(() => {
      expect(getByText('Stop Detection')).toBeTruthy();
    });
  });

  test('displays stats correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('0')).toBeTruthy(); // Total detections
  });
});
```

### E2E Tests

```javascript
// mobile/e2e/detection.e2e.js
describe('Detection Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete detection flow', async () => {
    // Navigate to detection screen
    await element(by.id('detection-tab')).tap();
    
    // Start detection
    await element(by.id('start-detection-button')).tap();
    
    // Wait for detection to start
    await expect(element(by.id('detection-status'))).toHaveText('Detection Active');
    
    // Check stats update
    await expect(element(by.id('total-detections'))).toBeVisible();
    
    // Stop detection
    await element(by.id('stop-detection-button')).tap();
    
    // Verify detection stopped
    await expect(element(by.id('detection-status'))).toHaveText('Detection Inactive');
  });

  it('should handle alerts correctly', async () => {
    // Navigate to alerts screen
    await element(by.id('alerts-tab')).tap();
    
    // Check for alerts
    await expect(element(by.id('alerts-list'))).toBeVisible();
    
    // Mark alert as read
    await element(by.id('alert-item-0')).tap();
    await element(by.id('mark-read-button')).tap();
    
    // Verify alert marked as read
    await expect(element(by.id('alert-item-0'))).toHaveText('Read');
  });
});
```

## Integration Testing

### API Integration Tests

```python
# tests/test_api_integration.py
import pytest
import requests
import time

class TestAPIIntegration:
    def setup_method(self):
        self.base_url = "http://localhost:8000"
        self.auth_token = self.get_auth_token()
    
    def get_auth_token(self):
        response = requests.post(f"{self.base_url}/api/auth/login", json={
            "username": "testuser",
            "password": "testpass123"
        })
        return response.json()["access_token"]
    
    def test_complete_detection_flow(self):
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # 1. Start detection
        response = requests.post(
            f"{self.base_url}/api/detection/process",
            headers=headers,
            json={
                "user_id": "test_user",
                "image_data": "base64_encoded_image",
                "timestamp": time.time()
            }
        )
        assert response.status_code == 200
        detection = response.json()
        
        # 2. Check alerts if peeking detected
        if detection["is_peeking"]:
            alerts_response = requests.get(
                f"{self.base_url}/api/alerts/",
                headers=headers
            )
            assert alerts_response.status_code == 200
            alerts = alerts_response.json()["alerts"]
            assert len(alerts) > 0
        
        # 3. Get statistics
        stats_response = requests.get(
            f"{self.base_url}/api/detection/stats/test_user",
            headers=headers
        )
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert "total_detections" in stats
    
    def test_websocket_integration(self):
        import websocket
        
        def on_message(ws, message):
            data = json.loads(message)
            assert "type" in data
            ws.close()
        
        ws = websocket.WebSocketApp(
            f"ws://localhost:8000/ws/detection/test_user",
            on_message=on_message
        )
        ws.run_forever()
```

### Database Integration Tests

```python
# tests/test_database_integration.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Detection, Alert, User

class TestDatabaseIntegration:
    def setup_method(self):
        self.engine = create_engine("sqlite:///./test.db")
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def test_detection_crud(self):
        # Create detection
        detection = Detection(
            user_id="test_user",
            is_peeking=True,
            confidence=0.8,
            face_count=2
        )
        self.session.add(detection)
        self.session.commit()
        
        # Read detection
        found_detection = self.session.query(Detection).filter_by(
            user_id="test_user"
        ).first()
        assert found_detection is not None
        assert found_detection.is_peeking == True
        
        # Update detection
        found_detection.confidence = 0.9
        self.session.commit()
        
        # Verify update
        updated_detection = self.session.query(Detection).filter_by(
            user_id="test_user"
        ).first()
        assert updated_detection.confidence == 0.9
        
        # Delete detection
        self.session.delete(updated_detection)
        self.session.commit()
        
        # Verify deletion
        deleted_detection = self.session.query(Detection).filter_by(
            user_id="test_user"
        ).first()
        assert deleted_detection is None
```

## Performance Testing

### Load Testing

```python
# tests/test_performance.py
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

class TestPerformance:
    async def test_concurrent_detections(self):
        async def make_detection_request(session, user_id):
            async with session.post(
                "http://localhost:8000/api/detection/process",
                json={
                    "user_id": user_id,
                    "image_data": "base64_encoded_image",
                    "timestamp": time.time()
                }
            ) as response:
                return await response.json()
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                make_detection_request(session, f"user_{i}")
                for i in range(100)  # 100 concurrent requests
            ]
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            # Verify all requests succeeded
            assert all("detection_id" in result for result in results)
            
            # Check response time
            total_time = end_time - start_time
            avg_response_time = total_time / len(results)
            assert avg_response_time < 1.0  # Less than 1 second per request
    
    def test_database_performance(self):
        # Test database query performance
        start_time = time.time()
        
        # Perform 1000 database operations
        for i in range(1000):
            detection = Detection(
                user_id=f"user_{i}",
                is_peeking=i % 2 == 0,
                confidence=0.8
            )
            self.session.add(detection)
        
        self.session.commit()
        end_time = time.time()
        
        # Verify performance
        total_time = end_time - start_time
        assert total_time < 5.0  # Less than 5 seconds for 1000 operations
```

### Memory Testing

```python
# tests/test_memory.py
import psutil
import os
import gc

class TestMemoryUsage:
    def test_detection_memory_usage(self):
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Perform memory-intensive operations
        detections = []
        for i in range(10000):
            detection = Detection(
                user_id=f"user_{i}",
                is_peeking=True,
                confidence=0.8,
                face_count=2,
                gaze_angles=[15.2, -8.5]
            )
            detections.append(detection)
        
        peak_memory = process.memory_info().rss
        
        # Clean up
        del detections
        gc.collect()
        
        final_memory = process.memory_info().rss
        
        # Verify memory usage is reasonable
        memory_increase = peak_memory - initial_memory
        assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase
```

## Security Testing

### Authentication Tests

```python
# tests/test_security.py
import pytest
import jwt
from datetime import datetime, timedelta

class TestSecurity:
    def test_invalid_token_rejected(self, client):
        response = client.get(
            "/api/detection/status/test_user",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_expired_token_rejected(self, client):
        # Create expired token
        expired_token = jwt.encode({
            "sub": "test_user",
            "exp": datetime.utcnow() - timedelta(hours=1)
        }, "secret", algorithm="HS256")
        
        response = client.get(
            "/api/detection/status/test_user",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
    
    def test_sql_injection_protection(self, client):
        malicious_user_id = "'; DROP TABLE detections; --"
        
        response = client.post(
            "/api/detection/process",
            json={
                "user_id": malicious_user_id,
                "image_data": "base64_encoded_image"
            }
        )
        
        # Should not cause database error
        assert response.status_code in [200, 400, 422]
    
    def test_xss_protection(self, client):
        malicious_message = "<script>alert('XSS')</script>"
        
        response = client.post(
            "/api/alerts/",
            json={
                "message": malicious_message,
                "type": "test"
            }
        )
        
        # Message should be sanitized
        if response.status_code == 200:
            data = response.json()
            assert "<script>" not in data["message"]
```

### Input Validation Tests

```python
# tests/test_input_validation.py
class TestInputValidation:
    def test_invalid_confidence_threshold(self, client):
        response = client.put(
            "/api/detection/config/test_user",
            json={
                "confidence_threshold": 1.5  # Invalid: > 1.0
            }
        )
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client):
        response = client.post(
            "/api/detection/process",
            json={
                "user_id": "test_user"
                # Missing required fields
            }
        )
        assert response.status_code == 422
    
    def test_invalid_image_data(self, client):
        response = client.post(
            "/api/detection/process",
            json={
                "user_id": "test_user",
                "image_data": "invalid_base64_data"
            }
        )
        assert response.status_code == 400
```

## Test Automation

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd web
        npm install
    
    - name: Run tests
      run: |
        cd web
        npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./web/coverage/lcov.info

  mobile-tests:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd mobile
        npm install
    
    - name: Run tests
      run: |
        cd mobile
        npm test -- --coverage
```

### Test Scripts

```bash
#!/bin/bash
# scripts/run_tests.sh

set -e

echo "Running ScreenGuard Pro Tests..."

# Backend tests
echo "Running backend tests..."
cd backend
python -m pytest tests/ -v --cov=. --cov-report=html
cd ..

# Web dashboard tests
echo "Running web dashboard tests..."
cd web
python manage.py test --verbosity=2
cd ..

# Mobile app tests
echo "Running mobile app tests..."
cd mobile
npm test -- --coverage
cd ..

echo "All tests completed successfully!"
```

## Test Data Management

### Test Fixtures

```python
# tests/fixtures.py
import pytest
from datetime import datetime, timedelta

@pytest.fixture
def sample_detection_data():
    return {
        "user_id": "test_user",
        "is_peeking": True,
        "confidence": 0.87,
        "face_count": 2,
        "gaze_angles": [[15.2, -8.5], [12.1, 5.3]],
        "timestamp": datetime.now().isoformat()
    }

@pytest.fixture
def sample_alert_data():
    return {
        "user_id": "test_user",
        "type": "visual",
        "level": "medium",
        "message": "Screen peeking detected!",
        "confidence": 0.87,
        "timestamp": datetime.now().isoformat()
    }

@pytest.fixture
def sample_user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
```

### Test Database Seeding

```python
# tests/seed_test_data.py
def seed_test_database():
    """Seed test database with sample data"""
    
    # Create test users
    users = [
        User(username=f"user_{i}", email=f"user{i}@test.com")
        for i in range(10)
    ]
    session.add_all(users)
    session.commit()
    
    # Create test detections
    detections = []
    for i in range(100):
        detection = Detection(
            user_id=f"user_{i % 10}",
            is_peeking=i % 3 == 0,
            confidence=0.5 + (i % 50) / 100,
            face_count=1 + (i % 3),
            timestamp=datetime.now() - timedelta(days=i % 30)
        )
        detections.append(detection)
    
    session.add_all(detections)
    session.commit()
    
    # Create test alerts
    alerts = []
    for i in range(50):
        alert = Alert(
            user_id=f"user_{i % 10}",
            type=["visual", "audio", "haptic"][i % 3],
            level=["low", "medium", "high"][i % 3],
            message=f"Test alert {i}",
            timestamp=datetime.now() - timedelta(hours=i % 24)
        )
        alerts.append(alert)
    
    session.add_all(alerts)
    session.commit()
```

## Running Tests

### Backend Tests

```bash
# Run all tests
cd backend
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_detection_service.py -v

# Run specific test
pytest tests/test_detection_service.py::TestDetectionService::test_detect_faces -v
```

### Web Dashboard Tests

```bash
# Run all tests
cd web
python manage.py test

# Run specific app tests
python manage.py test dashboard

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Mobile App Tests

```bash
# Run all tests
cd mobile
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test DetectionService.test.js

# Run E2E tests
npm run test:e2e
```

### Integration Tests

```bash
# Run all integration tests
pytest tests/test_integration.py -v

# Run performance tests
pytest tests/test_performance.py -v

# Run security tests
pytest tests/test_security.py -v
```

## Test Reporting

### Coverage Reports

```bash
# Generate HTML coverage report
pytest --cov=. --cov-report=html

# Generate XML coverage report for CI
pytest --cov=. --cov-report=xml

# Generate terminal coverage report
pytest --cov=. --cov-report=term-missing
```

### Test Reports

```bash
# Generate JUnit XML report
pytest --junitxml=test-results.xml

# Generate HTML test report
pytest --html=test-report.html --self-contained-html
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Use mocks for external services and APIs
3. **Test Data Cleanup**: Clean up test data after each test
4. **Meaningful Test Names**: Use descriptive test names that explain what is being tested
5. **Assertion Clarity**: Use clear and specific assertions
6. **Test Coverage**: Aim for high test coverage but focus on critical paths
7. **Performance Testing**: Include performance tests for critical functionality
8. **Security Testing**: Test for common security vulnerabilities
9. **Continuous Integration**: Run tests automatically on code changes
10. **Test Documentation**: Document complex test scenarios and test data requirements
