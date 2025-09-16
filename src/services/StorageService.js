/**
 * Storage Service - Handles local data storage and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  constructor() {
    this.keys = {
      DETECTION_SETTINGS: 'detection_settings',
      ALERT_SETTINGS: 'alert_settings',
      USER_PREFERENCES: 'user_preferences',
      DETECTIONS: 'detections',
      ALERTS: 'alerts',
      STATS: 'stats',
      DEVICE_INFO: 'device_info',
    };
  }

  async initialize() {
    try {
      // Initialize default settings if they don't exist
      await this.initializeDefaultSettings();
      console.log('StorageService initialized');
    } catch (error) {
      console.error('Failed to initialize StorageService:', error);
      throw error;
    }
  }

  async initializeDefaultSettings() {
    try {
      // Check if settings exist
      const detectionSettings = await this.getDetectionSettings();
      const alertSettings = await this.getAlertSettings();
      const userPreferences = await this.getUserPreferences();

      // Set default detection settings
      if (!detectionSettings || Object.keys(detectionSettings).length === 0) {
        await this.setDetectionSettings({
          confidenceThreshold: 0.7,
          gazeThreshold: 0.3,
          detectionInterval: 1000,
          screenRegion: { x: 0, y: 0, width: 375, height: 812 },
          enabled: true,
        });
      }

      // Set default alert settings
      if (!alertSettings || Object.keys(alertSettings).length === 0) {
        await this.setAlertSettings({
          visualAlerts: true,
          audioAlerts: true,
          hapticAlerts: true,
          audioVolume: 0.8,
          vibrationPattern: [0, 500, 200, 500],
          alertLevels: {
            low: true,
            medium: true,
            high: true,
            critical: true,
          },
        });
      }

      // Set default user preferences
      if (!userPreferences || Object.keys(userPreferences).length === 0) {
        await this.setUserPreferences({
          theme: 'light',
          language: 'en',
          notifications: true,
          autoStart: false,
          privacyMode: false,
        });
      }
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
    }
  }

  // Detection Settings
  async getDetectionSettings() {
    try {
      const settings = await AsyncStorage.getItem(this.keys.DETECTION_SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to get detection settings:', error);
      return {};
    }
  }

  async setDetectionSettings(settings) {
    try {
      await AsyncStorage.setItem(this.keys.DETECTION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to set detection settings:', error);
      throw error;
    }
  }

  // Alert Settings
  async getAlertSettings() {
    try {
      const settings = await AsyncStorage.getItem(this.keys.ALERT_SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to get alert settings:', error);
      return {};
    }
  }

  async setAlertSettings(settings) {
    try {
      await AsyncStorage.setItem(this.keys.ALERT_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to set alert settings:', error);
      throw error;
    }
  }

  // User Preferences
  async getUserPreferences() {
    try {
      const preferences = await AsyncStorage.getItem(this.keys.USER_PREFERENCES);
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  async setUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to set user preferences:', error);
      throw error;
    }
  }

  // Detections
  async getDetections(limit = 100) {
    try {
      const detections = await AsyncStorage.getItem(this.keys.DETECTIONS);
      const parsed = detections ? JSON.parse(detections) : [];
      return parsed.slice(0, limit);
    } catch (error) {
      console.error('Failed to get detections:', error);
      return [];
    }
  }

  async addDetection(detection) {
    try {
      const detections = await this.getDetections(1000);
      detections.unshift({
        ...detection,
        id: detection.id || Date.now().toString(),
        timestamp: detection.timestamp || new Date().toISOString(),
      });
      
      // Keep only last 1000 detections
      if (detections.length > 1000) {
        detections.splice(1000);
      }
      
      await AsyncStorage.setItem(this.keys.DETECTIONS, JSON.stringify(detections));
    } catch (error) {
      console.error('Failed to add detection:', error);
      throw error;
    }
  }

  async clearDetections() {
    try {
      await AsyncStorage.removeItem(this.keys.DETECTIONS);
    } catch (error) {
      console.error('Failed to clear detections:', error);
      throw error;
    }
  }

  // Alerts
  async getAlerts(limit = 100) {
    try {
      const alerts = await AsyncStorage.getItem(this.keys.ALERTS);
      const parsed = alerts ? JSON.parse(alerts) : [];
      return parsed.slice(0, limit);
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }
  }

  async addAlert(alert) {
    try {
      const alerts = await this.getAlerts(1000);
      alerts.unshift({
        ...alert,
        id: alert.id || Date.now().toString(),
        timestamp: alert.timestamp || new Date().toISOString(),
        isRead: false,
      });
      
      // Keep only last 1000 alerts
      if (alerts.length > 1000) {
        alerts.splice(1000);
      }
      
      await AsyncStorage.setItem(this.keys.ALERTS, JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to add alert:', error);
      throw error;
    }
  }

  async markAlertAsRead(alertId) {
    try {
      const alerts = await this.getAlerts(1000);
      const alert = alerts.find(a => a.id === alertId);
      
      if (alert) {
        alert.isRead = true;
        alert.readAt = new Date().toISOString();
        await AsyncStorage.setItem(this.keys.ALERTS, JSON.stringify(alerts));
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      throw error;
    }
  }

  async clearAlerts() {
    try {
      await AsyncStorage.removeItem(this.keys.ALERTS);
    } catch (error) {
      console.error('Failed to clear alerts:', error);
      throw error;
    }
  }

  // Stats
  async getStats() {
    try {
      const stats = await AsyncStorage.getItem(this.keys.STATS);
      return stats ? JSON.parse(stats) : {
        totalDetections: 0,
        peekingDetections: 0,
        accuracy: 0,
        alertsToday: 0,
        lastDetection: null,
        lastAlert: null,
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalDetections: 0,
        peekingDetections: 0,
        accuracy: 0,
        alertsToday: 0,
        lastDetection: null,
        lastAlert: null,
      };
    }
  }

  async updateStats() {
    try {
      const detections = await this.getDetections(1000);
      const alerts = await this.getAlerts(1000);
      
      const totalDetections = detections.length;
      const peekingDetections = detections.filter(d => d.isPeeking).length;
      const accuracy = totalDetections > 0 ? (peekingDetections / totalDetections) * 100 : 0;
      
      const today = new Date().toDateString();
      const alertsToday = alerts.filter(a => {
        const alertDate = new Date(a.timestamp).toDateString();
        return today === alertDate;
      }).length;
      
      const lastDetection = detections.length > 0 ? detections[0].timestamp : null;
      const lastAlert = alerts.length > 0 ? alerts[0].timestamp : null;
      
      const stats = {
        totalDetections,
        peekingDetections,
        accuracy: Math.round(accuracy),
        alertsToday,
        lastDetection,
        lastAlert,
      };
      
      await AsyncStorage.setItem(this.keys.STATS, JSON.stringify(stats));
      return stats;
    } catch (error) {
      console.error('Failed to update stats:', error);
      throw error;
    }
  }

  // Device Info
  async getDeviceInfo() {
    try {
      const deviceInfo = await AsyncStorage.getItem(this.keys.DEVICE_INFO);
      return deviceInfo ? JSON.parse(deviceInfo) : {};
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {};
    }
  }

  async setDeviceInfo(deviceInfo) {
    try {
      await AsyncStorage.setItem(this.keys.DEVICE_INFO, JSON.stringify(deviceInfo));
    } catch (error) {
      console.error('Failed to set device info:', error);
      throw error;
    }
  }

  // Generic storage methods
  async getItem(key) {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  // Export/Import data
  async exportData() {
    try {
      const data = {
        detections: await this.getDetections(1000),
        alerts: await this.getAlerts(1000),
        settings: {
          detection: await this.getDetectionSettings(),
          alert: await this.getAlertSettings(),
          user: await this.getUserPreferences(),
        },
        stats: await this.getStats(),
        deviceInfo: await this.getDeviceInfo(),
        exportDate: new Date().toISOString(),
      };
      
      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      if (data.detections) {
        await AsyncStorage.setItem(this.keys.DETECTIONS, JSON.stringify(data.detections));
      }
      
      if (data.alerts) {
        await AsyncStorage.setItem(this.keys.ALERTS, JSON.stringify(data.alerts));
      }
      
      if (data.settings) {
        if (data.settings.detection) {
          await this.setDetectionSettings(data.settings.detection);
        }
        if (data.settings.alert) {
          await this.setAlertSettings(data.settings.alert);
        }
        if (data.settings.user) {
          await this.setUserPreferences(data.settings.user);
        }
      }
      
      if (data.stats) {
        await AsyncStorage.setItem(this.keys.STATS, JSON.stringify(data.stats));
      }
      
      if (data.deviceInfo) {
        await this.setDeviceInfo(data.deviceInfo);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
}
