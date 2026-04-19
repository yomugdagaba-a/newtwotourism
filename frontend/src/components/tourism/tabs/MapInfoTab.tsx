"use client";

interface Props {
  tourismId: number;
  latitude?: number | null;
  longitude?: number | null;
}

export default function MapInfoTab({ tourismId, latitude, longitude }: Props) {
  if (!latitude || !longitude) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No map coordinates available for this location.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-sm text-gray-600">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
    </div>
  );
}
