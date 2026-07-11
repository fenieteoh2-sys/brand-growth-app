import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heng Wei Inquiry Follow-Up",
  description: "Customer inquiry tracking and reply drafts for Heng Wei Hardware.",
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
