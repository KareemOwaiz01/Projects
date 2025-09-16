"""
Alerts views for ScreenGuard Pro.
"""

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def alert_list(request):
    """Alert list view."""
    return render(request, 'alerts/list.html')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alert_list_api(request):
    """API endpoint for alert list."""
    # Mock data for demonstration
    alerts = [
        {
            'id': 1,
            'type': 'visual',
            'level': 'medium',
            'message': 'Screen peeking detected on iPhone 13',
            'timestamp': '2024-01-15T14:30:25Z',
            'confidence': 0.87,
            'device_name': 'iPhone 13',
            'is_read': False
        },
        {
            'id': 2,
            'type': 'audio',
            'level': 'high',
            'message': 'Screen peeking detected on MacBook Pro',
            'timestamp': '2024-01-15T14:25:10Z',
            'confidence': 0.92,
            'device_name': 'MacBook Pro',
            'is_read': True
        }
    ]
    
    return Response({'alerts': alerts})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def alert_settings_api(request):
    """API endpoint for alert settings."""
    if request.method == 'GET':
        settings = {
            'visual_alerts': {
                'enabled': True,
                'threshold': 0.7,
                'cooldown': 3
            },
            'audio_alerts': {
                'enabled': True,
                'threshold': 0.8,
                'cooldown': 5
            },
            'haptic_alerts': {
                'enabled': True,
                'threshold': 0.6,
                'cooldown': 2
            }
        }
        return Response(settings)
    
    elif request.method == 'PUT':
        # Update alert settings
        return Response({'message': 'Alert settings updated successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_alert_api(request):
    """API endpoint to test alerts."""
    alert_type = request.data.get('type', 'visual')
    
    return Response({
        'message': f'{alert_type.title()} alert test sent successfully'
    })
