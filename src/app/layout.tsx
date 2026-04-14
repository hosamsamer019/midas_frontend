import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";


const inter = Inter({ subsets: ["latin"] });
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "MIDAS",
  description: "Medical Intelligence Data Analysis System - Advanced antibiogram data analysis platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.className} ${notoSansArabic.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="pt-16 min-h-screen bg-background">
              <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
                {children}
              </div>
            </main>
            <ChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
