"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { RoadInfoDto } from "@/types/road";
import { HorseServiceSummaryDto } from "@/types/horse";
import { TourismFullDetailDto } from "@/types/tourism";
import { getRoadsByTourism } from "@/services/road.service";
import { getHorseServicesByRoad } from "@/services/horse.service";
import { fetchTourismDetail } from "@/services/tourism.service";
import TopBar from "@/components/layout/TopBar";
import dynamic from "next/dynamic";

// Dynamically import the map modal to avoid SSR issues
const RoadMapModal = dynamic(() => import("@/components/map/RoadMapModal"), {
  ssr: false,
});

function RoadDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tourismId = Number(searchParams.get("tourismId"));
  const tourismName = searchParams.get("tourismName") || "destination";
  
  const [tourismDetail, setTourismDetail] = useState<TourismFullDetailDto | null>(null);
  const [roads, setRoads] = useState<RoadInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horseServices, setHorseServices] = useState<Record<number, HorseServiceSummaryDto[]>>({});
  const [expandedHorseServices, setExpandedHorseServices] = useState<Record<number, boolean>>({});
  const [loadingHorseServices, setLoadingHorseServices] = useState<Record<number, boolean>>({});
  
  // Map modal state
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<RoadInfoDto | null>(null);

  // Function to open map modal
  const openMapModal = (road: RoadInfoDto) => {
    setSelectedRoad(road);
    setMapModalOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      if (!tourismId) {
        setError("No tourism destination selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch tourism details
        const tourismData = await fetchTourismDetail(tourismId);
        setTourismDetail(tourismData);
        
        // Fetch roads
        const roadsData = await getRoadsByTourism(tourismId);
        setRoads(roadsData);
      } catch (err: any) {
        setError(err.message || "Failed to load road information");
        console.error("Data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tourismId]);

  // Function to toggle and load horse services for a road
  const toggleHorseServices = async (roadId: number) => {
    // If already expanded, just collapse
    if (expandedHorseServices[roadId]) {
      setExpandedHorseServices(prev => ({ ...prev, [roadId]: false }));
      return;
    }

    // If not loaded yet, fetch horse services
    if (!horseServices[roadId]) {
      setLoadingHorseServices(prev => ({ ...prev, [roadId]: true }));
      try {
        const services = await getHorseServicesByRoad(roadId);
        setHorseServices(prev => ({ ...prev, [roadId]: services }));
      } catch (err) {
        console.error("Failed to load horse services:", err);
        setHorseServices(prev => ({ ...prev, [roadId]: [] }));
      } finally {
        setLoadingHorseServices(prev => ({ ...prev, [roadId]: false }));
      }
    }

    // Expand the section
    setExpandedHorseServices(prev => ({ ...prev, [roadId]: true }));
  };

  const getRoadIcon = (roadType: string) => {
    const icons: Record<string, string> = {
      CAR: "🚗",
      FOOT: "🚶‍♂️",
      PLANE: "✈️",
      HORSE: "🐎"
    };
    return icons[roadType] || "🛤️";
  };

  const getRoadColor = (roadType: string) => {
    const colors: Record<string, string> = {
      CAR: "from-blue-500 via-blue-600 to-indigo-700",
      FOOT: "from-emerald-500 via-green-500 to-emerald-600",
      PLANE: "from-orange-400 via-orange-500 to-red-500",
      HORSE: "from-purple-500 via-pink-500 to-rose-500"
    };
    return colors[roadType] || "from-gray-400 to-gray-500";
  };

  const getRoadTypeLabel = (roadType: string) => {
    const labels: Record<string, string> = {
      CAR: "Drive",
      FOOT: "Walk",
      PLANE: "Fly",
      HORSE: "Ride"
    };
    return labels[roadType] || roadType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-8"></div>
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full animate-pulse blur-xl"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-emerald-600 bg-clip-text text-transparent">
              Loading Routes
            </h2>
            <p className="text-xl text-gray-600">Discovering the best paths to {tourismName}...</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/50 to-blue-50/30 overflow-x-hidden">
      <TopBar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Header */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-3xl font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-12"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {tourismName}
          </button>
          
          <div className="space-y-6">
            <div className="inline-block">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-blue-900 bg-clip-text text-transparent mb-6 leading-none">
                🛤️ Routes
              </h1>
            </div>
            <div className="max-w-3xl mx-auto">
              <p className="text-2xl md:text-3xl font-light text-gray-700 leading-tight">
                {roads.length} carefully planned routes to your dream destination
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-lg font-medium text-emerald-700">
              <span className="px-4 py-2 bg-emerald-100/80 backdrop-blur-sm rounded-2xl border border-emerald-200">
                🚗 {roads.filter(r => r.distanceByCar).length} Drive
              </span>
              <span className="px-4 py-2 bg-green-100/80 backdrop-blur-sm rounded-2xl border border-green-200">
                🚶 {roads.filter(r => r.distanceByFoot).length} Walk
              </span>
              <span className="px-4 py-2 bg-orange-100/80 backdrop-blur-sm rounded-2xl border border-orange-200">
                ✈️ {roads.filter(r => r.distanceByPlane).length} Fly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Error State */}
      {error && (
        <section className="max-w-4xl mx-auto px-6 py-32">
          <div className="bg-gradient-to-br from-red-50/80 to-pink-50/60 backdrop-blur-xl border border-red-200/50 rounded-3xl p-16 md:p-24 text-center shadow-2xl">
            <div className="text-8xl mb-8">🚫</div>
            <h2 className="text-4xl md:text-5xl font-black text-red-800 mb-6">No Routes Available</h2>
            <p className="text-2xl text-red-700 mb-12 max-w-2xl mx-auto leading-relaxed">
              {error}. Travel routes for {tourismName} are being prepared.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-12 py-6 rounded-3xl text-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl border-2 border-transparent hover:border-emerald-700"
              >
                ← Back to {tourismName}
              </button>
              <button className="bg-white/80 backdrop-blur-xl text-gray-800 px-12 py-6 rounded-3xl text-xl font-bold border-2 border-gray-300 hover:bg-white hover:shadow-2xl transition-all transform hover:scale-105">
                🌍 Explore Other Destinations
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Roads Grid */}
      {roads.length > 0 && (
        <section className="px-6 pb-32 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
              {roads.map((road, index) => (
                <article
                  key={road.id}
                  className="group relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl hover:shadow-3xl border border-white/60 overflow-hidden h-full transition-all duration-700 hover:-translate-y-6 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Animated Gradient Header */}
                  <div className={`h-64 lg:h-72 relative overflow-hidden bg-gradient-to-br ${getRoadColor(road.roadType)}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl">
                            <span className="text-3xl drop-shadow-lg">{getRoadIcon(road.roadType)}</span>
                          </div>
                          <div>
                            <h3 className="text-3xl lg:text-4xl font-black text-white drop-shadow-2xl">
                              {getRoadTypeLabel(road.roadType)}
                            </h3>
                            <p className="text-white/90 font-medium text-lg drop-shadow-lg">
                              {road.roadType}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-1">
                          {road.totalDistance?.toFixed(1) ?? '—'}
                        </div>
                        <p className="text-xl font-medium text-white/95 drop-shadow-lg">Total Distance</p>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-3xl animate-pulse" />
                  </div>

                  {/* Content Body */}
                  <div className="p-10 lg:p-12 relative">
                    {/* Route Info */}
                    <div className="flex items-start gap-4 mb-8 p-6 bg-gradient-to-r from-emerald-50/80 via-white/60 to-blue-50/60 backdrop-blur-xl rounded-3xl border border-emerald-100/50 shadow-lg">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-xl">
                        <span className="text-2xl">📍</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-1">Starting Point</p>
                        <p className="text-2xl lg:text-3xl font-black text-gray-900 truncate">
                          {road.initialPlace}
                        </p>
                        <p className="text-lg text-emerald-700 font-semibold">
                          → {tourismName}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {road.description && (
                      <div className="mb-10">
                        <p className="text-lg text-gray-700 leading-relaxed bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                          {road.description}
                        </p>
                      </div>
                    )}

                    {/* Interactive Distance Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
                      {road.distanceByCar && (
                        <DistanceCard icon="🚗" label="Drive" distance={road.distanceByCar} color="blue" />
                      )}
                      {road.distanceByFoot && (
                        <DistanceCard icon="🚶" label="Walk" distance={road.distanceByFoot} color="green" />
                      )}
                      {road.distanceByPlane && (
                        <DistanceCard icon="✈️" label="Fly" distance={road.distanceByPlane} color="orange" />
                      )}
                      {road.distanceByHorse && (
                        <DistanceCard icon="🐎" label="Ride" distance={road.distanceByHorse} color="purple" />
                      )}
                    </div>

                    {/* Premium Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-gray-100/50 bg-gradient-to-b from-white/50 to-transparent backdrop-blur-sm rounded-2xl p-6 -mx-6 lg:-mx-12 mb-6">
                      <button 
                        onClick={() => openMapModal(road)}
                        className="flex-1 group relative bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white py-5 px-8 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border-2 border-transparent hover:border-emerald-400"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          🗺️ View on Map
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -skew-x-12 transform -rotate-2 scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left" />
                      </button>
                      
                      <button 
                        onClick={() => toggleHorseServices(road.id)}
                        disabled={loadingHorseServices[road.id]}
                        className="px-8 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden border-2 border-transparent hover:border-purple-400 disabled:opacity-70 disabled:cursor-wait"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          🐎 Horse Services
                          {loadingHorseServices[road.id] ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <svg className={`w-5 h-5 transition-transform ${expandedHorseServices[road.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </span>
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/30 to-transparent rounded-2xl blur animate-pulse" />
                      </button>
                    </div>

                    {/* Horse Services Section */}
                    {expandedHorseServices[road.id] && (
                      <div className="mt-6 p-6 bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-rose-50/40 backdrop-blur-xl rounded-3xl border border-purple-200/50 shadow-xl animate-fadeIn">
                        <h4 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                          🐎 Available Horse Services
                        </h4>
                        
                        {horseServices[road.id]?.length > 0 ? (
                          <div className="grid gap-4">
                            {horseServices[road.id].map((service) => (
                              <div 
                                key={service.id}
                                className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-2xl">🐴</span>
                                      </div>
                                      <div>
                                        <h5 className="text-lg font-bold text-gray-900">{service.ownerName}</h5>
                                        <p className="text-sm text-purple-600 font-medium">📍 {service.initialPlace}</p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-3">
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                        📞 {service.contactInfo}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-3xl font-black text-purple-600">
                                      {service.cost.toLocaleString()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">ETB</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-5xl mb-4">🐎</div>
                            <p className="text-lg text-purple-700 font-medium">No horse services available for this route yet.</p>
                            <p className="text-sm text-gray-500 mt-2">Check back later for updates!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!error && !loading && roads.length === 0 && (
        <section className="max-w-5xl mx-auto px-6 py-40 text-center">
          <div className="relative mb-16">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-2xl p-8">
              <span className="text-6xl">🛤️</span>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 rounded-2xl animate-bounce" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-100 rounded-2xl animate-pulse" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8">
            No Routes Yet
          </h2>
          <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Road information for <span className="font-semibold text-emerald-700">{tourismName}</span> is being prepared. 
            Check back soon for the best travel routes!
          </p>
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-16 py-7 rounded-3xl text-2xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            >
              ← Back to Destination
            </button>
            <button className="bg-white/90 backdrop-blur-xl text-gray-800 px-16 py-7 rounded-3xl text-2xl font-bold border-2 border-gray-300 hover:bg-white hover:shadow-3xl hover:shadow-emerald-100 transition-all transform hover:scale-105 shadow-xl">
              🌍 Discover More Places
            </button>
          </div>
        </section>
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>

      {/* Road Map Modal */}
      {selectedRoad && tourismDetail && (
        <RoadMapModal
          key={`${tourismId}-${selectedRoad.id}`}
          isOpen={mapModalOpen}
          onClose={() => {
            setMapModalOpen(false);
            setSelectedRoad(null);
          }}
          road={selectedRoad}
          tourismName={tourismDetail.name}
          tourismWereda={tourismDetail.wereda}
          tourismKebele={tourismDetail.kebele}
          tourismLatitude={tourismDetail.latitude}
          tourismLongitude={tourismDetail.longitude}
        />
      )}
    </div>
  );
}

// Interactive Distance Card Component
export default function RoadDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <RoadDetailContent />
    </Suspense>
  );
}

function DistanceCard({ icon, label, distance, color }: { 
  icon: string; 
  label: string; 
  distance: number; 
  color: string 
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/80 to-transparent backdrop-blur-xl border border-white/60 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-28 flex flex-col justify-center hover:border-gray-200">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -rotate-3 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-2xl mb-1">{icon}</span>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent drop-shadow-lg">
            {distance.toFixed(1)}
          </p>
          <span className="text-xs font-medium text-gray-500">km</span>
        </div>
      </div>
    </div>
  );
}
