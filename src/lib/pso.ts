// src/lib/pso.ts

import { CollectionPoint } from '@/data/mockLocations';

/**
 * Paramètres de l'algorithme PSO
 */
interface PSOParameters {
  numParticles: number;       // Nombre de particules (20-50)
  numIterations: number;      // Nombre d'itérations (50-200)
  w: number;                  // Poids d'inertie (0.4-0.9)
  c1: number;                 // Coefficient cognitif (1.5-2.5)
  c2: number;                 // Coefficient social (1.5-2.5)
}

/**
 * Résultat de l'optimisation PSO
 */
export interface PSOResult {
  bestPath: CollectionPoint[];
  bestDistance: number;
  iterations: number;
}

/**
 * Algorithme d'Optimisation par Essaim Particulaire (PSO)
 * Adapté pour le problème du voyageur de commerce (TSP)
 * Utilise une représentation discrète avec échange de positions
 * 
 * @param points - Points à visiter
 * @param params - Paramètres de l'algorithme
 * @param depotPosition - Position du dépôt de départ/retour (optionnel)
 */

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
 * Calcul de la distance totale d'un chemin
 */
const calculatePathDistance = (path: number[], distances: number[][]): number => {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += distances[path[i]][path[i + 1]];
  }
  return totalDistance;
};

/**
 * Algorithme d'Optimisation par Essaim Particulaire (PSO)
 * Adapté pour le problème du voyageur de commerce (TSP)
 * Utilise une représentation discrète avec échange de positions
 * 
 * @param points - Points à visiter
 * @param params - Paramètres de l'algorithme
 * @param depotPosition - Position du dépôt de départ/retour (optionnel)
 */
export const solveWithPSO = (
  points: CollectionPoint[],
  params: PSOParameters = {
    numParticles: 30,
    numIterations: 100,
    w: 0.7,
    c1: 2.0,
    c2: 2.0
  },
  depotPosition?: { lat: number; lng: number }
): PSOResult => {
  const n = points.length;
  if (n < 1) return { bestPath: points, bestDistance: 0, iterations: 0 };

  // Calcul de la matrice des distances
  const distances = Array(n).fill(null).map((_, i) =>
    Array(n).fill(null).map((_, j) => 
      i === j ? 0 : haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
    )
  );

  // Initialisation des particules
  const particles: number[][] = [];
  const velocities: Array<Array<[number, number]>> = [];
  const personalBests: number[][] = [];
  const personalBestDistances: number[] = [];

  let globalBestPath: number[] = [];
  let globalBestDistance = Infinity;

  // Initialisation aléatoire des particules
  for (let i = 0; i < params.numParticles; i++) {
    const path = Array.from({ length: n }, (_, k) => k);
    // Mélanger aléatoirement
    for (let j = path.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [path[j], path[k]] = [path[k], path[j]];
    }
    particles.push(path);
    
    const distance = calculatePathDistance(path, distances);
    personalBests.push([...path]);
    personalBestDistances.push(distance);
    velocities.push([]);

    if (distance < globalBestDistance) {
      globalBestDistance = distance;
      globalBestPath = [...path];
    }
  }

  // Boucle principale de l'algorithme
  for (let iteration = 0; iteration < params.numIterations; iteration++) {
    for (let i = 0; i < params.numParticles; i++) {
      // Mise à jour de la vitesse et de la position
      const newPath = updateParticle(
        particles[i],
        velocities[i],
        personalBests[i],
        globalBestPath,
        params.w,
        params.c1,
        params.c2,
        n
      );

      particles[i] = newPath;
      const distance = calculatePathDistance(newPath, distances);

      // Mise à jour du meilleur personnel
      if (distance < personalBestDistances[i]) {
        personalBestDistances[i] = distance;
        personalBests[i] = [...newPath];
      }

      // Mise à jour du meilleur global
      if (distance < globalBestDistance) {
        globalBestDistance = distance;
        globalBestPath = [...newPath];
      }
    }
  }

  // Convertir les indices en points réels
  const bestPathPoints = globalBestPath.map(index => points[index]);

  // Ajouter la distance de retour au dépôt si spécifié
  let totalDistanceWithReturn = globalBestDistance;
  if (depotPosition && bestPathPoints.length > 0) {
    const lastPoint = bestPathPoints[bestPathPoints.length - 1];
    const returnDistance = haversineDistance(
      lastPoint.lat,
      lastPoint.lng,
      depotPosition.lat,
      depotPosition.lng
    );
    totalDistanceWithReturn += returnDistance;
  }

  return {
    bestPath: bestPathPoints,
    bestDistance: totalDistanceWithReturn,
    iterations: params.numIterations
  };
};

/**
 * Mise à jour d'une particule avec échange de positions
 */
const updateParticle = (
  currentPath: number[],
  velocity: Array<[number, number]>,
  personalBest: number[],
  globalBest: number[],
  w: number,
  c1: number,
  c2: number,
  n: number
): number[] => {
  const newPath = [...currentPath];

  // Appliquer l'inertie (garder une partie de la vélocité précédente)
  const newVelocity: Array<[number, number]> = [];
  const numSwaps = Math.floor(velocity.length * w);
  for (let i = 0; i < numSwaps && i < velocity.length; i++) {
    newVelocity.push(velocity[i]);
  }

  // Composante cognitive (attirance vers le meilleur personnel)
  const cognitiveSwaps = getCognitiveSwaps(newPath, personalBest, c1);
  newVelocity.push(...cognitiveSwaps);

  // Composante sociale (attirance vers le meilleur global)
  const socialSwaps = getSocialSwaps(newPath, globalBest, c2);
  newVelocity.push(...socialSwaps);

  // Appliquer les échanges de la vélocité
  for (const [i, j] of newVelocity) {
    [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
  }

  return newPath;
};

/**
 * Obtenir les échanges pour se rapprocher du meilleur personnel
 */
const getCognitiveSwaps = (current: number[], target: number[], c1: number): Array<[number, number]> => {
  const swaps: Array<[number, number]> = [];
  const n = current.length;
  const numSwaps = Math.floor(Math.random() * c1 * 3);

  for (let s = 0; s < numSwaps; s++) {
    // Trouver une position où current diffère de target
    const diffPositions: number[] = [];
    for (let i = 0; i < n; i++) {
      if (current[i] !== target[i]) {
        diffPositions.push(i);
      }
    }

    if (diffPositions.length >= 2) {
      const pos1 = diffPositions[Math.floor(Math.random() * diffPositions.length)];
      // Trouver où target a la valeur de current[pos1]
      const targetValue = current[pos1];
      const pos2 = target.indexOf(targetValue);
      
      if (pos2 !== -1 && pos1 !== pos2) {
        swaps.push([pos1, pos2]);
        [current[pos1], current[pos2]] = [current[pos2], current[pos1]];
      }
    }
  }

  return swaps;
};

/**
 * Obtenir les échanges pour se rapprocher du meilleur global
 */
const getSocialSwaps = (current: number[], target: number[], c2: number): Array<[number, number]> => {
  const swaps: Array<[number, number]> = [];
  const n = current.length;
  const numSwaps = Math.floor(Math.random() * c2 * 3);

  for (let s = 0; s < numSwaps; s++) {
    // Trouver une position où current diffère de target
    const diffPositions: number[] = [];
    for (let i = 0; i < n; i++) {
      if (current[i] !== target[i]) {
        diffPositions.push(i);
      }
    }

    if (diffPositions.length >= 2) {
      const pos1 = diffPositions[Math.floor(Math.random() * diffPositions.length)];
      // Trouver où target a la valeur de current[pos1]
      const targetValue = current[pos1];
      const pos2 = target.indexOf(targetValue);
      
      if (pos2 !== -1 && pos1 !== pos2) {
        swaps.push([pos1, pos2]);
        [current[pos1], current[pos2]] = [current[pos2], current[pos1]];
      }
    }
  }

  return swaps;
};
