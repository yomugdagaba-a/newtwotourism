"use client";

import { useEffect, useState } from "react";
import { submitTourismRating, fetchTourismRatings, TourismRatingResponse } from "@/services/rating.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/common/Toast";

interface Props {
  tourismId: number;
}

export default function TourismRatingTab({ tourismId }: Props) {
  const { token, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const [ratings, setRatings] = useState<TourismRatingResponse[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRatings = async () => {
    try {
      const data = await fetchTourismRatings(tourismId, token ?? undefined);
      setRatings(data);
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [tourismId]);

  const handleAddRating = async () => {
    if (!isAuthenticated || !token) {
      toast.warning("Please log in to submit a rating.");
      return;
    }
    
    try {
      setLoading(true);
      await submitTourismRating(tourismId, newRating, comment || undefined, token);
      setComment("");
      setNewRating(5);
      await loadRatings();
      toast.success("Rating submitted successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit rating";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Rating */}
      <div className="border p-4 rounded-md shadow-sm">
        <h3 className="font-semibold mb-2">Add Your Rating</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={5}
            value={newRating}
            onChange={e => setNewRating(Number(e.target.value))}
            className="border rounded px-2 py-1 w-16"
          />
          <input
            type="text"
            placeholder="Comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <button 
            onClick={handleAddRating} 
            disabled={loading}
            className="bg-green-700 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {ratings.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No ratings yet. Be the first to rate!</p>
      ) : (
        ratings.map(r => (
          <div key={r.id} className="border p-2 rounded-md shadow-sm">
            <p className="font-semibold">{r.userFullName}</p>
            <p>Rating: {r.rating}/5</p>
            {r.comment && <p className="text-gray-600">{r.comment}</p>}
            {r.createdAt && (
              <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
