"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { getAllUsers } from "../../store/authSlice"
import UsersTable from "../../components/Cards/UsersTable.jsx"

export default function UsersByRole() {
  const { role } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { users, loading, error, user } = useSelector((state) => state.auth)

  const [filteredUsers, setFilteredUsers] = useState([])
  const hasNavigated = useRef(false) // Prevent multiple navigations
  const hasFetchedUsers = useRef(false) // Prevent multiple API calls

  // Role configuration for validation
  const validRoles = ["admin", "coach", "nutritionniste", "client"]
  const roleLabels = {
    admin: "Administrateurs",
    coach: "Coachs Sportifs",
    nutritionniste: "Nutritionnistes",
    client: "Clients",
  }

  // Check if user is admin - only run once
  useEffect(() => {
    if (user && user.role !== "admin" && !hasNavigated.current) {
      hasNavigated.current = true
      navigate("/admin/dashboard", { replace: true })
    }
  }, [user, navigate])

  // Fetch users if not already loaded - only run once
  useEffect(() => {
    if (user?.role === "admin" && !users && !loading && !hasFetchedUsers.current) {
      hasFetchedUsers.current = true
      dispatch(getAllUsers())
    }
  }, [dispatch, user?.role, users, loading])

  // Filter users by role - only when users or role changes
  useEffect(() => {
    if (users && Array.isArray(users) && role) {
      const filtered = users.filter((u) => u.role?.toLowerCase() === role.toLowerCase())
      setFilteredUsers(filtered)
    }
  }, [users, role])

  // Early return if user is not admin
  if (user && user.role !== "admin") {
    return null // Component will unmount due to navigation
  }

  // Validate role parameter
  if (!validRoles.includes(role?.toLowerCase())) {
    return (
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
            <div className="rounded-t mb-0 px-4 py-3 border-0">
              <div className="flex flex-wrap items-center">
                <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-center">
                  <h3 className="font-semibold text-lg text-red-600">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Rôle invalide
                  </h3>
                  <p className="text-blueGray-500 mt-2">
                    Le rôle "{role}" n'est pas reconnu. Rôles valides: {validRoles.join(", ")}
                  </p>
                  <button
                    onClick={() => navigate("/admin/dashboard", { replace: true })}
                    className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mt-4 ease-linear transition-all duration-150"
                  >
                    Retour au Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
            <div className="rounded-t mb-0 px-4 py-3 border-0">
              <div className="flex flex-wrap items-center justify-center">
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-lightBlue-500 mb-4"></i>
                  <h3 className="font-semibold text-lg text-blueGray-700">Chargement des utilisateurs...</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
            <div className="rounded-t mb-0 px-4 py-3 border-0">
              <div className="flex flex-wrap items-center">
                <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-center">
                  <h3 className="font-semibold text-lg text-red-600">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    Erreur de chargement
                  </h3>
                  <p className="text-blueGray-500 mt-2">{error}</p>
                  <button
                    onClick={() => {
                      hasFetchedUsers.current = false
                      dispatch(getAllUsers())
                    }}
                    className="bg-lightBlue-500 text-white active:bg-lightBlue-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mt-4 ease-linear transition-all duration-150"
                  >
                    <i className="fas fa-redo mr-1"></i>
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-wrap mt-4">
        <div className="w-full px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
            <div className="rounded-t mb-0 px-4 py-3 border-0">
              <div className="flex flex-wrap items-center">
                <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                      <li className="inline-flex items-center">
                        <button
                          onClick={() => navigate("/admin/dashboard", { replace: true })}
                          className="inline-flex items-center text-sm font-medium text-blueGray-700 hover:text-lightBlue-600 transition-colors"
                          type="button"
                        >
                          <i className="fas fa-home mr-2"></i>
                          Dashboard
                        </button>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <i className="fas fa-chevron-right text-blueGray-400 mx-2"></i>
                          <span className="ml-1 text-sm font-medium text-blueGray-500 md:ml-2">Utilisateurs</span>
                        </div>
                      </li>
                      <li aria-current="page">
                        <div className="flex items-center">
                          <i className="fas fa-chevron-right text-blueGray-400 mx-2"></i>
                          <span className="ml-1 text-sm font-medium text-lightBlue-600 md:ml-2">
                            {roleLabels[role]}
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex flex-wrap">
        <div className="w-full mb-12 px-4">
          <UsersTable users={filteredUsers} role={role} />
        </div>
      </div>
    </>
  )
}
