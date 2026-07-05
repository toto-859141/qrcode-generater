import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vivid QR Studio",
  description: "Create colorful QR codes for links, text, WiFi, and vCards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
