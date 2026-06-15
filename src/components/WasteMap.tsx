'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CollectionPoint } from '@/data/mockLocations';
import { OptimizedRoute, TruckRoute } from '@/lib/routeOptimizer';

// Configuration des icônes pour les marqueurs
const createMarkerIcon = (status: 'plein' | 'vide') => {
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${status === 'plein' ? 'red' : 'green'}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Icône pour le dépôt (point de départ)
const depotIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Créer une icône avec numéro d'ordre et couleur du camion
const createNumberedIcon = (order: number, truckColor: string) => {
  return new DivIcon({
    html: `<div style="
      background-color: ${truckColor};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${order}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface WasteMapProps {
  locations: CollectionPoint[];
  optimizedRoute?: OptimizedRoute | null;
  truckRoutes?: TruckRoute[] | null; // Nouvelles routes multi-camions
}

export default function WasteMap({ locations, optimizedRoute, truckRoutes }: WasteMapProps) {
  // Centre de la carte : Matadi (coordonnées moyennes)
  const center: [number, number] = [-5.8205, 13.4598];
  
  // Préparer les coordonnées de la polyline pour l'ancien itinéraire (single truck)
  const routeCoordinates: [number, number][] = optimizedRoute
    ? [
        center,
        ...optimizedRoute.steps.map((step) => [step.point.lat, step.point.lng] as [number, number]),
      ]
    : [];
  
  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 shadow-md">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Tuiles OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Ligne de l'itinéraire optimisé (mode single truck - legacy) */}
        {!truckRoutes && optimizedRoute && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
          />
        )}
        
        {/* Routes multi-camions (nouveau mode) */}
        {truckRoutes && truckRoutes.map((truckRoute) => {
          const coordinates: [number, number][] = [
            center, // Dépôt
            ...truckRoute.route.steps.map((step) => [step.point.lat, step.point.lng] as [number, number]),
          ];
          
          return (
            <Polyline
              key={truckRoute.truckId}
              positions={coordinates}
              pathOptions={{ 
                color: truckRoute.color, 
                weight: 5, 
                opacity: 0.9,
                dashArray: truckRoute.route.steps.length > 0 ? undefined : '10, 5',
              }}
            />
          );
        })}
        
        {/* Marqueur du dépôt (point de départ) */}
        {(optimizedRoute || truckRoutes) && (
          <Marker position={center} icon={depotIcon}>
            <Popup>
              <div className="p-2 min-w-[180px]">
                <h3 className="font-bold text-sm">🏭 Dépôt Central</h3>
                <p className="text-xs text-gray-600 mt-1">Point de départ des bennes</p>
                {truckRoutes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Flotte active :</p>
                    {truckRoutes.map((truck) => (
                      <div key={truck.truckId} className="flex items-center gap-2 text-xs mt-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: truck.color }}
                        />
                        <span>{truck.truckName}: {truck.pointsCount} points</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Marqueurs pour chaque point de collecte */}
        {locations.map((point) => {
          // Trouver dans quelle route se trouve ce point
          let truckRoute: TruckRoute | undefined;
          let routeStep: any = undefined;
          
          if (truckRoutes) {
            for (const tr of truckRoutes) {
              const step = tr.route.steps.find((s) => s.point.id === point.id);
              if (step) {
                truckRoute = tr;
                routeStep = step;
                break;
              }
            }
          } else if (optimizedRoute) {
            routeStep = optimizedRoute.steps.find((step) => step.point.id === point.id);
          }
          
          // Utiliser une icône numérotée avec la couleur du camion si disponible
          const markerIcon = routeStep && truckRoute
            ? createNumberedIcon(routeStep.order, truckRoute.color)
            : routeStep
            ? createNumberedIcon(routeStep.order, '#ef4444')
            : createMarkerIcon(point.status);
          
          return (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <h3 className="font-bold text-sm">{point.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Statut: <span className={`font-semibold ${point.status === 'plein' ? 'text-red-600' : 'text-green-600'}`}>
                      {point.status.toUpperCase()}
                    </span>
                  </p>
                  {point.status === 'plein' && (
                    <p className="text-xs text-gray-600">
                      📦 Volume estimé: {point.estimatedVolume} m³
                    </p>
                  )}
                  {routeStep && truckRoute && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: truckRoute.color }}
                        />
                        <p className="text-xs font-bold" style={{ color: truckRoute.color }}>
                          {truckRoute.truckName}
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 font-bold">
                        🚛 Ordre de passage : #{routeStep.order}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 Distance depuis précédent : {routeStep.distanceFromPrevious.toFixed(2)} km
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {point.id}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
