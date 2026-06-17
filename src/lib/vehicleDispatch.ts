import { CollectionPoint } from '@/data/mockLocations';
import { TruckRoute, AlgorithmType, calculateOptimalRoute } from './routeOptimizer';

/**
 * Configuration d'un véhicule de collecte
 */
export interface VehicleConfig {
  id: number;
  name: string;
  color: string;
  capacity: number; // Capacité maximale en m³
  available: boolean; // Disponibilité du véhicule
  currentLocation?: { lat: number; lng: number }; // Position actuelle (si différent du dépôt)
}

/**
 * Résultat de l'optimisation d'envoi
 */
export interface DispatchResult {
  assignedVehicles: TruckRoute[];
  unassignedPoints: CollectionPoint[]; // Points non assignés (manque de capacité)
  totalVehiclesNeeded: number;
  totalCapacityUsed: number;
  efficiencyScore: number; // Score d'efficacité 0-100
  recommendations: string[]; // Recommandations pour l'utilisateur
}

/**
 * Paramètres de dispatching
 */
export interface DispatchParams {
  algorithmType?: AlgorithmType;
  maxVehicles?: number; // Nombre maximum de véhicules à utiliser
  prioritizeByVolume?: boolean; // Prioriser par volume (true) ou par ordre géographique (false)
  urgencyThreshold?: number; // Seuil d'urgence (volume minimum pour considérer comme urgent)
}

/**
 * Véhicules par défaut pour Matadi
 */
export const DEFAULT_VEHICLES: VehicleConfig[] = [
  { id: 1, name: 'Camion A', color: '#ef4444', capacity: 60, available: true },   // Rouge - 25 m³
  { id: 2, name: 'Camion B', color: '#3b82f6', capacity: 60, available: true },   // Bleu - 20 m³
  { id: 3, name: 'Camion C', color: '#22c55e', capacity: 60, available: true },   // Vert - 15 m³
];

/**
 * Calcule le niveau de priorité d'un point basé sur son volume
 * Retourne un score de priorité (plus élevé = plus urgent)
 */
function calculatePriority(point: CollectionPoint, urgencyThreshold: number): number {
  let priority = 0;
  
  // Base : volume estimé
  priority += point.estimatedVolume;
  
  // Bonus si volume dépasse le seuil d'urgence
  if (point.estimatedVolume >= urgencyThreshold) {
    priority += 10; // Points urgents prioritaires
  }
  
  return priority;
}

/**
 * Optimise l'envoi des véhicules en fonction de la capacité et de la priorité
 * 
 * @param pointsToVisit - Points de collecte pleins
 * @param depotPosition - Position du dépôt
 * @param vehicles - Configuration des véhicules disponibles
 * @param params - Paramètres de dispatching
 * @returns Résultat de l'optimisation avec assignments et recommandations
 */
export function optimizeVehicleDispatch(
  pointsToVisit: CollectionPoint[],
  depotPosition?: { lat: number; lng: number },
  vehicles: VehicleConfig[] = DEFAULT_VEHICLES,
  params: DispatchParams = {}
): DispatchResult {
  const start = depotPosition || { lat: -5.8205, lng: 13.4598 };
  const algorithmType = params.algorithmType || 'nearest-neighbor';
  const maxVehicles = params.maxVehicles || vehicles.length;
  const prioritizeByVolume = params.prioritizeByVolume ?? true;
  const urgencyThreshold = params.urgencyThreshold || 10;
  
  const recommendations: string[] = [];
  const assignedVehicles: TruckRoute[] = [];
  let unassignedPoints: CollectionPoint[] = [];
  
  // Filtrer uniquement les véhicules disponibles
  const availableVehicles = vehicles.filter(v => v.available).slice(0, maxVehicles);
  
  if (availableVehicles.length === 0) {
    recommendations.push('⚠️ Aucun véhicule disponible !');
    return {
      assignedVehicles: [],
      unassignedPoints: pointsToVisit,
      totalVehiclesNeeded: 0,
      totalCapacityUsed: 0,
      efficiencyScore: 0,
      recommendations
    };
  }
  
  // Calculer le volume total à collecter
  const totalVolume = pointsToVisit.reduce((sum, p) => sum + p.estimatedVolume, 0);
  const totalCapacity = availableVehicles.reduce((sum, v) => sum + v.capacity, 0);
  
  // Vérifier si la capacité totale est suffisante
  if (totalVolume > totalCapacity) {
    recommendations.push(
      `⚠️ Volume total (${totalVolume} m³) dépasse la capacité disponible (${totalCapacity} m³)`
    );
    recommendations.push(
      `💡 Envisager d'ajouter ${Math.ceil((totalVolume - totalCapacity) / 15)} voyage(s) supplémentaire(s) ou des véhicules de plus grande capacité`
    );
  }
  
  // Trier les points par priorité
  let sortedPoints = [...pointsToVisit];
  if (prioritizeByVolume) {
    // Prioriser par volume décroissant (plus gros volumes en premier)
    sortedPoints.sort((a, b) => b.estimatedVolume - a.estimatedVolume);
    
    // Identifier les points urgents
    const urgentPoints = sortedPoints.filter(p => p.estimatedVolume >= urgencyThreshold);
    if (urgentPoints.length > 0) {
      recommendations.push(
        `🔴 ${urgentPoints.length} point(s) urgent(s) identifié(s) (volume ≥ ${urgencyThreshold} m³)`
      );
    }
  } else {
    // Prioriser par proximité géographique (regrouper par secteur)
    sortedPoints.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.lat - start.lat, 2) + Math.pow(a.lng - start.lng, 2));
      const distB = Math.sqrt(Math.pow(b.lat - start.lat, 2) + Math.pow(b.lng - start.lng, 2));
      return distA - distB;
    });
  }
  
  // Assigner les points aux véhicules selon leur capacité
  const remainingPoints = [...sortedPoints];
  
  for (const vehicle of availableVehicles) {
    if (remainingPoints.length === 0) break;
    
    // Collecter les points jusqu'à atteindre la capacité du véhicule
    const vehiclePoints: CollectionPoint[] = [];
    let currentVolume = 0;
    
    for (let i = 0; i < remainingPoints.length; i++) {
      const point = remainingPoints[i];
      if (currentVolume + point.estimatedVolume <= vehicle.capacity) {
        vehiclePoints.push(point);
        currentVolume += point.estimatedVolume;
        remainingPoints.splice(i, 1);
        i--; // Réajuster l'index après suppression
      }
    }
    
    if (vehiclePoints.length > 0) {
      // Optimiser l'itinéraire pour ce véhicule
      const optimizedRoute = calculateOptimalRoute(vehiclePoints, start, algorithmType);
      
      assignedVehicles.push({
        truckId: vehicle.id,
        truckName: vehicle.name,
        color: vehicle.color,
        route: optimizedRoute,
        pointsCount: vehiclePoints.length,
        totalVolume: currentVolume,
      });
      
      // Calculer le taux de remplissage
      const fillRate = Math.round((currentVolume / vehicle.capacity) * 100);
      
      if (fillRate < 50) {
        recommendations.push(
          `⚠️ ${vehicle.name} n'est rempli qu'à ${fillRate}% - envisager de réduire le nombre de véhicules`
        );
      } else if (fillRate >= 90) {
        recommendations.push(
          `✅ ${vehicle.name} optimisé à ${fillRate}% de capacité`
        );
      }
    }
  }
  
  // Points non assignés (si manque de capacité)
  unassignedPoints = remainingPoints;
  
  if (unassignedPoints.length > 0) {
    recommendations.push(
      `❌ ${unassignedPoints.length} point(s) non assigné(s) - capacité insuffisante`
    );
    recommendations.push(
      `💡 Ces points nécessitent un deuxième tour ou des véhicules supplémentaires`
    );
  }
  
  // Calculer le score d'efficacité
  const totalAssignedVolume = assignedVehicles.reduce((sum, v) => sum + v.totalVolume, 0);
  const capacityUtilization = totalCapacity > 0 ? (totalAssignedVolume / totalCapacity) * 100 : 0;
  const pointsAssignmentRate = pointsToVisit.length > 0 
    ? ((pointsToVisit.length - unassignedPoints.length) / pointsToVisit.length) * 100 
    : 0;
  
  // Score pondéré : 60% utilisation capacité + 40% taux d'assignment
  const efficiencyScore = Math.round(capacityUtilization * 0.6 + pointsAssignmentRate * 0.4);
  
  // Recommandations finales
  if (efficiencyScore >= 80) {
    recommendations.push(` Excellente efficacité de dispatching : ${efficiencyScore}%`);
  } else if (efficiencyScore >= 60) {
    recommendations.push(`✓ Bonne efficacité de dispatching : ${efficiencyScore}%`);
  } else {
    recommendations.push(`⚠️ Efficacité de dispatching faible : ${efficiencyScore}% - revoir la configuration`);
  }
  
  recommendations.push(
    `📊 Résumé : ${assignedVehicles.length}/${availableVehicles.length} véhicules utilisés, ` +
    `${totalAssignedVolume}/${totalVolume} m³ collectés`
  );
  
  return {
    assignedVehicles,
    unassignedPoints,
    totalVehiclesNeeded: assignedVehicles.length,
    totalCapacityUsed: totalAssignedVolume,
    efficiencyScore,
    recommendations
  };
}

/**
 * Compare différents scénarios de dispatching
 * Utile pour montrer l'impact de différentes stratégies
 */
export function compareDispatchScenarios(
  pointsToVisit: CollectionPoint[],
  depotPosition?: { lat: number; lng: number }
) {
  const scenarios = {
    // Scénario 1 : Tous les véhicules, priorisation par volume
    byVolume: optimizeVehicleDispatch(pointsToVisit, depotPosition, DEFAULT_VEHICLES, {
      prioritizeByVolume: true
    }),
    
    // Scénario 2 : Tous les véhicules, priorisation géographique
    byLocation: optimizeVehicleDispatch(pointsToVisit, depotPosition, DEFAULT_VEHICLES, {
      prioritizeByVolume: false
    }),
    
    // Scénario 3 : Seulement 2 véhicules (économie)
    economyMode: optimizeVehicleDispatch(pointsToVisit, depotPosition, DEFAULT_VEHICLES, {
      maxVehicles: 2,
      prioritizeByVolume: true
    })
  };
  
  return scenarios;
}
