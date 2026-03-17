"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import AuthStatus from "@/components/auth/AuthStatus";
import LoginForm from "@/app/auth/login/page";
import RegisterForm from "@/app/auth/register/page";
import ResetPasswordForm from "@/app/auth/reset-password/page";

export default function AuthDemoPage() {
  const [activeTab, setActiveTab] = useState<"status" | "login" | "register" | "reset">("status");
  const { isAuthenticated, username, role, emailVerified, token, refreshToken, getTimeUntilExpiry } = useAuthStore();

  const tabs = [
    { id: "status", label: "Auth Status", icon: "👤" },
    { id: "login", label: "Login", icon: "🔐" },
    { id: "register", label: "Register", icon: "📝" },
    { id: "reset", label: "Reset Password", icon: "🔑" },
  ];

  const timeUntilExpiry = getTimeUntilExpiry();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Authentication System Demo
          </h1>
          <p className="mt-2 text-gray-600">
            Test all authentication features including login, registration, password reset, and email verification
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Auth Status Tab */}
          {activeTab === "status" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Status</h2>
              
              {/* Current Status */}
              <div className="mb-8">
                <AuthStatus showEmailVerification={true} compact={false} />
              </div>

              {/* Debug Information */}
              {isAuthenticated && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Username:</span>
                        <span className="ml-2 text-gray-900">{username}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Role:</span>
                        <span className="ml-2 text-gray-900">{role}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email Verified:</span>
                        <span className={`ml-2 ${emailVerified ? "text-green-600" : "text-red-600"}`}>
                          {emailVerified ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Token Expires In:</span>
                        <span className="ml-2 text-gray-900">
                          {Math.floor(timeUntilExpiry / 60)}m {Math.floor(timeUntilExpiry % 60)}s
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-gray-700">Access Token (click to expand)</summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                          {token}
                        </div>
                      </details>
                    </div>
                    {refreshToken && (
                      <div className="mt-2">
                        <details className="cursor-pointer">
                          <summary className="font-medium text-gray-700">Refresh Token (click to expand)</summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {refreshToken}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feature List */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Implemented Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Email-based login support</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Password reset via email</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Email verification for new accounts</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Automatic token refresh</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Brute force protection</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Account lockout system</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Secure logout with token revocation</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-sm">Role-based access control</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Tab */}
          {activeTab === "login" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
              <div className="max-w-md mx-auto">
                <LoginForm 
                  onSuccess={() => setActiveTab("status")}
                  onRegisterClick={() => setActiveTab("register")}
                />
              </div>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>💡 <strong>Tip:</strong> You can login with either username or email address</p>
              </div>
            </div>
          )}

          {/* Register Tab */}
          {activeTab === "register" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>
              <div className="max-w-md mx-auto">
                <RegisterForm 
                  onSuccess={() => setActiveTab("status")}
                  onLoginClick={() => setActiveTab("login")}
                />
              </div>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>💡 <strong>Tip:</strong> After registration, check your email for verification link</p>
              </div>
            </div>
          )}

          {/* Reset Password Tab */}
          {activeTab === "reset" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Reset Password</h2>
              <div className="max-w-md mx-auto">
                <ResetPasswordForm />
              </div>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>💡 <strong>Tip:</strong> Enter your email to receive a password reset link</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="inline-flex space-x-4 text-sm">
            <a href="/auth/verify-email" className="text-green-600 hover:text-green-800">
              Email Verification Help
            </a>
            <span className="text-gray-300">|</span>
            <a href="/admin" className="text-purple-600 hover:text-purple-800">
              Admin Panel
            </a>
            <span className="text-gray-300">|</span>
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}