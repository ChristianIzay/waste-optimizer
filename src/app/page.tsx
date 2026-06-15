'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_LOCATIONS, CollectionPoint } from '@/data/mockLocations';
import { TruckRoute, calculateMultiTruckRoutes, AlgorithmType, ALGORITHM_LABELS, ALGORITHM_DESCRIPTIONS } from '@/lib/routeOptimizer';
import { Truck, MapPin, AlertTriangle, Settings } from 'lucide-react';
import VolumeChart from '@/components/VolumeChart';

// Chargement dynamique du composant WasteMap (uniquement côté client)
const WasteMap = dynamic(() => import('@/components/WasteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
      <p className="text-gray-500">Chargement de la carte...</p>
    </div>
  ),
});

export default function Home() {
  const [locations, setLocations] = useState<CollectionPoint[]>(MOCK_LOCATIONS);
  const [truckRoutes, setTruckRoutes] = useState<TruckRoute[] | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // État pour le sélecteur d'algorithme
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('nearest-neighbor');
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const fullPoints = isMounted ? locations.filter((loc) => loc.status === 'plein') : [];
  const emptyPoints = isMounted ? locations.filter((loc) => loc.status === 'vide') : [];
  
  const handleReset = () => {
    setLocations(MOCK_LOCATIONS);
    setTruckRoutes(null);
  };
  
  const handleCalculateRoute = () => {
    if (fullPoints.length === 0) {
      alert('Aucun point plein à collecter. Veuillez modifier manuellement le statut des points.');
      return;
    }
    
    const routes = calculateMultiTruckRoutes(fullPoints, undefined, 3, selectedAlgorithm);
    setTruckRoutes(routes);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Matadi Waste Optimizer</h1>
              <p className="text-sm text-gray-600">Plateforme d'optimisation de collecte de déchets - Ville de Matadi, RDC</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Panneau de contrôle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Optimisation des Itinéraires
          </h2>
          
          <div className="pt-4 border-t border-gray-200">
            {/* Sélecteur d'algorithme */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Algorithme d'Optimisation
                </h3>
                <button
                  onClick={() => setShowAlgorithmInfo(!showAlgorithmInfo)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {showAlgorithmInfo ? 'Masquer' : 'Plus d\'infos'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['nearest-neighbor', 'aco', 'pso'] as AlgorithmType[]).map((algo) => (
                  <label
                    key={algo}
                    className={`flex items-start gap-3 p-3 rounded-md border-2 cursor-pointer transition-all ${
                      selectedAlgorithm === algo
                        ? 'bg-blue-100 border-blue-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value={algo}
                      checked={selectedAlgorithm === algo}
                      onChange={(e) => setSelectedAlgorithm(e.target.value as AlgorithmType)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ALGORITHM_LABELS[algo]}</p>
                      {showAlgorithmInfo && (
                        <p className="text-xs text-gray-600 mt-1">{ALGORITHM_DESCRIPTIONS[algo]}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleCalculateRoute}
              disabled={fullPoints.length === 0}
              className={`px-6 py-3 rounded-md font-semibold text-white transition-colors flex items-center gap-2 ${
                fullPoints.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Truck className="w-5 h-5" />
              Calculer les itinéraires (3 camions) - {fullPoints.length} points
            </button>
            {truckRoutes && (
              <p className="text-sm text-gray-600 mt-2">
                Algorithme utilisé : <span className="font-semibold text-blue-700">{ALGORITHM_LABELS[selectedAlgorithm]}</span>
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Points Vides</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">{emptyPoints.length}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Points Pleins</span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">{fullPoints.length}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Volume Total Estimé</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">{fullPoints.reduce((sum, p) => sum + p.estimatedVolume, 0)} m³</p>
            </div>
          </div>
        </div>
        
        {/* Résultats MULTI-CAMIONS */}
        {truckRoutes && truckRoutes.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-700" />
              Itinéraires Optimisés - 3 Camions de Collecte
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {truckRoutes.map((truckRoute) => (
                <div key={truckRoute.truckId} className="bg-white border-2 rounded-lg p-4" style={{ borderColor: truckRoute.color }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: truckRoute.color }} />
                    <h3 className="font-bold text-gray-900">{truckRoute.truckName}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Points à visiter:</span>
                      <span className="font-bold text-gray-900">{truckRoute.pointsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance totale:</span>
                      <span className="font-bold text-gray-900">{truckRoute.route.totalDistance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temps estimé:</span>
                      <span className="font-bold text-gray-900">{truckRoute.route.estimatedTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume à collecter:</span>
                      <span className="font-bold text-gray-900">{truckRoute.totalVolume} m³</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Ordre de passage :</p>
                    <ol className="space-y-1">
                      {truckRoute.route.steps.map((step) => (
                        <li key={step.point.id} className="flex items-start gap-2 text-xs">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: truckRoute.color }}>
                            {step.order}
                          </span>
                          <span className="text-gray-700 truncate">{step.point.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white border-2 border-blue-300 rounded-lg p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">📊 Statistiques Globales de la Flotte</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Camions Actifs</p>
                  <p className="text-2xl font-bold text-blue-900">{truckRoutes.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-blue-900">{truckRoutes.reduce((sum, t) => sum + t.pointsCount, 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Distance Totale</p>
                  <p className="text-2xl font-bold text-blue-900">{Math.round(truckRoutes.reduce((sum, t) => sum + t.route.totalDistance, 0) * 100) / 100} km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Volume Total</p>
                  <p className="text-2xl font-bold text-blue-900">{truckRoutes.reduce((sum, t) => sum + t.totalVolume, 0)} m³</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Carte */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Carte des Points de Collecte
          </h2>
          <WasteMap locations={locations} truckRoutes={truckRoutes} />
        </div>
        
        {/* Graphique de répartition des volumes */}
        <div className="mb-6">
          <VolumeChart locations={locations} />
        </div>
        
        {/* Note sur la distance */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note importante :</strong> Les distances sont calculées en ligne droite (formule de Haversine, "vol d'oiseau"). 
            Cette approximation est utilisée pour le MVP. Les distances réelles par la route peuvent varier.
          </p>
        </div>
      </main>
    </div>
  );
}
