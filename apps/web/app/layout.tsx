import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S30 AI Customer Support Agent",
  description: "Autonomous customer support agent backend & dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
