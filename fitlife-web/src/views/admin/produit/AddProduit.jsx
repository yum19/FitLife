import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddProduit() {
  const [formData, setFormData] = useState({
    nom: "",
    categorie: "Food supplements",
    marque: "",
    prix: "",
    description: "",
    image: "",
  });
  const [previewImage, setPreviewImage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'nom':
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must contain at least 2 characters";
        if (value.trim().length > 100) return "Name cannot exceed 100 characters";
        return "";
      
      case 'marque':
        if (!value.trim()) return "Brand is required";
        if (value.trim().length < 2) return "Brand must contain at least 2 characters";
        if (value.trim().length > 50) return "Brand cannot exceed 50 characters";
        return "";
      
      case 'prix':
        if (!value) return "Price is required";
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return "Price must be a valid number";
        if (numValue <= 0) return "Price must be greater than 0";
        if (numValue > 999999) return "Price cannot exceed 999,999";
        return "";
      
      case 'description':
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 10) return "Description must contain at least 10 characters";
        if (value.trim().length > 1000) return "Description cannot exceed 1000 characters";
        return "";
      
      case 'image':
        if (!value) return "An image is required";
        return "";
      
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size cannot exceed 5MB",
        }));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          image: "Unsupported image format. Use JPEG, PNG, GIF or WebP",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
        setPreviewImage(reader.result);
        setErrors((prev) => ({ ...prev, image: "" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched({
      nom: true,
      marque: true,
      prix: true,
      description: true,
      image: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      console.log("Sending product data:", formData);
      
      const response = await fetch("http://localhost:5000/api/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server response:", errorData);
        throw new Error(`Server returned ${response.status}: ${errorData || 'Unknown error'}`);
      }
      
      const newProduit = await response.json();
      console.log("Product added successfully:", newProduit);
      navigate("/admin/tables/produits");
      
    } catch (error) {
      console.error("Error adding product:", error);
      setSubmitError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
      <div className="rounded-t bg-white mb-0 px-6 py-6">
        <div className="text-center flex justify-between">
          <h6 className="text-blueGray-700 text-xl font-bold">Add Product</h6>
          <button
            className={`${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-lightBlue-500 hover:shadow-md active:bg-lightBlue-600'
            } text-white font-bold uppercase text-xs px-4 py-2 rounded shadow outline-none focus:outline-none mr-1 ease-linear transition-all duration-150`}
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{submitError}</span>
            </div>
          )}
          
          <h6 className="text-blueGray-400 text-sm mt-3 mb-6 font-bold uppercase">
            Product Information
          </h6>

          <div className="flex flex-wrap">
            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    errors.nom ? 'border-red-500 border-2' : ''
                  }`}
                  placeholder="Product Name"
                  required
                />
                {errors.nom && (
                  <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Category
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  required
                >
                  <option value="Food supplements">Food supplements</option>
                  <option value="Sports equipment">Sports equipment</option>
                </select>
              </div>
            </div>

            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="marque"
                  value={formData.marque}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    errors.marque ? 'border-red-500 border-2' : ''
                  }`}
                  placeholder="Brand Name"
                  required
                />
                {errors.marque && (
                  <p className="text-red-500 text-xs mt-1">{errors.marque}</p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Price
                </label>
                <input
                  type="number"
                  name="prix"
                  value={formData.prix}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  step="0.01"
                  className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    errors.prix ? 'border-red-500 border-2' : ''
                  }`}
                  placeholder="Price"
                  required
                />
                {errors.prix && (
                  <p className="text-red-500 text-xs mt-1">{errors.prix}</p>
                )}
              </div>
            </div>

            <div className="w-full px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="3"
                  className={`border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    errors.description ? 'border-red-500 border-2' : ''
                  }`}
                  placeholder="Product Description"
                  required
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-6/12 px-4">
              <div className="relative w-full mb-3">
                <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${
                    errors.image ? 'border-red-500 border-2' : ''
                  }`}
                />
                {errors.image && (
                  <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                )}
                {previewImage && (
                  <div className="mt-2">
                    <img src={previewImage} alt="Preview" className="max-w-xs h-auto rounded shadow" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}