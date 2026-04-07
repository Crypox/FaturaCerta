import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PWARegister } from "@/components/PWARegister";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "FaturaCerta",
  description: "Gestao de faturas de obras de construcao civil",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FaturaCerta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="h-full flex flex-col bg-background text-foreground">
        <AuthGuard>
          <main className="flex-1 overflow-y-auto pb-20">
            {children}
          </main>
          <BottomNav />
        </AuthGuard>
        <PWARegister />
      </body>
    </html>
  );
}
