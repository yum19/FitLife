import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { format } from "date-fns"
import { Weight, Flame, Droplet, Zap, Moon, Activity, X } from "lucide-react"
import { motion } from "framer-motion"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import "../../assets/styles/client-details.css"

const API_AUTH_URL = "http://localhost:5000/api/auth"
const API_PROGRESSION_URL = "http://localhost:5000/api/progression"

export default function ClientDetailsPage() {
  const { id: clientId } = useParams()
  const [selectedUser, setSelectedUser] = useState(null)
  const [progressions, setProgressions] = useState([])
  const [bmr, setBmr] = useState(null)
  const [tdee, setTdee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return setError("Client ID is missing.")
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) return setError("Authentication token not found. Please log in.")

      try {
        const { data: user } = await axios.get(
          `${API_AUTH_URL}/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setSelectedUser(user)

        const { data: progs } = await axios.get(
          `${API_PROGRESSION_URL}/client/${clientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setProgressions(progs)

        const { age, sexe, taille, poids, niveauActivite } = user
        if (age && sexe && taille && poids) {
          const { data: bmrRes } = await axios.post(
            `${API_AUTH_URL}/calculate-bmr`,
            { age, sexe, taille, poids },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          setBmr(bmrRes.bmr)

          if (bmrRes.bmr && niveauActivite) {
            const { data: tdeeRes } = await axios.post(
              `${API_AUTH_URL}/calculate-tdee`,
              { bmr: bmrRes.bmr, niveauActivite },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            setTdee(tdeeRes.tdee)
          } else setTdee(null)
        } else {
          setBmr(null)
          setTdee(null)
        }
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to fetch data.")
      } finally {
        setLoading(false)
      }
    }
    fetchClientData()
  }, [clientId])

  if (loading) return <div className="client-details-loading">Chargement...</div>
  if (error) return <div className="client-details-error">{error}</div>
  if (!selectedUser) return <div className="client-details-no-data">Client non trouvé</div>

  const iconMap = {
    poids: <Weight className="client-details-progression-icon" />,
    calories_brulees: <Flame className="client-details-progression-icon" />,
    menstruation: <Droplet className="client-details-progression-icon" />,
    stress: <Zap className="client-details-progression-icon" />,
    sommeil: <Moon className="client-details-progression-icon" />,
  }
  const uniqueTypes = [...new Set(progressions.map(p => p.type))]
  const formatHistoryValue = prog => {
    switch (prog.type) {
      case "poids": return `${prog.valeur} kg`
      case "calories_brulees": return `${prog.valeur} kcal`
      case "stress": return prog.valeur
      case "sommeil": return `${prog.valeur.heures} h`
      case "menstruation": return `Jour ${prog.valeur.jourDuCycle}`
      default: return prog.valeur
    }
  }

  return (
    <div className="client-details-page-wrapper">
      <motion.h1
        className="client-details-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Détails du Client: {selectedUser.prenom} {selectedUser.nom}
      </motion.h1>

      <motion.div
        className="client-details-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="client-details-card-title">Informations Personnelles</h2>
        <div className="client-details-grid">
          <div>
            <p className="client-details-label">Email: <span className="client-details-value">{selectedUser.email}</span></p>
            <p className="client-details-label">Âge: <span className="client-details-value">{selectedUser.age || "N/A"}</span></p>
            <p className="client-details-label">Sexe: <span className="client-details-value">{selectedUser.sexe || "N/A"}</span></p>
          </div>
          <div>
            <p className="client-details-label">Taille: <span className="client-details-value">{selectedUser.taille || "N/A"} cm</span></p>
            <p className="client-details-label">Poids: <span className="client-details-value">{selectedUser.poids || "N/A"} kg</span></p>
            <p className="client-details-label">Objectif: <span className="client-details-value">{selectedUser.objectif || "N/A"}</span></p>
          </div>
        </div>
        <div className="client-details-additional-info">
          <p className="client-details-label">Allergies: <span className="client-details-value">{selectedUser.allergies?.length > 0 ? selectedUser.allergies.join(", ") : "Aucune"}</span></p>
          <p className="client-details-label">Niveau d'Activité: <span className="client-details-value">{selectedUser.niveauActivite || "N/A"}</span></p>
        </div>
        <div className="client-details-metrics">
          <h3 className="client-details-metrics-title">Métriques de Santé</h3>
          <div className="client-details-metrics-grid">
            <div className="client-details-metric">
              <Activity className="client-details-metric-icon" />
              <div>
                <p className="client-details-metric-description">BMR (Métabolisme de base) : Calories nécessaires au repos.</p>
                <p className="client-details-label">BMR: <span className="client-details-value">{bmr ? `${Math.round(bmr)} kcal` : "Non disponible"}</span></p>
              </div>
            </div>
            <div className="client-details-metric">
              <Activity className="client-details-metric-icon" />
              <div>
                <p className="client-details-metric-description">TDEE (Dépense énergétique quotidienne) : Calories brûlées par jour.</p>
                <p className="client-details-label">TDEE: <span className="client-details-value">{tdee ? `${Math.round(tdee)} kcal` : "Non disponible"}</span></p>
              </div>
            </div>
          </div>
        </div>
        <p className="client-details-inscription-date">Inscription: <span className="client-details-value">{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), "dd/MM/yyyy") : "N/A"}</span></p>
        {selectedUser.profilePhoto && (
          <div className="client-details-photo-wrapper">
            <p className="client-details-label">Photo de profil:</p>
            <img src={`http://localhost:5000${selectedUser.profilePhoto}`} alt="Profile" className="client-details-profile-photo" />
          </div>
        )}
      </motion.div>

      {/* Progression Types */}
      <motion.div
        className="client-details-progressions-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="client-details-progressions-title">Types de Progression</h2>
        <div className="client-details-types-list">
          {uniqueTypes.map(type => (
            <button key={type} className="client-details-type-button" onClick={() => setSelectedType(type)}>
              <div className="client-details-progression-icon-wrapper">{iconMap[type]}</div>
              <span className="client-details-progression-type-label">{type.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Modal History */}
      {selectedType && (
        <div className="modal-overlay" onClick={() => setSelectedType(null)}>
          <motion.div className="modal-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setSelectedType(null)}><X /></button>
            <h3>Historique: {selectedType.replace(/_/g, " ")}</h3>
            <div className="progression-history-list">
              {progressions.filter(p => p.type === selectedType).sort((a, b) => new Date(b.dateEnregistrement) - new Date(a.dateEnregistrement)).map(prog => (
                <div key={prog._id} className="history-item">
                  <span className="history-date">{format(new Date(prog.dateEnregistrement), "dd/MM/yyyy HH:mm")}</span>
                  <span className="history-value">{formatHistoryValue(prog)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}