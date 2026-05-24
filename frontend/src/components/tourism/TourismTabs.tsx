"use client";

import { useState, useEffect } from "react";
import HotelsTab from "@/components/tourism/tabs/HotelsTab";
import RoadInfoTab from "@/components/tourism/tabs/RoadInfoTab";
import HorseServiceTab from "@/components/tourism/tabs/HorseServiceTab";
import MapInfoTab from "@/components/tourism/tabs/MapInfoTab";
import TourismRatingTab from "@/components/tourism/tabs/TourismRatingTab";
import { useTranslation } from "react-i18next";

interface Props {
  tourismId: number;
  forceActiveTab?: string;
}

export default function TourismTabs({ tourismId, forceActiveTab }: Props) {
  const { t } = useTranslation();

  const tabs = [
    { key: "Hotels",        label: t("nav.hotels") },
    { key: "Road Info",     label: t("road.roadInfo") },
    { key: "Horse Services",label: t("horse.horseServices") },
    { key: "Map Info",      label: t("map.interactiveMap") },
    { key: "Ratings",       label: t("tourism.ratings") },
  ];

  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);

  useEffect(() => {
    if (forceActiveTab && tabs.some((t) => t.key === forceActiveTab)) {
      setActiveTab(forceActiveTab);
    }
  }, [forceActiveTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Tab Menu */}
      <div className="flex overflow-x-auto space-x-1 border-b mb-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 font-medium whitespace-nowrap flex-shrink-0 text-sm ${
              activeTab === tab.key
                ? "border-b-2 border-green-700 text-green-700"
                : "text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "Hotels"         && <HotelsTab tourismId={tourismId} />}
        {activeTab === "Road Info"      && <RoadInfoTab tourismId={tourismId} />}
        {activeTab === "Horse Services" && <HorseServiceTab tourismId={tourismId} />}
        {activeTab === "Map Info"       && <MapInfoTab tourismId={tourismId} />}
        {activeTab === "Ratings"        && <TourismRatingTab tourismId={tourismId} />}
      </div>
    </div>
  );
}
