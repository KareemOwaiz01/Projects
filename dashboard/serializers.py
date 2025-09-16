"""
Dashboard serializers for ScreenGuard Pro.
"""

from rest_framework import serializers
from .models import UserProfile, DashboardSettings, SystemStatus, ActivityLog, Notification


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        fields = [
            'phone_number',
            'timezone',
            'notification_preferences',
            'privacy_settings',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class DashboardSettingsSerializer(serializers.ModelSerializer):
    """Serializer for DashboardSettings model."""
    
    class Meta:
        model = DashboardSettings
        fields = [
            'theme',
            'refresh_interval',
            'default_view',
            'chart_preferences',
            'widget_layout',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SystemStatusSerializer(serializers.ModelSerializer):
    """Serializer for SystemStatus model."""
    
    class Meta:
        model = SystemStatus
        fields = [
            'id',
            'service_name',
            'status',
            'message',
            'last_check',
            'response_time',
            'metadata'
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog model."""
    
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'action',
            'description',
            'ip_address',
            'user_agent',
            'metadata',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'is_read',
            'is_important',
            'action_url',
            'metadata',
            'created_at',
            'read_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class DashboardDataSerializer(serializers.Serializer):
    """Serializer for dashboard data."""
    
    user = serializers.DictField()
    stats = serializers.DictField()
    recent_activity = serializers.ListField()
    system_status = serializers.ListField()


class ChartDataSerializer(serializers.Serializer):
    """Serializer for chart data."""
    
    detections_over_time = serializers.ListField()
    alert_types = serializers.ListField()
    device_usage = serializers.ListField()
    accuracy_trends = serializers.ListField()


class WidgetDataSerializer(serializers.Serializer):
    """Serializer for dashboard widget data."""
    
    widget_type = serializers.CharField()
    title = serializers.CharField()
    data = serializers.DictField()
    last_updated = serializers.DateTimeField()
    refresh_interval = serializers.IntegerField()


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics."""
    
    total_devices = serializers.IntegerField()
    active_detections = serializers.IntegerField()
    alerts_today = serializers.IntegerField()
    detection_accuracy = serializers.FloatField()
    total_detection_time = serializers.DurationField()
    last_detection = serializers.DateTimeField()


class SystemHealthSerializer(serializers.Serializer):
    """Serializer for system health data."""
    
    overall_status = serializers.CharField()
    services = SystemStatusSerializer(many=True)
    uptime = serializers.DurationField()
    last_incident = serializers.DateTimeField(allow_null=True)
    performance_metrics = serializers.DictField()
