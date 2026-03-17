"use client";

import { useEffect, useState } from "react";

interface TourismCard {
  id: number;
  name: string;
  imageUrl: string;
}

export default function HorizontalScroll() {
  const [tourisms, setTourisms] = useState<TourismCard[]>([]);

  useEffect(() => {
    // TODO: Replace with API call to fetch top tourism places
    setTourisms([
      { id: 1, name: "Heritage Site", imageUrl: "/images/tourism1.jpg" },
      { id: 2, name: "Highland View", imageUrl: "/images/tourism2.jpg" },
      { id: 3, name: "Aquatic Paradise", imageUrl: "/images/tourism3.jpg" },
      { id: 4, name: "Cultural Center", imageUrl: "/images/tourism4.jpg" },
    ]);
  }, []);

  return (
    <div className="flex overflow-x-auto gap-4 py-2 scrollbar-hide">
      {tourisms.map((tourism) => (
        <div
          key={tourism.id}
          className="min-w-[200px] md:min-w-[250px] flex-shrink-0 cursor-pointer hover:scale-105 transition"
        >
          <img
            src={tourism.imageUrl}
            alt={tourism.name}
            className="w-full h-44 md:h-56 object-cover rounded-lg shadow-md"
          />
          <h3 className="mt-2 text-lg font-semibold text-center">
            {tourism.name}
          </h3>
        </div>
      ))}
    </div>
  );
}
