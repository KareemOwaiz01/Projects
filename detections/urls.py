"""
Detections URL configuration.
"""

from django.urls import path
from . import views

app_name = 'detections'

urlpatterns = [
    path('', views.detection_list, name='detection_list'),
    path('api/', views.detection_list_api, name='detection_list_api'),
    path('api/start/', views.start_detection_api, name='start_detection_api'),
    path('api/stop/', views.stop_detection_api, name='stop_detection_api'),
    path('api/stats/', views.detection_stats_api, name='detection_stats_api'),
]
