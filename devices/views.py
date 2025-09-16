"""
Devices views for ScreenGuard Pro.
"""

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def device_list(request):
    """Device list view."""
    return render(request, 'devices/list.html')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_list_api(request):
    """API endpoint for device list."""
    # Mock data for demonstration
    devices = [
        {
            'id': 1,
            'name': 'iPhone 13',
            'type': 'mobile',
            'os': 'iOS 17.0',
            'status': 'connected',
            'last_seen': '2024-01-15T14:30:25Z',
            'detection_active': True
        },
        {
            'id': 2,
            'name': 'MacBook Pro',
            'type': 'laptop',
            'os': 'macOS 14.0',
            'status': 'connected',
            'last_seen': '2024-01-15T14:25:10Z',
            'detection_active': False
        }
    ]
    
    return Response({'devices': devices})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def device_detail_api(request, device_id):
    """API endpoint for device detail."""
    # Mock data for demonstration
    device = {
        'id': device_id,
        'name': 'iPhone 13',
        'type': 'mobile',
        'os': 'iOS 17.0',
        'status': 'connected',
        'last_seen': '2024-01-15T14:30:25Z',
        'detection_active': True,
        'settings': {
            'sensitivity': 0.7,
            'alert_types': ['visual', 'audio', 'haptic'],
            'screen_region': {'x': 0, 'y': 0, 'width': 375, 'height': 812}
        }
    }
    
    return Response(device)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def device_connect_api(request, device_id):
    """API endpoint to connect a device."""
    return Response({'message': f'Device {device_id} connected successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def device_disconnect_api(request, device_id):
    """API endpoint to disconnect a device."""
    return Response({'message': f'Device {device_id} disconnected successfully'})
