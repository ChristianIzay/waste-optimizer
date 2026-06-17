'use client';

import { CollectionPoint } from '@/data/mockLocations';

interface VolumeChartProps {
  locations: CollectionPoint[];
}

export default function VolumeChart({ locations }: VolumeChartProps) {
  // Filtrer uniquement les points pleins
  const fullPoints = locations.filter((loc) => loc.status === 'plein');
  
  if (fullPoints.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500 text-sm">Aucune donnée à afficher. Simulez des alertes pour voir la répartition.</p>
      </div>
    );
  }
  
  // Grouper par quartier (simplifié : on utilise le nom comme catégorie)
  const volumeByLocation = fullPoints.map((point) => ({
    name: point.name.length > 20 ? point.name.substring(0, 20) + '...' : point.name,
    volume: point.estimatedVolume,
    id: point.id,
  }));
  
  // Trouver le volume maximum pour l'échelle
  const maxVolume = Math.max(...volumeByLocation.map((item) => item.volume));
  
  // Couleurs pour les barres
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        📊 Répartition des Volumes par Point de Collecte
      </h3>
      
      <div className="space-y-3">
        {volumeByLocation.map((item, index) => {
          const percentage = (item.volume / maxVolume) * 100;
          const color = colors[index % colors.length];
          
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-32 text-xs text-gray-600 truncate" title={item.name}>
                {item.name}
              </div>
              <div className="flex-grow bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`${color} h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                  style={{ width: `${percentage}%` }}
                >
                  <span className="text-xs font-bold text-white">{item.volume} m³</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Légende */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Volume total : <strong>{fullPoints.reduce((sum, p) => sum + p.estimatedVolume, 0)} m³</strong> | 
          Points actifs : <strong>{fullPoints.length}</strong> | 
          Moyenne : <strong>{Math.round(fullPoints.reduce((sum, p) => sum + p.estimatedVolume, 0) / fullPoints.length)} m³</strong> par point
        </p>
      </div>
    </div>
  );
}
