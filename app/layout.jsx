import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

const themeInitScript = `
(() => {
  try {
    const saved = localStorage.getItem('dealer-school-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved === 'light' || saved === 'dark' ? saved : null;
    const resolved = theme || (prefersDark ? 'dark' : 'light');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.style.colorScheme = resolved;
  } catch {}
})();
`;

export const metadata = {
  title: "Dealer School | Formation dealer en ligne",
  description: "Formation dealer en ligne avec simulateurs interactifs, suivi de progression, revision guidee et parcours de certification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
