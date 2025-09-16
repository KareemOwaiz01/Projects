"""
Analytics URL configuration.
"""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.analytics_dashboard, name='analytics_dashboard'),
    path('api/overview/', views.analytics_overview_api, name='analytics_overview_api'),
    path('api/detections/', views.detection_analytics_api, name='detection_analytics_api'),
    path('api/alerts/', views.alert_analytics_api, name='alert_analytics_api'),
    path('api/export/', views.export_data_api, name='export_data_api'),
]
