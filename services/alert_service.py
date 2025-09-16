"""
Alert Service
Handles different types of alerts and notifications for screen peeking detection.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass
import json
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertType(Enum):
    """Types of alerts that can be triggered."""
    VISUAL = "visual"
    AUDIO = "audio"
    HAPTIC = "haptic"
    NOTIFICATION = "notification"
    EMAIL = "email"
    SMS = "sms"

class AlertLevel(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class AlertConfig:
    """Configuration for alert settings."""
    alert_type: AlertType
    enabled: bool = True
    threshold: float = 0.7
    cooldown: int = 5  # seconds
    max_frequency: int = 10  # max alerts per minute
    custom_message: Optional[str] = None

@dataclass
class AlertEvent:
    """Represents an alert event."""
    alert_id: str
    user_id: str
    alert_type: AlertType
    level: AlertLevel
    message: str
    timestamp: float
    confidence: float
    metadata: Dict = None

class AlertService:
    """
    Service for managing and sending alerts when screen peeking is detected.
    
    This service handles different types of alerts including visual, audio,
    haptic, and external notifications.
    """
    
    def __init__(self):
        """Initialize the alert service."""
        self.alert_configs: Dict[str, AlertConfig] = {}
        self.alert_history: List[AlertEvent] = []
        self.alert_callbacks: Dict[AlertType, List[Callable]] = {}
        self.rate_limits: Dict[str, List[float]] = {}  # Track alert frequency
        self.cooldowns: Dict[str, float] = {}  # Track cooldown periods
        
        # Initialize default alert configurations
        self._setup_default_configs()
        
        logger.info("AlertService initialized successfully")
    
    def _setup_default_configs(self):
        """Set up default alert configurations."""
        default_configs = {
            AlertType.VISUAL: AlertConfig(
                alert_type=AlertType.VISUAL,
                enabled=True,
                threshold=0.7,
                cooldown=3,
                max_frequency=20
            ),
            AlertType.AUDIO: AlertConfig(
                alert_type=AlertType.AUDIO,
                enabled=True,
                threshold=0.8,
                cooldown=5,
                max_frequency=10
            ),
            AlertType.HAPTIC: AlertConfig(
                alert_type=AlertType.HAPTIC,
                enabled=True,
                threshold=0.6,
                cooldown=2,
                max_frequency=30
            ),
            AlertType.NOTIFICATION: AlertConfig(
                alert_type=AlertType.NOTIFICATION,
                enabled=True,
                threshold=0.7,
                cooldown=10,
                max_frequency=5
            )
        }
        
        for alert_type, config in default_configs.items():
            self.alert_configs[alert_type.value] = config
            self.alert_callbacks[alert_type] = []
    
    def register_callback(self, alert_type: AlertType, callback: Callable):
        """
        Register a callback function for a specific alert type.
        
        Args:
            alert_type: Type of alert to register callback for
            callback: Function to call when alert is triggered
        """
        if alert_type not in self.alert_callbacks:
            self.alert_callbacks[alert_type] = []
        
        self.alert_callbacks[alert_type].append(callback)
        logger.info(f"Registered callback for {alert_type.value} alerts")
    
    def update_config(self, alert_type: AlertType, config: AlertConfig):
        """
        Update configuration for a specific alert type.
        
        Args:
            alert_type: Type of alert to update
            config: New configuration
        """
        self.alert_configs[alert_type.value] = config
        logger.info(f"Updated configuration for {alert_type.value} alerts")
    
    def _can_send_alert(self, user_id: str, alert_type: AlertType) -> bool:
        """
        Check if an alert can be sent based on rate limits and cooldowns.
        
        Args:
            user_id: ID of the user
            alert_type: Type of alert to check
            
        Returns:
            True if alert can be sent, False otherwise
        """
        config = self.alert_configs.get(alert_type.value)
        if not config or not config.enabled:
            return False
        
        # Check cooldown
        cooldown_key = f"{user_id}_{alert_type.value}"
        current_time = time.time()
        
        if cooldown_key in self.cooldowns:
            if current_time - self.cooldowns[cooldown_key] < config.cooldown:
                return False
        
        # Check rate limit
        rate_key = f"{user_id}_{alert_type.value}"
        if rate_key not in self.rate_limits:
            self.rate_limits[rate_key] = []
        
        # Remove old timestamps (older than 1 minute)
        minute_ago = current_time - 60
        self.rate_limits[rate_key] = [
            ts for ts in self.rate_limits[rate_key] if ts > minute_ago
        ]
        
        # Check if we're within rate limit
        if len(self.rate_limits[rate_key]) >= config.max_frequency:
            return False
        
        return True
    
    def _update_rate_limits(self, user_id: str, alert_type: AlertType):
        """Update rate limit tracking for an alert."""
        rate_key = f"{user_id}_{alert_type.value}"
        cooldown_key = f"{user_id}_{alert_type.value}"
        
        current_time = time.time()
        
        if rate_key not in self.rate_limits:
            self.rate_limits[rate_key] = []
        
        self.rate_limits[rate_key].append(current_time)
        self.cooldowns[cooldown_key] = current_time
    
    async def send_alert(self, 
                        user_id: str, 
                        alert_type: AlertType, 
                        level: AlertLevel,
                        message: str,
                        confidence: float,
                        metadata: Optional[Dict] = None) -> bool:
        """
        Send an alert of the specified type.
        
        Args:
            user_id: ID of the user to alert
            alert_type: Type of alert to send
            level: Severity level of the alert
            message: Alert message
            confidence: Confidence level of the detection
            metadata: Additional metadata for the alert
            
        Returns:
            True if alert was sent successfully, False otherwise
        """
        config = self.alert_configs.get(alert_type.value)
        if not config:
            logger.warning(f"No configuration found for alert type: {alert_type.value}")
            return False
        
        # Check if alert meets threshold
        if confidence < config.threshold:
            logger.debug(f"Alert confidence {confidence} below threshold {config.threshold}")
            return False
        
        # Check if alert can be sent
        if not self._can_send_alert(user_id, alert_type):
            logger.debug(f"Alert rate limited or in cooldown for user {user_id}")
            return False
        
        # Create alert event
        alert_id = f"{user_id}_{alert_type.value}_{int(time.time() * 1000)}"
        alert_event = AlertEvent(
            alert_id=alert_id,
            user_id=user_id,
            alert_type=alert_type,
            level=level,
            message=message or config.custom_message or f"Screen peeking detected!",
            timestamp=time.time(),
            confidence=confidence,
            metadata=metadata or {}
        )
        
        # Add to history
        self.alert_history.append(alert_event)
        
        # Update rate limits
        self._update_rate_limits(user_id, alert_type)
        
        # Execute callbacks
        callbacks = self.alert_callbacks.get(alert_type, [])
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(alert_event)
                else:
                    callback(alert_event)
            except Exception as e:
                logger.error(f"Error executing alert callback: {e}")
        
        logger.info(f"Alert sent: {alert_type.value} to user {user_id} (confidence: {confidence:.2f})")
        return True
    
    async def send_multiple_alerts(self, 
                                 user_id: str, 
                                 alert_types: List[AlertType],
                                 level: AlertLevel,
                                 message: str,
                                 confidence: float,
                                 metadata: Optional[Dict] = None) -> Dict[AlertType, bool]:
        """
        Send multiple types of alerts simultaneously.
        
        Args:
            user_id: ID of the user to alert
            alert_types: List of alert types to send
            level: Severity level of the alerts
            message: Alert message
            confidence: Confidence level of the detection
            metadata: Additional metadata for the alerts
            
        Returns:
            Dictionary mapping alert types to success status
        """
        results = {}
        
        # Send alerts concurrently
        tasks = []
        for alert_type in alert_types:
            task = self.send_alert(user_id, alert_type, level, message, confidence, metadata)
            tasks.append((alert_type, task))
        
        for alert_type, task in tasks:
            try:
                success = await task
                results[alert_type] = success
            except Exception as e:
                logger.error(f"Error sending {alert_type.value} alert: {e}")
                results[alert_type] = False
        
        return results
    
    def get_alert_history(self, user_id: Optional[str] = None, 
                         limit: int = 100) -> List[AlertEvent]:
        """
        Get alert history for a user or all users.
        
        Args:
            user_id: ID of the user (None for all users)
            limit: Maximum number of alerts to return
            
        Returns:
            List of alert events
        """
        if user_id:
            user_alerts = [alert for alert in self.alert_history if alert.user_id == user_id]
            return user_alerts[-limit:]
        
        return self.alert_history[-limit:]
    
    def get_alert_stats(self, user_id: Optional[str] = None) -> Dict:
        """
        Get alert statistics for a user or all users.
        
        Args:
            user_id: ID of the user (None for all users)
            
        Returns:
            Dictionary with alert statistics
        """
        alerts = self.get_alert_history(user_id)
        
        if not alerts:
            return {
                "total_alerts": 0,
                "alerts_by_type": {},
                "alerts_by_level": {},
                "average_confidence": 0.0,
                "recent_alerts": 0
            }
        
        # Calculate statistics
        total_alerts = len(alerts)
        alerts_by_type = {}
        alerts_by_level = {}
        total_confidence = 0.0
        recent_alerts = 0
        
        current_time = time.time()
        one_hour_ago = current_time - 3600
        
        for alert in alerts:
            # Count by type
            alert_type = alert.alert_type.value
            alerts_by_type[alert_type] = alerts_by_type.get(alert_type, 0) + 1
            
            # Count by level
            alert_level = alert.level.value
            alerts_by_level[alert_level] = alerts_by_level.get(alert_level, 0) + 1
            
            # Sum confidence
            total_confidence += alert.confidence
            
            # Count recent alerts
            if alert.timestamp > one_hour_ago:
                recent_alerts += 1
        
        return {
            "total_alerts": total_alerts,
            "alerts_by_type": alerts_by_type,
            "alerts_by_level": alerts_by_level,
            "average_confidence": total_confidence / total_alerts if total_alerts > 0 else 0.0,
            "recent_alerts": recent_alerts
        }
    
    def clear_history(self, user_id: Optional[str] = None):
        """
        Clear alert history for a user or all users.
        
        Args:
            user_id: ID of the user (None for all users)
        """
        if user_id:
            self.alert_history = [alert for alert in self.alert_history if alert.user_id != user_id]
            logger.info(f"Cleared alert history for user {user_id}")
        else:
            self.alert_history.clear()
            logger.info("Cleared all alert history")
    
    def get_configuration(self) -> Dict:
        """Get current alert configuration."""
        return {
            alert_type: {
                "enabled": config.enabled,
                "threshold": config.threshold,
                "cooldown": config.cooldown,
                "max_frequency": config.max_frequency,
                "custom_message": config.custom_message
            }
            for alert_type, config in self.alert_configs.items()
        }
