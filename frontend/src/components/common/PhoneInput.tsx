// cache-bust: 2026-04-15
"use client";
import React, { useState, useEffect, useRef } from 'react';

export interface Country {
  code: string; name: string; dialCode: string; flag: string; format: string; maxLength: number;
}

export const COUNTRIES: Country[] = [
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', format: '9X XXX XXXX', maxLength: 9 },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫', format: 'XXX XXX XXXX', maxLength: 9 },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿', format: 'XXX XXX XXXX', maxLength: 9 },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', format: 'XXX XXXXXX', maxLength: 10 },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', format: 'XXX XX XX XX', maxLength: 9 },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', format: 'X XXX XXXX', maxLength: 8 },
  { code: 'BA', name: 'Bosnia', dialCode: '+387', flag: '🇧🇦', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: 'XX XXXXX XXXX', maxLength: 11 },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭', format: 'XX XXX XXX', maxLength: 9 },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'CF', name: 'Central African Rep.', dialCode: '+236', flag: '🇨🇫', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', format: 'X XXXX XXXX', maxLength: 9 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: 'XXX XXXX XXXX', maxLength: 11 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺', format: 'X XXX XXXX', maxLength: 8 },
  { code: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', format: 'XX XX XX XX', maxLength: 8 },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯', format: 'XX XX XX XX', maxLength: 8 },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷', format: 'X XXX XXX', maxLength: 7 },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: 'X XX XX XX XX', maxLength: 9 },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦', format: 'X XX XX XX', maxLength: 7 },
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲', format: 'XXX XXXX', maxLength: 7 },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪', format: 'XXX XXX XXX', maxLength: 9 },
];

COUNTRIES.push(
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: 'XXX XXXXXXXX', maxLength: 11 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸', format: 'XXX XXXX', maxLength: 7 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: 'XXXXX XXXXX', maxLength: 10 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', format: 'XXX XXXX XXXX', maxLength: 11 },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'CI', name: 'Ivory Coast', dialCode: '+225', flag: '🇨🇮', format: 'XX XX XX XX', maxLength: 8 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', format: 'X XXX XXXX', maxLength: 8 },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦', format: 'XX XX XXX XXX', maxLength: 10 },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷', format: 'XXX XXX XXXX', maxLength: 9 },
  { code: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹', format: 'XXX XXXXX', maxLength: 8 },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬', format: 'XX XX XXX XX', maxLength: 9 },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼', format: 'XXX XX XXXX', maxLength: 9 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻', format: 'XXX XXXX', maxLength: 7 },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩', format: 'XXX XX XXX', maxLength: 8 },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲', format: 'X XXX XXXX', maxLength: 9 },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: 'X XXXX XXXX', maxLength: 9 }
);

COUNTRIES.push(
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', format: 'XX XX XXXX', maxLength: 8 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', format: 'XXX XX XXX', maxLength: 8 },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', format: 'XXX XXX XX XX', maxLength: 10 },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: 'XXXX XXXX', maxLength: 8 },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳', format: 'XX XXX XXX', maxLength: 8 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲', format: 'XX XXXXXX', maxLength: 8 },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾', format: 'X XXX XXXX', maxLength: 8 },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿', format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', format: 'XX XXX XXXX', maxLength: 9 }
);

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
  value, onChange, defaultCountry = 'ET', label = 'Phone Number',
  required = false, error, placeholder, className = '',
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) { setSelectedCountry(country); setPhoneNumber(value.replace(country.dialCode, '').trim()); }
      else setPhoneNumber(value);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.dialCode.includes(searchTerm) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validate = (phone: string, country: Country) => {
    const d = phone.replace(/\D/g, '');
    if (d.length < 7) return false;
    if (country.code === 'ET') return /^[97]\d{8}$/.test(d) || /^0[97]\d{8}$/.test(d);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
    setPhoneNumber(cleaned);
    onChange(`${selectedCountry.dialCode}${cleaned.replace(/\D/g, '')}`, validate(cleaned, selectedCountry), selectedCountry);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country); setIsOpen(false); setSearchTerm('');
    onChange(`${country.dialCode}${phoneNumber.replace(/\D/g, '')}`, validate(phoneNumber, country), country);
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="flex w-full overflow-hidden">
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button type="button" onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2 py-2 border rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors w-[90px] sm:w-[110px] ${error ? 'border-red-500' : 'border-gray-300'}`}>
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div className="absolute z-50 mt-1 w-64 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden left-0">
              <div className="p-2 border-b border-gray-200">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search country..." autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="max-h-72 overflow-y-auto">
                {filtered.map(country => (
                  <button key={country.code} type="button" onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 transition-colors text-left ${selectedCountry.code === country.code ? 'bg-emerald-100' : ''}`}>
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 text-sm text-gray-900">{country.name}</span>
                    <span className="text-sm text-gray-500">{country.dialCode}</span>
                  </button>
                ))}
                {filtered.length === 0 && <div className="px-3 py-4 text-center text-gray-500 text-sm">No countries found</div>}
              </div>
            </div>
          )}
        </div>
        <input type="tel" value={phoneNumber} onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry.format}
          className={`flex-1 min-w-0 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">{selectedCountry.dialCode} {selectedCountry.format}</p>
    </div>
  );
}
