"""
Dashboard views for ScreenGuard Pro.
"""

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
import json
import logging

from .models import UserProfile, DashboardSettings, SystemStatus, ActivityLog, Notification
from .serializers import DashboardDataSerializer, SystemStatusSerializer

logger = logging.getLogger(__name__)


class DashboardView(TemplateView):
    """Main dashboard view."""
    template_name = 'dashboard/index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.user.is_authenticated:
            context['user_profile'] = getattr(self.request.user, 'profile', None)
            context['dashboard_settings'] = getattr(self.request.user, 'dashboard_settings', None)
            context['recent_notifications'] = Notification.objects.filter(
                user=self.request.user,
                is_read=False
            )[:5]
        return context


@login_required
def dashboard_overview(request):
    """Dashboard overview with key metrics and charts."""
    try:
        # Get user's devices and recent activity
        user = request.user
        
        # Mock data for demonstration - in production, this would come from API calls
        context = {
            'user': user,
            'total_devices': 2,
            'active_detections': 1,
            'alerts_today': 3,
            'detection_accuracy': 94.5,
            'recent_detections': [
                {
                    'device_name': 'iPhone 13',
                    'timestamp': '2024-01-15 14:30:25',
                    'confidence': 0.87,
                    'alert_sent': True
                },
                {
                    'device_name': 'MacBook Pro',
                    'timestamp': '2024-01-15 14:25:10',
                    'confidence': 0.92,
                    'alert_sent': True
                }
            ],
            'system_status': SystemStatus.objects.all()[:5],
            'chart_data': {
                'detections_over_time': [
                    {'date': '2024-01-15', 'count': 12},
                    {'date': '2024-01-14', 'count': 8},
                    {'date': '2024-01-13', 'count': 15},
                ],
                'alert_types': [
                    {'type': 'Visual', 'count': 5},
                    {'type': 'Audio', 'count': 3},
                    {'type': 'Haptic', 'count': 7},
                ]
            }
        }
        
        return render(request, 'dashboard/overview.html', context)
        
    except Exception as e:
        logger.error(f"Error in dashboard overview: {e}")
        messages.error(request, "Error loading dashboard data")
        return render(request, 'dashboard/overview.html', {'error': str(e)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data_api(request):
    """API endpoint for dashboard data."""
    try:
        user = request.user
        
        # Get dashboard data
        dashboard_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'last_login': user.last_login,
            },
            'stats': {
                'total_devices': 2,
                'active_detections': 1,
                'alerts_today': 3,
                'detection_accuracy': 94.5,
            },
            'recent_activity': [
                {
                    'action': 'Device Connected',
                    'timestamp': '2024-01-15T14:30:25Z',
                    'description': 'iPhone 13 connected successfully'
                },
                {
                    'action': 'Alert Triggered',
                    'timestamp': '2024-01-15T14:25:10Z',
                    'description': 'Screen peeking detected on MacBook Pro'
                }
            ],
            'system_status': [
                {
                    'service': 'Detection API',
                    'status': 'healthy',
                    'response_time': 45.2
                },
                {
                    'service': 'Alert Service',
                    'status': 'healthy',
                    'response_time': 12.8
                }
            ]
        }
        
        serializer = DashboardDataSerializer(dashboard_data)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in dashboard data API: {e}")
        return Response(
            {'error': 'Failed to fetch dashboard data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status_api(request):
    """API endpoint for system status."""
    try:
        status_objects = SystemStatus.objects.all()
        serializer = SystemStatusSerializer(status_objects, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in system status API: {e}")
        return Response(
            {'error': 'Failed to fetch system status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_dashboard_settings(request):
    """Update user's dashboard settings."""
    try:
        user = request.user
        settings_data = request.data
        
        # Get or create dashboard settings
        dashboard_settings, created = DashboardSettings.objects.get_or_create(
            user=user,
            defaults={
                'theme': 'light',
                'refresh_interval': 30,
                'default_view': 'overview'
            }
        )
        
        # Update settings
        if 'theme' in settings_data:
            dashboard_settings.theme = settings_data['theme']
        if 'refresh_interval' in settings_data:
            dashboard_settings.refresh_interval = settings_data['refresh_interval']
        if 'default_view' in settings_data:
            dashboard_settings.default_view = settings_data['default_view']
        if 'chart_preferences' in settings_data:
            dashboard_settings.chart_preferences = settings_data['chart_preferences']
        if 'widget_layout' in settings_data:
            dashboard_settings.widget_layout = settings_data['widget_layout']
        
        dashboard_settings.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=user,
            action='settings_updated',
            description='Dashboard settings updated',
            metadata=settings_data
        )
        
        return Response({
            'message': 'Dashboard settings updated successfully',
            'settings': {
                'theme': dashboard_settings.theme,
                'refresh_interval': dashboard_settings.refresh_interval,
                'default_view': dashboard_settings.default_view,
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating dashboard settings: {e}")
        return Response(
            {'error': 'Failed to update dashboard settings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_api(request):
    """API endpoint for user notifications."""
    try:
        user = request.user
        unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
        limit = int(request.GET.get('limit', 20))
        
        notifications = Notification.objects.filter(user=user)
        if unread_only:
            notifications = notifications.filter(is_read=False)
        
        notifications = notifications[:limit]
        
        data = []
        for notification in notifications:
            data.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'is_read': notification.is_read,
                'is_important': notification.is_important,
                'action_url': notification.action_url,
                'created_at': notification.created_at.isoformat(),
                'read_at': notification.read_at.isoformat() if notification.read_at else None,
            })
        
        return Response({
            'notifications': data,
            'total_count': Notification.objects.filter(user=user).count(),
            'unread_count': Notification.objects.filter(user=user, is_read=False).count(),
        })
        
    except Exception as e:
        logger.error(f"Error in notifications API: {e}")
        return Response(
            {'error': 'Failed to fetch notifications'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read."""
    try:
        user = request.user
        
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.mark_as_read()
            
            return Response({'message': 'Notification marked as read'})
            
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return Response(
            {'error': 'Failed to mark notification as read'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the user."""
    try:
        user = request.user
        
        updated_count = Notification.objects.filter(
            user=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated_count} notifications marked as read'
        })
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return Response(
            {'error': 'Failed to mark all notifications as read'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def health_check(request):
    """Health check endpoint for monitoring."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'screenguard-dashboard',
        'timestamp': timezone.now().isoformat()
    })
