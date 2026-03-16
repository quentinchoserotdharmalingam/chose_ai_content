import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/shared/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ressource IA — POC",
  description: "Prototype de la Ressource IA multi-format",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Sidebar />
        <main className="ml-56 min-h-screen">
          <div className="px-8 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
