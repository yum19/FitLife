import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants/Config";

// Define the Produit interface based on your backend schema
export interface Produit {
  _id: string;
  nom: string;
  categorie: string;
  marque: string;
  prix: number;
  description: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Custom hook to manage product data
export const useProductService = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const response = await axios.get<Produit[]>(`${API_URL}/produits`, {
          timeout: 5000,
        });
        console.log("Fetched products:", response.data);
        setProduits(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("Network error details:", {
          message: errorMessage,
          code: (err as any)?.code,
          config: (err as any)?.config,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  return { produits, loading, error };
};