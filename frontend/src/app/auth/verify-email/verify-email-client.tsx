"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendVerificationEmail, verifyEmailWithOtp } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { FormButton, Alert } from "@/components/common/FormInput";

type Step = 'request' | 'verify' | 'success';

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  
  const { userId, updateEmailVerified } = useAuthStore();
  
  const [step, setStep] = useState<Step>(emailParam ? 'verify' : 'request');
  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining before resend allowed

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Parse error message — backend may return JSON string or plain text
  const parseErrorMessage = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      return parsed.message || raw;
    } catch {
      return raw;
    }
  };

  // Extract wait seconds from "Please wait N seconds." message
  const extractWaitSeconds = (msg: string): number => {
    const match = msg.match(/(\d+)\s*second/i);
    return match ? parseInt(match[1]) : 60;
  };

  const startResendCooldown = (seconds: number) => {
    setCanResend(false);
    setResendCooldown(seconds);
  };

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await sendVerificationEmail({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 15);
        setStep('verify');
        startResendCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      const msg = parseErrorMessage(err.message || "Failed to send verification OTP");
      const waitSecs = extractWaitSeconds(msg);
      if (waitSecs > 0 && msg.toLowerCase().includes('wait')) {
        startResendCooldown(waitSecs);
        setError(`Please wait ${waitSecs} seconds before requesting a new code.`);
        // Still move to verify step if we're not there yet
        if (step === 'request') setStep('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [email, step]);

  // Auto-send OTP if email is provided
  useEffect(() => {
    console.log('📧 VerifyEmailPage mounted - emailParam:', emailParam, 'step:', step);
    
    if (emailParam && step === 'verify') {
      console.log('🔄 Auto-sending OTP for email:', emailParam);
      handleSendOtp();
    }
  }, [emailParam, step, handleSendOtp]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (expiresIn && step === 'verify') {
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

  // Resend cooldown — start at 60s when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      startResendCooldown(60);
    }
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    
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
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      const response = await sendVerificationEmail({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 15);
        setOtp(['', '', '', '', '', '']);
        startResendCooldown(60);
        otpRefs.current[0]?.focus();
        setSuccess("New verification code sent!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      const msg = parseErrorMessage(err.message || "Failed to resend OTP");
      const waitSecs = extractWaitSeconds(msg);
      if (waitSecs > 0 && msg.toLowerCase().includes('wait')) {
        startResendCooldown(waitSecs);
        setError(`Please wait ${waitSecs} seconds before requesting a new code.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await verifyEmailWithOtp(email, otpCode);
      if (response.success) {
        updateEmailVerified(true);
        setStep('success');
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err: any) {
      const msg = parseErrorMessage(err.message || "Verification failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Light background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />
      </div>
      
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            {step === 'success' ? (
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'request' && "Verify Your Email"}
            {step === 'verify' && "Enter Verification Code"}
            {step === 'success' && "Email Verified!"}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 'request' && "Enter your email to receive a verification code"}
            {step === 'verify' && `We sent a 6-digit code to ${email}`}
            {step === 'success' && "Your email has been verified successfully"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {error && <Alert type="error" message={error} onClose={() => setError("")} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

          {/* Loading state when auto-sending OTP */}
          {loading && step === 'verify' && !otp.some(digit => digit !== '') ? (
            <div className="text-center py-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Sending verification code...</p>
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-4">
              <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h3>
              <p className="text-gray-600 mb-6">Your email is now verified. You can access all features.</p>
              
              <div className="space-y-3">
                <Link href="/auth/login"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all text-center shadow-lg">
                  Continue to Sign In
                </Link>
                <Link href="/"
                  className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all text-center border border-gray-300">
                  Go to Home
                </Link>
              </div>
            </div>
          ) : step === 'request' ? (
            // Step 1: Email input
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <FormButton 
                type="button" 
                variant="primary" 
                loading={loading} 
                fullWidth
                onClick={handleSendOtp}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 shadow-lg"
              >
                Send Verification Code
              </FormButton>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            // Step 2: OTP verification
            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter 6-digit code</label>
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
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
                      disabled={loading}
                    />
                  ))}
                </div>
                
                {/* Timer and Resend */}
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  {countdown > 0 ? (
                    <span className="text-gray-600">
                      Code expires in <span className="font-mono font-bold text-emerald-600">{formatTime(countdown)}</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Code expired</span>
                  )}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`font-medium transition-colors ${canResend ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
                  </button>
                </div>
              </div>

              <FormButton type="submit" variant="primary" loading={loading} fullWidth
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 shadow-lg">
                Verify Email
              </FormButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('request'); setOtp(['', '', '', '', '', '']); }}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Features Preview */}
        {step !== 'success' && (
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">🏨</div>
              <p className="text-xs text-gray-600">Book Hotels</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">🏞️</div>
              <p className="text-xs text-gray-600">Explore Places</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-xs text-gray-600">Leave Reviews</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
