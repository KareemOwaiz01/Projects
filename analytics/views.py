"""
Analytics views for ScreenGuard Pro.
"""

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def analytics_dashboard(request):
    """Analytics dashboard view."""
    return render(request, 'analytics/dashboard.html')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview_api(request):
    """API endpoint for analytics overview."""
    overview = {
        'total_detections': 156,
        'peeking_detections': 23,
        'false_positives': 2,
        'accuracy_rate': 0.91,
        'average_confidence': 0.89,
        'detection_trends': [
            {'date': '2024-01-15', 'count': 12},
            {'date': '2024-01-14', 'count': 8},
            {'date': '2024-01-13', 'count': 15},
        ],
        'device_usage': [
            {'device': 'iPhone 13', 'detections': 45, 'percentage': 28.8},
            {'device': 'MacBook Pro', 'detections': 67, 'percentage': 42.9},
            {'device': 'iPad Air', 'detections': 44, 'percentage': 28.2},
        ]
    }
    
    return Response(overview)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detection_analytics_api(request):
    """API endpoint for detection analytics."""
    analytics = {
        'hourly_distribution': [
            {'hour': 9, 'detections': 5},
            {'hour': 10, 'detections': 8},
            {'hour': 11, 'detections': 12},
            {'hour': 14, 'detections': 15},
            {'hour': 15, 'detections': 18},
        ],
        'confidence_distribution': [
            {'range': '0.9-1.0', 'count': 45},
            {'range': '0.8-0.9', 'count': 67},
            {'range': '0.7-0.8', 'count': 32},
            {'range': '0.6-0.7', 'count': 12},
        ],
        'accuracy_over_time': [
            {'date': '2024-01-15', 'accuracy': 0.91},
            {'date': '2024-01-14', 'accuracy': 0.89},
            {'date': '2024-01-13', 'accuracy': 0.93},
        ]
    }
    
    return Response(analytics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alert_analytics_api(request):
    """API endpoint for alert analytics."""
    analytics = {
        'alert_types': [
            {'type': 'Visual', 'count': 45, 'percentage': 35.7},
            {'type': 'Audio', 'count': 32, 'percentage': 25.4},
            {'type': 'Haptic', 'count': 49, 'percentage': 38.9},
        ],
        'alert_trends': [
            {'date': '2024-01-15', 'count': 12},
            {'date': '2024-01-14', 'count': 8},
            {'date': '2024-01-13', 'count': 15},
        ],
        'response_times': {
            'average': 0.25,
            'min': 0.12,
            'max': 0.45
        }
    }
    
    return Response(analytics)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_data_api(request):
    """API endpoint to export analytics data."""
    export_format = request.data.get('format', 'csv')
    date_range = request.data.get('date_range', '30d')
    
    # Mock export response
    return Response({
        'message': f'Data exported successfully in {export_format} format',
        'download_url': f'/api/analytics/download/export_{export_format}_{date_range}.{export_format}',
        'file_size': '2.3 MB'
    })
