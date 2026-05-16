"use client";

import React, { useState, useEffect } from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  rows?: number;
  options?: { value: string | number; label: string }[];
  helpText?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onKeyDown,
  error,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  rows = 3,
  options = [],
  helpText,
  icon,
  showPasswordToggle = false,
  min,
  max,
  step,
  className = ''
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const showError = touched && error;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-1 focus:ring-offset-0
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${showError 
      ? 'border-red-400 focus:ring-red-300 focus:border-red-500 bg-red-50' 
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-300 hover:border-gray-400 bg-white'
    }
    ${icon ? 'pl-10' : ''}
    ${type === 'password' && showPasswordToggle ? 'pr-10' : ''}
  `;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`${baseInputClasses} resize-none`}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">Select {label.toLowerCase()}...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={name}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        className={baseInputClasses}
      />
    );
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        {renderInput()}
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {showError && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !showError && (
        <p className="mt-1 text-sm text-gray-500 hidden">{helpText}</p>
      )}
    </div>
  );
}

// Form Button Component
interface FormButtonProps {
  type?: 'submit' | 'button' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function FormButton({
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  fullWidth = false
}: FormButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed border
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 border-green-600'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Alert Component
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export function Alert({ type, title, message, onClose }: AlertProps) {
  const styles = {
    success: { bg: 'bg-green-50', border: 'border-green-300', icon: 'text-green-500', title: 'text-green-800', text: 'text-green-700' },
    error: { bg: 'bg-red-50', border: 'border-red-300', icon: 'text-red-500', title: 'text-red-800', text: 'text-red-700' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: 'text-yellow-500', title: 'text-yellow-800', text: 'text-yellow-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-500', title: 'text-blue-800', text: 'text-blue-700' }
  };

  const icons = {
    success: <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />,
    error: <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />,
    warning: <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />,
    info: <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  };

  const s = styles[type];

  return (
    <div className={`rounded-lg p-4 ${s.bg} border ${s.border}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${s.icon}`} viewBox="0 0 20 20" fill="currentColor">
            {icons[type]}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-bold ${s.title}`}>{title}</h3>}
          <p className={`text-sm font-semibold ${s.text} ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className={`ml-3 ${s.icon} hover:opacity-75`}>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
