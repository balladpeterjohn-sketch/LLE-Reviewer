import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const THEME_KEY = '@lle_theme';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceGlass: string;
  surfaceGlassStrong: string;
  text: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  borderGlass: string;
  borderLight: string;
  danger: string;
  success: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  primary: '#1B4D3E',
  primaryLight: '#2D6A4F',
  primaryDark: '#0d2219',
  accent: '#C9A227',
  accentLight: '#E8C96A',
  background: '#EEF2EE',
  backgroundDeep: '#E6EDE6',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  surfaceGlassStrong: 'rgba(255,255,255,0.94)',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textOnPrimary: '#FFFFFF',
  border: '#D8DDD8',
  borderGlass: 'rgba(255,255,255,0.55)',
  borderLight: 'rgba(27,77,62,0.12)',
  danger: '#C0392B',
  success: '#27AE60',
  shadow: '#1B4D3E',
};

export const darkColors: ThemeColors = {
  primary: '#3DA87A',
  primaryLight: '#4DC48A',
  primaryDark: '#1B4D3E',
  accent: '#E8C96A',
  accentLight: '#F0D890',
  background: '#111814',
  backgroundDeep: '#0D140F',
  surface: '#1C2420',
  surfaceGlass: 'rgba(28,36,32,0.90)',
  surfaceGlassStrong: 'rgba(35,45,40,0.97)',
  text: '#EEEEE8',
  textSecondary: '#8A9A8E',
  textOnPrimary: '#FFFFFF',
  border: '#2A3830',
  borderGlass: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(61,168,122,0.15)',
  danger: '#E85D4A',
  success: '#3EC87A',
  shadow: '#000000',
};

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = Appearance.getColorScheme() === 'dark';
  const [isDark, setIsDark] = useState(systemDark);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'dark') setIsDark(true);
      else if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const setDark = useCallback((dark: boolean) => {
    setIsDark(dark);
    AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
