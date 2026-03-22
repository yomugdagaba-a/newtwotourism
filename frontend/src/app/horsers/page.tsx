"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { HorseServiceSummaryDto } from "@/types/horse";
import { getHorseServicesByTourism, getHorseServicesByRoad } from "@/services/horse.service";
import { useAuthStore } from "@/store/useAuthStore";
import HorseBookingModal from "@/components/horse/HorseBookingModal";

export default function HorsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore.getState();

  const tourismIdParam = searchParams.get("tourismId");
  const roadIdParam = searchParams.get("roadId");

  const tourismId = tourismIdParam ? Number(tourismIdParam) : undefined;
  const roadId = roadIdParam ? Number(roadIdParam) : undefined;

  const [horseServices, setHorseServices] = useState<HorseServiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    serviceId: number;
    ownerName?: string;
  }>({ open: false, serviceId: 0 });

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        let services: HorseServiceSummaryDto[] = [];
        
        if (roadId) {
          services = await getHorseServicesByRoad(roadId, token ?? undefined);
        } else if (tourismId) {
          services = await getHorseServicesByTourism(tourismId, token ?? undefined);
        } else {
          throw new Error("Missing roadId or tourismId");
        }
        
        setHorseServices(services);
      } catch (err: any) {
        console.error("Horse services load failed:", err);
        setError("Services temporarily unavailable. Please try calling providers directly.");
        setHorseServices([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, [roadId, tourismId, token]);

  const openBookingModal = (serviceId: number, ownerName?: string) => {
    setBookingModal({ open: true, serviceId, ownerName });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-emerald-50">
      <TopBar />
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-lg transition-all hover:scale-105"
        >
          ← Back to Routes
        </button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-600 bg-clip-text text-transparent">
              Horse Services
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            {roadId 
              ? `Premium horse rental services available along this route` 
              : `Professional horse services for your adventure`
            }
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-8 shadow-xl"></div>
            <p className="text-2xl font-semibold text-gray-600">Loading trusted horse providers...</p>
          </div>
        ) 

        /* Error State */
        : error ? (
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-12 text-center shadow-2xl">
            <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            </div>
            <h2 className="text-3xl font-bold text-red-800 mb-4">Services Unavailable</h2>
            <p className="text-xl text-red-700 mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              Retry Loading
            </button>
          </div>
        )

        /* Empty State */
        : horseServices.length === 0 ? (
          <div className="text-center py-32 max-w-2xl mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">No Services Available</h2>
            <p className="text-2xl text-gray-600 mb-8 leading-relaxed">
              {roadId 
                ? "No horse rental services for this route yet. Check back soon!" 
                : "No horse services available for this destination yet."
              }
            </p>
            <p className="text-lg text-gray-500 mb-12">We're working to bring you more options daily!</p>
          </div>
        )

        /* Services Grid */
        : (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <p className="text-2xl font-bold text-gray-900">
                Found <span className="text-purple-600">{horseServices.length}</span> 
                {horseServices.length === 1 ? "service" : "services"}
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {horseServices.map((service) => (
                <div
                  key={service.id}
                  className="group bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 border border-white/60 h-full"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-3xl font-black text-gray-900 truncate mb-2 group-hover:text-purple-600 transition-colors">{service.ownerName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">📍 Initial Place:</span>
                        <span className="truncate">{service.initialPlace ?? "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-6 mb-8">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-xl font-bold text-white">ETB</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Price</p>
                          <p className="text-4xl font-black text-emerald-600">
                            {service.cost?.toLocaleString() ?? "N/A"} <span className="text-2xl text-emerald-700">ETB</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">Contact</p>
                          <p className="text-lg font-semibold text-gray-900 truncate" title={service.contactInfo}>
                            {service.contactInfo}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <a
                      href={`tel:${service.contactInfo}`}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl text-center font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Call Now
                    </a>
                    <button 
                      onClick={() => openBookingModal(service.id, service.ownerName)}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Modal */}
        <HorseBookingModal
          open={bookingModal.open}
          onClose={() => setBookingModal({ open: false, serviceId: 0 })}
          serviceId={bookingModal.serviceId}
          ownerName={bookingModal.ownerName}
        />
      </div>
    </div>
  );
}
