import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertical AI Demo Studio",
  description: "AI-native production platform for vertical demo videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-surface text-zinc-100">
        {children}
      </body>
    </html>
  );
}
