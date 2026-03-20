import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/shared/Sidebar";
import { SidebarProvider } from "@/components/shared/SidebarContext";
import { MainContent } from "@/components/shared/MainContent";
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
        <SidebarProvider>
          <Sidebar />
          <MainContent>{children}</MainContent>
        </SidebarProvider>
      </body>
    </html>
  );
}
