import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if valid token exists on load
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setUser({ token });
        } catch (error) {
          console.error(error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Returns response data — caller checks for requiresOTP
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // If OTP is required, do NOT store token yet
    if (res.data.requiresOTP) {
      return res.data; // { requiresOTP: true, email, message }
    }
    // Fallback: if no OTP required (shouldn't happen with new flow)
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user || { token: res.data.token });
    return res.data;
  };

  // Returns response data — caller checks for requiresOTP
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    // If OTP is required, do NOT store token yet
    if (res.data.requiresOTP) {
      return res.data; // { requiresOTP: true, email, message }
    }
    // Fallback
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user || { token: res.data.token });
    return res.data;
  };

  // Verify OTP — this is where the token is finally stored
  const verifyOTP = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user || { token: res.data.token, name: res.data.name, email: res.data.email });
    return res.data;
  };

  // Resend OTP
  const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  // Google OAuth — no OTP needed
  const googleLogin = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user || { token: res.data.token, name: res.data.name, email: res.data.email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOTP, resendOTP, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
