// src/lib/aco.ts

import { CollectionPoint } from '@/data/mockLocations';

/**
 * Paramètres de l'algorithme ACO
 */
interface ACOParameters {
  numAnts: number;          // Nombre de fourmis (10-50)
  numIterations: number;    // Nombre d'itérations (50-200)
  alpha: number;            // Importance des phéromones (1-2)
  beta: number;             // Importance de la distance (2-5)
  evaporationRate: number;  // Taux d'évaporation (0.1-0.5)
  Q: number;                // Constante de dépôt de phéromones (100-1000)
}

/**
 * Résultat de l'optimisation ACO
 */
export interface ACOResult {
  bestPath: CollectionPoint[];
  bestDistance: number;
  iterations: number;
}

/**
 * Calcul de la distance entre deux points (Haversine)
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Algorithme d'Optimisation par Colonie de Fourmis (ACO)
 * pour le problème du voyageur de commerce (TSP)
 */
export const solveWithACO = (
  points: CollectionPoint[],
  params: ACOParameters = {
    numAnts: 20,
    numIterations: 100,
    alpha: 1,
    beta: 2,
    evaporationRate: 0.3,
    Q: 100
  }
): ACOResult => {
  const n = points.length;
  if (n < 2) return { bestPath: points, bestDistance: 0, iterations: 0 };

  // Initialisation de la matrice des phéromones
  const pheromones = Array(n).fill(null).map(() => Array(n).fill(1.0));
  
  // Calcul de la matrice des distances
  const distances = Array(n).fill(null).map((_, i) =>
    Array(n).fill(null).map((_, j) => 
      i === j ? 0 : haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
    )
  );

  let bestPath: number[] = [];
  let bestDistance = Infinity;

  // Boucle principale de l'algorithme
  for (let iteration = 0; iteration < params.numIterations; iteration++) {
    const allPaths: number[][] = [];
    const allDistances: number[] = [];

    // Chaque fourmi construit un chemin
    for (let ant = 0; ant < params.numAnts; ant++) {
      const path = constructPath(pheromones, distances, params.alpha, params.beta, n);
      const distance = calculatePathDistance(path, distances);
      
      allPaths.push(path);
      allDistances.push(distance);

      // Mise à jour du meilleur chemin
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPath = [...path];
      }
    }

    // Évaporation des phéromones
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pheromones[i][j] *= (1 - params.evaporationRate);
      }
    }

    // Dépôt de phéromones par chaque fourmi
    for (let ant = 0; ant < params.numAnts; ant++) {
      const path = allPaths[ant];
      const distance = allDistances[ant];
      const pheromoneDeposit = params.Q / distance;

      for (let i = 0; i < n - 1; i++) {
        pheromones[path[i]][path[i + 1]] += pheromoneDeposit;
        pheromones[path[i + 1]][path[i]] += pheromoneDeposit; // Symétrique
      }
    }
  }

  // Convertir les indices en points réels
  const bestPathPoints = bestPath.map(index => points[index]);

  return {
    bestPath: bestPathPoints,
    bestDistance,
    iterations: params.numIterations
  };
};

/**
 * Construction d'un chemin par une fourmi
 */
const constructPath = (
  pheromones: number[][],
  distances: number[][],
  alpha: number,
  beta: number,
  n: number
): number[] => {
  const visited = new Set<number>();
  const path: number[] = [];

  // Point de départ aléatoire
  let current = Math.floor(Math.random() * n);
  path.push(current);
  visited.add(current);

  // Construction du chemin
  while (path.length < n) {
    const probabilities: number[] = [];
    const candidates: number[] = [];

    // Calcul des probabilités pour chaque ville non visitée
    for (let next = 0; next < n; next++) {
      if (!visited.has(next)) {
        const pheromone = Math.pow(pheromones[current][next], alpha);
        const heuristic = Math.pow(1 / distances[current][next], beta);
        probabilities.push(pheromone * heuristic);
        candidates.push(next);
      }
    }

    // Sélection de la prochaine ville basée sur les probabilités
    const totalProbability = probabilities.reduce((sum, p) => sum + p, 0);
    let random = Math.random() * totalProbability;
    let selectedIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      random -= probabilities[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    current = candidates[selectedIndex];
    path.push(current);
    visited.add(current);
  }

  return path;
};

/**
 * Calcul de la distance totale d'un chemin
 */
const calculatePathDistance = (path: number[], distances: number[][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += distances[path[i]][path[i + 1]];
  }
  return totalDistance;
};
