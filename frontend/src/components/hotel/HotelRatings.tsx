// frontend/src/components/hotel/HotelRatings.tsx
"use client";

import { HotelRatingResponseDto } from "@/types/hotel";

interface Props {
  ratings: HotelRatingResponseDto[];
  averageRating: number;
}

const HotelRatings: React.FC<Props> = ({ ratings, averageRating }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Average Rating: {averageRating.toFixed(1)}★</h3>
      {ratings.length === 0 && <p>No ratings yet.</p>}
      {ratings.map(r => (
        <div key={r.id} className="border rounded p-3 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold">{r.fullName || r.username}</span>
            <span className="text-yellow-500">{r.rating}★</span>
          </div>
          {r.comment && <p>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
};

export default HotelRatings;
