"""
Devices URL configuration.
"""

from django.urls import path
from . import views

app_name = 'devices'

urlpatterns = [
    path('', views.device_list, name='device_list'),
    path('api/', views.device_list_api, name='device_list_api'),
    path('api/<int:device_id>/', views.device_detail_api, name='device_detail_api'),
    path('api/<int:device_id>/connect/', views.device_connect_api, name='device_connect_api'),
    path('api/<int:device_id>/disconnect/', views.device_disconnect_api, name='device_disconnect_api'),
]
