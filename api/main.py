"""
ScreenGuard Pro - FastAPI Backend Application
Main application entry point with API routes and configuration.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ScreenGuard Pro API",
    description="Security application API for screen peeking detection",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "ScreenGuard Pro API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "screen-guard-pro-api",
        "version": "1.0.0"
    }

@app.websocket("/ws/detection/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time detection data streaming."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Process detection data here
            await manager.send_personal_message(f"Detection data for user {user_id}: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/detection/status/{user_id}")
async def get_detection_status(user_id: str):
    """Get current detection status for a user."""
    return {
        "user_id": user_id,
        "is_detecting": True,
        "last_detection": None,
        "alert_count": 0
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
