"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";
import { validateForm, hasErrors, schemas, ValidationErrors } from "@/utils/validation";
import BlockedBanner from "@/components/common/BlockedBanner";

function LoginFormContent() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: ""
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for registration success message
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage("Registration successful! Please sign in with your credentials.");
    }
  }, [searchParams]);

  // If already authenticated, redirect
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      const redirectTo = searchParams.get('redirect') || getDefaultRedirect(auth.role);
      router.push(redirectTo);
    }
  }, [auth.isAuthenticated, auth.token, auth.role, router, searchParams]);

  const getDefaultRedirect = (role: string | null) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'HOTEL_OWNER': return '/hotel-owner';
      default: return '/';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError("");
  };

  const validateFormData = (): boolean => {
    const validationErrors = validateForm(formData, schemas.login);
    setErrors(validationErrors);
    return !hasErrors(validationErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateFormData()) {
      return;
    }

    setLoading(true);
    
    try {
      const res = await login({ username: formData.usernameOrEmail, password: formData.password });
      
      if (res?.token) {
        auth.login(res.token, res.refreshToken, res.userId);
        
        // Standalone login page - redirect based on role or redirect param
          setTimeout(() => {
            const currentAuth = useAuthStore.getState();
            const redirectTo = searchParams.get('redirect') || getDefaultRedirect(currentAuth.role);
            router.push(redirectTo);
          }, 100);
      } else {
        throw new Error("Invalid login response - no token received");
      }
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      setServerError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Light background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob animation-delay-2000" />
      </div>
      
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Back</span>
      </button>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 border-blue-400">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600 font-semibold">Sign in to North Wollo Tourism</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            {successMessage && (
              <Alert type="success" message={successMessage} onClose={() => setSuccessMessage("")} />
            )}
            {serverError && (
              <BlockedBanner message={serverError} onClose={() => setServerError("")} />
            )}

            <FormInput
              label="Username or Email"
              name="usernameOrEmail"
              type="text"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              error={errors.usernameOrEmail}
              placeholder="Enter your username or email"
              required
              autoComplete="username email"
              disabled={loading}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={loading}
              showPasswordToggle
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="flex items-center justify-between">
              <Link
                href="/auth/reset-password"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <FormButton
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!formData.usernameOrEmail.trim() || !formData.password.trim()}
              fullWidth
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 py-3 font-black"
            >
              Sign In
            </FormButton>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-700 font-bold">New to North Wollo Tourism?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
              <Link
                href="/auth/register"
                className="block w-full py-3 px-4 border border-blue-500 text-blue-600 font-black rounded-lg hover:bg-blue-50 transition-colors text-center"
              >
                Create an Account
              </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-700 font-bold">
          By signing in, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline font-black">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-blue-600 hover:underline font-black">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <LoginFormContent />
    </Suspense>
  );
}
