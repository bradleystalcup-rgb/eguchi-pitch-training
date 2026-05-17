import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eguchi Pitch Training",
  description: "Child-friendly chord color ear training inspired by the Eguchi method.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
