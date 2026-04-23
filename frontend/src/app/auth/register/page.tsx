"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.service";
import Link from "next/link";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";


// Validation helpers
const validateFullName = (name: string): string | null => {
  if (!name.trim()) return "Required";
  if (name.trim().length < 2) return "Min 2 characters";
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) return "Letters only";
  return null;
};

const validateUsername = (username: string): string | null => {
  if (!username.trim()) return "Required";
  if (username.length < 4) return "Min 4 characters";
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return "Start with letter, use letters/numbers/_";
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Required";
  if (password.length < 8) return "Min 8 characters";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) 
    return "Need uppercase, lowercase & number";
  return null;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return "Required";
  if (password !== confirmPassword) return "Passwords don't match";
  return null;
};

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "", fullName: "", email: "", password: "", confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError("");
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateAll()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      console.log('📝 Registering user:', registerData.email);
      const response = await register(registerData);
      console.log('✅ Registration successful:', response);
      
      // Always redirect to email verification page
      console.log('🔄 Redirecting to verify-email page with email:', formData.email);
      
      // Registration successful - redirect to verify email
      
      // Then redirect to verify-email page
      setTimeout(() => {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&from=register`);
      }, 100);
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setServerError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-3 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-200 rounded-full mix-blend-screen filter blur-[100px] opacity-10" />
      </div>

      <div className="w-full max-w-md">
        {/* Header - Compact */}
        <div className="text-center mb-4">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 border-blue-400">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900">Create Account</h2>
        </div>

        {/* Form Card - Compact */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            {serverError && <Alert type="error" message={serverError} onClose={() => setServerError("")} />}

            {/* Two columns for name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput 
                label="Full Name" 
                name="fullName" 
                type="text" 
                value={formData.fullName} 
                onChange={handleChange}
                error={errors.fullName} 
                placeholder="John Doe" 
                required
                disabled={loading}
              />
              <FormInput 
                label="Username" 
                name="username" 
                type="text" 
                value={formData.username} 
                onChange={handleChange}
                error={errors.username} 
                placeholder="john_doe" 
                required
                disabled={loading}
              />
            </div>

            <FormInput 
              label="Email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange}
              error={errors.email} 
              placeholder="user@example.com" 
              required
              disabled={loading}
            />

            {/* Two columns for password fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FormInput 
                  label="Password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  error={errors.password} 
                  placeholder="••••••••" 
                  required
                  disabled={loading} 
                  showPasswordToggle
                />
                {formData.password && (
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300'}`} />
                    ))}
                  </div>
                )}
              </div>
              <FormInput 
                label="Confirm" 
                name="confirmPassword" 
                type="password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="••••••••" 
                required
                disabled={loading} 
                showPasswordToggle
              />
            </div>

            {/* Info - Compact */}
            <p className="text-xs text-gray-600 text-center font-semibold">
              You'll receive a verification code via email after registration.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <FormButton 
                type="submit" 
                variant="primary" 
                loading={loading} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-2.5 font-black"
              >
                Register
              </FormButton>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600 font-semibold">Already have an account? </span>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-black">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
