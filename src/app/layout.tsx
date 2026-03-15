import type { Metadata } from "next";
import { Header } from "@/components/shared/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ressource IA — POC",
  description: "Prototype de la Ressource IA multi-format",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
