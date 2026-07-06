import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Bestofset — İdarəetmə",
  description: "Bestofset mətbəəsi üçün idarəetmə sistemi",
};

const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
