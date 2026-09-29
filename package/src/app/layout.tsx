"use client";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import './global.css'
import { Agentation } from "agentation";
import { GlobalToastProvider } from "@/app/GlobalToastProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider theme={baselightTheme}>
          <CssBaseline />
          <GlobalToastProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <Agentation />}
          </GlobalToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
