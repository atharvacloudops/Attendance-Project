import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/api.service';

// ─── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  studentProfile: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isLoading: true,   // true on app start while we verify token
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        studentProfile: action.payload.studentProfile || null,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return { ...initialState, isLoading: false };

    case 'UPDATE_STUDENT_PROFILE':
      return { ...state, studentProfile: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Verify existing token on app load ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: 'AUTH_ERROR', payload: null });
      return;
    }
    verifyToken();
    // eslint-disable-next-line
  }, []);

  const verifyToken = async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const res = await authService.getMe();
      const { user, studentProfile } = res.data;
      const token = localStorage.getItem('token');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, studentProfile, token } });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'AUTH_ERROR', payload: null });
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const res = await authService.login({ email, password });
      const { token, user, studentProfile } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { token, user, studentProfile } });
      return { success: true, role: user.role };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: msg });
      return { success: false, error: msg };
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const res = await authService.register(data);
      const { token, user, studentProfile } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { token, user, studentProfile } });
      return { success: true, role: user.role };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: msg });
      return { success: false, error: msg };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // ── Update student profile in context ─────────────────────────────────────
  const updateStudentProfile = useCallback((profile) => {
    dispatch({ type: 'UPDATE_STUDENT_PROFILE', payload: profile });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateStudentProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Custom hook ──────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
