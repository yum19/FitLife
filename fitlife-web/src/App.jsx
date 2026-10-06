"use client";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/styles/tailwind.css";

// layouts
import Admin from "./layouts/Admin.jsx";
import Auth from "./layouts/Auth.jsx";
// views without layouts
import Profile from "./views/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProduitsCatalog from "./views/admin/produit/ProduitsCatalog.jsx"; // Import the new component

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Protected routes with layouts */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        >
          {/* Nested route for ProduitsCatalog */}
          <Route path="tables/produits" element={<ProduitsCatalog />} />
        </Route>

        {/* Auth routes */}
        <Route path="/auth/*" element={<Auth />} />

        {/* Protected routes without layouts */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/auth/login"} replace />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/auth/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;