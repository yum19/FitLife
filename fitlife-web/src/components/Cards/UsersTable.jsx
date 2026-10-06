"use client"

import PropTypes from "prop-types"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Lock, Unlock, Eye } from "lucide-react"
import "../../assets/styles/users-table.css"
import axios from "axios"

export default function UsersTable({ users: initialUsers, role }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [usersState, setUsersState] = useState(initialUsers)
  const [alert, setAlert] = useState({ show: false, message: "", type: "" })
  const usersPerPage = 8

  useEffect(() => {
    setUsersState(initialUsers)
  }, [initialUsers])

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = usersState.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(usersState.length / usersPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const roleConfig = {
    admin: {
      label: "Administrateurs",
      icon: "fas fa-shield-alt",
      badgeClass: "userstable-role-admin",
      iconColorClass: "text-red-600",
    },
    coach: {
      label: "Coachs Sportifs",
      icon: "fas fa-dumbbell",
      badgeClass: "userstable-role-coach",
      iconColorClass: "text-blue-600",
    },
    nutritionniste: {
      label: "Nutritionnistes",
      icon: "fas fa-apple-alt",
      badgeClass: "userstable-role-nutritionniste",
      iconColorClass: "text-green-600",
    },
    client: {
      label: "Clients",
      icon: "fas fa-user",
      badgeClass: "userstable-role-client",
      iconColorClass: "text-gray-600",
    },
  }

  const currentRole = roleConfig[role] || {
    label: "Users",
    icon: "fas fa-users",
    badgeClass: "userstable-role-client",
    iconColorClass: "text-blueGray-500",
  }

  const getUserStatus = (user) => {
    return user.disponible !== undefined ? (user.disponible ? "Disponible" : "Indisponible") : "Actif"
  }

  const getStatusColorClass = (status) => {
    switch (status.toLowerCase()) {
      case "disponible":
      case "actif":
        return "userstable-status-available"
      case "indisponible":
        return "userstable-status-unavailable"
      default:
        return "userstable-status-default"
    }
  }

  const toggleBlockUser = async (userId, isBlocked, userName) => {
    const action = isBlocked ? "débloquer" : "bloquer"
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} l'utilisateur ${userName} ?`

    if (!window.confirm(confirmMessage)) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setAlert({ show: true, message: "Erreur d'authentification : Veuillez vous reconnecter.", type: "error" })
        return
      }

      const endpoint = `http://localhost:5000/api/auth/${isBlocked ? "unblock" : "block"}/${userId}`
      const response = await axios.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } })

      setUsersState((prevUsers) =>
        prevUsers.map((user) => (user._id === userId ? { ...user, isBlocked: !isBlocked } : user)),
      )

      setAlert({
        show: true,
        message: `L'utilisateur ${userName} a été ${action} avec succès !`,
        type: "success",
      })
    } catch (error) {
      const errorMessage = error.response?.data?.msg || error.message
      setAlert({ show: true, message: `Échec de ${action} l'utilisateur : ${errorMessage}`, type: "error" })
    }

    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" })
    }, 3000)
  }

  const renderRoleSpecificHeaders = () => {
    switch (role) {
      case "client":
        return <th className="userstable-th">Objectif</th>
      case "coach":
      case "nutritionniste":
        return (
          <>
            <th className="userstable-th">Certifications</th>
            <th className="userstable-th">Spécialités</th>
          </>
        )
      default:
        return null
    }
  }

  const renderRoleSpecificData = (user) => {
    switch (role) {
      case "client":
        return <td className="userstable-td">{user.objectif || "N/A"}</td>
      case "coach":
      case "nutritionniste":
        return (
          <>
            <td className="userstable-td">
              {user.certifications?.length > 0 ? user.certifications.join(", ") : "Aucune"}
            </td>
            <td className="userstable-td">
              {user.specialites?.length > 0 ? user.specialites.join(", ") : "Aucune"}
            </td>
          </>
        )
      default:
        return null
    }
  }

  const getColSpan = () => {
    let count = 5
    if (role === "client") count += 1
    else if (role === "coach" || role === "nutritionniste") count += 2
    if (role !== "admin") count += 1
    return count
  }

  return (
    <div className="userstable-container">
      {alert.show && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${
            alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="userstable-header">
        <div className="userstable-header-content">
          <div className="userstable-title-wrapper">
            <h3 className="userstable-title">
              <i className={`${currentRole.icon} userstable-icon ${currentRole.iconColorClass}`}></i>
              {currentRole.label}
              <span className="userstable-count">
                ({usersState.length} utilisateur{usersState.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
        </div>
      </div>

      <div className="userstable-table-wrapper">
        <table className="userstable-table">
          <thead>
            <tr>
              <th className="userstable-th">Utilisateur</th>
              <th className="userstable-th">Email</th>
              <th className="userstable-th">Rôle</th>
              <th className="userstable-th">Statut</th>
              <th className="userstable-th">Date d'inscription</th>
              {renderRoleSpecificHeaders()}
              {role !== "admin" && <th className="userstable-th">Action</th>}
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={getColSpan()} className="userstable-no-users">
                  Aucun utilisateur trouvé pour ce rôle
                </td>
              </tr>
            ) : (
              currentUsers.map((user, index) => {
                const status = getUserStatus(user)
                const statusColorClass = getStatusColorClass(status)
                const userName = `${user.prenom || "N/A"} ${user.nom || "N/A"}`

                return (
                  <tr key={user._id || index} className="userstable-tr">
                    <td className="userstable-td userstable-user-cell">
                      <div className="userstable-avatar-wrapper">
                        <i className={`${currentRole.icon} userstable-avatar-icon ${currentRole.iconColorClass}`}></i>
                      </div>
                      <span className="userstable-user-name">{userName}</span>
                    </td>
                    <td className="userstable-td">{user.email}</td>
                    <td className="userstable-td">
                      <span className={`userstable-role-badge ${currentRole.badgeClass}`}>
                        <i className={`${currentRole.icon} userstable-icon`}></i>
                        {currentRole.label}
                      </span>
                    </td>
                    <td className="userstable-td">
                      <i className={`fas fa-circle userstable-status-icon ${statusColorClass}`}></i>
                      {status}
                    </td>
                    <td className="userstable-td">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "N/A"}
                    </td>
                    {renderRoleSpecificData(user)}
                    {role !== "admin" && (
                      <td className="userstable-td userstable-actions-cell">
                        <div className="userstable-actions-wrapper">
                          {role === "client" && (
                            <Link
                              to={`/admin/ClientDetails/${user._id}`}
                              className="userstable-icon-button"
                              title="Voir les détails"
                            >
                              <Eye size={18} />
                            </Link>
                          )}
                          <button
                            onClick={() => toggleBlockUser(user._id, user.isBlocked, userName)}
                            className="userstable-icon-button"
                            title={user.isBlocked ? "Débloquer l'utilisateur" : "Bloquer l'utilisateur"}
                          >
                            {user.isBlocked ? <Lock size={18} /> : <Unlock size={18} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="userstable-pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="userstable-pagination-button"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`userstable-pagination-button ${
                currentPage === i + 1 ? "userstable-pagination-button-active" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="userstable-pagination-button"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}

UsersTable.propTypes = {
  users: PropTypes.array.isRequired,
  role: PropTypes.string.isRequired,
}
