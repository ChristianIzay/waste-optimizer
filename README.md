# 🚛 Matadi Waste Optimizer

**Plateforme d'optimisation de collecte de déchets pour la Ville de Matadi (RDC)**

Matadi Waste Optimizer est une application web intelligente conçue pour optimiser les tournées de collecte des déchets ménagers et industriels dans la ville de Matadi. Elle permet aux gestionnaires de visualiser l'état des points de collecte en temps réel et de calculer les itinéraires les plus efficaces pour les camions de collecte.

---

## ✨ Fonctionnalités Clés (MVP)

- **Cartographie Interactive :** Visualisation en temps réel de 27 points de collecte réels à Matadi sur une carte OpenStreetMap (via Leaflet).
- **Données Géographiques Précises :** Gestion native des coordonnées UTM (Zone 33S) converties dynamiquement en coordonnées GPS (WGS84) grâce à `proj4js`.
- **Simulation Dynamique :** État des bennes (Plein/Vide) généré aléatoirement à chaque chargement pour tester la robustesse du système.
- **Double Moteur d'Optimisation :**
  - 🐜 **ACO (Ant Colony Optimization) :** Algorithme méta-heuristique inspiré du comportement des fourmis pour trouver des solutions quasi-optimales.
  -  **Plus Proche Voisin (Nearest Neighbor) :** Algorithme déterministe et rapide servant de baseline de comparaison.
- **Tableau de Bord Analytique :** Statistiques sur les volumes estimés, distances parcourues et efficacité de l'optimisation.

---

## 🛠️ Stack Technique

- **Framework :** Next.js 14+ (App Router)
- **Langage :** TypeScript
- **Style :** Tailwind CSS
- **Cartographie :** React-Leaflet + OpenStreetMap
- **Géolocalisation :** Proj4js (Conversion UTM vers WGS84)
- **Calculs :** Algorithmes TSP (Voyageur de Commerce) implémentés from scratch

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn

### Installation

1. Clonez le dépôt et accédez au dossier du projet :
   ```bash
   cd matadi-waste-optimizer
2.Installez les dépendances :
  ```bash
   npm install
3. Lancez le serveur de développement :
  ```bash
  npm run dev

4. Ouvrez http://localhost:3000 dans votre navigateur.

📂 Architecture du Projet
src/
├── app/                  # Next.js App Router (Pages et Layouts)
├── components/           # Composants UI (Carte, Tableaux de bord, Contrôles)
├── data/                 # Données mockées (Points de collecte UTM de Matadi)
├── lib/                  # Logique métier et algorithmes
│   ├── aco.ts            # Implémentation de l'Optimisation par Colonie de Fourmis
│   ├── nearestNeighbor.ts# Implémentation de l'algorithme du Plus Proche Voisin
│   ── utils.ts          # Utilitaires (Formule de Haversine, etc.)
── styles/               # Styles globaux Tailwind
   
