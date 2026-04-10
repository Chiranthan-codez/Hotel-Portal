import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuxStay — Hotel Management",
  description: "Modern hotel management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
