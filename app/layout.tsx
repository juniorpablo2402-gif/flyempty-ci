import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyEmpty CI — L’aviation, autrement",
  description: "Découvrez les opportunités de vols privés et de sièges disponibles en Côte d’Ivoire.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
