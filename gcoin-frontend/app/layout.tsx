import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WalletProvider } from "@/components/wallet-provider";
import "./globals.css";
import Providers from "./providers";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "GCoin — INR-Backed Stablecoin Platform",
  description: "The future of digital payments in India. Buy, transfer, and redeem GCoin with seamless INR integration on Polygon blockchain.",
  keywords: ["GCoin", "stablecoin", "INR", "Polygon", "crypto", "India", "blockchain", "Cashfree"],
  authors: [{ name: "GCoin Team" }],
  openGraph: {
    title: "GCoin — India's Digital Currency",
    description: "1 GCoin = 1 INR. Seamless crypto-to-fiat on Polygon.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CASHFREE SDK — MUST load before page renders */}
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="beforeInteractive"
          id="cashfree-sdk"
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground`}>
        <Providers>
           <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange={false}
   >
    <WalletProvider>
            <div className="relative min-h-screen flex flex-col">
              <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gcoin-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gcoin-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gcoin-500/5 rounded-full blur-3xl" />
              </div>

              <Navbar />
              <main className="flex-1 relative z-10 pt-16">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster position="bottom-right" richColors closeButton />
          </WalletProvider>
        </ThemeProvider>
      </Providers>
      </body>
    </html>
  );
}