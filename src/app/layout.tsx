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
        <main className="min-h-screen bg-white lg:ml-[200px]">
          <div className="px-4 py-4 pt-16 sm:px-6 sm:py-6 lg:px-8 lg:pt-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
