import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Growth App",
  description: "Lead capture, MQL/SQL tracking, and AI sales scripts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
