import './global.css'
import { Agentation } from "agentation";
import { GlobalToastProvider } from "@/app/GlobalToastProvider";
import ThemeRegistry from './ThemeRegistry';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeRegistry>
          <GlobalToastProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <Agentation />}
          </GlobalToastProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
