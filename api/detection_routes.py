"""
Detection API Routes
Handles detection-related API endpoints for the ScreenGuard Pro application.
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging
import time
import json

from ..models.screen_peek_detector import ScreenPeekDetector, DetectionResult
from ..services.alert_service import AlertService, AlertType, AlertLevel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/detection", tags=["detection"])

# Initialize services
detector = ScreenPeekDetector()
alert_service = AlertService()

# Pydantic models for request/response
class DetectionRequest(BaseModel):
    """Request model for detection processing."""
    user_id: str
    image_data: str  # Base64 encoded image
    timestamp: Optional[float] = None
    screen_region: Optional[Dict[str, int]] = None

class DetectionResponse(BaseModel):
    """Response model for detection results."""
    detection_id: str
    user_id: str
    is_peeking: bool
    confidence: float
    face_count: int
    gaze_angles: List[List[float]]
    timestamp: float
    alerts_sent: List[str]

class DetectionConfig(BaseModel):
    """Configuration model for detection settings."""
    confidence_threshold: float = 0.7
    gaze_threshold: float = 0.3
    screen_region: Optional[Dict[str, int]] = None
    alert_types: List[str] = ["visual", "audio", "haptic"]

class DetectionStats(BaseModel):
    """Statistics model for detection data."""
    total_detections: int
    peeking_detections: int
    false_positives: int
    average_confidence: float
    detection_rate: float
    last_detection: Optional[float]

# WebSocket connection manager
class DetectionConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.detection_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to detection WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.detection_tasks:
            self.detection_tasks[user_id].cancel()
            del self.detection_tasks[user_id]
        logger.info(f"User {user_id} disconnected from detection WebSocket")

    async def send_detection_update(self, user_id: str, detection_data: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(detection_data))
            except Exception as e:
                logger.error(f"Error sending detection update to user {user_id}: {e}")

manager = DetectionConnectionManager()

@router.post("/process", response_model=DetectionResponse)
async def process_detection(request: DetectionRequest):
    """
    Process a single detection request.
    
    Args:
        request: Detection request with image data and user information
        
    Returns:
        DetectionResponse with detection results
    """
    try:
        # Validate user_id
        if not request.user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Update screen region if provided
        if request.screen_region:
            screen_region = (
                request.screen_region.get("x", 0),
                request.screen_region.get("y", 0),
                request.screen_region.get("width", 1920),
                request.screen_region.get("height", 1080)
            )
            detector.update_screen_region(screen_region)
        
        # Process the detection
        # Note: In a real implementation, you would decode the base64 image data
        # and process it with the detector. For now, we'll simulate the process.
        
        # Simulate detection processing
        detection_result = DetectionResult(
            is_peeking=False,  # This would be determined by actual image processing
            confidence=0.0,
            face_count=0,
            gaze_angles=[],
            timestamp=request.timestamp or time.time()
        )
        
        # Generate detection ID
        detection_id = f"{request.user_id}_{int(time.time() * 1000)}"
        
        # Send alerts if peeking detected
        alerts_sent = []
        if detection_result.is_peeking and detection_result.confidence > 0.7:
            alert_types = [AlertType.VISUAL, AlertType.AUDIO, AlertType.HAPTIC]
            alert_results = await alert_service.send_multiple_alerts(
                user_id=request.user_id,
                alert_types=alert_types,
                level=AlertLevel.MEDIUM,
                message="Screen peeking detected!",
                confidence=detection_result.confidence
            )
            
            alerts_sent = [alert_type.value for alert_type, sent in alert_results.items() if sent]
        
        # Send real-time update via WebSocket
        await manager.send_detection_update(request.user_id, {
            "detection_id": detection_id,
            "is_peeking": detection_result.is_peeking,
            "confidence": detection_result.confidence,
            "timestamp": detection_result.timestamp
        })
        
        return DetectionResponse(
            detection_id=detection_id,
            user_id=request.user_id,
            is_peeking=detection_result.is_peeking,
            confidence=detection_result.confidence,
            face_count=detection_result.face_count,
            gaze_angles=detection_result.gaze_angles,
            timestamp=detection_result.timestamp,
            alerts_sent=alerts_sent
        )
        
    except Exception as e:
        logger.error(f"Error processing detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/status/{user_id}")
async def get_detection_status(user_id: str):
    """
    Get current detection status for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        Current detection status and statistics
    """
    try:
        # Get alert statistics
        alert_stats = alert_service.get_alert_stats(user_id)
        
        # Get detection configuration
        detector_stats = detector.get_detection_stats()
        
        return {
            "user_id": user_id,
            "is_active": user_id in manager.active_connections,
            "detection_config": detector_stats,
            "alert_stats": alert_stats,
            "last_update": time.time()
        }
        
    except Exception as e:
        logger.error(f"Error getting detection status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/config/{user_id}")
async def update_detection_config(user_id: str, config: DetectionConfig):
    """
    Update detection configuration for a user.
    
    Args:
        user_id: ID of the user
        config: New detection configuration
        
    Returns:
        Updated configuration
    """
    try:
        # Update detector configuration
        detector.confidence_threshold = config.confidence_threshold
        detector.gaze_threshold = config.gaze_threshold
        
        if config.screen_region:
            screen_region = (
                config.screen_region.get("x", 0),
                config.screen_region.get("y", 0),
                config.screen_region.get("width", 1920),
                config.screen_region.get("height", 1080)
            )
            detector.update_screen_region(screen_region)
        
        # Update alert service configuration
        for alert_type_str in config.alert_types:
            try:
                alert_type = AlertType(alert_type_str)
                # Enable the alert type
                alert_config = alert_service.alert_configs.get(alert_type_str)
                if alert_config:
                    alert_config.enabled = True
            except ValueError:
                logger.warning(f"Invalid alert type: {alert_type_str}")
        
        return {
            "user_id": user_id,
            "config_updated": True,
            "new_config": {
                "confidence_threshold": config.confidence_threshold,
                "gaze_threshold": config.gaze_threshold,
                "screen_region": config.screen_region,
                "alert_types": config.alert_types
            }
        }
        
    except Exception as e:
        logger.error(f"Error updating detection config: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats/{user_id}")
async def get_detection_stats(user_id: str):
    """
    Get detection statistics for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        Detection statistics
    """
    try:
        # Get alert statistics
        alert_stats = alert_service.get_alert_stats(user_id)
        
        # Calculate detection statistics
        total_detections = alert_stats.get("total_alerts", 0)
        peeking_detections = alert_stats.get("alerts_by_level", {}).get("medium", 0) + \
                           alert_stats.get("alerts_by_level", {}).get("high", 0)
        
        return DetectionStats(
            total_detections=total_detections,
            peeking_detections=peeking_detections,
            false_positives=0,  # This would be calculated from user feedback
            average_confidence=alert_stats.get("average_confidence", 0.0),
            detection_rate=peeking_detections / max(total_detections, 1),
            last_detection=time.time() if peeking_detections > 0 else None
        )
        
    except Exception as e:
        logger.error(f"Error getting detection stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.websocket("/ws/{user_id}")
async def websocket_detection(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time detection updates.
    
    Args:
        websocket: WebSocket connection
        user_id: ID of the user
    """
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "start_detection":
                # Start continuous detection
                await start_continuous_detection(user_id)
            elif message.get("type") == "stop_detection":
                # Stop continuous detection
                if user_id in manager.detection_tasks:
                    manager.detection_tasks[user_id].cancel()
                    del manager.detection_tasks[user_id]
            elif message.get("type") == "update_config":
                # Update detection configuration
                config_data = message.get("config", {})
                # Process configuration update
                pass
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)

async def start_continuous_detection(user_id: str):
    """Start continuous detection for a user."""
    if user_id in manager.detection_tasks:
        return  # Already running
    
    async def detection_loop():
        while True:
            try:
                # Simulate detection processing
                # In a real implementation, this would process camera frames
                await asyncio.sleep(1)  # Process every second
                
                # Send periodic status update
                await manager.send_detection_update(user_id, {
                    "type": "status_update",
                    "is_active": True,
                    "timestamp": time.time()
                })
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in detection loop for user {user_id}: {e}")
                break
    
    task = asyncio.create_task(detection_loop())
    manager.detection_tasks[user_id] = task

@router.delete("/stop/{user_id}")
async def stop_detection(user_id: str):
    """
    Stop detection for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        Success status
    """
    try:
        if user_id in manager.detection_tasks:
            manager.detection_tasks[user_id].cancel()
            del manager.detection_tasks[user_id]
        
        return {"user_id": user_id, "detection_stopped": True}
        
    except Exception as e:
        logger.error(f"Error stopping detection for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
