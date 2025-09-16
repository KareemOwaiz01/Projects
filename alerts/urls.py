"""
Alerts URL configuration.
"""

from django.urls import path
from . import views

app_name = 'alerts'

urlpatterns = [
    path('', views.alert_list, name='alert_list'),
    path('api/', views.alert_list_api, name='alert_list_api'),
    path('api/settings/', views.alert_settings_api, name='alert_settings_api'),
    path('api/test/', views.test_alert_api, name='test_alert_api'),
]
