/**
 * Alerts Screen - Alert history and management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';

import { AlertService } from '../services/AlertService';

const alertService = new AlertService();

export default function AlertsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, high

  // Fetch alerts data
  const { data: alertsData, refetch } = useQuery(
    ['alerts', filter],
    async () => {
      const alerts = await alertService.getAlerts(100);
      return { alerts };
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

  const markAsRead = async (alertId) => {
    try {
      await alertService.markAlertAsRead(alertId);
      await refetch();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await alertService.markAllAlertsAsRead();
      await refetch();
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const getFilteredAlerts = () => {
    const alerts = alertsData?.alerts || [];
    
    switch (filter) {
      case 'unread':
        return alerts.filter(alert => !alert.isRead);
      case 'high':
        return alerts.filter(alert => alert.level === 'high' || alert.level === 'critical');
      default:
        return alerts;
    }
  };

  const getAlertIcon = (level) => {
    const icons = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'priority_high',
    };
    return icons[level] || 'info';
  };

  const getAlertColor = (level) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0',
    };
    return colors[level] || '#2196F3';
  };

  const formatTimestamp = (timestamp) => {
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
  };

  const renderAlert = ({ item }) => (
    <Card style={[styles.alertCard, !item.isRead && styles.unreadAlert]}>
      <Card.Content>
        <View style={styles.alertHeader}>
          <View style={styles.alertIconContainer}>
            <Icon
              name={getAlertIcon(item.level)}
              size={24}
              color={getAlertColor(item.level)}
            />
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle}>{item.message}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.alertTime}>{formatTimestamp(item.timestamp)}</Text>
            <View style={styles.alertMeta}>
              <Chip
                mode="outlined"
                compact
                style={[styles.levelChip, { borderColor: getAlertColor(item.level) }]}
                textStyle={{ color: getAlertColor(item.level) }}
              >
                {item.level.toUpperCase()}
              </Chip>
              {item.confidence && (
                <Chip
                  mode="outlined"
                  compact
                  style={styles.confidenceChip}
                >
                  {(item.confidence * 100).toFixed(0)}% confidence
                </Chip>
              )}
            </View>
          </View>
        </View>
        
        {item.metadata && item.metadata.faceCount && (
          <View style={styles.alertDetails}>
            <Text style={styles.detailText}>
              Faces detected: {item.metadata.faceCount}
            </Text>
            {item.metadata.gazeAngles && (
              <Text style={styles.detailText}>
                Gaze angles: {item.metadata.gazeAngles.map(angle => angle.toFixed(1)).join(', ')}°
              </Text>
            )}
          </View>
        )}
        
        {!item.isRead && (
          <Button
            mode="text"
            onPress={() => markAsRead(item.id)}
            style={styles.markReadButton}
            compact
          >
            Mark as Read
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const filteredAlerts = getFilteredAlerts();
  const unreadCount = (alertsData?.alerts || []).filter(alert => !alert.isRead).length;

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({alertsData?.alerts?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'high' && styles.activeFilterTab]}
          onPress={() => setFilter('high')}
        >
          <Text style={[styles.filterText, filter === 'high' && styles.activeFilterText]}>
            High Priority
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        style={styles.alertsList}
        contentContainerStyle={styles.alertsListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-none" size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'No alerts have been generated yet.'
                : `No ${filter} alerts found.`
              }
            </Text>
          </View>
        }
      />

      {/* Mark All as Read FAB */}
      {unreadCount > 0 && (
        <FAB
          style={styles.fab}
          icon="done-all"
          onPress={markAllAsRead}
          label="Mark All Read"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  alertsList: {
    flex: 1,
  },
  alertsListContent: {
    padding: 16,
  },
  alertCard: {
    marginBottom: 12,
    elevation: 2,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  levelChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  confidenceChip: {
    marginBottom: 4,
  },
  alertDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  markReadButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});
