// frontend/src/components/common/Button.tsx
"use client";

import React, { FC, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className,
  disabled = false,
}) => {
  const baseStyle =
    "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none";

  const variantStyle = clsx({
    "bg-green-700 text-white hover:bg-green-800": variant === "primary",
    "bg-gray-200 text-gray-900 hover:bg-gray-300": variant === "secondary",
    "bg-red-600 text-white hover:bg-red-700": variant === "danger",
    "opacity-50 cursor-not-allowed": disabled,
  });

  return (
    <button
      type={type}
      className={`${baseStyle} ${variantStyle} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
