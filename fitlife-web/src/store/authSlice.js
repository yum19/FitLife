"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

// ========== THUNKS ==========

// LOGIN
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const loginData = {
        email: credentials.email,
        motDePasse: credentials.password,
      };

      const response = await axios.post(`${API_URL}/login`, loginData);

      // Sauvegarde token ET user dans localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Échec de la connexion"
      );
    }
  }
);

// UPDATE PROFILE
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_URL}/users`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Échec de la mise à jour du profil"
      );
    }
  }
);


// FORGOT PASSWORD
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg ||
          "Échec de l'envoi de l'email de réinitialisation"
      );
    }
  }
);

// RESET PASSWORD
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/reset-password/${token}`,
        {
          motDePasse: password,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Échec de la réinitialisation du mot de passe"
      );
    }
  }
);

// GET ALL USERS
export const getAllUsers = createAsyncThunk(
  "auth/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Échec de la récupération des utilisateurs"
      );
    }
  }
);

// ========== SLICE ==========

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    users: null, // Added to store all users
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.users = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // UPDATE PROFILE
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // FORGOT PASSWORD
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // RESET PASSWORD
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // GET ALL USERS
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
