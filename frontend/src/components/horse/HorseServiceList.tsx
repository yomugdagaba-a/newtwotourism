"use client";

import { useEffect, useState } from "react";
import { HorseServiceSummaryDto } from "@/types/horse";
import { getHorseServicesByTourism, getHorseServicesByRoad } from "@/services/horse.service";
import Button from "@/components/common/Button";

interface Props {
  tourismPlaceId?: number;
  roadInfoId?: number;
  token?: string;
}

const HorseServiceList: React.FC<Props> = ({ tourismPlaceId, roadInfoId, token }) => {
  const [services, setServices] = useState<HorseServiceSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        let result: HorseServiceSummaryDto[] = [];

        if (tourismPlaceId !== undefined) {
          result = await getHorseServicesByTourism(tourismPlaceId, token);
        } else if (roadInfoId !== undefined) {
          result = await getHorseServicesByRoad(roadInfoId, token);
        }

        if (active) setServices(result ?? []);
      } catch (err) {
        console.error("Failed to load horse services:", err);
        if (active) setServices([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [tourismPlaceId, roadInfoId, token]);

  if (loading) return <div className="text-gray-600">Loading horse services...</div>;
  if (!services.length) return <div className="text-gray-500">No horse services available.</div>;

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <div
          key={service.id}
          className="border rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg truncate">{service.ownerName}</h4>
            {service.initialPlace && (
              <p className="text-sm text-gray-600">Location: {service.initialPlace}</p>
            )}
            {service.contactInfo && (
              <p className="text-sm">
                Contact:{" "}
                <a className="text-emerald-600 hover:underline" href={`tel:${service.contactInfo}`}>
                  {service.contactInfo}
                </a>
              </p>
            )}
            {typeof service.cost === "number" && (
              <p className="text-sm font-semibold mt-2">
                Cost: <span className="text-lg">{service.cost.toLocaleString()} ETB</span>
              </p>
            )}
          </div>

          <div className="flex-shrink-0 flex gap-3">
            {service.contactInfo && (
              <a
                href={`tel:${service.contactInfo}`}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                📞 Call
              </a>
            )}

            <Button onClick={() => window.open(`tel:${service.contactInfo}`)}>
              Book Horse
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HorseServiceList;
