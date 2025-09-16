"""
WebSocket consumers for ScreenGuard Dashboard.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Notification, SystemStatus

logger = logging.getLogger(__name__)


class DashboardConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for dashboard real-time updates."""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'dashboard_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Dashboard WebSocket connected for user {self.user_id}")
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"Dashboard WebSocket disconnected for user {self.user_id}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
            elif message_type == 'subscribe_detections':
                # Subscribe to detection updates
                await self.channel_layer.group_add(
                    f'detections_{self.user_id}',
                    self.channel_name
                )
            elif message_type == 'unsubscribe_detections':
                # Unsubscribe from detection updates
                await self.channel_layer.group_discard(
                    f'detections_{self.user_id}',
                    self.channel_name
                )
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
    
    async def dashboard_update(self, event):
        """Send dashboard update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))
    
    async def detection_alert(self, event):
        """Send detection alert to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'detection_alert',
            'data': event['data']
        }))
    
    async def system_status_update(self, event):
        """Send system status update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'system_status_update',
            'data': event['data']
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications."""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Notification WebSocket connected for user {self.user_id}")
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"Notification WebSocket disconnected for user {self.user_id}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'mark_read':
                notification_id = text_data_json.get('notification_id')
                await self.mark_notification_read(notification_id)
            elif message_type == 'mark_all_read':
                await self.mark_all_notifications_read()
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in notification WebSocket")
        except Exception as e:
            logger.error(f"Error processing notification WebSocket message: {e}")
    
    async def new_notification(self, event):
        """Send new notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user_id=self.user_id
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all notifications as read for the user."""
        from django.utils import timezone
        return Notification.objects.filter(
            user_id=self.user_id,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )


class SystemStatusConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for system status updates."""
    
    async def connect(self):
        self.room_group_name = 'system_status'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info("System status WebSocket connected")
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info("System status WebSocket disconnected")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'get_status':
                # Send current system status
                status_data = await self.get_system_status()
                await self.send(text_data=json.dumps({
                    'type': 'system_status',
                    'data': status_data
                }))
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in system status WebSocket")
        except Exception as e:
            logger.error(f"Error processing system status WebSocket message: {e}")
    
    async def status_update(self, event):
        """Send system status update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_system_status(self):
        """Get current system status."""
        status_objects = SystemStatus.objects.all()
        return [
            {
                'service_name': status.service_name,
                'status': status.status,
                'message': status.message,
                'last_check': status.last_check.isoformat(),
                'response_time': status.response_time,
                'metadata': status.metadata
            }
            for status in status_objects
        ]
