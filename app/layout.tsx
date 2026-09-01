import type { Metadata } from "next";
import "./globals.css";
import "./phase2.css";
import "./phase3.css";

export const metadata: Metadata = {
  title: "MOZPORN — Plataforma 18+",
  description: "Plataforma para criadores e membros adultos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt"><body>{children}</body></html>;
}
