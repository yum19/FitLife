import { authService } from '@/services/authService';
import type { AuthState, User } from "@/types/auth";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, motDePasse }: { email: string; motDePasse: string }, { rejectWithValue }) => {
    try {
      const { user, token } = await authService.login(email, motDePasse);
      const mappedUser = {
        _id: user._id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        age: user.age,
        sexe: user.sexe,
        taille: user.taille,
        poids: user.poids,
        role: user.role,
        objectif: user.objectif,
        allergies: user.allergies,
        certifications: user.certifications,
        specialites: user.specialites,
        disponible: user.disponible,
        profilePhoto: user.profilePhoto?? "",
        niveauActivite: user.niveauActivite ?? '', // or a suitable default
        isBlocked: user.isBlocked ?? false,    
        
      };
      return { user: mappedUser, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload: any, { rejectWithValue }) => {
    try {
      const { user, token } = await authService.register(payload);
      const mappedUser = {
        _id: user._id,
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        age: user.age,
        sexe: user.sexe,
        taille: user.taille,
        poids: user.poids,
        role: user.role,
        objectif: user.objectif,
        allergies: user.allergies,
        certifications: user.certifications,
        specialites: user.specialites,
        disponible: user.disponible,
        profilePhoto: user.profilePhoto ?? "",
        niveauActivite: user.niveauActivite ?? '', // or a suitable default
        isBlocked: user.isBlocked ?? false,    

      };
      return { user: mappedUser, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state: any) => !!(state.auth.user && state.auth.token);
export const selectIsLoading = (state: any) => state.auth.loading;
export const selectAuthError = (state: any) => state.auth.error;
