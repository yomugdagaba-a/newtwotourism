"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useTranslation } from "react-i18next";

export interface Rating {
  id?: number;
  username?: string;
  fullName?: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  user?: {
    username?: string;
    fullName?: string;
  };
}

interface RatingsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchUrl: string;
  title?: string;
  token?: string;
  refreshKey?: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function RatingsViewModal({
  isOpen,
  onClose,
  fetchUrl,
  title = "Reviews",
  token,
  refreshKey,
}: RatingsViewModalProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const loadRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) throw new Error("Failed to fetch ratings");
        const data = await res.json();
        setRatings(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error fetching ratings");
      } finally {
        setLoading(false);
      }
    };
    loadRatings();
  }, [isOpen, fetchUrl, token, refreshKey]);

  const getDisplayName = (r: Rating): string =>
    r.user?.username || r.user?.fullName || r.userFullName || r.fullName || r.username || "Anonymous";

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("tourism.ratings")}</p>
        </div>

        {/* Summary bar */}
        {!loading && ratings.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-5">
            <div className="text-center">
              <div className="text-4xl font-black text-yellow-500 leading-none">
                {avgRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400 font-semibold mt-1">{t("hotel.rating")}</div>
            </div>
            <div className="flex-1">
              <StarRow rating={Math.round(avgRating)} />
              <p className="text-sm text-gray-500 font-semibold mt-1">
                {t("tourism.ratings")} ({ratings.length})
              </p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto space-y-4">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-center text-red-500 text-sm py-6">{error}</p>
          )}

          {!loading && !error && ratings.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-500 font-semibold text-sm">{t("common.noResults")}</p>
              <p className="text-gray-400 text-xs mt-1">{t("tourism.writeReview")}</p>
            </div>
          )}

          {!loading &&
            ratings.map((r, i) => (
              <div
                key={r.id || i}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                {/* Reviewer row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-600 text-sm flex-shrink-0">
                      {getDisplayName(r).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-sm leading-none">
                        {getDisplayName(r)}
                      </p>
                      {r.createdAt && (
                        <p className="text-gray-400 text-xs mt-0.5">{formatDate(r.createdAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StarRow rating={r.rating} />
                    <span className="text-xs font-black text-gray-600">{r.rating}/5</span>
                  </div>
                </div>

                {/* Comment */}
                {r.comment && (
                  <p className="text-gray-600 text-sm leading-relaxed mt-2 pl-11">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
