'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_LOCATIONS, CollectionPoint } from '@/data/mockLocations';
import { TruckRoute, calculateMultiTruckRoutes, AlgorithmType, ALGORITHM_LABELS, ALGORITHM_DESCRIPTIONS, calculateUnoptimizedRouteWithReturn, calculateMultiTruckRoutesUnoptimized } from '@/lib/routeOptimizer';
import { optimizeVehicleDispatch, DispatchResult, DEFAULT_VEHICLES, VehicleConfig } from '@/lib/vehicleDispatch';
import { Truck, MapPin, AlertTriangle, Settings, Route, Send, CheckCircle2, XCircle, Info } from 'lucide-react';
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
  
  // Nouvel état pour afficher/masquer l'itinéraire non optimisé
  const [showUnoptimizedRoute, setShowUnoptimizedRoute] = useState(false);
  
  // États pour le dispatching de véhicules
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [prioritizeByVolume, setPrioritizeByVolume] = useState(true);
  const [maxVehicles, setMaxVehicles] = useState(3);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const fullPoints = isMounted ? locations.filter((loc) => loc.status === 'plein') : [];
  const emptyPoints = isMounted ? locations.filter((loc) => loc.status === 'vide') : [];
  
  const handleReset = () => {
    setLocations(MOCK_LOCATIONS);
    setTruckRoutes(null);
    setDispatchResult(null);
  };
  
  const handleCalculateRoute = () => {
    if (fullPoints.length === 0) {
      alert('Aucun point plein à collecter. Veuillez modifier manuellement le statut des points.');
      return;
    }
    
    // Optimiser le dispatching des véhicules
    const dispatch = optimizeVehicleDispatch(
      fullPoints,
      undefined,
      DEFAULT_VEHICLES.slice(0, maxVehicles),
      {
        algorithmType: selectedAlgorithm,
        prioritizeByVolume,
        urgencyThreshold: 10
      }
    );
    
    setDispatchResult(dispatch);
    setTruckRoutes(dispatch.assignedVehicles);
  };
  
  // Calculer les statistiques de l'itinéraire non optimisé MULTI-CAMIONS
  const centerDepot = { lat: -5.8205, lng: 13.4598 };
  
  // Pour une comparaison JUSTE, on compare :
  // - Non optimisé MULTI-CAMIONS : mêmes points répartis entre 3 camions (même répartition géographique)
  //   mais chaque camion visite ses points dans l'ordre original
  // - Optimisé MULTI-CAMIONS : mêmes points répartis entre 3 camions avec algorithme optimal
  
  const unoptimizedMultiTruckRoutes = truckRoutes && showUnoptimizedRoute 
    ? calculateMultiTruckRoutesUnoptimized(fullPoints, centerDepot, 3)
    : null;
  
  // Statistiques totales non optimisées (somme des 3 camions)
  const unoptimizedTotalDistance = unoptimizedMultiTruckRoutes
    ? Math.round(unoptimizedMultiTruckRoutes.reduce((sum, t) => sum + t.route.totalDistance, 0) * 100) / 100
    : 0;
  const unoptimizedTotalTime = unoptimizedMultiTruckRoutes
    ? unoptimizedMultiTruckRoutes.reduce((sum, t) => sum + t.route.estimatedTime, 0)
    : 0;
  
  // Calculer les statistiques globales optimisées MULTI-CAMIONS (pour affichage)
  const optimizedTotalDistance = truckRoutes 
    ? Math.round(truckRoutes.reduce((sum, t) => sum + t.route.totalDistance, 0) * 100) / 100
    : 0;
  const optimizedTotalTime = truckRoutes
    ? truckRoutes.reduce((sum, t) => sum + t.route.estimatedTime, 0)
    : 0;
  
  // Constantes pour les calculs environnementaux
  const FUEL_CONSUMPTION_PER_KM = 0.3; // litres/km pour un camion de collecte
  const FUEL_PRICE_PER_LITER = 1.2; // USD/litre (prix moyen carburant RDC)
  const CO2_PER_LITER_FUEL = 2.68; // kg CO2 par litre de diesel
  const CO2_ABSORBED_PER_TREE = 22; // kg CO2 absorbé par arbre par an (EPA standard)
  
  // Calculs carburant et coûts - Optimisé MULTI-CAMIONS
  const optimizedFuelConsumption = Math.round(optimizedTotalDistance * FUEL_CONSUMPTION_PER_KM * 100) / 100;
  const optimizedFuelCost = Math.round(optimizedFuelConsumption * FUEL_PRICE_PER_LITER * 100) / 100;
  const optimizedCO2 = Math.round(optimizedFuelConsumption * CO2_PER_LITER_FUEL * 100) / 100;
  
  // Calculs carburant et coûts - Non optimisé MULTI-CAMIONS
  const unoptimizedFuelConsumption = Math.round(unoptimizedTotalDistance * FUEL_CONSUMPTION_PER_KM * 100) / 100;
  const unoptimizedFuelCost = Math.round(unoptimizedFuelConsumption * FUEL_PRICE_PER_LITER * 100) / 100;
  const unoptimizedCO2 = Math.round(unoptimizedFuelConsumption * CO2_PER_LITER_FUEL * 100) / 100;
  
  // Économies (comparaison multi-camions vs multi-camions)
  const fuelSaved = Math.round((unoptimizedFuelConsumption - optimizedFuelConsumption) * 100) / 100;
  const costSaved = Math.round((unoptimizedFuelCost - optimizedFuelCost) * 100) / 100;
  const co2Saved = Math.round((unoptimizedCO2 - optimizedCO2) * 100) / 100;
  const treesEquivalent = co2Saved > 0 ? Math.round(co2Saved / CO2_ABSORBED_PER_TREE * 100) / 100 : 0;
  
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
            {/* Panneau de configuration du dispatching */}
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-600" />
                  Configuration d'Envoi des Véhicules
                </h3>
                <button
                  onClick={() => setShowDispatchPanel(!showDispatchPanel)}
                  className="text-sm text-purple-600 hover:text-purple-800 underline"
                >
                  {showDispatchPanel ? 'Masquer' : 'Options avancées'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de véhicules */}
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-2">
                    Nombre de véhicules à utiliser : <span className="font-bold">{maxVehicles}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={maxVehicles}
                    onChange={(e) => setMaxVehicles(Number(e.target.value))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-purple-700 mt-1">
                    <span>1 (économie)</span>
                    <span>2</span>
                    <span>3 (max)</span>
                  </div>
                </div>
                
                {/* Priorisation */}
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-2">
                    Stratégie de priorisation :
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPrioritizeByVolume(true)}
                      className={`flex-1 px-3 py-2 text-xs rounded-md border-2 transition-all ${
                        prioritizeByVolume
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      Par Volume (urgent)
                    </button>
                    <button
                      onClick={() => setPrioritizeByVolume(false)}
                      className={`flex-1 px-3 py-2 text-xs rounded-md border-2 transition-all ${
                        !prioritizeByVolume
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      Par Secteur
                    </button>
                  </div>
                </div>
              </div>
              
              {showDispatchPanel && (
                <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-800">
                  <p className="font-semibold mb-1">ℹ️ Informations sur les véhicules :</p>
                  <ul className="space-y-1 ml-4">
                    {DEFAULT_VEHICLES.slice(0, maxVehicles).map(v => (
                      <li key={v.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                        <span>{v.name} - Capacité : {v.capacity} m³</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
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
              <Send className="w-5 h-5" />
              Optimiser et Envoyer les Véhicules - {fullPoints.length} points
            </button>
            {truckRoutes && (
              <p className="text-sm text-gray-600 mt-2">
                Algorithme utilisé : <span className="font-semibold text-blue-700">{ALGORITHM_LABELS[selectedAlgorithm]}</span>
                {dispatchResult && (
                  <span className="ml-2 text-purple-700">| Efficacité dispatching : {dispatchResult.efficiencyScore}%</span>
                )}
              </p>
            )}
          </div>
          
          {/* Recommandations de dispatching */}
          {dispatchResult && dispatchResult.recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-purple-600" />
                 Recommandations d'Envoi des Véhicules
              </h3>
              
              <div className="space-y-2">
                {dispatchResult.recommendations.map((rec, idx) => {
                  const isError = rec.includes('⚠️') || rec.includes('❌');
                  const isSuccess = rec.includes('✅') || rec.includes(' Excellente');
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 text-sm p-2 rounded ${
                        isError ? 'bg-red-50 text-red-800' : 
                        isSuccess ? 'bg-green-50 text-green-800' : 
                        'bg-white text-gray-700'
                      }`}
                    >
                      {isError ? <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : 
                       isSuccess ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                       <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <span>{rec.replace(/[⚠️❌✅💡🔴📊✓ ]/g, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Points non assignés */}
              {dispatchResult.unassignedPoints.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs font-semibold text-red-800 mb-2">
                    ❌ Points non assignés ({dispatchResult.unassignedPoints.length}) :
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dispatchResult.unassignedPoints.map(point => (
                      <div key={point.id} className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                        <p className="font-bold text-red-900 truncate">{point.name}</p>
                        <p className="text-red-700">{point.estimatedVolume} m³</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
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
            
            {/* Toggle pour afficher/masquer l'itinéraire non optimisé */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnoptimizedRoute}
                  onChange={(e) => setShowUnoptimizedRoute(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-yellow-700" />
                  <span className="text-sm font-medium text-yellow-900">
                    Afficher l'itinéraire NON optimisé (ordre original)
                  </span>
                </div>
              </label>
              {showUnoptimizedRoute && (
                <p className="text-xs text-yellow-700 mt-2 ml-7">
                  L'itinéraire non optimisé suit l'ordre original des points tel qu'ils apparaissent dans la liste, 
                  avec retour au dépôt. Utilisez ceci pour comparer avec l'itinéraire optimisé.
                </p>
              )}
            </div>
            
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
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">📊 Statistiques Globales de la Flotte (Optimisée)</h3>
              
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
                  <p className="text-2xl font-bold text-blue-900">{optimizedTotalDistance} km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Volume Total</p>
                  <p className="text-2xl font-bold text-blue-900">{truckRoutes.reduce((sum, t) => sum + t.totalVolume, 0)} m³</p>
                </div>
              </div>
            </div>
            
            {/* Statistiques de l'itinéraire NON optimisé MULTI-CAMIONS */}
            {showUnoptimizedRoute && unoptimizedMultiTruckRoutes && (
              <div className="mt-4 bg-white border-2 border-yellow-400 rounded-lg p-5">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <Route className="w-5 h-5 text-yellow-600" />
                  📊 Statistiques - Itinéraire NON Optimisé (Multi-Camions, Ordre Original)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Camions Utilisés</p>
                    <p className="text-2xl font-bold text-yellow-900">{unoptimizedMultiTruckRoutes.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Distance Totale</p>
                    <p className="text-2xl font-bold text-yellow-900">{unoptimizedTotalDistance} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Temps Total Estimé</p>
                    <p className="text-2xl font-bold text-yellow-900">{unoptimizedTotalTime} min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Volume Total</p>
                    <p className="text-2xl font-bold text-yellow-900">{fullPoints.reduce((sum, p) => sum + p.estimatedVolume, 0)} m³</p>
                  </div>
                </div>
                
                {/* Détails par camion non optimisé */}
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-3">🚛 Détail par Camion (Non Optimisé) :</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {unoptimizedMultiTruckRoutes.map((truckRoute) => (
                      <div key={truckRoute.truckId} className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: truckRoute.color }} />
                          <span className="text-xs font-bold text-gray-900">{truckRoute.truckName}</span>
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Points:</span>
                            <span className="font-bold">{truckRoute.pointsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance:</span>
                            <span className="font-bold">{truckRoute.route.totalDistance} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Temps:</span>
                            <span className="font-bold">{truckRoute.route.estimatedTime} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Comparaison détaillée : Avant/Après Optimisation */}
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-4 flex items-center gap-2">
                    📈 Analyse Comparative Complète - Avant/Après Optimisation
                  </h4>
                  
                  {/* Tableau comparatif */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Non Optimisé (AVANT) - MULTI-CAMIONS */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <h5 className="font-bold text-red-900 mb-3 text-center text-sm">❌ AVANT (Non Optimisé Multi-Camions)</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Distance :</span>
                          <span className="font-bold text-red-900">{unoptimizedTotalDistance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Carburant :</span>
                          <span className="font-bold text-red-900">{unoptimizedFuelConsumption} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Coût carburant :</span>
                          <span className="font-bold text-red-900">{unoptimizedFuelCost} $</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Émissions CO₂ :</span>
                          <span className="font-bold text-red-900">{unoptimizedCO2} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Temps total :</span>
                          <span className="font-bold text-red-900">{unoptimizedTotalTime} min</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-red-200">
                          <span className="text-gray-700">Camions utilisés :</span>
                          <span className="font-bold text-red-900">{unoptimizedMultiTruckRoutes.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Flèche */}
                    <div className="flex items-center justify-center">
                      <div className="text-4xl text-green-600">→</div>
                    </div>
                    
                    {/* Optimisé (APRÈS) */}
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <h5 className="font-bold text-green-900 mb-3 text-center text-sm">✅ APRÈS ({ALGORITHM_LABELS[selectedAlgorithm]})</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Distance :</span>
                          <span className="font-bold text-green-900">{optimizedTotalDistance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Carburant :</span>
                          <span className="font-bold text-green-900">{optimizedFuelConsumption} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Coût carburant :</span>
                          <span className="font-bold text-green-900">{optimizedFuelCost} $</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Émissions CO₂ :</span>
                          <span className="font-bold text-green-900">{optimizedCO2} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Temps :</span>
                          <span className="font-bold text-green-900">{optimizedTotalTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Économies réalisées */}
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg p-5">
                    <h5 className="font-bold text-green-900 mb-4 text-center text-base">🎯 Économies Réalisées par l'Optimisation</h5>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">⛽ Carburant Économisé</p>
                        <p className="text-2xl font-bold text-green-700">{fuelSaved} L</p>
                        <p className="text-xs text-green-600 mt-1">~{Math.round(fuelSaved / unoptimizedFuelConsumption * 100)}% réduit</p>
                      </div>
                      
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">💵 Coût Économisé</p>
                        <p className="text-2xl font-bold text-green-700">{costSaved} $</p>
                        <p className="text-xs text-green-600 mt-1">par tournée</p>
                      </div>
                      
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">🌍 CO₂ Évité</p>
                        <p className="text-2xl font-bold text-green-700">{co2Saved} kg</p>
                        <p className="text-xs text-green-600 mt-1">~{Math.round(co2Saved / unoptimizedCO2 * 100)}% réduit</p>
                      </div>
                      
                      <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">🌳 Arbres Équivalents</p>
                        <p className="text-2xl font-bold text-green-700">{treesEquivalent}</p>
                        <p className="text-xs text-green-600 mt-1">arbres/an compensés</p>
                      </div>
                    </div>
                    
                    {/* Impact environnemental annualisé */}
                    <div className="mt-4 pt-4 border-t border-green-300">
                      <p className="text-xs text-gray-700 text-center mb-3">
                        <strong>📊 Projection Annuelle</strong> (basée sur 1 tournée/jour, 6 jours/semaine, ~312 jours/an)
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Carburant/an</p>
                          <p className="text-lg font-bold text-green-700">{Math.round(fuelSaved * 312)} L</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Économie/an</p>
                          <p className="text-lg font-bold text-green-700">{Math.round(costSaved * 312)} $</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">CO₂ évité/an</p>
                          <p className="text-lg font-bold text-green-700">{Math.round(co2Saved * 312)} kg</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Arbres équivalents/an</p>
                          <p className="text-lg font-bold text-green-700">{Math.round(treesEquivalent * 312)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Note explicative */}
                    <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded text-xs text-green-800">
                      <p className="font-semibold mb-1">🌱 Notes méthodologiques :</p>
                      <ul className="list-disc list-inside space-y-1 text-[10px]">
                        <li>Consommation : {FUEL_CONSUMPTION_PER_KM} L/km (camion de collecte diesel)</li>
                        <li>Prix carburant : {FUEL_PRICE_PER_LITER} $/L (moyenne RDC)</li>
                        <li>Émission CO₂ : {CO2_PER_LITER_FUEL} kg/L de diesel brûlé</li>
                        <li>1 arbre absorbe ~{CO2_ABSORBED_PER_TREE} kg CO₂/an (standard EPA)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Ordre de passage non optimisé (tous les camions) */}
                <div className="mt-4 pt-4 border-t border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">📋 Ordre de passage par Camion (non optimisé - ordre original) :</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {unoptimizedMultiTruckRoutes.map((truckRoute) => (
                      <div key={truckRoute.truckId} className="bg-yellow-50 border border-yellow-300 rounded p-2">
                        <h6 className="text-[10px] font-bold text-yellow-900 mb-2 flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: truckRoute.color }} />
                          {truckRoute.truckName} ({truckRoute.pointsCount} points)
                        </h6>
                        <ol className="space-y-1">
                          {truckRoute.route.steps.map((step, idx) => (
                            <li key={`unopt-${truckRoute.truckId}-${idx}`} className="flex items-start gap-1 text-[9px]">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-[8px]">
                                {step.order}
                              </span>
                              <span className="text-gray-700 truncate flex-1">{step.point.name}</span>
                              <span className="text-gray-500 text-[8px]">
                                {step.distanceFromPrevious.toFixed(2)} km
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Carte */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Carte des Points de Collecte
          </h2>
          <WasteMap locations={locations} truckRoutes={truckRoutes} showUnoptimizedRoute={showUnoptimizedRoute} />
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
