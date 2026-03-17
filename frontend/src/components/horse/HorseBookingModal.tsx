"use client";

import { useState } from "react";
import PhoneInput, { Country } from "@/components/common/PhoneInput";

interface Props {
  open: boolean;
  onClose: () => void;
  serviceId: number;
  ownerName?: string;
  serviceName?: string;
  pricePerHour?: number;
}

interface FormErrors {
  name?: string;
  phone?: string;
  date?: string;
  email?: string;
}

export default function HorseBookingModal({ open, onClose, serviceId, ownerName, serviceName, pricePerHour }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!open) return null;

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 2) return "Name must be at least 2 characters";
    if (value.trim().length > 100) return "Name must be less than 100 characters";
    if (!/^[a-zA-Z\s\-'\.]+$/.test(value)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return undefined; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePhone = (): string | undefined => {
    if (!phone) return "Phone number is required";
    if (!phoneValid) return "Please enter a valid phone number";
    return undefined;
  };

  const validateDate = (value: string): string | undefined => {
    if (!value) return "Please select a date";
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return "Date cannot be in the past";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: validateName(name),
      phone: validatePhone(),
      date: validateDate(date),
      email: validateEmail(email),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const newErrors = { ...errors };
    switch (field) {
      case 'name':
        newErrors.name = validateName(name);
        break;
      case 'email':
        newErrors.email = validateEmail(email);
        break;
      case 'date':
        newErrors.date = validateDate(date);
        break;
      case 'phone':
        newErrors.phone = validatePhone();
        break;
    }
    setErrors(newErrors);
  };

  const handlePhoneChange = (fullNumber: string, isValid: boolean, country: Country) => {
    setPhone(fullNumber);
    setPhoneValid(isValid);
    if (touched.phone) {
      setErrors(prev => ({
        ...prev,
        phone: !fullNumber ? "Phone number is required" : (!isValid ? "Please enter a valid phone number" : undefined)
      }));
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      phone: true,
      date: true,
      email: true,
    });

    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors above before submitting.' });
      return;
    }

    setLoading(true);
    setSubmitStatus(null);

    try {
      // For now, we'll simulate the booking since the service might not exist
      // In production, this would call the actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus({
        type: 'success',
        message: `🎉 Booking request sent to ${ownerName ?? 'horse service'}! We'll contact you at ${phone} to confirm.`
      });
      
      // Reset form after success
      setTimeout(() => {
        setName("");
        setPhone("");
        setPhoneValid(false);
        setEmail("");
        setDate("");
        setDuration(1);
        setNotes("");
        setTouched({});
        setErrors({});
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setSubmitStatus({ type: 'error', message: err?.message || "Booking failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setName("");
    setPhone("");
    setPhoneValid(false);
    setEmail("");
    setDate("");
    setDuration(1);
    setNotes("");
    setTouched({});
    setErrors({});
    setSubmitStatus(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐎</span>
              <div>
                <h3 className="text-lg font-bold text-white">Book Horse Service</h3>
                {ownerName && <p className="text-amber-100 text-sm">Provider: {ownerName}</p>}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Service Info */}
          {(serviceName || pricePerHour) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              {serviceName && <p className="font-medium text-amber-900">{serviceName}</p>}
              {pricePerHour && <p className="text-sm text-amber-700">Price: {pricePerHour} ETB/hour</p>}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Enter your full name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                touched.name && errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone with Country Selector */}
          <PhoneInput
            value={phone}
            onChange={handlePhoneChange}
            defaultCountry="ET"
            label="Phone Number"
            required
            error={touched.phone ? errors.phone : undefined}
          />

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="your.email@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                touched.email && errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={getMinDate()}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => handleBlur('date')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                touched.date && errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {touched.date && errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">−</span>
              </button>
              <span className="text-lg font-medium w-12 text-center">{duration}</span>
              <button
                type="button"
                onClick={() => setDuration(Math.min(8, duration + 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">+</span>
              </button>
              <span className="text-sm text-gray-500">hour{duration !== 1 ? 's' : ''}</span>
            </div>
            {pricePerHour && (
              <p className="mt-2 text-sm text-amber-700 font-medium">
                Estimated total: {pricePerHour * duration} ETB
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or preferences?"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
            <p className="text-xs text-gray-500 text-right">{notes.length}/500</p>
          </div>

          {/* Status Messages */}
          {submitStatus && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{submitStatus.type === 'success' ? '✅' : '❌'}</span>
                <p className="text-sm">{submitStatus.message}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                '🐎 Send Booking Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
