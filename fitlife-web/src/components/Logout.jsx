"use client"

import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { logout } from "../store/authSlice"

export default function Logout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate("/auth/login")
  }

  return (
    <button onClick={handleLogout} className="text-blueGray-500 block px-4 py-2 text-sm">
      Se déconnecter
    </button>
  )
}
