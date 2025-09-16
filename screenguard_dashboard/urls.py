"""
URL configuration for ScreenGuard Dashboard project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('dashboard.urls')),
    path('api/devices/', include('devices.urls')),
    path('api/detections/', include('detections.urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/analytics/', include('analytics.urls')),
    
    # Authentication
    path('api/auth/', include('rest_framework.urls')),
    path('api/auth/jwt/', include('rest_framework_simplejwt.urls')),
    
    # WebSocket
    path('ws/', include('dashboard.ws_urls')),
    
    # Redirect root to dashboard
    path('', RedirectView.as_view(url='/dashboard/', permanent=False)),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Add debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
