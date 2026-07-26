import type { Metadata } from "next";
import { Poppins, JetBrains_Mono, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SignEase – Digital Assurance PDF Signer",
  description:
    "Tanda tangani dokumen PDF Anda langsung di browser tanpa menyimpan file ke server. Privasi penuh, 100% client-side.",
  keywords: ["e-sign", "pdf", "tanda tangan digital", "browser", "tanpa upload"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} ${inter.variable} font-sans antialiased`}
      >
        <NextAuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{ classNames: { toast: "font-sans text-xs" } }}
          />
        </NextAuthProvider>
      </body>
    </html>
  );
}
