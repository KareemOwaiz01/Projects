/**
 * Analytics Screen - Data visualization and insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery } from 'react-query';

import { DetectionService } from '../services/DetectionService';
import { AlertService } from '../services/AlertService';
import { StorageService } from '../services/StorageService';

const detectionService = new DetectionService();
const alertService = new AlertService();
const storageService = new StorageService();

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // Fetch analytics data
  const { data: analyticsData, refetch } = useQuery(
    ['analytics', timeRange],
    async () => {
      const detections = await detectionService.getDetections(1000);
      const alerts = await alertService.getAlerts(1000);
      const stats = await detectionService.getStats();
      
      return {
        detections,
        alerts,
        stats,
        timeRange,
      };
    },
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const getFilteredData = (data, days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(item => new Date(item.timestamp) >= cutoffDate);
  };

  const getChartData = () => {
    const detections = analyticsData?.detections || [];
    const alerts = analyticsData?.alerts || [];
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const filteredDetections = getFilteredData(detections, days);
    const filteredAlerts = getFilteredData(alerts, days);
    
    // Group by date
    const detectionByDate = {};
    const alertByDate = {};
    
    filteredDetections.forEach(detection => {
      const date = new Date(detection.timestamp).toDateString();
      if (!detectionByDate[date]) {
        detectionByDate[date] = { total: 0, peeking: 0 };
      }
      detectionByDate[date].total++;
      if (detection.isPeeking) {
        detectionByDate[date].peeking++;
      }
    });
    
    filteredAlerts.forEach(alert => {
      const date = new Date(alert.timestamp).toDateString();
      if (!alertByDate[date]) {
        alertByDate[date] = 0;
      }
      alertByDate[date]++;
    });
    
    // Create chart data
    const dates = Object.keys(detectionByDate).sort();
    const detectionData = dates.map(date => detectionByDate[date].total);
    const peekingData = dates.map(date => detectionByDate[date].peeking);
    const alertData = dates.map(date => alertByDate[date] || 0);
    
    return {
      dates: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      detectionData,
      peekingData,
      alertData,
    };
  };

  const getAlertTypeData = () => {
    const alerts = analyticsData?.alerts || [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const filteredAlerts = getFilteredData(alerts, days);
    
    const typeCount = {};
    filteredAlerts.forEach(alert => {
      typeCount[alert.type] = (typeCount[alert.type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      population: count,
      color: getAlertTypeColor(type),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getAlertTypeColor = (type) => {
    const colors = {
      detection: '#2196F3',
      test: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    };
    return colors[type] || '#9E9E9E';
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
  };

  const chartData = getChartData();
  const alertTypeData = getAlertTypeData();
  const stats = analyticsData?.stats || {
    totalDetections: 0,
    peekingDetections: 0,
    accuracy: 0,
    alertsToday: 0,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Time Range Selector */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Time Range</Title>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Summary Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Summary</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="visibility" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.totalDetections}</Text>
              <Text style={styles.statLabel}>Total Detections</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="warning" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.peekingDetections}</Text>
              <Text style={styles.statLabel}>Peeking Detected</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="notifications" size={24} color="#F44336" />
              <Text style={styles.statNumber}>{stats.alertsToday}</Text>
              <Text style={styles.statLabel}>Alerts Today</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Detection Trends Chart */}
      {chartData.dates.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Detection Trends</Title>
            <LineChart
              data={{
                labels: chartData.dates,
                datasets: [
                  {
                    data: chartData.detectionData,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: chartData.peekingData,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.legendText}>Total Detections</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Peeking Detected</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Alert Types Chart */}
      {alertTypeData.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Alert Types</Title>
            <PieChart
              data={alertTypeData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Daily Activity Chart */}
      {chartData.dates.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Daily Activity</Title>
            <BarChart
              data={{
                labels: chartData.dates,
                datasets: [
                  {
                    data: chartData.alertData,
                  },
                ],
              }}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
            <Text style={styles.chartSubtitle}>Alerts per day</Text>
          </Card.Content>
        </Card>
      )}

      {/* Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Insights</Title>
          <View style={styles.insights}>
            <View style={styles.insightItem}>
              <Icon name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.insightText}>
                Detection accuracy is {stats.accuracy}%
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="schedule" size={20} color="#2196F3" />
              <Text style={styles.insightText}>
                Most active during peak hours
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="security" size={20} color="#FF9800" />
              <Text style={styles.insightText}>
                {stats.peekingDetections} potential security incidents detected
              </Text>
            </View>
          </View>
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
  segmentedButtons: {
    marginTop: 8,
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
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  insights: {
    marginTop: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});
