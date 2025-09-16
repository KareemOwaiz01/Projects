"""
Screen Peek Detection Model
Core computer vision model for detecting when someone is peering at the screen.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Optional
import logging
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DetectionResult:
    """Data class for detection results."""
    is_peeking: bool
    confidence: float
    face_count: int
    gaze_angles: List[Tuple[float, float]]
    timestamp: float

class ScreenPeekDetector:
    """
    Main class for detecting screen peeking behavior using computer vision.
    
    This class uses MediaPipe for face detection and gaze estimation to determine
    if someone is looking at the user's screen.
    """
    
    def __init__(self, 
                 confidence_threshold: float = 0.7,
                 gaze_threshold: float = 0.3,
                 screen_region: Optional[Tuple[int, int, int, int]] = None):
        """
        Initialize the screen peek detector.
        
        Args:
            confidence_threshold: Minimum confidence for face detection
            gaze_threshold: Threshold for determining if gaze is directed at screen
            screen_region: Screen region coordinates (x, y, width, height)
        """
        self.confidence_threshold = confidence_threshold
        self.gaze_threshold = gaze_threshold
        self.screen_region = screen_region
        
        # Initialize MediaPipe solutions
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Initialize face detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,  # 0 for short-range, 1 for full-range
            min_detection_confidence=confidence_threshold
        )
        
        # Initialize face mesh for detailed landmarks
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=confidence_threshold,
            min_tracking_confidence=0.5
        )
        
        logger.info("ScreenPeekDetector initialized successfully")
    
    def detect_faces(self, frame: np.ndarray) -> List[dict]:
        """
        Detect faces in the given frame.
        
        Args:
            frame: Input image frame (BGR format)
            
        Returns:
            List of face detection results
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_frame)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                confidence = detection.score[0]
                
                if confidence >= self.confidence_threshold:
                    faces.append({
                        'bbox': bbox,
                        'confidence': confidence,
                        'landmarks': detection.location_data.relative_keypoints
                    })
        
        return faces
    
    def estimate_gaze_direction(self, frame: np.ndarray, face_bbox: dict) -> Tuple[float, float]:
        """
        Estimate gaze direction for a detected face.
        
        Args:
            frame: Input image frame
            face_bbox: Face bounding box information
            
        Returns:
            Tuple of (pitch, yaw) angles in degrees
        """
        try:
            # Extract face region
            h, w = frame.shape[:2]
            x = int(face_bbox['bbox'].xmin * w)
            y = int(face_bbox['bbox'].ymin * h)
            width = int(face_bbox['bbox'].width * w)
            height = int(face_bbox['bbox'].height * h)
            
            # Ensure coordinates are within frame bounds
            x = max(0, x)
            y = max(0, y)
            width = min(width, w - x)
            height = min(height, h - y)
            
            face_roi = frame[y:y+height, x:x+width]
            
            if face_roi.size == 0:
                return (0.0, 0.0)
            
            # Process with face mesh for detailed landmarks
            rgb_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            mesh_results = self.face_mesh.process(rgb_face)
            
            if mesh_results.multi_face_landmarks:
                landmarks = mesh_results.multi_face_landmarks[0]
                
                # Calculate gaze direction using eye landmarks
                # This is a simplified approach - in production, use a proper gaze estimation model
                left_eye_center = self._get_eye_center(landmarks, 'left')
                right_eye_center = self._get_eye_center(landmarks, 'right')
                nose_tip = self._get_nose_tip(landmarks)
                
                if left_eye_center and right_eye_center and nose_tip:
                    # Calculate head pose angles
                    pitch, yaw = self._calculate_head_pose(
                        left_eye_center, right_eye_center, nose_tip
                    )
                    return (pitch, yaw)
            
        except Exception as e:
            logger.error(f"Error in gaze estimation: {e}")
        
        return (0.0, 0.0)
    
    def _get_eye_center(self, landmarks, eye_type: str) -> Optional[Tuple[float, float]]:
        """Get eye center coordinates from face mesh landmarks."""
        # MediaPipe face mesh eye landmark indices
        if eye_type == 'left':
            eye_indices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        else:  # right eye
            eye_indices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        
        eye_points = []
        for idx in eye_indices:
            if idx < len(landmarks.landmark):
                landmark = landmarks.landmark[idx]
                eye_points.append((landmark.x, landmark.y))
        
        if eye_points:
            return (sum(p[0] for p in eye_points) / len(eye_points),
                   sum(p[1] for p in eye_points) / len(eye_points))
        return None
    
    def _get_nose_tip(self, landmarks) -> Optional[Tuple[float, float]]:
        """Get nose tip coordinates from face mesh landmarks."""
        # Nose tip landmark index in MediaPipe face mesh
        nose_tip_idx = 1
        if nose_tip_idx < len(landmarks.landmark):
            landmark = landmarks.landmark[nose_tip_idx]
            return (landmark.x, landmark.y)
        return None
    
    def _calculate_head_pose(self, left_eye, right_eye, nose_tip) -> Tuple[float, float]:
        """
        Calculate head pose angles from facial landmarks.
        
        Args:
            left_eye: Left eye center coordinates
            right_eye: Right eye center coordinates
            nose_tip: Nose tip coordinates
            
        Returns:
            Tuple of (pitch, yaw) angles in degrees
        """
        # Calculate eye center
        eye_center_x = (left_eye[0] + right_eye[0]) / 2
        eye_center_y = (left_eye[1] + right_eye[1]) / 2
        
        # Calculate pitch (vertical head movement)
        pitch = np.arctan2(nose_tip[1] - eye_center_y, abs(nose_tip[0] - eye_center_x))
        pitch_degrees = np.degrees(pitch)
        
        # Calculate yaw (horizontal head movement)
        yaw = np.arctan2(nose_tip[0] - eye_center_x, abs(nose_tip[1] - eye_center_y))
        yaw_degrees = np.degrees(yaw)
        
        return (pitch_degrees, yaw_degrees)
    
    def is_looking_at_screen(self, gaze_angles: Tuple[float, float]) -> bool:
        """
        Determine if the gaze direction indicates looking at the screen.
        
        Args:
            gaze_angles: Tuple of (pitch, yaw) angles
            
        Returns:
            True if looking at screen, False otherwise
        """
        pitch, yaw = gaze_angles
        
        # Define thresholds for screen-looking behavior
        # These values may need adjustment based on testing
        pitch_threshold = 15.0  # degrees
        yaw_threshold = 20.0    # degrees
        
        # Check if gaze is within screen-looking range
        is_pitch_ok = abs(pitch) < pitch_threshold
        is_yaw_ok = abs(yaw) < yaw_threshold
        
        return is_pitch_ok and is_yaw_ok
    
    def process_frame(self, frame: np.ndarray) -> DetectionResult:
        """
        Process a single frame and return detection results.
        
        Args:
            frame: Input image frame (BGR format)
            
        Returns:
            DetectionResult object with detection information
        """
        import time
        
        timestamp = time.time()
        
        # Detect faces
        faces = self.detect_faces(frame)
        face_count = len(faces)
        
        is_peeking = False
        gaze_angles = []
        max_confidence = 0.0
        
        # Process each detected face
        for face in faces:
            gaze = self.estimate_gaze_direction(frame, face)
            gaze_angles.append(gaze)
            
            if self.is_looking_at_screen(gaze):
                is_peeking = True
                max_confidence = max(max_confidence, face['confidence'])
        
        # Calculate overall confidence
        confidence = max_confidence if is_peeking else 0.0
        
        return DetectionResult(
            is_peeking=is_peeking,
            confidence=confidence,
            face_count=face_count,
            gaze_angles=gaze_angles,
            timestamp=timestamp
        )
    
    def update_screen_region(self, screen_region: Tuple[int, int, int, int]):
        """Update the screen region coordinates."""
        self.screen_region = screen_region
        logger.info(f"Screen region updated: {screen_region}")
    
    def get_detection_stats(self) -> dict:
        """Get detection statistics and performance metrics."""
        return {
            "confidence_threshold": self.confidence_threshold,
            "gaze_threshold": self.gaze_threshold,
            "screen_region": self.screen_region,
            "model_status": "active"
        }
