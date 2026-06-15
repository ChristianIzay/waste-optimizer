# 🚛 Matadi Waste Optimizer

**Plateforme intelligente d'optimisation de collecte de déchets pour la Ville de Matadi (RDC)**

Matadi Waste Optimizer est une application web conçue pour moderniser la gestion des déchets urbains. Elle permet aux gestionnaires de visualiser l'état des points de collecte en temps réel et de calculer les itinéraires les plus efficaces pour les camions de collecte grâce à des algorithmes d'intelligence artificielle (Optimisation par Colonie de Fourmis).

---

## ✨ Fonctionnalités Clés (MVP)

- **Cartographie Interactive :** Visualisation en temps réel de **27 points de collecte réels** de Matadi sur une carte OpenStreetMap (via React-Leaflet).
- **Données Géographiques Précises :** Gestion native des coordonnées UTM (Zone 33S) converties dynamiquement en coordonnées GPS (WGS84) grâce à `proj4js`.
- **Simulation Dynamique :** État des bennes (Plein/Vide) et volumes générés aléatoirement à chaque chargement pour tester la robustesse du système.
- **Double Moteur d'Optimisation (TSP) :**
  - 🐜 **ACO (Ant Colony Optimization) :** Algorithme méta-heuristique inspiré du comportement des fourmis pour trouver des solutions quasi-optimales.
  -  **Plus Proche Voisin (Nearest Neighbor) :** Algorithme déterministe et rapide servant de baseline de comparaison.
- **Tableau de Bord Analytique :** Statistiques sur les volumes estimés, distances parcourues et efficacité de l'optimisation.

---

## 🛠️ Stack Technique

- **Framework :** Next.js 14+ (App Router)
- **Langage :** TypeScript (Strict)
- **Style :** Tailwind CSS
- **Cartographie :** React-Leaflet + OpenStreetMap
- **Géolocalisation :** Proj4js (Conversion UTM EPSG:32733 vers WGS84 EPSG:4326)
- **Algorithmes :** Implémentations from scratch en TypeScript (ACO & Nearest Neighbor)

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn

### Installation

1. Clonez le dépôt et accédez au dossier du projet :
   ```bash
   cd matadi-waste-optimizer

2. Installez les dépendances :
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
├── data/                 # Données mockées (27 Points de collecte UTM de Matadi)
├── lib/                  # Logique métier et algorithmes
│   ├── aco.ts            # Implémentation de l'Optimisation par Colonie de Fourmis
│   └── nearestNeighbor.ts# Implémentation de l'algorithme du Plus Proche Voisin
└── styles/               # Styles globaux Tailwind

---

🧠 Note Technique sur les Algorithmes et Distances

Pour cette version MVP, les distances sont calculées "à vol d'oiseau" via la Formule de Haversine.
L'algorithme ACO utilise des paramètres par défaut (20 fourmis, 100 itérations, alpha=1, beta=2) qui offrent un excellent équilibre entre qualité de la solution et temps de calcul pour moins de 50 points.
Les résultats de l'ACO peuvent varier légèrement d'une exécution à l'autre en raison de son aspect stochastique (aléatoire), ce qui est une caractéristique normale et attendue des algorithmes évolutionnaires.

---

Guide d'utilisation pour la Démo

Chargement initial : L'application charge les 27 points. Les bennes rouges (pleines) et vertes (vides) sont réparties aléatoirement.
Simulation : Cliquez sur les boutons "Simuler X alertes" pour transformer des bennes vides en bennes pleines et augmenter la charge de travail.
Optimisation : Cliquez sur "Calculer l'itinéraire optimal". Le système trace le chemin le plus court pour collecter toutes les bennes pleines.
Analyse : Consultez les statistiques (Distance totale, Temps estimé, Volume total) et l'ordre de passage détaillé.
