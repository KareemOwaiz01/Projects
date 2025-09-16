/**
 * Settings Screen - App configuration and preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Switch, Button, List, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { DetectionService } from '../services/DetectionService';
import { AlertService } from '../services/AlertService';
import { StorageService } from '../services/StorageService';

const detectionService = new DetectionService();
const alertService = new AlertService();
const storageService = new StorageService();

export default function SettingsScreen() {
  const [detectionSettings, setDetectionSettings] = useState({});
  const [alertSettings, setAlertSettings] = useState({});
  const [userPreferences, setUserPreferences] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const detection = await detectionService.getSettings();
      const alert = await alertService.getSettings();
      const user = await storageService.getUserPreferences();
      
      setDetectionSettings(detection);
      setAlertSettings(alert);
      setUserPreferences(user);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateDetectionSetting = async (key, value) => {
    try {
      const newSettings = { ...detectionSettings, [key]: value };
      setDetectionSettings(newSettings);
      await detectionService.saveSettings(newSettings);
    } catch (error) {
      console.error('Failed to update detection setting:', error);
    }
  };

  const updateAlertSetting = async (key, value) => {
    try {
      const newSettings = { ...alertSettings, [key]: value };
      setAlertSettings(newSettings);
      await alertService.saveSettings(newSettings);
    } catch (error) {
      console.error('Failed to update alert setting:', error);
    }
  };

  const updateUserPreference = async (key, value) => {
    try {
      const newPreferences = { ...userPreferences, [key]: value };
      setUserPreferences(newPreferences);
      await storageService.setUserPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update user preference:', error);
    }
  };

  const exportData = async () => {
    try {
      const data = await storageService.exportData();
      Alert.alert('Data Exported', 'Your data has been exported successfully.');
      console.log('Exported data:', data);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data: ' + error.message);
    }
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all detection history, alerts, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clear();
              await loadSettings();
              Alert.alert('Data Cleared', 'All data has been cleared successfully.');
            } catch (error) {
              Alert.alert('Clear Failed', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await detectionService.saveSettings({});
              await alertService.saveSettings({});
              await storageService.setUserPreferences({});
              await loadSettings();
              Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
            } catch (error) {
              Alert.alert('Reset Failed', 'Failed to reset settings: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Detection Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Detection Settings</Title>
          
          <List.Item
            title="Enable Detection"
            description="Allow screen peeking detection"
            left={() => <Icon name="visibility" size={24} color="#2196F3" />}
            right={() => (
              <Switch
                value={detectionSettings.enabled !== false}
                onValueChange={(value) => updateDetectionSetting('enabled', value)}
              />
            )}
          />
          
          <List.Item
            title="Auto Start"
            description="Start detection when app launches"
            left={() => <Icon name="play-arrow" size={24} color="#4CAF50" />}
            right={() => (
              <Switch
                value={userPreferences.autoStart || false}
                onValueChange={(value) => updateUserPreference('autoStart', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Alert Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Alert Settings</Title>
          
          <List.Item
            title="Visual Alerts"
            description="Show popup alerts when peeking is detected"
            left={() => <Icon name="visibility" size={24} color="#FF9800" />}
            right={() => (
              <Switch
                value={alertSettings.visualAlerts !== false}
                onValueChange={(value) => updateAlertSetting('visualAlerts', value)}
              />
            )}
          />
          
          <List.Item
            title="Audio Alerts"
            description="Play sound when peeking is detected"
            left={() => <Icon name="volume-up" size={24} color="#F44336" />}
            right={() => (
              <Switch
                value={alertSettings.audioAlerts !== false}
                onValueChange={(value) => updateAlertSetting('audioAlerts', value)}
              />
            )}
          />
          
          <List.Item
            title="Haptic Alerts"
            description="Vibrate when peeking is detected"
            left={() => <Icon name="vibration" size={24} color="#9C27B0" />}
            right={() => (
              <Switch
                value={alertSettings.hapticAlerts !== false}
                onValueChange={(value) => updateAlertSetting('hapticAlerts', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Privacy Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Privacy Settings</Title>
          
          <List.Item
            title="Privacy Mode"
            description="Hide sensitive information in notifications"
            left={() => <Icon name="security" size={24} color="#607D8B" />}
            right={() => (
              <Switch
                value={userPreferences.privacyMode || false}
                onValueChange={(value) => updateUserPreference('privacyMode', value)}
              />
            )}
          />
          
          <List.Item
            title="Data Collection"
            description="Allow anonymous usage data collection"
            left={() => <Icon name="analytics" size={24} color="#795548" />}
            right={() => (
              <Switch
                value={userPreferences.dataCollection !== false}
                onValueChange={(value) => updateUserPreference('dataCollection', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          
          <List.Item
            title="Theme"
            description={userPreferences.theme === 'dark' ? 'Dark' : 'Light'}
            left={() => <Icon name="palette" size={24} color="#E91E63" />}
            right={() => (
              <Switch
                value={userPreferences.theme === 'dark'}
                onValueChange={(value) => updateUserPreference('theme', value ? 'dark' : 'light')}
              />
            )}
          />
          
          <List.Item
            title="Notifications"
            description="Enable push notifications"
            left={() => <Icon name="notifications" size={24} color="#FF5722" />}
            right={() => (
              <Switch
                value={userPreferences.notifications !== false}
                onValueChange={(value) => updateUserPreference('notifications', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Data Management</Title>
          
          <Button
            mode="outlined"
            onPress={exportData}
            style={styles.actionButton}
            icon="download"
          >
            Export Data
          </Button>
          
          <Button
            mode="outlined"
            onPress={resetSettings}
            style={styles.actionButton}
            icon="restore"
          >
            Reset Settings
          </Button>
          
          <Button
            mode="outlined"
            onPress={clearData}
            style={[styles.actionButton, styles.dangerButton]}
            icon="delete"
            textColor="#F44336"
          >
            Clear All Data
          </Button>
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Information</Title>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={() => <Icon name="info" size={24} color="#2196F3" />}
          />
          
          <List.Item
            title="Build"
            description="2024.01.15"
            left={() => <Icon name="build" size={24} color="#4CAF50" />}
          />
          
          <List.Item
            title="Privacy Policy"
            description="View our privacy policy"
            left={() => <Icon name="policy" size={24} color="#FF9800" />}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here.')}
          />
          
          <List.Item
            title="Terms of Service"
            description="View terms of service"
            left={() => <Icon name="description" size={24} color="#9C27B0" />}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service content would be displayed here.')}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButton: {
    marginVertical: 8,
  },
  dangerButton: {
    borderColor: '#F44336',
  },
});
