import "@/styles/globals.css";

import type { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import AuthModal from "@/components/auth/AuthModal";
import UpgradeModal from "@/components/user/UpgradeModal";

import ContextProvider from "@/context/ContextProvider";

export const metadata = {
  title: "chessthan - An online Chess Platform.",
  description: "An online Chess Platform.",
  openGraph: {
    title: "chessthan",
    description: "An online Chess Platform.",
    url: "https://chessthan.vercel.app",
    siteName: "chessthan",
    locale: "en_US",
    type: "website"
  },
  robots: {
    index: true,
    follow: false,
    nocache: true,
    noarchive: true
  },
  icons: {
    icon: [
      { type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
      { type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" }
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" }
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(process.env.VERCEL ? "https://chessthan.vercel.app" : "http://localhost:3000")
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="overflow-x-hidden bg-base-100 text-base-content min-h-screen">
        <ContextProvider>
          <div className="flex min-h-screen bg-base-100 text-base-content">
            {/* Left Sidebar on Desktop / Bottom Tabbar on Mobile */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-16 pb-16 md:pb-0">
              <main className="flex-grow p-4 md:p-8 flex items-center justify-center min-h-[90vh]">
                {children}
              </main>
            </div>
          </div>

          <AuthModal />
          <UpgradeModal />
        </ContextProvider>
        <script
          id="load-theme"
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
              document.documentElement.setAttribute("data-theme", "chessuDark");
          } else {
              document.documentElement.setAttribute("data-theme", "chessuLight");
          }`
          }}
        ></script>
      </body>
    </html>
  );
}
