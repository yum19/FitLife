import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../views/auth/Login";
import ForgotPassword from "../views/auth/ForgotPassword";
import ResetPassword from "../views/auth/ResetPassword";

export default function Auth() {
  return (
    <div 
      className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-blueGray-800 bg-cover bg-center" 
      style={{backgroundImage: "url(/src/assets/img/register_bg_2.png)"}}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="login" replace />} />
        </Routes>
      </div>
    </div>
  );
}