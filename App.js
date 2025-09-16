/**
 * ScreenGuard Pro Mobile Application
 * Main App component with navigation and core functionality
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DetectionScreen from './src/screens/DetectionScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

// Services
import { DetectionService } from './src/services/DetectionService';
import { AlertService } from './src/services/AlertService';
import { StorageService } from './src/services/StorageService';

// Theme
import { theme } from './src/theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Initialize services
const detectionService = new DetectionService();
const alertService = new AlertService();
const storageService = new StorageService();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Detection') {
            iconName = 'visibility';
          } else if (route.name === 'Alerts') {
            iconName = 'notifications';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'ScreenGuard Pro' }}
      />
      <Tab.Screen 
        name="Detection" 
        component={DetectionScreen}
        options={{ title: 'Detection' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize storage
      await storageService.initialize();
      
      // Initialize detection service
      await detectionService.initialize();
      
      // Initialize alert service
      await alertService.initialize();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator} 
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}
