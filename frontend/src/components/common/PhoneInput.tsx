"use client";

import React, { useState, useEffect, useRef } from 'react';

// Country data with dial codes and flags
export const COUNTRIES = [
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', format: '9X XXX XXXX', maxLength: 9 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: 'XXX XXXXXXXX', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: 'X XX XX XX XX', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: 'XXX XXXX XXXX', maxLength: 11 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: 'XXXXX XXXXX', maxLength: 10 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: 'XX XXXXX XXXX', maxLength: 11 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', format: 'XXX XXX XX XX', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', format: 'XXX XXXX XXXX', maxLength: 11 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: 'X XXXX XXXX', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', format: 'XXX XX XX XX', maxLength: 9 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', format: 'XXX XXXXXX', maxLength: 10 },
];

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  format: string;
  maxLength: number;
}

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string, isValid: boolean, country: Country) => void;
  defaultCountry?: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = 'ET',
  label = 'Phone Number',
  required = false,
  error,
  placeholder,
  className = '',
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value if it contains dial code
  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode, '').trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validatePhone = (phone: string, country: Country): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 7) return false;
    if (digitsOnly.length > country.maxLength) return false;
    
    // Ethiopian specific validation
    if (country.code === 'ET') {
      return /^[97]\d{8}$/.test(digitsOnly) || /^0[97]\d{8}$/.test(digitsOnly);
    }
    
    return digitsOnly.length >= 7;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits, spaces, and dashes
    const cleaned = input.replace(/[^\d\s-]/g, '');
    setPhoneNumber(cleaned);
    
    const digitsOnly = cleaned.replace(/\D/g, '');
    const fullNumber = `${selectedCountry.dialCode}${digitsOnly}`;
    const isValid = validatePhone(cleaned, selectedCountry);
    onChange(fullNumber, isValid, selectedCountry);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');
    
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const fullNumber = `${country.dialCode}${digitsOnly}`;
    const isValid = validatePhone(phoneNumber, country);
    onChange(fullNumber, isValid, country);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors min-w-[100px] ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>
              
              {/* Country List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 transition-colors text-left ${
                      selectedCountry.code === country.code ? 'bg-emerald-100' : ''
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 text-sm text-gray-900">{country.name}</span>
                    <span className="text-sm text-gray-500">{country.dialCode}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Phone Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry.format}
          className={`flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      <p className="mt-1 text-xs text-gray-500">
        Format: {selectedCountry.dialCode} {selectedCountry.format}
      </p>
    </div>
  );
}
