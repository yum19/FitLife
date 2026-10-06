"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate, useParams } from "react-router-dom"
import { resetPassword, clearError } from "../../store/authSlice"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useParams()
  const { loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === "" || confirmPassword === "") return
    if (password !== confirmPassword) {
      dispatch({ type: "auth/resetPassword/rejected", payload: "Les mots de passe ne correspondent pas" })
      return
    }

    dispatch(resetPassword({ token, password })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        navigate("/auth/login", { state: { message: "Mot de passe réinitialisé avec succès" } })
      }
    })
  }

  return (
    <div className="max-w-md bg-white rounded-xl shadow-2xl p-8 mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-blueGray-800 mb-1">Set New Password</h2>
        <p className="text-blueGray-500">Enter your new password</p>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-100 rounded px-4 py-2 text-sm">{error}</div>}
      {location.state?.message && (
        <div className="mb-4 text-green-600 bg-green-100 rounded px-4 py-2 text-sm">
          {location.state.message}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blueGray-700 mb-2">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150"
            placeholder="New Password"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-blueGray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150"
            placeholder="Confirm Password"
            required
          />
        </div>

        <button
          className="w-full bg-blueGray-800 text-white font-bold py-3 rounded shadow hover:shadow-lg transition-all duration-150 mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
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