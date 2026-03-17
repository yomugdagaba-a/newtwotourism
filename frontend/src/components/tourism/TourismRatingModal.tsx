"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";

interface TourismRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title?: string; // ✅ Title prop for hotel or tourism name
}

export default function TourismRatingModal({
  isOpen,
  onClose,
  onSubmit,
  title = "this place",
}: TourismRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleStarClick = (value: number) => setRating(value);

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
  };

  const handleCancel = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="bg-white rounded-3xl p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Rate {title}</h2>
        
        {/* Star Rating */}
        <div className="flex justify-center mb-6 text-yellow-400 text-4xl">
          {[1,2,3,4,5].map((star) => (
            <span
              key={star}
              className={`cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
              onClick={() => handleStarClick(star)}
            >
              ★
            </span>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comments..."
          className="w-full border border-gray-300 rounded-xl p-3 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
          rows={4}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition font-semibold"
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
}
