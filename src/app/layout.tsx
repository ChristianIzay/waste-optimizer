import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Matadi Waste Optimizer - Plateforme d\'Optimisation de Collecte',
  description: 'Plateforme d\'optimisation de collecte de déchets pour la Ville de Matadi, RDC. Calcul d\'itinéraires optimaux pour la collecte des bennes pleines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
