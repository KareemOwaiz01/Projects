/**
 * Theme configuration for ScreenGuard Pro Mobile App
 */

import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#BBDEFB',
    secondary: '#FF9800',
    secondaryContainer: '#FFE0B2',
    tertiary: '#4CAF50',
    tertiaryContainer: '#C8E6C9',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#F44336',
    errorContainer: '#FFCDD2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#212121',
    onSurfaceVariant: '#757575',
    onBackground: '#212121',
    onError: '#FFFFFF',
    outline: '#BDBDBD',
    outlineVariant: '#E0E0E0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#303030',
    inverseOnSurface: '#FAFAFA',
    inversePrimary: '#1976D2',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
    surfaceDisabled: 'rgba(0, 0, 0, 0.12)',
    onSurfaceDisabled: 'rgba(0, 0, 0, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    ...DefaultTheme.fonts,
    displayLarge: {
      fontFamily: 'System',
      fontSize: 57,
      fontWeight: '400',
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontFamily: 'System',
      fontSize: 45,
      fontWeight: '400',
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: 'System',
      fontSize: 36,
      fontWeight: '400',
      lineHeight: 44,
      letterSpacing: 0,
    },
    headlineLarge: {
      fontFamily: 'System',
      fontSize: 32,
      fontWeight: '400',
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: 'System',
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 32,
      letterSpacing: 0,
    },
    titleLarge: {
      fontFamily: 'System',
      fontSize: 22,
      fontWeight: '400',
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: 'System',
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#1976D2',
    primaryContainer: '#0D47A1',
    secondary: '#F57C00',
    secondaryContainer: '#E65100',
    tertiary: '#388E3C',
    tertiaryContainer: '#1B5E20',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    background: '#000000',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    onBackground: '#FFFFFF',
    onError: '#FFFFFF',
    outline: '#404040',
    outlineVariant: '#2A2A2A',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#252525',
      level4: '#272727',
      level5: '#2C2C2C',
    },
  },
};

export const colors = {
  // Primary colors
  primary: '#2196F3',
  primaryLight: '#64B5F6',
  primaryDark: '#1976D2',
  
  // Secondary colors
  secondary: '#FF9800',
  secondaryLight: '#FFB74D',
  secondaryDark: '#F57C00',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  
  error: '#F44336',
  errorLight: '#EF5350',
  errorDark: '#D32F2F',
  
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Background colors
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textHint: '#9E9E9E',
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  borderDark: '#BDBDBD',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};
