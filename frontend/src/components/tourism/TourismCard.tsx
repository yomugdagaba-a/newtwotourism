"use client";

import React from "react";
import { TourismPublicCard } from "@/types/tourism";
import { getImageUrl } from "@/utils/imageUrl";

interface Props {
  tourism: TourismPublicCard;
  onClick?: (id: number) => void;
}

const TourismCard: React.FC<Props> = ({ tourism, onClick }) => {
  // ✅ ID Validation - Prevent 404 errors
  const handleClick = () => {
    if (!tourism.id || tourism.id <= 0) {
      console.error(`Invalid ID clicked: ${tourism.id} (${tourism.name})`);
      return;
    }
    console.log(`TourismCard clicked: "${tourism.name}" (ID: ${tourism.id})`);
    onClick?.(tourism.id);
  };

  return (
    <div
      className="w-full max-w-sm bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 overflow-hidden group relative z-0 hover:-translate-y-2 h-full flex flex-col"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Image Section - Enhanced */}
      <div className="relative h-64 flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group-hover:brightness-105 transition-all duration-500">
        {tourism.imageUrl ? (
          <img
            src={getImageUrl(tourism.imageUrl)}
            alt={`${tourism.name} (${tourism.category || "Tourism Place"})`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/tourism1.jpg";
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-gray-500 text-sm font-medium block">No image available</span>
            </div>
          </div>
        )}
        
        {/* ID Debug Badge - Development only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            ID: {tourism.id}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        {/* Title & Viewers */}
        <div>
          <h3 className="font-black text-2xl text-gray-900 mb-3 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {tourism.name}
          </h3>
          
          {tourism.category && (
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold mb-4">
              {tourism.category}
            </span>
          )}

          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span>{tourism.viewersCount?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Location & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <span className="text-sm text-gray-500 font-medium">
            {tourism.kebele ? `${tourism.kebele}, ` : ""}{tourism.wereda || "North Wollo"}
          </span>
          <div className="flex items-center space-x-2 text-sm text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
            <span>Explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourismCard;
