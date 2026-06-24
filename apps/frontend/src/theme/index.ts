import { createTheme, type ThemeOptions } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

const sharedThemeOptions: ThemeOptions = {
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        "#root": {
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        slotProps: {
          inputLabel: {
            shrink: true,
          },
        },
      },
    },
  },
};

const brandPalette = {
  primary: {
    main: "#ffba7f",
    light: "#ffd4b3",
    dark: "#cc945f",
    contrastText: "#000000",
  },
  secondary: {
    main: "#545454",
    light: "#737373",
    dark: "#363636",
    contrastText: "#ffba7f",
  },
};

export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: "light",
    ...brandPalette,
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
});

export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: "dark",
    ...brandPalette,
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});

export const getTheme = (mode: ThemeMode) =>
  mode === "dark" ? darkTheme : lightTheme;
