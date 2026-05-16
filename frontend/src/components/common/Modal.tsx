"use client";

import React, { ReactNode, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  title?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  rounded?: boolean;
}

const Modal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  children, 
  size = "lg", 
  title,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  rounded = true
}) => {
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  const handleBackdropClick = () => {
    if (closeOnOutsideClick) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white ${rounded ? 'rounded-2xl' : ''} ${size === 'sm' ? 'p-4' : 'p-4 sm:p-6'} w-full relative max-h-[90vh] overflow-y-auto ${sizeClasses[size]}`}
        style={{ scrollbarWidth: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
