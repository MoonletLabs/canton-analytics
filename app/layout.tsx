import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Canton Analytics | Workflow products for enterprise & operators",
  description: "Featured App reporting, Validator FinOps, Operator Console, Incidents, Compliance Vault — built on public RPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AnalyticsProvider>
          <Navigation />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
