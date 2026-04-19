"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL } from "@/services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "profile" | "update" | "password" | "help" | "privacy" | "about";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile Information" },
  { id: "update", label: "Update Profile" },
  { id: "password", label: "Change Password" },
  { id: "help", label: "Help & Support" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "about", label: "About" },
];

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  roles: { name: string }[];
}

export default function ProfileModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { username, role, userId, token } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoadingProfile(true);
      fetch(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setProfile(data))
        .catch(() => setProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-white font-semibold">{username}</p>
              <p className="text-blue-200 text-xs">{role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 border-r border-gray-100 py-3 bg-gray-50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2.5 text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingProfile && activeTab === "profile" ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>
            ) : (
              <>
                {activeTab === "profile" && <ProfileInfo profile={profile} role={role} />}
                {activeTab === "update" && <UpdateProfile profile={profile} token={token} onUpdated={setProfile} />}
                {activeTab === "password" && <ChangePassword token={token} />}
                {activeTab === "help" && <HelpSupport />}
                {activeTab === "privacy" && <PrivacySecurity />}
                {activeTab === "about" && <About />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Info ──────────────────────────────────────────────
function ProfileInfo({ profile, role }: { profile: UserProfile | null; role: string | null }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {profile?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{profile?.fullName || "—"}</p>
          <p className="text-sm text-gray-500">@{profile?.username || "—"}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{role}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Username" value={profile?.username || "—"} />
        <InfoCard label="Full Name" value={profile?.fullName || "—"} />
        <InfoCard label="Email" value={profile?.email || "—"} />
        <InfoCard label="User ID" value={profile?.id ? `#${profile.id}` : "—"} />
        <InfoCard label="Account Status" value={profile?.active ? "Active" : "Inactive"} valueClass={profile?.active ? "text-green-600" : "text-red-500"} />
        <InfoCard label="Email Verified" value={profile?.emailVerified ? "Verified" : "Not Verified"} valueClass={profile?.emailVerified ? "text-green-600" : "text-yellow-600"} />
        <InfoCard label="Role" value={role || "—"} />
        <InfoCard label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} />
      </div>
    </div>
  );
}

function InfoCard({ label, value, valueClass = "text-gray-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold truncate ${valueClass}`}>{value}</p>
    </div>
  );
}

// ── Update Profile ────────────────────────────────────────────
function UpdateProfile({
  profile,
  token,
  onUpdated,
}: {
  profile: UserProfile | null;
  token: string | null;
  onUpdated: (p: UserProfile) => void;
}) {
  const [form, setForm] = useState({ username: "", fullName: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Pre-fill when profile loads
  useEffect(() => {
    if (profile) {
      setForm({ username: profile.username || "", fullName: profile.fullName || "", email: profile.email || "" });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.username.trim()) {
      setStatus("error");
      setMessage("Username cannot be empty.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onUpdated(updated);
      setStatus("success");
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Update failed.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Update Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Username"
          type="text"
          value={form.username}
          onChange={(v) => setForm({ ...form, username: v })}
          placeholder="Enter your username"
        />
        <FormField
          label="Full Name"
          type="text"
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          placeholder="Enter your full name"
        />
        <FormField
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="Enter your email"
        />
        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {status === "loading" ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

// ── Change Password ───────────────────────────────────────────
function ChangePassword({ token }: { token: string | null }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setStatus("error");
      setMessage("New passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (!token) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setMessage("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to change password.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Current Password" type="password" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} placeholder="Enter current password" />
        <FormField label="New Password" type="password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} placeholder="Min. 8 characters" />
        <FormField label="Confirm New Password" type="password" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} placeholder="Repeat new password" />
        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>{message}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {status === "loading" ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

// ── Help & Support ────────────────────────────────────────────
function HelpSupport() {
  const faqs = [
    { q: "How do I book a hotel?", a: "Browse hotels, select your dates, and click 'Book Now'. You'll receive a confirmation email." },
    { q: "How do I cancel a booking?", a: "Go to 'My Bookings', find your booking, and click 'Cancel'. Cancellation policies vary by hotel." },
    { q: "How do I contact a hotel owner?", a: "Visit the hotel page and use the contact details provided by the owner." },
    { q: "Is my payment information secure?", a: "Yes, all transactions are encrypted and processed securely." },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Help & Support</h2>
      <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Contact Support</p>
          <p className="text-xs text-gray-600 mt-0.5">support@northwollotourism.com</p>
          <p className="text-xs text-gray-500 mt-1">We typically respond within 24 hours.</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Frequently Asked Questions</p>
        {faqs.map((faq, i) => (
          <details key={i} className="group border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 text-sm font-medium text-gray-800 cursor-pointer list-none flex justify-between items-center hover:bg-gray-50 rounded-lg">
              {faq.q}
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="px-4 pb-3 text-sm text-gray-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// ── Privacy & Security ────────────────────────────────────────
function PrivacySecurity() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
      <div className="space-y-3">
        <SecurityItem title="Two-Factor Authentication" desc="Add an extra layer of security to your account." badge="Coming Soon" />
        <SecurityItem title="Login Activity" desc="Review recent login sessions and devices." badge="Coming Soon" />
        <SecurityItem title="Delete Account" desc="Permanently delete your account and all associated data." badge="Contact Support" badgeClass="bg-red-100 text-red-700" />
      </div>
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-semibold text-gray-800 mb-2">Data Privacy</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          North Wollo Tourism collects only the data necessary to provide our services. We never sell your personal information to third parties. Your data is stored securely and you can request deletion at any time.
        </p>
      </div>
    </div>
  );
}

function SecurityItem({ title, desc, badge, badgeClass = "bg-gray-100 text-gray-600" }: { title: string; desc: string; badge: string; badgeClass?: string }) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-3 ${badgeClass}`}>{badge}</span>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────
function About() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">About</h2>
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">NW</div>
        <div>
          <p className="text-lg font-bold text-gray-900">North Wollo Tourism</p>
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        North Wollo Tourism is a platform dedicated to showcasing the rich cultural heritage, natural wonders, and hospitality of the North Wollo region in Ethiopia. Discover ancient churches, breathtaking highlands, mysterious caverns, and vibrant local culture.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">100+</p>
          <p className="text-xs text-gray-500 mt-1">Tourism Sites</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">50+</p>
          <p className="text-xs text-gray-500 mt-1">Partner Hotels</p>
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
        <p>© 2026 North Wollo Tourism. All rights reserved.</p>
        <p>Built with Next.js, NestJS & PostgreSQL</p>
      </div>
    </div>
  );
}

// ── Shared FormField ──────────────────────────────────────────
function FormField({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-all ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
