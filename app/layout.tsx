import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CG Construções HelpDesk Pro — Sistema Profissional de Atendimento TI",
  description:
    "Sistema corporativo modular e White Label para gestão de chamados, técnicos, BI e atendimento da CG Construções (HelpDesk Pro).",
  icons: [
    { rel: "icon", url: "/cg-logo.png" },
    { rel: "shortcut icon", url: "/cg-logo.png" },
    { rel: "apple-touch-icon", url: "/cg-logo.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
