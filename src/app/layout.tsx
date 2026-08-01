import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import { AuthProvider } from "@/context/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGAP — Gap Assessment SPPG",
  description:
    "Self-assessment kepatuhan HACCP/GMP untuk Satuan Pelayanan Pemenuhan Gizi (SPPG).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12645d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
