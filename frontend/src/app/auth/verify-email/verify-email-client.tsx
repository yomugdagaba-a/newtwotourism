"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendVerificationEmail, verifyEmailWithOtp } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { FormButton, Alert } from "@/components/common/FormInput";
import BlockedBanner from "@/components/common/BlockedBanner";

type Step = 'request' | 'verify' | 'success';

function VerifyEmailContent() {
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
  const fromRegister = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('from') === 'register'
    : false;
  const [expiresIn, setExpiresIn] = useState<number | null>(fromRegister ? 5 : null);
  const [countdown, setCountdown] = useState(fromRegister ? 5 * 60 : 0);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const parseErrorMessage = (raw: string): string => {
    try { const parsed = JSON.parse(raw); return parsed.message || raw; } catch { return raw; }
  };

  const extractWaitSeconds = (msg: string): number => {
    const match = msg.match(/(\d+)\s*second/i);
    return match ? parseInt(match[1]) : 60;
  };

  const startResendCooldown = (seconds: number) => {
    setCanResend(false);
    setResendCooldown(seconds);
  };

  useEffect(() => {
    if (resendCooldown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    if (!email) { setError("Please enter your email address"); return; }
    setLoading(true); setError("");
    try {
      const response = await sendVerificationEmail({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 15);
        setStep('verify');
        startResendCooldown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else { setError(response.message || "Failed to send OTP"); }
    } catch (err: any) {
      const msg = parseErrorMessage(err.message || "Failed to send verification OTP");
      const waitSecs = extractWaitSeconds(msg);
      if (waitSecs > 0 && msg.toLowerCase().includes('wait')) {
        startResendCooldown(waitSecs);
        setError(`Please wait ${waitSecs} seconds before requesting a new code.`);
        if (step === 'request') setStep('verify');
      } else { setError(msg); }
    } finally { setLoading(false); }
  }, [email, step]);

  useEffect(() => {
    if (emailParam && step === 'verify') {
      const fromReg = new URLSearchParams(window.location.search).get('from') === 'register';
      if (!fromReg) handleSendOtp();
    }
  }, [emailParam, step, handleSendOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expiresIn && !fromRegister) setCountdown(expiresIn * 60);
  }, [expiresIn]);

  useEffect(() => {
    if (step === 'verify') startResendCooldown(60);
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp); setError("");
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
    setOtp(newOtp);
    if (pastedData.length === 6) otpRefs.current[5]?.focus();
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true); setError("");
    try {
      const response = await sendVerificationEmail({ email });
      if (response.success) {
        setExpiresIn(response.expiresInMinutes || 15);
        setCountdown((response.expiresInMinutes || 15) * 60);
        setOtp(['', '', '', '', '', '']);
        startResendCooldown(60);
        otpRefs.current[0]?.focus();
        setSuccess("New verification code sent! Check your inbox.");
        setTimeout(() => setSuccess(""), 5000);
      } else { setError(response.message || "Failed to resend OTP"); }
    } catch (err: any) {
      const msg = parseErrorMessage(err.message || "Failed to resend OTP");
      const waitSecs = extractWaitSeconds(msg);
      if (waitSecs > 0 && msg.toLowerCase().includes('wait')) {
        startResendCooldown(waitSecs);
        setError(`Please wait ${waitSecs} seconds before requesting a new code.`);
      } else { setError(msg); }
    } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const response = await verifyEmailWithOtp(email, otpCode);
      if (response.success) { updateEmailVerified(true); setStep('success'); }
      else { setError(response.message || "Verification failed"); }
    } catch (err: any) { setError(parseErrorMessage(err.message || "Verification failed")); }
    finally { setLoading(false); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mx-auto h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            {step === 'success' ? (
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'request' && "Verify Your Email"}
            {step === 'verify' && "Enter Verification Code"}
            {step === 'success' && "Email Verified!"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'request' && "Enter your email to receive a verification code"}
            {step === 'verify' && `We sent a 6-digit code to ${email}`}
            {step === 'success' && "Your email has been verified successfully"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-200">
          {error && <BlockedBanner message={error} onClose={() => setError("")} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

          {fromRegister && step === 'verify' && !error && (
            <div className="mb-3 bg-white border border-gray-200 rounded-xl p-3 flex gap-2 items-start">
              <span className="text-gray-500 mt-0.5">📧</span>
              <p className="text-sm text-gray-800 font-semibold">
                A verification code was sent to <strong>{email}</strong> when you registered. Check your inbox (and spam folder).
              </p>
            </div>
          )}

          {loading && step === 'verify' && !otp.some(d => d !== '') ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600 font-medium text-sm">Sending verification code...</p>
            </div>
          ) : step === 'success' ? (
            <div className="text-center py-3">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Welcome!</h3>
              <p className="text-gray-600 mb-5 text-sm">Your email is now verified. You can access all features.</p>
              <div className="flex flex-col items-center gap-2">
                <Link href="/auth/login"
                  className="px-10 py-2 text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 !text-white font-medium rounded-xl transition-all text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Continue to Sign In
                </Link>
                <Link href="/"
                  className="px-10 py-2 text-sm bg-gray-100 !text-gray-700 font-medium rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-all text-center border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                  Go to Home
                </Link>
              </div>
            </div>
          ) : step === 'request' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-800 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email address"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder-gray-500"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <FormButton type="button" variant="primary" loading={loading} onClick={handleSendOtp}
                  className="bg-blue-600 hover:bg-blue-700 px-10 py-2 text-sm shadow-sm">
                  Send Verification Code
                </FormButton>
              </div>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter 6-digit code</label>
                <div className="flex justify-center gap-1.5" onPaste={handleOtpPaste}>
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
                      className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                      disabled={loading}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                  {countdown > 0 ? (
                    <span className="text-gray-600">
                      Code expires in <span className="font-mono font-bold text-blue-600">{formatTime(countdown)}</span>
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Code expired</span>
                  )}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`font-medium transition-colors ${canResend ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <FormButton type="submit" variant="primary" loading={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-10 py-2 text-sm shadow-sm">
                  Verify Email
                </FormButton>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('request'); setOtp(['', '', '', '', '', '']); }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}
        </div>

        {step !== 'success' && (
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-xl mb-1">🏨</div>
              <p className="text-xs text-gray-600">Book Hotels</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-xl mb-1">🏞️</div>
              <p className="text-xs text-gray-600">Explore Places</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="text-xl mb-1">⭐</div>
              <p className="text-xs text-gray-600">Leave Reviews</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
