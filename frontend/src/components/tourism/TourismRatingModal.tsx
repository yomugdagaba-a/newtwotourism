"use client";

import { useState } from "react";
import Modal from "@/components/common/Modal";
import { useTranslation } from "react-i18next";

interface TourismRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  title?: string;
}

export default function TourismRatingModal({
  isOpen,
  onClose,
  onSubmit,
  title = "this place",
}: TourismRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const { t } = useTranslation();

  const handleStarClick = (value: number) => { setRating(value); setRatingError(""); };

  const handleSubmit = () => {
    if (rating === 0) {
      setRatingError(t("tourism.writeReview"));
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
    setRatingError("");
  };

  const handleCancel = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="bg-white rounded-3xl p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">{t("tourism.writeReview")} — {title}</h2>

        {/* Star Rating */}
        <div className="flex justify-center mb-2 text-yellow-400 text-4xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
              onClick={() => handleStarClick(star)}
            >
              ★
            </span>
          ))}
        </div>
        {ratingError && <p className="text-red-600 text-sm font-semibold text-center mb-3">{ratingError}</p>}

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("booking.writeMessage")}
          className="w-full border border-gray-300 rounded-xl p-3 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
          rows={4}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-semibold"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition font-semibold"
          >
            {t("common.submit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
