"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { resendVerificationEmail } from "@/services/auth.service";
import LogoutButton from "./LogoutButton";
import Link from "next/link";

interface AuthStatusProps {
  showEmailVerification?: boolean;
  compact?: boolean;
}

export default function AuthStatus({ 
  showEmailVerification = true, 
  compact = false 
}: AuthStatusProps) {
  const { 
    isAuthenticated, 
    username, 
    role, 
    emailVerified, 
    userId,
    getTimeUntilExpiry 
  } = useAuthStore();
  
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResendVerification = async () => {
    if (!userId) return;
    
    setResendLoading(true);
    setResendMessage("");
    
    try {
      const response = await resendVerificationEmail(userId);
      if (response.success) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setResendMessage("Failed to send verification email. Please try again.");
      }
    } catch (error) {
      setResendMessage("Failed to send verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const timeUntilExpiry = getTimeUntilExpiry();
  const isTokenExpiringSoon = timeUntilExpiry > 0 && timeUntilExpiry < 300; // Less than 5 minutes

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center space-x-4 ${compact ? "text-sm" : ""}`}>
        <Link
          href="/auth/login"
          className="text-green-600 hover:text-green-800 font-medium transition-colors duration-200"
        >
          Sign In
        </Link>
        <Link
          href="/auth/register"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            {username}
          </span>
          {role === "ADMIN" && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Admin
            </span>
          )}
          {!emailVerified && showEmailVerification && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Unverified
            </span>
          )}
        </div>
        <LogoutButton 
          variant="link" 
          className="text-sm text-red-600 hover:text-red-800"
          showConfirmation={false}
        >
          Sign Out
        </LogoutButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-medium text-lg">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Welcome, {username}!
            </p>
            <div className="flex items-center space-x-2">
              {role && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  role === "ADMIN" 
                    ? "bg-purple-100 text-purple-800" 
                    : role === "HOTEL_OWNER"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {role.replace("_", " ")}
                </span>
              )}
              {isTokenExpiringSoon && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Session expiring soon
                </span>
              )}
            </div>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Email Verification Status */}
      {showEmailVerification && !emailVerified && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please verify your email address to access all features. 
                  Check your inbox for a verification email.
                </p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="bg-yellow-50 text-yellow-800 rounded-md p-2 text-sm font-medium hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600 disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </button>
                  <Link
                    href="/auth/verify-email"
                    className="bg-yellow-50 text-yellow-800 rounded-md p-2 text-sm font-medium hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  >
                    Verification Help
                  </Link>
                </div>
              </div>
              {resendMessage && (
                <div className="mt-2 text-sm text-yellow-700">
                  {resendMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Access */}
      {role === "ADMIN" && (
        <div className="rounded-md bg-purple-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">
                Administrator Access
              </h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>You have administrator privileges.</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/admin"
                  className="bg-purple-50 text-purple-800 rounded-md p-2 text-sm font-medium hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-50 focus:ring-purple-600"
                >
                  Go to Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}