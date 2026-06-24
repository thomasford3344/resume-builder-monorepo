import { createTheme, type ThemeOptions } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

const brandPrimary = {
  main: "#ffba7f",
  light: "#ffd4b3",
  dark: "#cc945f",
  contrastText: "#000000",
};

const lightSecondary = {
  main: "#545454",
  light: "#737373",
  dark: "#363636",
  contrastText: "#ffba7f",
};

const darkSecondary = {
  main: "#cfd8dc",
  light: "#eceff1",
  dark: "#b0bec5",
  contrastText: "#121212",
};

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
    MuiIconButton: {
      styleOverrides: {
        colorSecondary: ({ theme }) =>
          theme.palette.mode === "dark"
            ? {
                color: theme.palette.grey[300],
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }
            : {},
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

export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: "light",
    primary: brandPrimary,
    secondary: lightSecondary,
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
    primary: brandPrimary,
    secondary: darkSecondary,
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});

export const getTheme = (mode: ThemeMode) =>
  mode === "dark" ? darkTheme : lightTheme;
