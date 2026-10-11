import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FyndoraX — Official Campus Lost & Found Platform",
  description: "AI-governed campus recovery system with zero-leak catalogs, forensic verification quizzes, and verified handover chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FFF9FA" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#FFF9FA] text-[#1E1215] antialiased">
        {children}
      </body>
    </html>
  );
}
