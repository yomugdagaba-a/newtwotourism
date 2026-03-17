"use client";

import { useState, useEffect } from "react";
import { bookHotel } from "@/services/hotel.service";
import { useAuthStore } from "@/store/useAuthStore";
import PhoneInput, { Country } from "@/components/common/PhoneInput";

interface Props {
  hotelId: number;
  hotelName: string;
}

interface FormErrors {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
}

export default function HotelBookingForm({ hotelId, hotelName }: Props) {
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.userId);
  const userFullName = useAuthStore(state => state.fullName);
  const userEmail = useAuthStore(state => state.email);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (userFullName) setFullName(userFullName);
      if (userEmail) setEmail(userEmail);
    }
  }, [isAuthenticated, userFullName, userEmail]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum checkout date (day after check-in)
  const getMinCheckoutDate = () => {
    if (!checkInDate) return getMinDate();
    const checkIn = new Date(checkInDate);
    checkIn.setDate(checkIn.getDate() + 1);
    return checkIn.toISOString().split('T')[0];
  };

  // Validation functions
  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 100) return "Name must be less than 100 characters";
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) return "Please enter a valid email address";
    return undefined;
  };

  const validateCheckInDate = (date: string): string | undefined => {
    if (!date) return "Check-in date is required";
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return "Check-in date cannot be in the past";
    return undefined;
  };

  const validateCheckOutDate = (checkOut: string, checkIn: string): string | undefined => {
    if (!checkOut) return "Check-out date is required";
    if (!checkIn) return "Please select check-in date first";
    const checkOutDate = new Date(checkOut);
    const checkInDate = new Date(checkIn);
    if (checkOutDate <= checkInDate) return "Check-out must be after check-in date";
    
    // Maximum stay of 30 days
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) return "Maximum stay is 30 days";
    
    return undefined;
  };

  const validateGuests = (guestCount: number): string | undefined => {
    if (guestCount < 1) return "At least 1 guest is required";
    if (guestCount > 20) return "Maximum 20 guests allowed";
    return undefined;
  };

  const validatePhone = (): string | undefined => {
    if (!phone) return "Phone number is required";
    if (!phoneValid) return "Please enter a valid phone number";
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      checkInDate: validateCheckInDate(checkInDate),
      checkOutDate: validateCheckOutDate(checkOutDate, checkInDate),
      guests: validateGuests(guests),
      phone: validatePhone(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== undefined);
  };

  // Handle field blur for real-time validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const newErrors = { ...errors };
    switch (field) {
      case 'fullName':
        newErrors.fullName = validateFullName(fullName);
        break;
      case 'email':
        newErrors.email = validateEmail(email);
        break;
      case 'checkInDate':
        newErrors.checkInDate = validateCheckInDate(checkInDate);
        break;
      case 'checkOutDate':
        newErrors.checkOutDate = validateCheckOutDate(checkOutDate, checkInDate);
        break;
      case 'guests':
        newErrors.guests = validateGuests(guests);
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
    setSelectedCountry(country);
    if (touched.phone) {
      setErrors(prev => ({
        ...prev,
        phone: !fullNumber ? "Phone number is required" : (!isValid ? "Please enter a valid phone number" : undefined)
      }));
    }
  };

  const handleBooking = async () => {
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      checkInDate: true,
      checkOutDate: true,
      guests: true,
      phone: true,
    });

    if (!validateForm()) {
      setBookingStatus({ type: 'error', message: 'Please fix the errors above before submitting.' });
      return;
    }

    if (!isAuthenticated || !token) {
      setBookingStatus({ type: 'error', message: 'You must be logged in to make a booking.' });
      return;
    }

    setLoading(true);
    setBookingStatus(null);

    try {
      const response = await bookHotel(
        {
          hotelId,
          userId: userId || 0,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests,
        },
        userId || 0,
        token
      );

      if (response && response.bookingId) {
        setBookingStatus({
          type: 'success',
          message: `🎉 Booking successful! Your booking ID is: ${response.bookingId}. We'll contact you at ${phone} for confirmation.`
        });
        // Reset form
        setCheckInDate("");
        setCheckOutDate("");
        setGuests(1);
        setSpecialRequests("");
        setTouched({});
        setErrors({});
      } else {
        setBookingStatus({ type: 'success', message: 'Booking submitted successfully!' });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Booking failed. Please try again.";
      setBookingStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // Calculate number of nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <span className="text-xl">🏨</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Book {hotelName}</h3>
          <p className="text-sm text-gray-500">Fill in your details to reserve</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Guest Information Section */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>👤</span> Guest Information
          </h4>
          
          {/* Full Name */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="Enter your full name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                touched.fullName && errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {touched.fullName && errors.fullName && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="your.email@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                touched.email && errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
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
        </div>

        {/* Booking Details Section */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>📅</span> Booking Details
          </h4>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-in <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkInDate}
                min={getMinDate()}
                onChange={(e) => {
                  setCheckInDate(e.target.value);
                  // Reset checkout if it's before new check-in
                  if (checkOutDate && new Date(checkOutDate) <= new Date(e.target.value)) {
                    setCheckOutDate("");
                  }
                }}
                onBlur={() => handleBlur('checkInDate')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  touched.checkInDate && errors.checkInDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {touched.checkInDate && errors.checkInDate && (
                <p className="mt-1 text-xs text-red-600">{errors.checkInDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={getMinCheckoutDate()}
                onChange={(e) => setCheckOutDate(e.target.value)}
                onBlur={() => handleBlur('checkOutDate')}
                disabled={!checkInDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  touched.checkOutDate && errors.checkOutDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {touched.checkOutDate && errors.checkOutDate && (
                <p className="mt-1 text-xs text-red-600">{errors.checkOutDate}</p>
              )}
            </div>
          </div>

          {/* Nights Summary */}
          {checkInDate && checkOutDate && !errors.checkOutDate && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-emerald-800">
                <span className="font-medium">{calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</span>
                {' '}• {new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' → '}
                {new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">−</span>
              </button>
              <span className="text-lg font-medium w-12 text-center">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(20, guests + 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">+</span>
              </button>
              <span className="text-sm text-gray-500">guest{guests !== 1 ? 's' : ''}</span>
            </div>
            {touched.guests && errors.guests && (
              <p className="mt-1 text-sm text-red-600">{errors.guests}</p>
            )}
          </div>
        </div>

        {/* Special Requests */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requests? (e.g., early check-in, room preferences, dietary requirements)"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <p className="text-xs text-gray-500 text-right">{specialRequests.length}/500</p>
        </div>

        {/* Status Messages */}
        {bookingStatus && (
          <div className={`p-4 rounded-lg ${
            bookingStatus.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{bookingStatus.type === 'success' ? '✅' : '❌'}</span>
              <p className="text-sm">{bookingStatus.message}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleBooking}
          disabled={loading || !isAuthenticated}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            loading || !isAuthenticated
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : !isAuthenticated ? (
            'Please login to book'
          ) : (
            '🎯 Confirm Booking'
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-center text-sm text-gray-500">
            <a href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Login
            </a>
            {' '}or{' '}
            <a href="/auth/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Register
            </a>
            {' '}to make a booking
          </p>
        )}
      </div>
    </div>
  );
}
