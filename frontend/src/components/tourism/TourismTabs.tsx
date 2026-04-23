"use client";

import { useState, useEffect } from "react";
import HotelsTab from "@/components/tourism/tabs/HotelsTab";
import RoadInfoTab from "@/components/tourism/tabs/RoadInfoTab";
import HorseServiceTab from "@/components/tourism/tabs/HorseServiceTab";
import MapInfoTab from "@/components/tourism/tabs/MapInfoTab";
import TourismRatingTab from "@/components/tourism/tabs/TourismRatingTab";

interface Props {
  tourismId: number;
  // Optional: parent can force/change the active tab
  forceActiveTab?: string;
}

export default function TourismTabs({ tourismId, forceActiveTab }: Props) {
  const tabs = ["Hotels", "Road Info", "Horse Services", "Map Info", "Ratings"];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);

  useEffect(() => {
    if (forceActiveTab && tabs.includes(forceActiveTab)) {
      setActiveTab(forceActiveTab);
    }
  }, [forceActiveTab]);

  return (
    <div>
      {/* Tab Menu */}
      <div className="flex overflow-x-auto space-x-1 border-b mb-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 font-medium whitespace-nowrap flex-shrink-0 text-sm ${
              activeTab === tab ? "border-b-2 border-green-700 text-green-700" : "text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "Hotels" && <HotelsTab tourismId={tourismId} />}
        {activeTab === "Road Info" && <RoadInfoTab tourismId={tourismId} />}
        {activeTab === "Horse Services" && <HorseServiceTab tourismId={tourismId} />}
        {activeTab === "Map Info" && <MapInfoTab tourismId={tourismId} />}
        {activeTab === "Ratings" && <TourismRatingTab tourismId={tourismId} />}
      </div>
    </div>
  );
}
