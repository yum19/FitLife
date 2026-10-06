"use client"
import { useSelector } from "react-redux"
import "../../assets/styles/card-profile.css"

export default function CardProfile() {
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    return (
      <div className="cardprof-loading-container">
        <div className="cardprof-loading-content">
          <div className="cardprof-loading-spinner"></div>
          <p className="cardprof-loading-text">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  // Fonction pour obtenir les initiales
  const getInitials = (prenom, nom) => {
    return `${prenom?.charAt(0) || ""}${nom?.charAt(0) || ""}`.toUpperCase()
  }

  // Fonction pour obtenir la couleur selon le rôle
  const getRoleColor = () => {
    return "cardprof-role-text" // Only admin role
  }

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = () => {
    return "Administrateur" // Only admin role
  }

  return (
    <div className="cardprof-container">
      {/* Header Background */}
      <div className="cardprof-header"></div>

      {/* Profile Content */}
      <div className="cardprof-content">
        {/* Avatar Section */}
        <div className="cardprof-avatar-section">
          <div className="cardprof-avatar-wrapper">
            <div className="cardprof-avatar">
              {user?.profilePhoto ? (
                <img
                  src={`http://localhost:5000${user.profilePhoto}` || "/placeholder.svg"}
                  alt="Avatar"
                  className="cardprof-avatar-img"
                />
              ) : (
                <span className="cardprof-avatar-initials">{getInitials(user.prenom, user.nom)}</span>
              )}
            </div>
            {/* Online Status Indicator */}
            <div className="cardprof-status-indicator"></div>
          </div>
        </div>

        {/* User Info */}
        <div className="cardprof-user-info">
          <h2 className="cardprof-user-name">
            {user.prenom || "Non spécifié"} {user.nom || "Non spécifié"}
          </h2>

          {/* Role Badge */}
          <div className="cardprof-role-badge">
            <svg className="cardprof-role-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                clipRule="evenodd"
              />
            </svg>
            <span className={getRoleColor()}>{getRoleLabel()}</span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="cardprof-contact-info">
          {/* Email */}
          <div className="cardprof-contact-item">
            <div className="cardprof-contact-content">
              <div className="cardprof-contact-icon-wrapper cardprof-contact-icon-email">
                <svg
                  className="cardprof-contact-icon cardprof-contact-icon-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="cardprof-contact-info-wrapper">
                <p className="cardprof-contact-label">Email</p>
                <p className="cardprof-contact-value">{user.email || "Non spécifié"}</p>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="cardprof-contact-item">
            <div className="cardprof-contact-content">
              <div className="cardprof-contact-icon-wrapper cardprof-contact-icon-gender">
                <svg
                  className="cardprof-contact-icon cardprof-contact-icon-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="cardprof-contact-info-wrapper">
                <p className="cardprof-contact-label">Sexe</p>
                <p className="cardprof-contact-value">
                  {user.sexe ? (user.sexe === "homme" ? "Homme" : "Femme") : "Non spécifié"}
                </p>
              </div>
            </div>
          </div>

          {/* Age (if available) */}
          {user.age && (
            <div className="cardprof-contact-item">
              <div className="cardprof-contact-content">
                <div className="cardprof-contact-icon-wrapper cardprof-contact-icon-age">
                  <svg
                    className="cardprof-contact-icon cardprof-contact-icon-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="cardprof-contact-info-wrapper">
                  <p className="cardprof-contact-label">Âge</p>
                  <p className="cardprof-contact-value">{user.age} ans</p>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* Description */}
        <div className="cardprof-description">
          <div className="cardprof-description-content">
            <p className="cardprof-description-text">
              Profil administrateur avec accès complet aux fonctionnalités de gestion de la plateforme.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="cardprof-actions">
          <button className="cardprof-btn cardprof-btn-primary">
            <svg className="cardprof-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Message
          </button>
          <button className="cardprof-btn cardprof-btn-secondary">
            <svg className="cardprof-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
            Paramètres
          </button>
        </div>
      </div>
    </div>
  )
}
