// src/data/mockLocations.ts
import proj4 from 'proj4';

// Définir la projection UTM Zone 33S (EPSG:32733)
proj4.defs('EPSG:32733', '+proj=utm +zone=33 +south +datum=WGS84 +units=m +no_defs');

/**
 * Interface définissant un point de collecte de déchets
 */
export interface CollectionPoint {
  id: string;
  numero: string;
  name: string;
  lat: number;
  lng: number;
  utmX: number;
  utmY: number;
  status: 'plein' | 'vide';
  estimatedVolume: number;
}

/**
 * Conversion UTM Zone 33S → WGS84 (Lat/Lng) avec proj4
 */
const convertUTMtoWGS84 = (utmX: number, utmY: number): { lat: number; lng: number } => {
  const [lng, lat] = proj4('EPSG:32733', 'EPSG:4326', [utmX, utmY]);
  return { lat, lng };
};

/**
 * Données brutes UTM des 27 points de collecte de Matadi
 */
const RAW_UTM_DATA = [
  { numero: '01', name: 'Pont Mpozo', utmX: 333243.0797, utmY: 9354630.7545 },
  { numero: '02', name: 'Momo', utmX: 332158.6574, utmY: 9355155.5940 },
  { numero: '03', name: 'Rond-point belvédère', utmX: 331916.9310, utmY: 9355666.8020 },
  { numero: '04', name: 'Epome', utmX: 331750.9902, utmY: 9356019.1556 },
  { numero: '05', name: 'Commandant streiz', utmX: 331231.7115, utmY: 9355156.3814 },
  { numero: '06', name: 'Mikondo', utmX: 330866.3661, utmY: 9354475.2956 },
  { numero: '07', name: 'Mvuadu', utmX: 330634.8757, utmY: 9353795.7354 },
  { numero: '08', name: 'Coca', utmX: 329711.2762, utmY: 9353946.1255 },
  { numero: '09', name: '24 Novembre', utmX: 329629.7821, utmY: 9354846.6940 },
  { numero: '10', name: 'SAFARI', utmX: 328992.7898, utmY: 9354445.7196 },
  { numero: '11', name: 'Rond-point Kinkanda', utmX: 328360.1280, utmY: 9354587.4484 },
  { numero: '12', name: 'RTNC', utmX: 328024.3095, utmY: 9354965.7856 },
  { numero: '13', name: 'Rond-point OEBK', utmX: 326950.3199, utmY: 9355296.2402 },
  { numero: '14', name: 'Pont Marechal', utmX: 326677.4919, utmY: 9355607.5515 },
  { numero: '15', name: 'Buima', utmX: 329541.9890, utmY: 9353702.6767 },
  { numero: '16', name: 'Toulouse', utmX: 329591.2004, utmY: 9353226.3104 },
  { numero: '17', name: 'Tsasa', utmX: 327979.4287, utmY: 9352316.0964 },
  { numero: '18', name: 'Morgue', utmX: 328046.3562, utmY: 9354321.1163 },
  { numero: '19', name: 'Rond-point stade', utmX: 330705.3464, utmY: 9355645.1490 },
  { numero: '20', name: 'Rond-point nzanza', utmX: 330236.0665, utmY: 9356482.5301 },
  { numero: '21', name: 'Kiamvu', utmX: 329992.3717, utmY: 9355825.4595 },
  { numero: '22', name: '24/15', utmX: 329826.2340, utmY: 9356113.6415 },
  { numero: '23', name: 'Damar', utmX: 329778.5974, utmY: 9356374.6587 },
  { numero: '24', name: 'Amis congo', utmX: 329246.8190, utmY: 9356202.6157 },
  { numero: '25', name: 'Rond-point Londé', utmX: 329741.1967, utmY: 9355684.1244 },
  { numero: '26', name: 'Nkalankala', utmX: 329203.4145, utmY: 9355602.6303 },
  { numero: '27', name: 'Ciné palace', utmX: 329466.5971, utmY: 9355252.0483 },
  { numero: '28', name: 'Ciné palace', utmX: 329466.5971, utmY: 9355252.0483 },
  
];

/**
 * Génération des points avec un état ALÉATOIRE à chaque chargement.
 * Rien n'est prédéfini : le statut et le volume sont tirés au sort.
 */
export const MOCK_LOCATIONS: CollectionPoint[] = RAW_UTM_DATA.map((raw, index) => {
  const { lat, lng } = convertUTMtoWGS84(raw.utmX, raw.utmY);
  return {
    id: `MAT-${String(index + 1).padStart(3, '0')}`,
    ...raw,
    lat,
    lng,
    // 50% de chance d'être plein ou vide à chaque chargement
    status: Math.random() > 0.5 ? 'plein' : 'vide', 
    // Volume aléatoire entre 4 et 16 m³
    estimatedVolume: Math.floor(Math.random() * 13) + 4, 
  };
});

/**
 * Simule de nouvelles alertes : change des bennes 'vide' en 'plein'
 */
export const simulateNewAlerts = (locations: CollectionPoint[], count: number): CollectionPoint[] => {
  const updatedLocations = [...locations];
  const emptyLocations = updatedLocations.filter(loc => loc.status === 'vide');
  
  // Si toutes les bennes sont déjà pleines, on ne peut pas en ajouter
  if (emptyLocations.length === 0) return updatedLocations;

  const shuffled = emptyLocations.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, emptyLocations.length));
  
  selected.forEach(location => {
    const index = updatedLocations.findIndex(loc => loc.id === location.id);
    if (index !== -1) {
      updatedLocations[index].status = 'plein';
    }
  });
  
  return updatedLocations;
};

/**
 * Réinitialise l'état de toutes les bennes de manière aléatoire
 */
export const resetLocations = (): CollectionPoint[] => {
  return MOCK_LOCATIONS.map(loc => ({
    ...loc,
    status: Math.random() > 0.5 ? 'plein' : 'vide',
    estimatedVolume: Math.floor(Math.random() * 13) + 4
  }));
};

/**
 * Calcule le volume total des points pleins
 */
export const getTotalVolume = (locations: CollectionPoint[]): number => {
  return locations
    .filter(loc => loc.status === 'plein')
    .reduce((total, loc) => total + loc.estimatedVolume, 0);
};

/**
 * Compte les points par statut
 */
export const getCountByStatus = (locations: CollectionPoint[]): { plein: number; vide: number } => {
  return {
    plein: locations.filter(loc => loc.status === 'plein').length,
    vide: locations.filter(loc => loc.status === 'vide').length
  };
};