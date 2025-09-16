/**
 * Home Screen - Main dashboard with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';

import { DetectionService } from '../services/DetectionService';
import { AlertService } from '../services/AlertService';
import { StorageService } from '../services/StorageService';

const detectionService = new DetectionService();
const alertService = new AlertService();
const storageService = new StorageService();

export default function HomeScreen({ navigation }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, refetch } = useQuery(
    'dashboardData',
    async () => {
      const stats = await storageService.getStats();
      const recentAlerts = await alertService.getRecentAlerts(5);
      return { stats, recentAlerts };
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'alerts':
        navigation.navigate('Alerts');
        break;
      case 'analytics':
        navigation.navigate('Analytics');
        break;
      default:
        break;
    }
  };

  const stats = dashboardData?.stats || {
    totalDetections: 0,
    peekingDetections: 0,
    accuracy: 0,
    alertsToday: 0,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="visibility" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.totalDetections}</Text>
              <Text style={styles.statLabel}>Total Detections</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="warning" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.peekingDetections}</Text>
              <Text style={styles.statLabel}>Peeking Detected</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="notifications" size={24} color="#F44336" />
              <Text style={styles.statNumber}>{stats.alertsToday}</Text>
              <Text style={styles.statLabel}>Alerts Today</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Alerts */}
        {dashboardData?.recentAlerts && dashboardData.recentAlerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <Card.Content>
              <Title>Recent Alerts</Title>
              {dashboardData.recentAlerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Icon
                    name="warning"
                    size={20}
                    color={alert.level === 'high' ? '#F44336' : '#FF9800'}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{alert.timestamp}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('settings')}
              >
                <Icon name="settings" size={32} color="#2196F3" />
                <Text style={styles.actionLabel}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('alerts')}
              >
                <Icon name="notifications" size={32} color="#FF9800" />
                <Text style={styles.actionLabel}>Alerts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('analytics')}
              >
                <Icon name="analytics" size={32} color="#4CAF50" />
                <Text style={styles.actionLabel}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon={isDetecting ? 'stop' : 'play-arrow'}
        onPress={toggleDetection}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 8,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  alertsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});
