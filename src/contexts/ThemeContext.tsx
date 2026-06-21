import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { colors as lightColors, dark as darkColors } from '../theme';

const THEME_KEY = '@lle_theme';

export type ThemeColors = typeof lightColors;

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = Appearance.getColorScheme() === 'dark';
  const [isDark, setIsDark] = useState(systemDark);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'dark')  setIsDark(true);
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

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
