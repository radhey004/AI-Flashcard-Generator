import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'dark', toggleMode: () => {} });

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'dark';
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  }, []);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary: { main: '#2196f3' },
        secondary: { main: '#f50057' },
        background: {
          default: mode === 'dark' ? '#0f1117' : '#f4f6f8',
          paper: mode === 'dark' ? '#1a1d27' : '#ffffff',
        },
        ...(mode === 'dark' && {
          text: { primary: '#e8eaf0', secondary: '#9aa0b4' },
        }),
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
      shape: { borderRadius: 12 },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: 6 },
          },
        },
        MuiTextField: {
          defaultProps: { variant: 'outlined' },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundImage: 'none',
              borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            },
          },
        },
      },
    }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
