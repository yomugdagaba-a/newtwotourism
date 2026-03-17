"use client";

import { useAuthStore, BrowsingMode } from "@/store/useAuthStore";

interface ModeSwitcherProps {
  className?: string;
}

export default function ModeSwitcher({ className = "" }: ModeSwitcherProps) {
  const { role, browsingMode, setBrowsingMode } = useAuthStore();

  // Only show for HOTEL_OWNER
  if (role !== "HOTEL_OWNER") return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 font-medium">Mode:</span>
      <div className="flex bg-gray-200 rounded-lg p-1 border border-gray-300">
        <button
          onClick={() => setBrowsingMode("CLIENT")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            browsingMode === "CLIENT"
              ? "bg-emerald-500 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          👤 Client
        </button>
        <button
          onClick={() => setBrowsingMode("OWNER")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            browsingMode === "OWNER"
              ? "bg-orange-500 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          🏨 Owner
        </button>
      </div>
    </div>
  );
}

// Compact version for mobile/smaller spaces
export function ModeSwitcherCompact({ className = "" }: ModeSwitcherProps) {
  const { role, browsingMode, setBrowsingMode } = useAuthStore();

  if (role !== "HOTEL_OWNER") return null;

  const toggleMode = () => {
    setBrowsingMode(browsingMode === "CLIENT" ? "OWNER" : "CLIENT");
  };

  return (
    <button
      onClick={toggleMode}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
        browsingMode === "OWNER"
          ? "bg-orange-100 text-orange-700 border border-orange-400"
          : "bg-emerald-100 text-emerald-700 border border-emerald-400"
      } ${className}`}
    >
      <span>{browsingMode === "OWNER" ? "🏨" : "👤"}</span>
      <span className="text-sm font-medium">
        {browsingMode === "OWNER" ? "Owner Mode" : "Client Mode"}
      </span>
      <span className="text-xs text-gray-500">tap to switch</span>
    </button>
  );
}
