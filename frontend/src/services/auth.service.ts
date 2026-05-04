// src/services/auth.service.ts - Enhanced Authentication Service
import { api } from "./api";
import { API_BASE_URL } from "./api";

// Request/Response Interfaces
interface LoginRequest {
  username: string; // Can be username or email
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId?: number;
}

interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface PasswordResetConfirmRequest {
  email: string;
  token: string; // 6-digit OTP
  newPassword: string;
}

interface EmailVerificationRequest {
  email: string;
}

interface TokenRefreshRequest {
  refreshToken: string;
}

interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: string;
}

interface PasswordResetResponse {
  success: boolean;
  message: string;
  expiresInMinutes?: number;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
  expiresInMinutes?: number;
}

// Authentication Methods
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('🔐 LOGIN REQUEST → /auth/login', { username: data.username });
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ LOGIN ERROR:', response.status, errorText);
      
      // Try to parse JSON error for better message
      let errorMessage = "Login failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      
      // Handle specific error cases
      if (response.status === 423) {
        throw new Error("Account is locked due to too many failed attempts. Please try again later or reset your password.");
      } else if (response.status === 429) {
        throw new Error(errorMessage || "Too many requests from this IP address. Please try again later.");
      } else if (response.status === 401) {
        if (errorMessage.toLowerCase().includes('inactive') || errorMessage.toLowerCase().includes('blocked')) {
          throw new Error("Your account has been deactivated or blocked. Please contact the administrator for more information.");
        }
        if (errorMessage.toLowerCase().includes('locked')) {
          throw new Error(errorMessage);
        }
        throw new Error("Invalid username/email or password.");
      } else if (response.status === 403) {
        throw new Error("Email verification required. Please check your email and verify your account.");
      }
      
      throw new Error(errorMessage || `Login failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ LOGIN RESPONSE:', result);
    
    return result;
  } catch (error) {
    console.log('❌ LOGIN NETWORK ERROR:', error);
    throw error;
  }
};

export const register = async (data: RegisterRequest): Promise<any> => {
  console.log('🔐 REGISTER → /auth/register', { username: data.username, email: data.email });
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ REGISTER ERROR:', response.status, errorText);
      
      // Try to parse JSON error response for better message
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.details || errorJson.rootCause || errorJson.error || "Registration failed";
        throw new Error(errorMessage);
      } catch {
        throw new Error(errorText || "Registration failed");
      }
    }
    
    const result = await response.json();
    console.log('✅ REGISTER SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('❌ REGISTER NETWORK ERROR:', error);
    throw error;
  }
};

export const logout = async (refreshToken?: string): Promise<void> => {
  console.log('🔐 LOGOUT → /auth/revoke-token');
  
  try {
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/revoke-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }
    
    // Clear local storage regardless of API call success
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    console.log('✅ LOGOUT SUCCESS');
  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error);
    // Still clear local storage even if API call fails
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
};

// Password Reset Methods
export const initiatePasswordReset = async (data: ResetPasswordRequest): Promise<PasswordResetResponse> => {
  console.log('🔐 PASSWORD RESET → /auth/reset-password', { email: data.email });
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PASSWORD RESET ERROR:', response.status, errorText);
      throw new Error(errorText || "Password reset failed");
    }
    
    const result = await response.json();
    console.log('✅ PASSWORD RESET SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('❌ PASSWORD RESET NETWORK ERROR:', error);
    throw error;
  }
};

export const confirmPasswordReset = async (data: PasswordResetConfirmRequest): Promise<PasswordResetResponse> => {
  console.log('🔐 PASSWORD RESET CONFIRM → /auth/reset-password/confirm');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PASSWORD RESET CONFIRM ERROR:', response.status, errorText);
      throw new Error(errorText || "Password reset confirmation failed");
    }
    
    const result = await response.json();
    console.log('✅ PASSWORD RESET CONFIRM SUCCESS:', result);
    return result;
  } catch (error) {
    console.error('❌ PASSWORD RESET CONFIRM NETWORK ERROR:', error);
    throw error;
  }
};

export const validateResetToken = async (token: string): Promise<PasswordResetResponse> => {
  console.log('🔐 VALIDATE RESET TOKEN → /auth/reset-password/validate');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Token validation failed");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ VALIDATE RESET TOKEN ERROR:', error);
    throw error;
  }
};

// Email Verification Methods
export const sendVerificationEmail = async (data: EmailVerificationRequest): Promise<EmailVerificationResponse> => {
  console.log('🔐 SEND VERIFICATION → /auth/send-verification', { email: data.email });
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to send verification email");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ SEND VERIFICATION ERROR:', error);
    throw error;
  }
};

export const verifyEmail = async (token: string): Promise<EmailVerificationResponse> => {
  console.log('🔐 VERIFY EMAIL → /auth/verify-email');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Email verification failed");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ VERIFY EMAIL ERROR:', error);
    throw error;
  }
};

export const verifyEmailWithOtp = async (email: string, otp: string): Promise<EmailVerificationResponse> => {
  console.log('🔐 VERIFY EMAIL OTP → /auth/verify-email-otp');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Email verification failed");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ VERIFY EMAIL OTP ERROR:', error);
    throw error;
  }
};

export const resendVerificationEmail = async (userId: number): Promise<EmailVerificationResponse> => {
  console.log('🔐 RESEND VERIFICATION → /auth/resend-verification');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to resend verification email");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ RESEND VERIFICATION ERROR:', error);
    throw error;
  }
};

export const checkEmailVerified = async (email: string): Promise<EmailVerificationResponse> => {
  console.log('🔐 CHECK EMAIL VERIFIED → /auth/email-verified');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/email-verified?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to check email verification status");
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ CHECK EMAIL VERIFIED ERROR:', error);
    throw error;
  }
};

// Token Refresh Methods
export const refreshToken = async (refreshToken: string): Promise<TokenPairResponse> => {
  console.log('🔐 REFRESH TOKEN → /auth/refresh');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ REFRESH TOKEN ERROR:', response.status, errorText);
      throw new Error(errorText || "Token refresh failed");
    }
    
    const result = await response.json();
    console.log('✅ REFRESH TOKEN SUCCESS');
    return result;
  } catch (error) {
    console.error('❌ REFRESH TOKEN NETWORK ERROR:', error);
    throw error;
  }
};

export const validateRefreshToken = async (token: string): Promise<{ valid: boolean; userId?: number }> => {
  console.log('🔐 VALIDATE REFRESH TOKEN → /auth/validate-refresh-token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate-refresh-token?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ VALIDATE REFRESH TOKEN ERROR:', error);
    return { valid: false };
  }
};

// Legacy method for backward compatibility
export const resetPassword = initiatePasswordReset;
