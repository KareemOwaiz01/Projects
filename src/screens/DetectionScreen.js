/**
 * Detection Screen - Real-time detection monitoring and controls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Button, Switch, Slider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';

import { DetectionService } from '../services/DetectionService';
import { AlertService } from '../services/AlertService';

const detectionService = new DetectionService();
const alertService = new AlertService();

export default function DetectionScreen() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [settings, setSettings] = useState({
    confidenceThreshold: 0.7,
    gazeThreshold: 0.3,
    detectionInterval: 1000,
    enabled: true,
  });

  // Fetch detection data
  const { data: detectionData, refetch } = useQuery(
    'detectionData',
    async () => {
      const detections = await detectionService.getDetections(10);
      const stats = await detectionService.getStats();
      return { detections, stats };
    },
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  useEffect(() => {
    loadSettings();
    checkDetectionStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await detectionService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const checkDetectionStatus = async () => {
    try {
      const isActive = detectionService.isDetectionActive();
      setIsDetecting(isActive);
    } catch (error) {
      console.error('Failed to check detection status:', error);
    }
  };

  const toggleDetection = async () => {
    try {
      if (isDetecting) {
        await detectionService.stopDetection();
        setIsDetecting(false);
        Alert.alert('Detection Stopped', 'Screen peeking detection has been stopped.');
      } else {
        const hasPermission = await detectionService.requestPermissions();
        if (hasPermission) {
          await detectionService.startDetection();
          setIsDetecting(true);
          Alert.alert('Detection Started', 'Screen peeking detection is now active.');
        } else {
          Alert.alert('Permission Required', 'Camera permission is required for detection.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle detection: ' + error.message);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await detectionService.saveSettings(newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const testAlert = async (type) => {
    try {
      await alertService.testAlert(type);
    } catch (error) {
      Alert.alert('Error', 'Failed to test alert: ' + error.message);
    }
  };

  const detections = detectionData?.detections || [];
  const stats = detectionData?.stats || {
    totalDetections: 0,
    peekingDetections: 0,
    accuracy: 0,
    alertsToday: 0,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Detection Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Icon
              name={isDetecting ? 'visibility' : 'visibility-off'}
              size={32}
              color={isDetecting ? '#4CAF50' : '#757575'}
            />
            <View style={styles.statusText}>
              <Title style={styles.statusTitle}>
                {isDetecting ? 'Detection Active' : 'Detection Inactive'}
              </Title>
              <Paragraph style={styles.statusSubtitle}>
                {isDetecting
                  ? 'Monitoring for screen peeking'
                  : 'Tap to start detection'}
              </Paragraph>
            </View>
          </View>
          <Button
            mode={isDetecting ? 'contained' : 'outlined'}
            onPress={toggleDetection}
            style={styles.toggleButton}
            color={isDetecting ? '#F44336' : '#2196F3'}
          >
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Button>
        </Card.Content>
      </Card>

      {/* Detection Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Detection Statistics</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalDetections}</Text>
              <Text style={styles.statLabel}>Total Detections</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.peekingDetections}</Text>
              <Text style={styles.statLabel}>Peeking Detected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.alertsToday}</Text>
              <Text style={styles.statLabel}>Alerts Today</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Detection Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Title>Detection Settings</Title>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Detection</Text>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>
              Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={settings.confidenceThreshold}
              onValueChange={(value) => updateSetting('confidenceThreshold', value)}
              step={0.1}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>
              Gaze Threshold: {(settings.gazeThreshold * 100).toFixed(0)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={settings.gazeThreshold}
              onValueChange={(value) => updateSetting('gazeThreshold', value)}
              step={0.1}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>
              Detection Interval: {settings.detectionInterval}ms
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={500}
              maximumValue={5000}
              value={settings.detectionInterval}
              onValueChange={(value) => updateSetting('detectionInterval', Math.round(value))}
              step={100}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Alert Testing */}
      <Card style={styles.testCard}>
        <Card.Content>
          <Title>Test Alerts</Title>
          <Paragraph>Test different types of alerts to ensure they work correctly.</Paragraph>
          
          <View style={styles.testButtons}>
            <Button
              mode="outlined"
              onPress={() => testAlert('visual')}
              style={styles.testButton}
            >
              Test Visual
            </Button>
            <Button
              mode="outlined"
              onPress={() => testAlert('audio')}
              style={styles.testButton}
            >
              Test Audio
            </Button>
            <Button
              mode="outlined"
              onPress={() => testAlert('haptic')}
              style={styles.testButton}
            >
              Test Haptic
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Detections */}
      <Card style={styles.detectionsCard}>
        <Card.Content>
          <Title>Recent Detections</Title>
          {detections.length > 0 ? (
            detections.map((detection, index) => (
              <View key={index} style={styles.detectionItem}>
                <Icon
                  name={detection.isPeeking ? 'warning' : 'check-circle'}
                  size={20}
                  color={detection.isPeeking ? '#F44336' : '#4CAF50'}
                />
                <View style={styles.detectionContent}>
                  <Text style={styles.detectionTime}>
                    {new Date(detection.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.detectionConfidence}>
                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.detectionStatus}>
                  {detection.isPeeking ? 'Peeking' : 'Normal'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDetections}>No recent detections</Text>
          )}
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
  statusCard: {
    marginBottom: 16,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    marginTop: 8,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  settingItem: {
    marginVertical: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  testCard: {
    marginBottom: 16,
    elevation: 2,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  detectionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  detectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detectionContent: {
    marginLeft: 12,
    flex: 1,
  },
  detectionTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  detectionConfidence: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detectionStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  noDetections: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 16,
  },
});
