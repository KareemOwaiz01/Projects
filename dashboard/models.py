"""
Dashboard models for ScreenGuard Pro.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    """Extended user profile for ScreenGuard Pro users."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')
    notification_preferences = models.JSONField(default=dict)
    privacy_settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} Profile"


class DashboardSettings(models.Model):
    """User-specific dashboard settings and preferences."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_settings')
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto'),
    ])
    refresh_interval = models.IntegerField(default=30)  # seconds
    default_view = models.CharField(max_length=20, default='overview', choices=[
        ('overview', 'Overview'),
        ('devices', 'Devices'),
        ('detections', 'Detections'),
        ('alerts', 'Alerts'),
        ('analytics', 'Analytics'),
    ])
    chart_preferences = models.JSONField(default=dict)
    widget_layout = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} Dashboard Settings"


class SystemStatus(models.Model):
    """System status and health monitoring."""
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('maintenance', 'Maintenance'),
    ]
    
    service_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)
    last_check = models.DateTimeField(auto_now=True)
    response_time = models.FloatField(null=True, blank=True)  # milliseconds
    metadata = models.JSONField(default=dict)
    
    class Meta:
        verbose_name_plural = 'System Status'
        ordering = ['service_name']
    
    def __str__(self):
        return f"{self.service_name} - {self.status}"


class ActivityLog(models.Model):
    """User activity logging for audit and analytics."""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('device_connected', 'Device Connected'),
        ('device_disconnected', 'Device Disconnected'),
        ('detection_started', 'Detection Started'),
        ('detection_stopped', 'Detection Stopped'),
        ('alert_triggered', 'Alert Triggered'),
        ('settings_updated', 'Settings Updated'),
        ('profile_updated', 'Profile Updated'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"


class Notification(models.Model):
    """User notifications and alerts."""
    
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    action_url = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
