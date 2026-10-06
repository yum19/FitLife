"use client"
import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { updateProfile, clearError } from "../../store/authSlice"
import "../../assets/styles/card-settings.css"

export default function CardSettings() {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state) => state.auth)
  const [previewImage, setPreviewImage] = useState(null)
  const [formData, setFormData] = useState({
    email: "",
    prenom: "",
    nom: "",
    age: "",
    sexe: "",
    profilePhoto: null,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        prenom: user.prenom || "",
        nom: user.nom || "",
        age: user.age || "",
        sexe: user.sexe || "",
        profilePhoto: null,
      })
      setPreviewImage(user.profilePhoto ? `http://localhost:5000${user.profilePhoto}` : null)
    }
  }, [user])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "profilePhoto" && files[0]) {
      setFormData((prev) => ({
        ...prev,
        profilePhoto: files[0],
      }))
      setPreviewImage(URL.createObjectURL(files[0]))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!user?._id) {
      dispatch(clearError())
      dispatch({ type: "auth/updateProfile/rejected", payload: "Utilisateur non trouvé" })
      return
    }
    const formDataToSend = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "profilePhoto" && value instanceof File) {
        formDataToSend.append("profilePhoto", value)
      } else if (value) {
        formDataToSend.append(key, value)
      }
    })
    dispatch(updateProfile(formDataToSend))
  }

  // Generate initials from prenom and nom
  const getInitials = () => {
    const prenomInitial = formData.prenom ? formData.prenom[0] : ""
    const nomInitial = formData.nom ? formData.nom[0] : ""
    return `${prenomInitial}${nomInitial}`.toUpperCase()
  }

  if (!user) {
    return <div className="profilesettings-loading">Chargement...</div>
  }

  return (
    <div className="profilesettings-container">
      <div className="profilesettings-header">
        <div className="profilesettings-header-content">
          <h2 className="profilesettings-title">Mon Profil</h2>
          <button className="profilesettings-save-btn" type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="profilesettings-spinner"></span>
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder"
            )}
          </button>
        </div>
        {error && <div className="profilesettings-error">{error}</div>}
      </div>

      <div className="profilesettings-content">
        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <div className="profilesettings-photo-section">
            <div className="profilesettings-field-wrapper">
              <label className="profilesettings-photo-label">Photo de Profil</label>
              <div className="profilesettings-photo-container">
                <div className="profilesettings-avatar-wrapper">
                  {previewImage ? (
                    <img
                      src={previewImage || "/placeholder.svg"}
                      alt="Profile Preview"
                      className="profilesettings-avatar-img"
                    />
                  ) : (
                    <div className="profilesettings-avatar-placeholder">
                      <span>{getInitials()}</span>
                    </div>
                  )}
                  <div className="profilesettings-camera-icon">
                    <svg className="profilesettings-camera-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>

                <label className="profilesettings-upload-btn">
                  <svg className="profilesettings-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Changer la photo
                  <input
                    type="file"
                    name="profilePhoto"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleChange}
                    className="profilesettings-upload-input"
                  />
                </label>
                <p className="profilesettings-upload-hint">JPG, PNG jusqu'à 2MB</p>
              </div>
            </div>
          </div>

          <h3 className="profilesettings-form-title">
            <svg className="profilesettings-form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Informations Personnelles
          </h3>

          <div className="profilesettings-grid">
            {/* Prénom */}
            <div className="profilesettings-field">
              <div className="profilesettings-field-wrapper">
                <label className="profilesettings-label">Prénom *</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="profilesettings-input"
                  placeholder="Prénom"
                />
              </div>
            </div>

            {/* Nom */}
            <div className="profilesettings-field">
              <div className="profilesettings-field-wrapper">
                <label className="profilesettings-label">Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="profilesettings-input"
                  placeholder="Nom"
                />
              </div>
            </div>

            {/* Email */}
            <div className="profilesettings-field">
              <div className="profilesettings-field-wrapper">
                <label className="profilesettings-label">Adresse Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="profilesettings-input"
                  placeholder="Email"
                />
              </div>
            </div>

            {/* Âge */}
            <div className="profilesettings-field">
              <div className="profilesettings-field-wrapper">
                <label className="profilesettings-label">Âge</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="profilesettings-input"
                  placeholder="Âge"
                />
              </div>
            </div>

            {/* Sexe */}
            <div className="profilesettings-field-full">
              <div className="profilesettings-field-wrapper">
                <label className="profilesettings-label">Sexe</label>
                <select name="sexe" value={formData.sexe} onChange={handleChange} className="profilesettings-select">
                  <option value="">Sélectionner</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
