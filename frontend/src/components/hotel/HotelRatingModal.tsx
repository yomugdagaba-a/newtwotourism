"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";

interface HotelRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: number;
  hotelName: string;
  onSubmit: (rating: number, comment: string) => void;
}

export default function HotelRatingModal({ isOpen, onClose, hotelId, hotelName, onSubmit }: HotelRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      setRatingError("Please select a rating between 1 and 5 stars.");
      return;
    }
    setRatingError("");
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      return (
        <span
          key={i}
          className={`text-3xl cursor-pointer ${starValue <= rating ? "text-yellow-400" : "text-gray-300"}`}
          onClick={() => setRating(starValue)}
        >
          ★
        </span>
      );
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 bg-white rounded-3xl max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Rate {hotelName}</h2>
        <div className="flex gap-2 mb-4 justify-center">{renderStars()}</div>
        {ratingError && <p className="text-red-600 text-sm font-semibold text-center mb-3">{ratingError}</p>}
        <textarea
          className="w-full border rounded-xl p-3 mb-4 text-gray-700"
          rows={4}
          placeholder="Write your comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
}
