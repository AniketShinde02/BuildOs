import { createTheme } from "@mui/material/styles";
import { Plus_Jakarta_Sans } from "next/font/google";

export const plus = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

// BuildOS Unified Design System - High Density (Linear/Vercel style)
const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    mode: "dark",
    primary: {
      main: "#FF5C00", // BuildOS Accent Primary
      light: "rgba(255, 92, 0, 0.2)", // Glow/Hover
      dark: "#CC4A00",
      contrastText: "#FAFAFA",
    },
    secondary: {
      main: "#121214", // Secondary background used in buttons
      light: "#1C1C1F",
      dark: "#09090B",
      contrastText: "#FAFAFA",
    },
    background: {
      default: "#000000", // Pure black background for high contrast
      paper: "#0A0A0A", // Elevated surface for cards
    },
    text: {
      primary: "#FAFAFA",
      secondary: "#A1A1AA",
    },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    info: { main: "#3B82F6" },
    divider: "#27272A",
    action: {
      hover: "#18181B",
      selected: "rgba(255, 92, 0, 0.1)",
      disabledBackground: "#18181B",
      disabled: "#52525B",
    },
  },
  shape: {
    borderRadius: 6, // Sharp, modern base corner
  },
  typography: {
    fontFamily: plus.style.fontFamily,
    h1: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h2: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 },
    h3: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.3 },
    h5: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5, color: "#FAFAFA" }, // High density base
    body2: { fontSize: "0.8125rem", fontWeight: 400, color: "#A1A1AA", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 500, fontSize: "0.875rem" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 500, color: "#A1A1AA" },
    subtitle2: { fontSize: "0.75rem", fontWeight: 500, color: "#A1A1AA", letterSpacing: "0.02em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: #000000 !important;
          color: #FAFAFA !important;
          -webkit-font-smoothing: antialiased;
        }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "8px", 
          backgroundColor: "#0A0A0A",
          border: "1px solid #27272A",
          boxShadow: "none",
          backgroundImage: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "16px",
          "&:last-child": { paddingBottom: "16px" }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          boxShadow: "none",
          padding: "4px 12px", // Tighter padding
          fontWeight: 500,
          "&:hover": { boxShadow: "none" },
        },
        containedPrimary: {
          backgroundColor: "#FAFAFA", // White buttons on dark theme (Vercel style)
          color: "#000000",
          "&:hover": { backgroundColor: "#E4E4E7" },
        },
        outlined: {
          borderColor: "#27272A",
          backgroundColor: "#0A0A0A",
          color: "#FAFAFA",
          "&:hover": { backgroundColor: "#18181B", borderColor: "#3F3F46" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", 
          backgroundColor: "#0A0A0A",
          border: "1px solid #27272A",
          boxShadow: "none"
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#000000",
          borderRight: "1px solid #27272A",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: "4px", fontWeight: 500, height: "24px", fontSize: "0.75rem" },
      },
      variants: [
        {
          props: { variant: "filled", color: "primary" },
          style: { backgroundColor: "rgba(255, 92, 0, 0.15)", color: "#FF5C00", border: "1px solid rgba(255, 92, 0, 0.3)" },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            backgroundColor: "#000000",
            fontSize: "0.875rem",
            "& fieldset": { borderColor: "#27272A" },
            "&:hover fieldset": { borderColor: "#3F3F46" },
            "&.Mui-focused fieldset": { borderColor: "#FAFAFA", borderWidth: "1px" },
          },
          "& .MuiInputBase-input": { padding: "8px 12px" }, // Tighter input boxes
        },
      },
    },
  },
});

export { baselightTheme };
