import React, { PropsWithChildren, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

const palette = {
  light: {
    background: '#f7f7fb',
    surface: '#ffffff',
    text: '#1b1b21',
    muted: '#7c7c85',
    accent: '#b83280',
  },
  dark: {
    background: '#0f1016',
    surface: '#181922',
    text: '#f6f6f9',
    muted: '#9d9dae',
    accent: '#ff69b4',
  },
};

export type AppTheme = {
  isDark: boolean;
  colors: typeof palette.light;
  navigation: Theme;
};

const ThemeContext = React.createContext<AppTheme | null>(null);

const buildNavigationTheme = (scheme: ColorSchemeName): Theme => {
  return scheme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: palette.dark.background,
          card: palette.dark.surface,
          primary: palette.dark.accent,
          text: palette.dark.text,
          border: '#2c2d37',
          notification: palette.dark.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.light.background,
          card: palette.light.surface,
          primary: palette.light.accent,
          text: palette.light.text,
          border: '#d6d6dc',
          notification: palette.light.accent,
        },
      };
};

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const scheme = useColorScheme() ?? Appearance.getColorScheme() ?? 'light';
  const value = useMemo<AppTheme>(() => {
    const paletteColors = scheme === 'dark' ? palette.dark : palette.light;
    return {
      isDark: scheme === 'dark',
      colors: paletteColors,
      navigation: buildNavigationTheme(scheme),
    };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): AppTheme => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
