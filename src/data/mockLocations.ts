// Interface représentant un point de collecte de déchets
export interface CollectionPoint {
  id: string;
  name: string;
  lat: number; // Latitude (autour de -5.82 pour Matadi)
  lng: number; // Longitude (autour de 13.46 pour Matadi)
  status: 'plein' | 'vide';
  estimatedVolume: number; // Volume estimé en m³
}

// Données mockées : 10 points de collecte réalistes autour de Matadi (RDC)
// Coordonnées centrées sur Matadi : lat ~ -5.82, lng ~ 13.46
export const MOCK_LOCATIONS: CollectionPoint[] = [
  {
    id: 'CP-001',
    name: 'Marché Central de Matadi',
    lat: -5.8205,
    lng: 13.4598,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-002',
    name: 'Port de Matadi',
    lat: -5.8178,
    lng: 13.4512,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-003',
    name: 'Quartier Mbanza-Ngungu',
    lat: -5.8245,
    lng: 13.4655,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-004',
    name: 'Hôpital Général de Matadi',
    lat: -5.8192,
    lng: 13.4623,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-005',
    name: 'École Primaire Kinkuzu',
    lat: -5.8267,
    lng: 13.4589,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-006',
    name: 'Gare Routière de Matadi',
    lat: -5.8223,
    lng: 13.4671,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-007',
    name: 'Quartier Nzanza',
    lat: -5.8156,
    lng: 13.4634,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-008',
    name: 'Centre Commercial Kongo',
    lat: -5.8289,
    lng: 13.4545,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-009',
    name: 'Église Saint-Pierre',
    lat: -5.8234,
    lng: 13.4702,
    status: 'vide',
    estimatedVolume: 0,
  },
  {
    id: 'CP-010',
    name: 'Zone Industrielle de Matadi',
    lat: -5.8145,
    lng: 13.4567,
    status: 'vide',
    estimatedVolume: 0,
  },
];

/**
 * Simule de nouvelles alertes en changeant le statut de points de collecte
 * de 'vide' à 'plein' avec un volume estimé aléatoire.
 * 
 * @param count - Nombre de points à simuler comme "pleins" (par défaut 3)
 * @returns Un nouveau tableau de CollectionPoint avec les modifications
 */
export function simulateNewAlerts(count: number = 3): CollectionPoint[] {
  // Créer une copie profonde pour éviter de muter l'original
  const updatedLocations = MOCK_LOCATIONS.map((point) => ({ ...point }));
  
  // Mélanger aléatoirement et sélectionner 'count' points
  const shuffled = [...updatedLocations].sort(() => Math.random() - 0.5);
  const selectedPoints = shuffled.slice(0, count);
  
  // Mettre à jour le statut et le volume des points sélectionnés
  selectedPoints.forEach((point) => {
    const targetPoint = updatedLocations.find((p) => p.id === point.id);
    if (targetPoint) {
      targetPoint.status = 'plein';
      targetPoint.estimatedVolume = Math.floor(Math.random() * 5) + 2; // Volume entre 2 et 7 m³
    }
  });
  
  return updatedLocations;
}
