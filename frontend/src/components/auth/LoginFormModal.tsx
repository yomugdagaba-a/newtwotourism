"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import FormInput, { FormButton, Alert } from "@/components/common/FormInput";
import { validateForm, hasErrors, schemas, ValidationErrors } from "@/utils/validation";

interface Props {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onCancel?: () => void;
}

export default function LoginFormModal({ onSuccess, onRegisterClick, onCancel }: Props) {
  const [formData, setFormData] = useState({ usernameOrEmail: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuthStore();
  const router = useRouter();

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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const validationErrors = validateForm(formData, schemas.login);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;
    setLoading(true);
    try {
      const res = await login({ username: formData.usernameOrEmail, password: formData.password });
      if (res?.token) {
        auth.login(res.token, res.refreshToken, res.userId);
        if (onSuccess) {
          onSuccess();
        } else {
          const currentAuth = useAuthStore.getState();
          router.push(getDefaultRedirect(currentAuth.role));
        }
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err: any) {
      setServerError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-gray-900">Welcome Back</h2>
        <p className="mt-1 text-gray-600 font-semibold">Sign in to North Wollo Tourism</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {serverError && <Alert type="error" title="Login Failed" message={serverError} onClose={() => setServerError("")} />}
        <FormInput label="Username or Email" name="usernameOrEmail" type="text"
          value={formData.usernameOrEmail} onChange={handleChange} error={errors.usernameOrEmail}
          placeholder="Enter your username or email" required autoComplete="username email" disabled={loading} />
        <FormInput label="Password" name="password" type="password"
          value={formData.password} onChange={handleChange} error={errors.password}
          placeholder="Enter your password" required autoComplete="current-password"
          disabled={loading} showPasswordToggle />
        <div className="flex items-center justify-between">
          <Link href="/auth/reset-password" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Forgot your password?
          </Link>
        </div>
        <FormButton type="submit" variant="primary" loading={loading}
          disabled={!formData.usernameOrEmail.trim() || !formData.password.trim()} fullWidth>
          Sign In
        </FormButton>
        <button type="button" onClick={() => onCancel ? onCancel() : router.push('/')}
          className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </form>
      <div className="mt-4 text-center">
        {onRegisterClick ? (
          <button type="button" onClick={onRegisterClick}
            className="block w-full py-3 px-4 border border-blue-500 text-blue-600 font-black rounded-lg hover:bg-blue-50 transition-colors">
            Create an Account
          </button>
        ) : (
          <Link href="/auth/register"
            className="block w-full py-3 px-4 border border-blue-500 text-blue-600 font-black rounded-lg hover:bg-blue-50 transition-colors text-center">
            Create an Account
          </Link>
        )}
      </div>
    </div>
  );
}
