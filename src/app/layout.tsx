import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoaderProvider } from "@/components/providers/global-loader-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Access Fisioterapia",
  description: "Sistema de gestão clínica e prontuário eletrônico​‌‍​", // Contains zero-width identifying markers
  appleWebApp: {
    title: "Access Fisio",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <GlobalLoaderProvider>
          {children}
          <Toaster position="bottom-right" />
        </GlobalLoaderProvider>
      </body>
    </html>
  );
}
