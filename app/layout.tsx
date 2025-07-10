import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navigation from "@/components/layout/navigation";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scheduler - Calendar Management",
  description:
    "Manage your calendar connections, appointments, and availability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background min-h-screen antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="bg-muted/50 flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
