"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"
import { forgotPassword, clearError } from "../../store/authSlice"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email === "") return

    dispatch(forgotPassword(email)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        navigate("/auth/login", { state: { message: "Email de réinitialisation envoyé avec succès" } })
      }
    })
  }

  return (
    <div className="max-w-md bg-white rounded-xl shadow-2xl p-8 mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-blueGray-800 mb-1">Reset Password</h2>
        <p className="text-blueGray-500">Enter your email to receive a password reset link</p>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-100 rounded px-4 py-2 text-sm">{error}</div>}
      {location.state?.message && (
        <div className="mb-4 text-green-600 bg-green-100 rounded px-4 py-2 text-sm">
          {location.state.message}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blueGray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150"
            placeholder="Email"
            required
          />
        </div>

        <button
          className="w-full bg-blueGray-800 text-white font-bold py-3 rounded shadow hover:shadow-lg transition-all duration-150 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="flex justify-center mt-6">
        <p className="text-sm text-blueGray-500">
          Back to{" "}
          <Link to="/auth/login" className="font-medium text-blueGray-800 hover:text-blueGray-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}