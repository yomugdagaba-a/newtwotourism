"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.service";
import Link from "next/link";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";

interface Props {
  onSuccess?: () => void;
  onLoginClick?: () => void;
  onCancel?: () => void;
}

export default function RegisterFormModal({ onSuccess, onLoginClick, onCancel }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirmPassword: "", fullName: ""
  });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setServerError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({ username: formData.username, email: formData.email, password: formData.password, fullName: formData.fullName });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      setServerError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-gray-900">Create Account</h2>
        <p className="mt-1 text-gray-600 font-semibold">Join North Wollo Tourism</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {serverError && <Alert type="error" message={serverError} onClose={() => setServerError("")} />}
        <FormInput label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" required />
        <FormInput label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required />
        <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Your email address" required />
        <FormInput label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required showPasswordToggle />
        <FormInput label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required showPasswordToggle />
        <FormButton type="submit" variant="primary" loading={loading} fullWidth>Register</FormButton>
        <button type="button" onClick={() => onCancel ? onCancel() : router.push('/')}
          className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <span className="text-gray-600 font-semibold">Already have an account? </span>
        {onLoginClick ? (
          <button type="button" onClick={onLoginClick} className="text-blue-600 hover:text-blue-700 font-black">Sign In</button>
        ) : (
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-black">Sign In</Link>
        )}
      </div>
    </div>
  );
}
