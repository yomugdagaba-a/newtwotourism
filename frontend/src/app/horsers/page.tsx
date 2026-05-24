"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HorseServiceSummaryDto } from "@/types/horse";
import { getHorseServicesByTourism, getHorseServicesByRoad } from "@/services/horse.service";
import { useAuthStore } from "@/store/useAuthStore";
import AvatarDropdown from "@/components/common/AvatarDropdown";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

function HorsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuthStore.getState();
  const { t } = useTranslation();

  const tourismIdParam = searchParams.get("tourismId");
  const roadIdParam = searchParams.get("roadId");

  const tourismId = tourismIdParam ? Number(tourismIdParam) : undefined;
  const roadId = roadIdParam ? Number(roadIdParam) : undefined;

  const [horseServices, setHorseServices] = useState<HorseServiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<{ show: boolean; phone: string; serviceId: number }>({ 
    show: false, 
    phone: '', 
    serviceId: 0 
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  const handleCopy = (serviceId: number, phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedId(serviceId);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  const handleCallClick = (serviceId: number, phoneNumber: string) => {
    setShowPhoneModal({ show: true, phone: phoneNumber, serviceId });
  };

  const closePhoneModal = () => {
    setShowPhoneModal({ show: false, phone: '', serviceId: 0 });
    setCopiedId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal sticky top bar */}
      <div className="sticky top-0 z-30 flex items-center h-12 px-2 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => router.back()}
          className="h-8 w-8 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="ml-1 text-gray-900 font-bold text-sm">{t("horse.horseServices")}</span>
        {!loading && !error && (
          <span className="ml-2 text-gray-400 text-sm font-semibold">
            · {horseServices.length} {horseServices.length === 1 ? t("horse.horseServices") : t("horse.horseServices")}
          </span>
        )}
        {/* Avatar — top right */}
        <div className="flex-1" />
        <AvatarDropdown />
      </div>

      <div className="px-4 md:px-6 py-4">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">{t("common.loading")}</p>
          </div>
        )

        /* Error State */
        : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )

        /* Empty State */
        : horseServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-sm">No horse services available for this route yet.</p>
          </div>
        )

        /* Services Grid */
        : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {horseServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🐴</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-gray-900 truncate">{service.ownerName}</h3>
                    <p className="text-xs text-gray-400">Horse Service</p>
                  </div>
                </div>

                {/* Info — column format like roads */}
                <div className="px-4 py-3 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1.5">Service Info</p>
                    <div className="space-y-1">
                      {service.initialPlace && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm font-semibold text-gray-600">Initial Place</span>
                          <span className="text-sm font-black text-gray-900">{service.initialPlace}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-semibold text-gray-600">Contact</span>
                        <span className="text-sm font-black text-gray-900">{service.contactInfo}</span>
                      </div>
                      {service.cost && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm font-semibold text-gray-600">Price</span>
                          <span className="text-sm font-black text-green-700">{service.cost.toLocaleString()} ETB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons pushed to bottom */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() => handleCallClick(service.id, service.contactInfo)}
                      className="flex-1 bg-white text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors border border-blue-200"
                    >
                      {t("common.contactUs")}
                    </button>
                    <button
                      disabled
                      className="flex-1 bg-white text-gray-400 py-2 rounded-lg font-normal text-sm cursor-not-allowed border border-gray-200"
                      title="Booking not available"
                    >
                      {t("horse.bookHorse")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t("common.contactUs")}</h3>
              <button
                onClick={closePhoneModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 flex-1">{showPhoneModal.phone}</span>
                <button
                  onClick={() => handleCopy(showPhoneModal.serviceId, showPhoneModal.phone)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  {copiedId === showPhoneModal.serviceId ? '✓ ' + t("common.ok") : t("common.ok")}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center mb-4">
              Use the Copy button to copy the number, then dial it from your phone.
            </p>

            <button
              onClick={closePhoneModal}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HorsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div></div>}>
      <HorsersContent />
    </Suspense>
  );
}
