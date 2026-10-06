
"use client";

import { createPopper } from "@popperjs/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";

const UserDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  // Dropdown state
  const [dropdownPopoverShow, setDropdownPopoverShow] = useState(false);
  const btnDropdownRef = useRef(null);
  const popoverDropdownRef = useRef(null);
  const popperInstanceRef = useRef(null);

  // Memoize getInitials and getRoleColor to avoid recalculations
  const getInitials = useCallback((prenom, nom) => {
    return `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase() || "??";
  }, []);

  const getRoleColor = useCallback((role) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "coach":
        return "bg-blue-500";
      case "nutritionniste":
        return "bg-green-500";
      case "client":
        return "bg-blueGray-500";
      default:
        return "bg-blueGray-500";
    }
  }, []);

  // Memoize role label to avoid re-computation
  const roleLabel = useMemo(() => {
    if (!user?.role) return "Utilisateur";
    switch (user.role) {
      case "admin":
        return "Administrateur";
      case "coach":
        return "Coach Sportif";
      case "nutritionniste":
        return "Nutritionniste";
      case "client":
        return "Client";
      default:
        return "Utilisateur";
    }
  }, [user?.role]);

  // Initialize Popper.js once and update when needed
  useEffect(() => {
    if (dropdownPopoverShow && btnDropdownRef.current && popoverDropdownRef.current) {
      popperInstanceRef.current = createPopper(btnDropdownRef.current, popoverDropdownRef.current, {
        placement: "bottom-start",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ],
      });
    }
    return () => {
      if (popperInstanceRef.current) {
        popperInstanceRef.current.destroy();
        popperInstanceRef.current = null;
      }
    };
  }, [dropdownPopoverShow]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setDropdownPopoverShow((prev) => !prev);
  }, []);

  // Event handlers
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/auth/login");
  }, [dispatch, navigate]);

  const handleProfileClick = useCallback(() => {
    navigate("/admin/settings");
    setDropdownPopoverShow(false);
  }, [navigate]);

  const handleDashboardClick = useCallback(() => {
    navigate("/admin/dashboard");
    setDropdownPopoverShow(false);
  }, [navigate]);

  const handleUsersClick = useCallback(() => {
    navigate("/admin/users");
    setDropdownPopoverShow(false);
  }, [navigate]);

  return (
    <>
      <button
        className="text-blueGray-600 block focus:outline-none"
        ref={btnDropdownRef}
        onClick={toggleDropdown}
        disabled={loading}
      >
        <div className="items-center flex">
         <span
  className={`w-12 h-12 text-sm text-white inline-flex items-center justify-center rounded-full overflow-hidden ${
    user ? getRoleColor(user.role) : "bg-blueGray-200"
  }`}
>
  {user?.profilePhoto ? (
    <img
      src={`http://localhost:5000${user.profilePhoto}`}
      alt="Avatar"
      className="w-full h-full object-cover"
    />
  ) : user ? (
    <span className="font-bold text-lg">{getInitials(user.prenom, user.nom)}</span>
  ) : (
    <i className="fas fa-user"></i>
  )}
</span>

        </div>
      </button>

      <div
        ref={popoverDropdownRef}
        className={
          (dropdownPopoverShow ? "block " : "hidden ") +
          "bg-white text-base z-50 float-left py-2 list-none text-left rounded-md shadow-lg min-w-[200px] max-w-[300px]"
        }
      >
        {/* User Info Header */}
        {user && (
          <div className="px-4 py-3 border-b border-blueGray-100">
            <p className="text-sm font-semibold text-blueGray-700 truncate">
              {user.prenom || "Non spécifié"} {user.nom || "Non spécifié"}
            </p>
            <p className="text-xs text-blueGray-500 truncate">{user.email || "Email non défini"}</p>
            <p className="text-xs text-blueGray-400 capitalize">{roleLabel}</p>
          </div>
        )}

        {/* Menu Items */}
        <button
          className="text-sm py-2 px-4 font-medium block w-full whitespace-nowrap bg-transparent text-blueGray-700 hover:bg-blueGray-50 text-left transition-colors duration-150"
          onClick={handleProfileClick}
          disabled={loading}
        >
          <i className="fas fa-user mr-2 text-blue-500"></i>
          Mon Profil
        </button>

        <button
          className="text-sm py-2 px-4 font-medium block w-full whitespace-nowrap bg-transparent text-blueGray-700 hover:bg-blueGray-50 text-left transition-colors duration-150"
          onClick={handleDashboardClick}
          disabled={loading}
        >
          <i className="fas fa-tachometer-alt mr-2 text-blue-500"></i>
          Dashboard
        </button>

      
        <div className="h-0 my-2 border border-solid border-blueGray-100" />

        <button
          className="text-sm py-2 px-4 font-medium block w-full whitespace-nowrap bg-transparent text-red-600 hover:bg-red-50 text-left transition-colors duration-150"
          onClick={handleLogout}
          disabled={loading}
        >
          <i className="fas fa-sign-out-alt mr-2 text-red-500"></i>
          {loading ? "Déconnexion..." : "Se déconnecter"}
        </button>
      </div>
    </>
  );
};

export default UserDropdown;