// src/lib/nearestNeighbor.ts

import { CollectionPoint } from '@/data/mockLocations';

/**
 * Résultat de l'optimisation
 */
export interface OptimizationResult {
  path: CollectionPoint[];
  distance: number;
}

/**
 * Calcul de la distance entre deux points (Haversine)
 */
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
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
 * Algorithme du Plus Proche Voisin (Nearest Neighbor)
 * Simple, rapide et déterministe
 */
export const solveWithNearestNeighbor = (points: CollectionPoint[]): OptimizationResult => {
  if (points.length < 2) return { path: points, distance: 0 };

  const visited = new Set<string>();
  const path: CollectionPoint[] = [];
  let totalDistance = 0;

  // Commencer par le premier point
  let current = points[0];
  path.push(current);
  visited.add(current.id);

  // Visiter le point le plus proche non visité
  while (path.length < points.length) {
    let nearest: CollectionPoint | null = null;
    let nearestDistance = Infinity;

    for (const point of points) {
      if (!visited.has(point.id)) {
        const distance = haversineDistance(current.lat, current.lng, point.lat, point.lng);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = point;
        }
      }
    }

    if (nearest) {
      path.push(nearest);
      visited.add(nearest.id);
      totalDistance += nearestDistance;
      current = nearest;
    }
  }

  return { path, distance: totalDistance };
};
