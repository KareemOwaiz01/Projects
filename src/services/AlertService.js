/**
 * Alert Service - Handles different types of alerts and notifications
 */

import { Alert, Vibration, Platform } from 'react-native';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AlertService {
  constructor() {
    this.settings = {
      visualAlerts: true,
      audioAlerts: true,
      hapticAlerts: true,
      audioVolume: 0.8,
      vibrationPattern: [0, 500, 200, 500],
    };
    this.sound = null;
  }

  async initialize() {
    try {
      // Load saved settings
      const savedSettings = await this.loadSettings();
      this.settings = { ...this.settings, ...savedSettings };
      
      // Initialize sound
      this.initializeSound();
      
      console.log('AlertService initialized');
    } catch (error) {
      console.error('Failed to initialize AlertService:', error);
    }
  }

  initializeSound() {
    try {
      // Initialize sound for alerts
      Sound.setCategory('Playback');
      this.sound = new Sound('alert.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound file:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize sound:', error);
    }
  }

  async triggerAlert(alert) {
    try {
      const { type, level, message, metadata } = alert;
      
      // Visual alert
      if (this.settings.visualAlerts) {
        await this.showVisualAlert(message, level);
      }
      
      // Audio alert
      if (this.settings.audioAlerts) {
        await this.playAudioAlert(level);
      }
      
      // Haptic alert
      if (this.settings.hapticAlerts) {
        await this.triggerHapticAlert(level);
      }
      
      // Store alert
      await this.storeAlert(alert);
      
      console.log('Alert triggered:', alert);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  async showVisualAlert(message, level) {
    try {
      const alertConfig = this.getAlertConfig(level);
      
      Alert.alert(
        'ScreenGuard Alert',
        message,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (error) {
      console.error('Failed to show visual alert:', error);
    }
  }

  async playAudioAlert(level) {
    try {
      if (!this.sound) return;
      
      const volume = this.settings.audioVolume;
      const repeatCount = level === 'high' ? 3 : 1;
      
      this.sound.setVolume(volume);
      
      for (let i = 0; i < repeatCount; i++) {
        this.sound.play((success) => {
          if (!success) {
            console.log('Failed to play sound');
          }
        });
        
        // Add delay between repeats
        if (i < repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Failed to play audio alert:', error);
    }
  }

  async triggerHapticAlert(level) {
    try {
      const pattern = this.getVibrationPattern(level);
      
      if (Platform.OS === 'ios') {
        Vibration.vibrate(pattern);
      } else {
        Vibration.vibrate(pattern[1] || 500);
      }
    } catch (error) {
      console.error('Failed to trigger haptic alert:', error);
    }
  }

  getAlertConfig(level) {
    const configs = {
      low: {
        color: '#4CAF50',
        icon: 'info',
      },
      medium: {
        color: '#FF9800',
        icon: 'warning',
      },
      high: {
        color: '#F44336',
        icon: 'error',
      },
      critical: {
        color: '#9C27B0',
        icon: 'priority_high',
      },
    };
    
    return configs[level] || configs.medium;
  }

  getVibrationPattern(level) {
    const patterns = {
      low: [0, 200],
      medium: [0, 500, 200, 500],
      high: [0, 1000, 200, 1000, 200, 1000],
      critical: [0, 2000, 200, 2000, 200, 2000, 200, 2000],
    };
    
    return patterns[level] || patterns.medium;
  }

  async storeAlert(alert) {
    try {
      const alerts = await this.getAlerts();
      alerts.unshift(alert);
      
      // Keep only last 100 alerts
      if (alerts.length > 100) {
        alerts.splice(100);
      }
      
      await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to store alert:', error);
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

  async getRecentAlerts(limit = 5) {
    try {
      const alerts = await this.getAlerts(limit);
      return alerts.map(alert => ({
        id: alert.id,
        message: alert.message,
        level: alert.level,
        timestamp: this.formatTimestamp(alert.timestamp),
        type: alert.type,
      }));
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  async markAlertAsRead(alertId) {
    try {
      const alerts = await this.getAlerts(1000);
      const alert = alerts.find(a => a.id === alertId);
      
      if (alert) {
        alert.isRead = true;
        alert.readAt = new Date().toISOString();
        await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }

  async markAllAlertsAsRead() {
    try {
      const alerts = await this.getAlerts(1000);
      alerts.forEach(alert => {
        alert.isRead = true;
        alert.readAt = new Date().toISOString();
      });
      
      await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  }

  async getUnreadCount() {
    try {
      const alerts = await this.getAlerts(1000);
      return alerts.filter(alert => !alert.isRead).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('alert_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  async saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem('alert_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  getSettings() {
    return this.settings;
  }

  async testAlert(type = 'visual') {
    try {
      const testAlert = {
        id: Date.now().toString(),
        type: 'test',
        level: 'medium',
        message: `Test ${type} alert`,
        timestamp: new Date().toISOString(),
        metadata: { test: true },
      };
      
      await this.triggerAlert(testAlert);
    } catch (error) {
      console.error('Failed to test alert:', error);
    }
  }
}
