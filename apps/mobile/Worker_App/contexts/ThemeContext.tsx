import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@theme_preference';

export type ThemeType = 'light' | 'dark';

export interface Theme {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  shadow: string;
  overlay: string;
}

const lightTheme: Theme = {
  background: '#E0F2FE', // Light Blue Background
  cardBackground: '#FFFFFF',
  text: '#1E293B', // Dark Slate
  textSecondary: '#64748B', // Blue Gray
  textTertiary: '#94A3B8', // Light Slate
  primary: '#0EA5E9', // Sky Blue
  primaryLight: '#BAE6FD', // Very Light Sky Blue
  primaryDark: '#0284C7', // Darker Sky Blue
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  shadow: 'rgba(14, 165, 233, 0.15)', // Blue-tinted shadow
  overlay: 'rgba(255, 255, 255, 0.6)', // Light overlay
};

const darkTheme: Theme = {
  background: '#0F172A', // Dark Slate
  cardBackground: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  primary: '#38BDF8', // Lighter Sky Blue for Dark Mode
  primaryLight: '#075985',
  primaryDark: '#7DD3FC',
  border: '#334155',
  borderLight: '#475569',
  success: '#22C55E',
  successLight: '#14532D',
  warning: '#FBBF24',
  warningLight: '#78350F',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: Theme;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
