"use client";

import { useState, useEffect, useRef } from "react";
import { initiatePasswordReset, confirmPasswordReset } from "@/services/auth.service";
import Link from "next/link";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";
import { validateForm, hasErrors, ValidationErrors, rules } from "@/utils/validation";

// Validation schemas
const emailValidation = {
  email: [rules.required('Email'), rules.email()]
};

const otpValidation = {
  otp: [
    rules.required('OTP'),
    rules.pattern('OTP', /^\d{6}$/, 'OTP must be a 6-digit code')
  ],
  newPassword: [
    rules.required('New password'),
    rules.minLength('Password', 8),
    rules.pattern('Password', /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  confirmPassword: [
    rules.required('Confirm password'),
    rules.match('Passwords', 'newPassword')
  ]
};

type Step = 'email' | 'otp' | 'success';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({ otp: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (expiresIn && step === 'otp') {
      setCountdown(expiresIn * 60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresIn, step]);

  // Resend cooldown
  useEffect(() => {
    if (step === 'otp') {
      setCanResend(false);
      const timer = setTimeout(() => setCanResend(true), 60000); // 60 seconds
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    setServerError("");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep last digit
    setOtp(newOtp);
    
    // Update formData
    setFormData(prev => ({ ...prev, otp: newOtp.join('') }));
    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
    setServerError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setFormData(prev => ({ ...prev, otp: newOtp.join('') }));
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError("");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateForm({ email }, emailValidation);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setLoading(true);

    try {
      const response = await initiatePasswordReset({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 10);
        setStep('otp');
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setServerError(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setServerError("");
    setLoading(true);

    try {
      const response = await initiatePasswordReset({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 10);
        setOtp(['', '', '', '', '', '']);
        setFormData(prev => ({ ...prev, otp: '' }));
        setCanResend(false);
        setTimeout(() => setCanResend(true), 60000);
        otpRefs.current[0]?.focus();
      } else {
        setServerError(response.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateForm(formData, otpValidation);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setLoading(true);

    try {
      const response = await confirmPasswordReset({ 
        email, 
        token: formData.otp, 
        newPassword: formData.newPassword 
      });
      if (response.success) {
        setStep('success');
      } else {
        setServerError(response.message || "Failed to reset password");
      }
    } catch (err: any) {
      setServerError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Light background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />
      </div>
      
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'email' && "Reset Password"}
            {step === 'otp' && "Enter OTP"}
            {step === 'success' && "Password Reset!"}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 'email' && "Enter your email to receive a 6-digit OTP"}
            {step === 'otp' && `We sent a code to ${email}`}
            {step === 'success' && "Your password has been reset successfully"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {step === 'success' ? (
            <div className="text-center py-4">
              <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Done!</h3>
              <p className="text-gray-600 mb-6">You can now log in with your new password.</p>
              <Link href="/auth/login"
                className="inline-block w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all text-center shadow-lg">
                Go to Sign In
              </Link>
            </div>
          ) : step === 'email' ? (
            // Step 1: Email input
            <form onSubmit={handleSendOtp} className="space-y-5">
              {serverError && <Alert type="error" message={serverError} onClose={() => setServerError("")} />}

              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={errors.email}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                disabled={loading}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <FormButton type="submit" variant="primary" loading={loading} fullWidth
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 py-3 shadow-lg">
                Send OTP
              </FormButton>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            // Step 2: OTP and new password
            <form onSubmit={handleResetPassword} className="space-y-6">
              {serverError && <Alert type="error" message={serverError} onClose={() => setServerError("")} />}

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Enter 6-digit OTP</label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 ${
                        errors.otp ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    />
                  ))}
                </div>
                {errors.otp && <p className="mt-2 text-sm text-red-600 text-center">{errors.otp}</p>}
                
                {/* Timer and Resend */}
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  {countdown > 0 ? (
                    <span className="text-gray-600">
                      Code expires in <span className="font-mono font-bold text-purple-600">{formatTime(countdown)}</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Code expired</span>
                  )}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`font-medium ${canResend ? 'text-purple-600 hover:text-purple-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  error={errors.newPassword}
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  showPasswordToggle
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength >= 4 ? 'text-emerald-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                      Strength: {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <FormInput
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                placeholder="Confirm your new password"
                required
                autoComplete="new-password"
                disabled={loading}
                showPasswordToggle
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />

              <FormButton type="submit" variant="primary" loading={loading} fullWidth
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 py-3 shadow-lg">
                Reset Password
              </FormButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setFormData({ otp: '', newPassword: '', confirmPassword: '' }); }}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-purple-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
