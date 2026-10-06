import { useEffect, useState } from "react";

import CardProduitsCatalog from "../../../components/Cards/CardProduitsCatalog";

export default function ProduitsCatalog() {
  const [produits, setProduits] = useState([]);


  useEffect(() => {
    // Fetch produits from your API or MongoDB
    fetch("http://localhost:5000/api/produits") // Use full URL with backend port
      .then((response) => {
        console.log("Response status:", response.status); // Debug response status
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log("Fetched data:", data); // Debug fetched data
        setProduits(data);
      })
      .catch((error) => console.error("Error fetching produits:", error));
  }, []);

  console.log("Rendering ProduitsCatalog, produits:", produits); // Debug render

  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full xl:w-12/12 mb-12 xl:mb-0 px-4">
          <CardProduitsCatalog produits={produits} color="light"/>
        </div>
      </div>
    </>
  );
}