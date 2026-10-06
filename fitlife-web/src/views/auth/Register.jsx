import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      if (!form.email || !form.password || !form.confirmPassword) {
        setError("All fields are required.");
      } else if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
      } else {
        // Success: redirect or show message
      }
    }, 1000);
  };

  return (
    <div className="max-w-md bg-white rounded-xl shadow-2xl p-8 mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-blueGray-800 mb-1">Create an account</h2>
        <p className="text-blueGray-500">Sign up to get started</p>
      </div>
      {error && (
        <div className="mb-4 text-red-600 bg-red-100 rounded px-4 py-2 text-sm">{error}</div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blueGray-700 mb-2">Email</label>
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
          <label htmlFor="password" className="block text-sm font-medium text-blueGray-700 mb-2">Password</label>
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
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-blueGray-700 mb-2">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
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
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <div className="flex justify-center mt-6">
        <p className="text-sm text-blueGray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-blueGray-800 hover:text-blueGray-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
