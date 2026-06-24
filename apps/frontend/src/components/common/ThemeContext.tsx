import * as React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import { getTheme, type ThemeMode } from "../../theme";

const THEME_STORAGE_KEY = "theme-mode";

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = React.createContext<ThemeModeContextValue | undefined>(
  undefined,
);

const getInitialMode = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
};

const ThemeModeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setModeState] = React.useState<ThemeMode>(getInitialMode);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={getTheme(mode)} key={mode}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = React.useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
};

export default ThemeModeProvider;
