"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

export interface Rating {
  id?: number;
  username?: string;
  fullName?: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

interface RatingsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchUrl: string;
  title?: string;
  token?: string;
  refreshKey?: number;
}

export default function RatingsViewModal({
  isOpen,
  onClose,
  fetchUrl,
  title = "Ratings",
  token,
  refreshKey,
}: RatingsViewModalProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) throw new Error("Failed to fetch ratings");
        const data = await res.json();
        setRatings(data || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Error fetching ratings";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [isOpen, fetchUrl, token, refreshKey]);

  const getDisplayName = (r: Rating): string => {
    return r.userFullName || r.fullName || r.username || "Anonymous";
  };

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
        
        {error && <p className="text-red-600 text-center py-4">{error}</p>}
        
        {!loading && !error && ratings.length === 0 && (
          <p className="text-center text-gray-600 py-8">No ratings yet. Be the first to rate!</p>
        )}

        {!loading && ratings.length > 0 && (
          <div className="space-y-4">
            {ratings.map((r, i) => (
              <div key={r.id || i} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">{getDisplayName(r)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-lg">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    <span className="text-sm text-gray-500">{r.rating}/5</span>
                  </div>
                </div>
                {r.comment && <p className="text-gray-700 mb-2">{r.comment}</p>}
                {r.createdAt && (
                  <span className="text-sm text-gray-400">{formatDate(r.createdAt)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
