import { CollectionPoint } from '@/data/mockLocations';
import { solveWithACO } from './aco';
import { solveWithPSO } from './pso';
import { solveWithNearestNeighbor } from './nearestNeighbor';

/**
 * Type d'algorithme d'optimisation disponible
 */
export type AlgorithmType = 'nearest-neighbor' | 'aco' | 'pso';

/**
 * Label lisible pour chaque algorithme
 */
export const ALGORITHM_LABELS: Record<AlgorithmType, string> = {
  'nearest-neighbor': 'Plus Proche Voisin',
  'aco': 'Colonie de Fourmis (ACO)',
  'pso': 'Essaim Particulaire (PSO)',
};

/**
 * Description de chaque algorithme
 */
export const ALGORITHM_DESCRIPTIONS: Record<AlgorithmType, string> = {
  'nearest-neighbor': 'Algorithme rapide et simple qui visite toujours le point le plus proche.',
  'aco': 'Optimisation par colonie de fourmis - approche bio-inspirée pour trouver des solutions quasi-optimales.',
  'pso': 'Optimisation par essaim particulaire - simulation du comportement collectif des oiseaux.',
};

/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine.
 * Retourne la distance en kilomètres (vol d'oiseau).
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Interface représentant un point dans l'itinéraire avec sa distance
 */
export interface RouteStep {
  point: CollectionPoint;
  distanceFromPrevious: number; // Distance depuis le point précédent (en km)
  order: number; // Ordre de passage
}

/**
 * Interface représentant un itinéraire complet avec métriques d'efficacité
 */
export interface OptimizedRoute {
  steps: RouteStep[];
  totalDistance: number; // Distance totale en km
  estimatedTime: number; // Temps estimé en minutes (basé sur 30 km/h en ville)
  
  // Métriques d'efficacité (Priorité 1)
  unoptimizedDistance?: number; // Distance sans optimisation (ordre aléatoire)
  distanceSaved?: number; // Distance économisée en km
  fuelSaved?: number; // Carburant économisé en litres (estimé : 0.3 L/km pour un camion)
  timeSaved?: number; // Temps gagné en minutes
  efficiencyPercent?: number; // Pourcentage d'amélioration
  
  // Informations sur l'algorithme utilisé
  algorithmUsed?: AlgorithmType;
  algorithmName?: string;
}

/**
 * Algorithme du Plus Proche Voisin (Nearest Neighbor)
 * 
 * Stratégie gloutonne qui commence par un point de départ et visite
 * toujours le point non visité le plus proche jusqu'à ce que tous
 * les points soient visités.
 * 
 * @param startPoint - Point de départ (dépôt des bennes)
 * @param pointsToVisit - Liste des points à visiter (bennes pleines)
 * @returns Itinéraire optimisé
 */
export function nearestNeighborAlgorithm(
  startPoint: { lat: number; lng: number },
  pointsToVisit: CollectionPoint[]
): OptimizedRoute {
  if (pointsToVisit.length === 0) {
    return { steps: [], totalDistance: 0, estimatedTime: 0 };
  }

  const unvisited = [...pointsToVisit];
  const steps: RouteStep[] = [];
  let currentPosition = startPoint;
  let totalDistance = 0;
  let order = 1;

  while (unvisited.length > 0) {
    // Trouver le point non visité le plus proche
    let nearestPoint = unvisited[0];
    let minDistance = haversineDistance(
      currentPosition.lat,
      currentPosition.lng,
      nearestPoint.lat,
      nearestPoint.lng
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = haversineDistance(
        currentPosition.lat,
        currentPosition.lng,
        unvisited[i].lat,
        unvisited[i].lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = unvisited[i];
      }
    }

    // Ajouter le point le plus proche à l'itinéraire
    steps.push({
      point: nearestPoint,
      distanceFromPrevious: minDistance,
      order: order++,
    });

    totalDistance += minDistance;
    currentPosition = { lat: nearestPoint.lat, lng: nearestPoint.lng };

    // Retirer le point visité de la liste
    const index = unvisited.findIndex((p) => p.id === nearestPoint.id);
    unvisited.splice(index, 1);
  }

  // Calculer le temps estimé (vitesse moyenne de 30 km/h en ville)
  const estimatedTime = (totalDistance / 30) * 60; // en minutes

  return {
    steps,
    totalDistance: Math.round(totalDistance * 100) / 100, // Arrondi à 2 décimales
    estimatedTime: Math.round(estimatedTime),
  };
}

/**
 * Amélioration 2-Opt
 * 
 * Algorithme d'amélioration locale qui cherche à réduire la distance totale
 * en inversant des segments de l'itinéraire lorsqu'une amélioration est possible.
 * 
 * @param route - Itinéraire à améliorer
 * @returns Itinéraire amélioré
 */
export function twoOptImprovement(route: OptimizedRoute): OptimizedRoute {
  if (route.steps.length < 3) {
    return route; // Pas d'amélioration possible avec moins de 3 points
  }

  let improved = true;
  let currentRoute = { ...route };

  while (improved) {
    improved = false;

    // Tester toutes les paires de points possibles
    for (let i = 0; i < currentRoute.steps.length - 1; i++) {
      for (let j = i + 1; j < currentRoute.steps.length; j++) {
        // Créer un nouvel itinéraire en inversant le segment entre i et j
        const newSteps = [
          ...currentRoute.steps.slice(0, i),
          ...currentRoute.steps.slice(i, j + 1).reverse(),
          ...currentRoute.steps.slice(j + 1),
        ];

        // Recalculer les distances
        let newTotalDistance = 0;
        const newStepsWithDistances: RouteStep[] = [];
        let previousPosition = { lat: -5.8205, lng: 13.4598 }; // Point de départ (Matadi centre)

        newSteps.forEach((step, index) => {
          const distance = haversineDistance(
            previousPosition.lat,
            previousPosition.lng,
            step.point.lat,
            step.point.lng
          );

          newStepsWithDistances.push({
            point: step.point,
            distanceFromPrevious: distance,
            order: index + 1,
          });

          newTotalDistance += distance;
          previousPosition = { lat: step.point.lat, lng: step.point.lng };
        });

        newTotalDistance = Math.round(newTotalDistance * 100) / 100;

        // Si l'amélioration est significative (> 0.01 km), l'accepter
        if (newTotalDistance < currentRoute.totalDistance - 0.01) {
          currentRoute = {
            steps: newStepsWithDistances,
            totalDistance: newTotalDistance,
            estimatedTime: Math.round((newTotalDistance / 30) * 60),
          };
          improved = true;
          break;
        }
      }

      if (improved) break;
    }
  }

  return currentRoute;
}

/**
 * Calcule la distance totale d'un itinéraire non optimisé (ordre original des points)
 * Utilisé comme baseline pour comparer l'efficacité de l'optimisation
 */
function calculateUnoptimizedDistance(
  startPoint: { lat: number; lng: number },
  pointsToVisit: CollectionPoint[]
): number {
  let totalDistance = 0;
  let currentPosition = startPoint;

  for (const point of pointsToVisit) {
    const distance = haversineDistance(
      currentPosition.lat,
      currentPosition.lng,
      point.lat,
      point.lng
    );
    totalDistance += distance;
    currentPosition = { lat: point.lat, lng: point.lng };
  }

  return totalDistance;
}

/**
 * Convertit le résultat d'un algorithme bio-inspiré en OptimizedRoute
 */
function convertBioResultToRoute(
  path: CollectionPoint[],
  totalDistance: number,
  startPoint: { lat: number; lng: number }
): OptimizedRoute {
  const steps: RouteStep[] = [];
  let currentPosition = startPoint;
  let order = 1;

  for (const point of path) {
    const distance = haversineDistance(
      currentPosition.lat,
      currentPosition.lng,
      point.lat,
      point.lng
    );

    steps.push({
      point,
      distanceFromPrevious: distance,
      order: order++,
    });

    currentPosition = { lat: point.lat, lng: point.lng };
  }

  const estimatedTime = (totalDistance / 30) * 60;

  return {
    steps,
    totalDistance: Math.round(totalDistance * 100) / 100,
    estimatedTime: Math.round(estimatedTime),
  };
}

/**
 * Fonction principale qui calcule l'itinéraire optimal avec l'algorithme choisi
 * 
 * @param pointsToVisit - Points de collecte pleins à visiter
 * @param depotPosition - Position du dépôt de départ (optionnel, par défaut centre de Matadi)
 * @param algorithmType - Type d'algorithme à utiliser (défaut: 'nearest-neighbor')
 * @returns Itinéraire optimisé final avec métriques d'efficacité
 */
export function calculateOptimalRoute(
  pointsToVisit: CollectionPoint[],
  depotPosition?: { lat: number; lng: number },
  algorithmType: AlgorithmType = 'nearest-neighbor'
): OptimizedRoute {
  // Position par défaut : centre de Matadi
  const start = depotPosition || { lat: -5.8205, lng: 13.4598 };

  // Calculer la distance non optimisée (baseline)
  const unoptimizedDistance = calculateUnoptimizedDistance(start, pointsToVisit);

  let optimizedRoute: OptimizedRoute;

  // Sélection de l'algorithme
  switch (algorithmType) {
    case 'aco': {
      // Algorithme Colonie de Fourmis
      const acoResult = solveWithACO(pointsToVisit);
      const route = convertBioResultToRoute(acoResult.bestPath, acoResult.bestDistance, start);
      optimizedRoute = twoOptImprovement(route);
      break;
    }
    
    case 'pso': {
      // Algorithme Essaim Particulaire
      const psoResult = solveWithPSO(pointsToVisit);
      const route = convertBioResultToRoute(psoResult.bestPath, psoResult.bestDistance, start);
      optimizedRoute = twoOptImprovement(route);
      break;
    }
    
    case 'nearest-neighbor':
    default: {
      // Algorithme du Plus Proche Voisin (défaut)
      const initialRoute = nearestNeighborAlgorithm(start, pointsToVisit);
      optimizedRoute = twoOptImprovement(initialRoute);
      break;
    }
  }

  // Calculer les métriques d'efficacité
  const distanceSaved = unoptimizedDistance - optimizedRoute.totalDistance;
  const fuelSaved = distanceSaved * 0.3; // Estimation : 0.3 L/km pour un camion de collecte
  const timeSaved = (distanceSaved / 30) * 60; // Temps gagné en minutes (à 30 km/h)
  const efficiencyPercent = unoptimizedDistance > 0 
    ? Math.round((distanceSaved / unoptimizedDistance) * 100)
    : 0;

  return {
    ...optimizedRoute,
    unoptimizedDistance: Math.round(unoptimizedDistance * 100) / 100,
    distanceSaved: Math.round(distanceSaved * 100) / 100,
    fuelSaved: Math.round(fuelSaved * 100) / 100,
    timeSaved: Math.round(timeSaved),
    efficiencyPercent,
    algorithmUsed: algorithmType,
    algorithmName: ALGORITHM_LABELS[algorithmType],
  };
}

/**
 * Interface pour un camion avec son itinéraire
 */
export interface TruckRoute {
  truckId: number;
  truckName: string;
  color: string; // Couleur pour l'affichage sur la carte
  route: OptimizedRoute;
  pointsCount: number;
  totalVolume: number;
}

/**
 * Répartit les points de collecte entre plusieurs camions
 * Stratégie : clustering géographique simple basé sur la proximité
 * 
 * @param pointsToVisit - Tous les points à collecter
 * @param depotPosition - Position du dépôt
 * @param numTrucks - Nombre de camions disponibles (défaut 3)
 * @param algorithmType - Type d'algorithme d'optimisation (défaut: 'nearest-neighbor')
 * @returns Tableau des routes optimisées par camion
 */
export function calculateMultiTruckRoutes(
  pointsToVisit: CollectionPoint[],
  depotPosition?: { lat: number; lng: number },
  numTrucks: number = 3,
  algorithmType: AlgorithmType = 'nearest-neighbor'
): TruckRoute[] {
  const start = depotPosition || { lat: -5.8205, lng: 13.4598 };
  
  // Configuration des camions
  const trucks = [
    { id: 1, name: 'Camion A', color: '#ef4444' },   // Rouge
    { id: 2, name: 'Camion B', color: '#3b82f6' },   // Bleu
    { id: 3, name: 'Camion C', color: '#22c55e' },   // Vert
  ];
  
  // Si moins de points que de camions, chaque point va à un camion différent
  if (pointsToVisit.length <= numTrucks) {
    return pointsToVisit.map((point, index) => {
      const route = calculateOptimalRoute([point], start, algorithmType);
      return {
        truckId: trucks[index].id,
        truckName: trucks[index].name,
        color: trucks[index].color,
        route,
        pointsCount: 1,
        totalVolume: point.estimatedVolume,
      };
    });
  }
  
  // Étape 1 : Répartition initiale basée sur la position angulaire depuis le dépôt
  // Cette approche crée des "secteurs" géographiques naturels
  const assignedPoints: CollectionPoint[][] = Array.from({ length: numTrucks }, () => []);
  
  // Calculer l'angle de chaque point par rapport au dépôt
  const pointsWithAngle = pointsToVisit.map((point) => {
    const angle = Math.atan2(point.lat - start.lat, point.lng - start.lng);
    return { point, angle };
  });
  
  // Trier par angle
  pointsWithAngle.sort((a, b) => a.angle - b.angle);
  
  // Distribuer en alternance pour équilibrer la charge
  pointsWithAngle.forEach((item, index) => {
    const truckIndex = index % numTrucks;
    assignedPoints[truckIndex].push(item.point);
  });
  
  // Étape 2 : Optimiser l'itinéraire de chaque camion
  const truckRoutes: TruckRoute[] = [];
  
  for (let i = 0; i < numTrucks; i++) {
    if (assignedPoints[i].length === 0) continue;
    
    const optimizedRoute = calculateOptimalRoute(assignedPoints[i], start, algorithmType);
    const totalVolume = assignedPoints[i].reduce((sum, p) => sum + p.estimatedVolume, 0);
    
    truckRoutes.push({
      truckId: trucks[i].id,
      truckName: trucks[i].name,
      color: trucks[i].color,
      route: optimizedRoute,
      pointsCount: assignedPoints[i].length,
      totalVolume,
    });
  }
  
  return truckRoutes;
}
