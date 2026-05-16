import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/common/Toast";
import { ConfirmDialogProvider } from "@/components/common/ConfirmDialog";
import InactivityMonitor from "@/components/common/InactivityMonitor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "North Wollo Tourism",
  description: "Discover the beauty of North Wollo - Your gateway to Ethiopian tourism",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <ConfirmDialogProvider>
            <AuthProvider>
              <InactivityMonitor />
              {children}
            </AuthProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
