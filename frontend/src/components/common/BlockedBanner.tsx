"use client";

// Detects security-related error messages from the backend and renders
// a styled, informative banner instead of a plain red error text.

interface Props {
  message: string;
  onClose?: () => void;
}

type BannerType = "ip_blocked" | "account_locked" | "account_inactive" | "too_many_attempts" | "generic_error";

function classify(message: string): BannerType {
  const m = message.toLowerCase();
  if (m.includes("ip address") || m.includes("too many requests from this ip")) return "ip_blocked";
  if (m.includes("temporarily locked") || m.includes("account is locked") || m.includes("account locked")) return "account_locked";
  if (m.includes("inactive") || m.includes("deactivated") || m.includes("blocked")) return "account_inactive";
  if (m.includes("too many failed") || m.includes("too many attempts")) return "too_many_attempts";
  return "generic_error";
}

const CONFIGS: Record<BannerType, { icon: string; title: string; color: string; bg: string; border: string; text: string }> = {
  ip_blocked: {
    icon: "🚫",
    title: "Your device is temporarily blocked",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
  },
  account_locked: {
    icon: "🔒",
    title: "Account temporarily locked",
    color: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
  },
  account_inactive: {
    icon: "⛔",
    title: "Account deactivated",
    color: "text-red-900",
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-800",
  },
  too_many_attempts: {
    icon: "⚠️",
    title: "Too many attempts",
    color: "text-yellow-800",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
  },
  generic_error: {
    icon: "❌",
    title: "Error",
    color: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
  },
};

// Extra help text for specific cases
const HELP: Partial<Record<BannerType, string>> = {
  ip_blocked: "Multiple failed login attempts were detected from your device. Please wait a few minutes before trying again.",
  account_locked: "Your account has been locked due to multiple failed login attempts. It will unlock automatically. You can also reset your password.",
  account_inactive: "Your account has been deactivated by an administrator. Please contact support for assistance.",
  too_many_attempts: "Please wait a moment before trying again.",
};

export default function BlockedBanner({ message, onClose }: Props) {
  const type = classify(message);
  const cfg = CONFIGS[type];
  const help = HELP[type];

  return (
    <div className={`rounded-xl border-2 ${cfg.bg} ${cfg.border} p-4 flex gap-3`}>
      <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${cfg.color}`}>{cfg.title}</p>
        <p className={`text-sm font-semibold mt-0.5 ${cfg.text}`}>{message}</p>
        {help && type !== "generic_error" && (
          <p className={`text-xs mt-1.5 font-medium ${cfg.text} opacity-80`}>{help}</p>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className={`flex-shrink-0 ${cfg.text} hover:opacity-70 transition-opacity`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
