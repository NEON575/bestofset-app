import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Bestofset — İdarəetmə",
  description: "Bestofset mətbəəsi üçün idarəetmə sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
