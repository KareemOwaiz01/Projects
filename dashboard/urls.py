"""
Dashboard URL configuration.
"""

from django.urls import path, include
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Main dashboard views
    path('', views.DashboardView.as_view(), name='index'),
    path('overview/', views.dashboard_overview, name='overview'),
    
    # API endpoints
    path('api/data/', views.dashboard_data_api, name='dashboard_data_api'),
    path('api/system-status/', views.system_status_api, name='system_status_api'),
    path('api/settings/', views.update_dashboard_settings, name='update_settings'),
    path('api/notifications/', views.notifications_api, name='notifications_api'),
    path('api/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('api/notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Health check
    path('health/', views.health_check, name='health_check'),
]
