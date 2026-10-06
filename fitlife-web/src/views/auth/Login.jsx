"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { loginUser, clearError } from "../../store/authSlice"

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard")
      } else {
        window.alert("Accès réservé aux administrateurs uniquement")
        dispatch(clearError())
        navigate("/auth/login")
      }
    }
  }, [isAuthenticated, user, navigate, dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.email === "" || form.password === "") {
      return
    }

    dispatch(
      loginUser({
        email: form.email,
        password: form.password,
      })
    )
  }

  return (
    <div className="max-w-md bg-white rounded-xl shadow-2xl p-8 mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-blueGray-800 mb-1">Admin Login</h2>
        <p className="text-blueGray-500">Sign in to access the admin dashboard</p>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-100 rounded px-4 py-2 text-sm">{error}</div>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blueGray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="border px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150"
            placeholder="Email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blueGray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="border px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150"
            placeholder="Password"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center cursor-pointer">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={handleChange}
              className="form-checkbox border rounded text-blueGray-700 ml-1 w-5 h-5 transition-all duration-150"
            />
            <span className="ml-2 text-sm text-blueGray-600">Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="text-sm text-blueGray-400 hover:text-blueGray-700">
            Forgot password?
          </Link>
        </div>

        <button
          className="w-full bg-blueGray-800 text-white font-bold py-3 rounded shadow hover:shadow-lg transition-all duration-150 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  )
}