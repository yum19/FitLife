import axios from 'axios';
import { API_URL } from '../constants/Config';
import { store } from '@/redux/store';

export interface Progression {
  _id: string;
  clientId: {
    _id: string;
    email: string;
    nom: string;
  };
  type: 'poids' | 'menstruation' | 'calories_brulees' | 'stress' | 'sommeil';
  valeur: number;
  unite: string;
  dateEnregistrement: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

class ProgressionService {
  private getHeaders() {
    const state = store.getState();
    const token = state.auth.token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async addProgression(progression: Omit<Progression, '_id'>) {
    try {
      const response = await axios.post(
        `${API_URL}/progression/add`,
        progression,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProgressionsByClientId(clientId: string) {
    try {
      const response = await axios.get(
        `${API_URL}/progression/client/${clientId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProgressionsByType(type: Progression['type']) {
    try {
      const response = await axios.get(
        `${API_URL}/progression/type/${type}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProgression(id: string, progression: Partial<Progression>) {
    try {
      const response = await axios.put(
        `${API_URL}/progression/${id}`,
        progression,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteProgression(id: string) {
    try {
      const response = await axios.delete(
        `${API_URL}/progression/${id}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      if (error.response?.status === 404) {
        return new Error('Resource not found. Please check the API endpoint.');
      }
      if (error.response?.status === 401) {
        return new Error('Unauthorized. Please check your authentication.');
      }
      return new Error(
        error.response?.data?.message || 
        `Error ${error.response?.status}: ${error.response?.statusText}` ||
        'An error occurred with the progression service'
      );
    }
    return new Error('An unexpected error occurred');
  }
}

export const progressionService = new ProgressionService();
