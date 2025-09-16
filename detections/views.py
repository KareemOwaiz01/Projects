"""
Detections views for ScreenGuard Pro.
"""

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def detection_list(request):
    """Detection list view."""
    return render(request, 'detections/list.html')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detection_list_api(request):
    """API endpoint for detection list."""
    # Mock data for demonstration
    detections = [
        {
            'id': 1,
            'device_name': 'iPhone 13',
            'timestamp': '2024-01-15T14:30:25Z',
            'confidence': 0.87,
            'is_peeking': True,
            'alert_sent': True,
            'gaze_angles': [15.2, -8.5]
        },
        {
            'id': 2,
            'device_name': 'MacBook Pro',
            'timestamp': '2024-01-15T14:25:10Z',
            'confidence': 0.92,
            'is_peeking': True,
            'alert_sent': True,
            'gaze_angles': [12.1, 5.3]
        }
    ]
    
    return Response({'detections': detections})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_detection_api(request):
    """API endpoint to start detection."""
    device_id = request.data.get('device_id')
    settings = request.data.get('settings', {})
    
    return Response({
        'message': f'Detection started for device {device_id}',
        'detection_id': f'det_{device_id}_{int(time.time() * 1000)}'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_detection_api(request):
    """API endpoint to stop detection."""
    device_id = request.data.get('device_id')
    
    return Response({
        'message': f'Detection stopped for device {device_id}'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detection_stats_api(request):
    """API endpoint for detection statistics."""
    stats = {
        'total_detections': 156,
        'peeking_detections': 23,
        'false_positives': 2,
        'average_confidence': 0.89,
        'detection_rate': 0.15,
        'last_detection': '2024-01-15T14:30:25Z'
    }
    
    return Response(stats)
