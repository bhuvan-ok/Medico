import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../lib/axios.js';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

// Silently restore session from refresh token cookie on app startup
export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
    const accessToken = refreshRes.data.data.accessToken;

    const userRes = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      withCredentials: true,
    });

    return { accessToken, user: userRes.data.data };
  } catch {
    return rejectWithValue(null);
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const logoutThunk = createAsyncThunk('auth/logoutThunk', async () => {
  await axiosInstance.post('/auth/logout').catch(() => {});
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    loading: false,
    initializing: true,  // true until the startup cookie-check completes
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    setCredentials: (state, action) => {
      if (action.payload.accessToken) state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── initializeAuth ──────────────────────────────────────────────────────
      .addCase(initializeAuth.pending, (state) => {
        state.initializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.initializing = false;
        // No valid cookie — user stays logged out, no error shown
      })
      // ── login ───────────────────────────────────────────────────────────────
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // ── register ────────────────────────────────────────────────────────────
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        toast.success('Account created! Please check your email to verify.');
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // ── logout ──────────────────────────────────────────────────────────────
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        toast.success('Logged out');
      });
  },
});

export const { logout, setCredentials, clearError } = authSlice.actions;
export const selectCurrentUser  = (state) => state.auth.user;
export const selectAccessToken  = (state) => state.auth.accessToken;
export const selectAuthLoading  = (state) => state.auth.loading;
export const selectInitializing = (state) => state.auth.initializing;
export default authSlice.reducer;
