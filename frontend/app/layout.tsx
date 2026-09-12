import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CampusOS — Unified Digital Campus Platform",
  description:
    "CampusOS brings academics, campus services, career tools, and AI-powered features together into one unified platform for universities.",
  keywords: [
    "university",
    "campus management",
    "student portal",
    "academic platform",
    "CampusOS",
  ],
  authors: [{ name: "CampusOS Team" }],
  openGraph: {
    title: "CampusOS — Unified Digital Campus Platform",
    description:
      "Unified platform for university academics, services, careers, and AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
