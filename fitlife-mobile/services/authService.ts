import AsyncStorage from "@react-native-async-storage/async-storage"




const API_BASE_URL = "http://192.168.1.18:5000/api"




interface User {
  _id: string
    email: string
    prenom: string
    nom: string
    age: number
    sexe: string
    taille: number
    poids: number
    role: string
    objectif: string
    allergies: string[]
    certifications: string[]
    specialites: string[]
    disponible: boolean
    niveauActivite: string;
    profilePhoto?: string;
    isBlocked: boolean;
}

interface AuthResponse {
  token: string
  user: User
}

interface RegisterBody {
  email: string
  motDePasse: string
  prenom: string
  nom: string
  age: number
  sexe: string
  taille: number
  poids: number
  role: string
  objectif: string
  allergies: string[]
}

class AuthService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async login(email: string, motDePasse: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, motDePasse }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      await AsyncStorage.setItem("authToken", data.token)
      return data
    } catch (error) {
      console.error("Login error:", error)
      throw new Error("An error occurred during login.")
    }
  }

  async register(body: RegisterBody): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    await AsyncStorage.setItem("authToken", data.token);
    return data;
  }

  async updateUserProfile(id: string, data: any): Promise<any> {
    const token = await AsyncStorage.getItem("authToken");
    let headers: any = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    let body: any;
    let url = `${API_BASE_URL}/auth/users`;
    let method = 'PUT';
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      // Let fetch/browser set the Content-Type with boundary
      body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
      url = `${API_BASE_URL}/users/${id}`;
    }
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    let result;
    try {
      result = await response.json();
    } catch (e) {
      const text = await response.text();
      throw new Error(text || 'Unknown error');
    }
    if (!response.ok) {
      throw new Error(result?.msg || 'Failed to update profile');
    }
    return result;
  }
// 
  async getCurrentUser(): Promise<User> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get current user")
      }

      return data.user
    } catch (error) {
      console.error("Get user error:", error)
      throw new Error("Failed to retrieve current user.")
    }
  }
//not used yet
  async refreshToken(): Promise<string> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to refresh token")
      }

      await AsyncStorage.setItem("authToken", data.token)
      return data.token
    } catch (error) {
      console.error("Refresh token error:", error)
      throw new Error("Token refresh failed.")
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem("authToken")
  }

  async forgotPassword(email: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to send reset email");
    }
    return data.msg;
  }
}

export const authService = new AuthService()
