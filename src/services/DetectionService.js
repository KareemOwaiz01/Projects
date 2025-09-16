/**
 * Detection Service - Handles screen peeking detection functionality
 */

import { Platform, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DetectionService {
  constructor() {
    this.isDetecting = false;
    this.detectionInterval = null;
    this.camera = null;
    this.callbacks = {
      onDetection: null,
      onError: null,
    };
  }

  async initialize() {
    try {
      // Initialize camera permissions
      await this.requestPermissions();
      
      // Load saved settings
      const settings = await this.loadSettings();
      this.settings = {
        confidenceThreshold: 0.7,
        gazeThreshold: 0.3,
        detectionInterval: 1000, // 1 second
        ...settings,
      };
      
      console.log('DetectionService initialized');
    } catch (error) {
      console.error('Failed to initialize DetectionService:', error);
      throw error;
    }
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'ScreenGuard Pro needs camera access to detect screen peeking',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS permissions handled by react-native-vision-camera
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startDetection() {
    try {
      if (this.isDetecting) {
        console.log('Detection already running');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      this.isDetecting = true;
      
      // Start detection loop
      this.detectionInterval = setInterval(() => {
        this.performDetection();
      }, this.settings.detectionInterval);

      // Save detection state
      await AsyncStorage.setItem('detection_active', 'true');
      
      console.log('Detection started');
    } catch (error) {
      console.error('Failed to start detection:', error);
      this.isDetecting = false;
      throw error;
    }
  }

  async stopDetection() {
    try {
      if (!this.isDetecting) {
        console.log('Detection not running');
        return;
      }

      this.isDetecting = false;
      
      if (this.detectionInterval) {
        clearInterval(this.detectionInterval);
        this.detectionInterval = null;
      }

      // Save detection state
      await AsyncStorage.setItem('detection_active', 'false');
      
      console.log('Detection stopped');
    } catch (error) {
      console.error('Failed to stop detection:', error);
      throw error;
    }
  }

  async performDetection() {
    try {
      // This is a simplified detection implementation
      // In a real app, this would use the camera and ML models
      
      // Simulate detection processing
      const mockDetection = {
        isPeeking: Math.random() > 0.8, // 20% chance of peeking
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        timestamp: new Date().toISOString(),
        faceCount: Math.floor(Math.random() * 3) + 1,
        gazeAngles: [Math.random() * 30 - 15, Math.random() * 30 - 15],
      };

      // Check if detection meets threshold
      if (mockDetection.isPeeking && mockDetection.confidence >= this.settings.confidenceThreshold) {
        await this.handleDetection(mockDetection);
      }

      // Store detection data
      await this.storeDetection(mockDetection);
      
    } catch (error) {
      console.error('Detection processing failed:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  async handleDetection(detection) {
    try {
      // Trigger callbacks
      if (this.callbacks.onDetection) {
        this.callbacks.onDetection(detection);
      }

      // Store alert
      const alert = {
        id: Date.now().toString(),
        type: 'detection',
        level: detection.confidence > 0.8 ? 'high' : 'medium',
        message: `Screen peeking detected with ${(detection.confidence * 100).toFixed(1)}% confidence`,
        timestamp: detection.timestamp,
        confidence: detection.confidence,
        metadata: detection,
      };

      await this.storeAlert(alert);
      
      console.log('Detection handled:', detection);
    } catch (error) {
      console.error('Failed to handle detection:', error);
    }
  }

  async storeDetection(detection) {
    try {
      const detections = await this.getDetections();
      detections.unshift(detection);
      
      // Keep only last 100 detections
      if (detections.length > 100) {
        detections.splice(100);
      }
      
      await AsyncStorage.setItem('detections', JSON.stringify(detections));
    } catch (error) {
      console.error('Failed to store detection:', error);
    }
  }

  async storeAlert(alert) {
    try {
      const alerts = await this.getAlerts();
      alerts.unshift(alert);
      
      // Keep only last 50 alerts
      if (alerts.length > 50) {
        alerts.splice(50);
      }
      
      await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  async getDetections(limit = 20) {
    try {
      const detections = await AsyncStorage.getItem('detections');
      return detections ? JSON.parse(detections).slice(0, limit) : [];
    } catch (error) {
      console.error('Failed to get detections:', error);
      return [];
    }
  }

  async getAlerts(limit = 20) {
    try {
      const alerts = await AsyncStorage.getItem('alerts');
      return alerts ? JSON.parse(alerts).slice(0, limit) : [];
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const detections = await this.getDetections(1000);
      const alerts = await this.getAlerts(1000);
      
      const totalDetections = detections.length;
      const peekingDetections = detections.filter(d => d.isPeeking).length;
      const accuracy = totalDetections > 0 ? (peekingDetections / totalDetections) * 100 : 0;
      const alertsToday = alerts.filter(a => {
        const today = new Date().toDateString();
        const alertDate = new Date(a.timestamp).toDateString();
        return today === alertDate;
      }).length;

      return {
        totalDetections,
        peekingDetections,
        accuracy: Math.round(accuracy),
        alertsToday,
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalDetections: 0,
        peekingDetections: 0,
        accuracy: 0,
        alertsToday: 0,
      };
    }
  }

  async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('detection_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  async saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem('detection_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  setCallback(type, callback) {
    this.callbacks[type] = callback;
  }

  isDetectionActive() {
    return this.isDetecting;
  }

  getSettings() {
    return this.settings;
  }
}
