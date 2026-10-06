const ProgrammeSport = require("../models/ProgrammeSport")
const Seance = require("../models/Seance")
const { getExercices } = require("../services/wgerService")
const User = require("../models/User")

// Configuration des séances selon les préférences utilisateur
const getSeanceConfig = (frequency, duration) => {
  let exercicesParSeance = 3
  let nombreDeSeances = 4
  let dureeParExercice = 90 // en secondes

  // Configuration selon la durée préférée
  switch (duration) {
    case "15-30":
      exercicesParSeance = 2
      dureeParExercice = 60 // exercices plus courts pour séances courtes
      break
    case "30-45":
      exercicesParSeance = 3
      dureeParExercice = 75
      break
    case "45-60":
      exercicesParSeance = 4
      dureeParExercice = 90
      break
    case "60+":
      exercicesParSeance = 5
      dureeParExercice = 105
      break
  }

  // Configuration selon la fréquence préférée
  switch (frequency) {
    case "1-2":
      nombreDeSeances = 2
      // Pour moins de séances, on peut augmenter légèrement le nombre d'exercices
      exercicesParSeance = Math.min(exercicesParSeance + 1, 6)
      break
    case "3-4":
      nombreDeSeances = 4
      break
    case "5-6":
      nombreDeSeances = 6
      break
    case "daily":
      nombreDeSeances = 7
      // Pour plus de séances, on peut réduire légèrement le nombre d'exercices
      exercicesParSeance = Math.max(exercicesParSeance - 1, 2)
      break
  }

  return { exercicesParSeance, nombreDeSeances, dureeParExercice }
}

// Génération des dates de séances intelligente
const genererDatesSeances = (nombreDeSeances, frequency) => {
  const dates = []
  const now = new Date()

  switch (frequency) {
    case "1-2":
      // Séances espacées de 3-4 jours
      for (let i = 0; i < nombreDeSeances; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i * 4)
        dates.push(date)
      }
      break
    case "3-4":
      // Séances tous les 2 jours
      for (let i = 0; i < nombreDeSeances; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i * 2)
        dates.push(date)
      }
      break
    case "5-6":
      // Séances presque quotidiennes avec 1 jour de repos
      for (let i = 0; i < nombreDeSeances; i++) {
        const date = new Date(now)
        // Ajouter un jour de repos après chaque 2 séances
        const joursAjoutes = i + Math.floor(i / 2)
        date.setDate(now.getDate() + joursAjoutes)
        dates.push(date)
      }
      break
    case "daily":
      // Séances quotidiennes
      for (let i = 0; i < nombreDeSeances; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)
        dates.push(date)
      }
      break
    default:
      // Par défaut, tous les 2 jours
      for (let i = 0; i < nombreDeSeances; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i * 2)
        dates.push(date)
      }
  }

  return dates
}

exports.genererProgramme = async (req, res) => {
  try {
    const { objectif, niveau, materiel, frequency, duration } = req.body

    // Obtenir la configuration optimale des séances
    const { exercicesParSeance, nombreDeSeances, dureeParExercice } = getSeanceConfig(frequency, duration)

    console.log(`🏋️ Generating program: ${nombreDeSeances} sessions of ${exercicesParSeance} exercises each.`)

    // Créer le programme
    let programme = await ProgrammeSport.create({
      userId: req.user.id,
      objectif,
      niveau,
      materiel,
      frequency,
      duration,
    })

    programme = await ProgrammeSport.findById(programme._id).populate("userId", "_id nom prenom").lean()

    // Récupérer les exercices avec priorité sur le français
    const totalExercicesNeeded = nombreDeSeances * exercicesParSeance
    const allExercices = await getExercices(objectif, niveau, materiel, [], totalExercicesNeeded * 1.5) // 50% de plus pour avoir du choix

    if (!allExercices || allExercices.length === 0) {
      return res.status(400).json({
        message: "No exercises found for this program with current criteria.",
        messageEn: "No exercises found for this program with current criteria.",
      })
    }

    const exercicesMelanges = allExercices.sort(() => 0.5 - Math.random())

    // Générer les dates des séances
    const datesSeances = genererDatesSeances(nombreDeSeances, frequency)

    const seances = []
    const exercicesUtilises = new Set() // Pour éviter les doublons

    for (let i = 0; i < nombreDeSeances; i++) {
      const exercicesSeance = []
      let tentatives = 0

      // Sélectionner des exercices uniques pour cette séance
      while (exercicesSeance.length < exercicesParSeance && tentatives < exercicesMelanges.length) {
        const exercice = exercicesMelanges[tentatives]

        if (!exercicesUtilises.has(exercice._id)) {
          exercicesSeance.push({
            ...exercice,
            duree: dureeParExercice,
            repetitions: exports.genererRepetitions(objectif, niveau),
          })
          exercicesUtilises.add(exercice._id)
        }
        tentatives++
      }

      // Si on n'a pas assez d'exercices uniques, compléter avec les exercices disponibles
      if (exercicesSeance.length < exercicesParSeance) {
        const exercicesRestants = exercicesMelanges.slice(0, exercicesParSeance - exercicesSeance.length)
        exercicesRestants.forEach((exercice) => {
          exercicesSeance.push({
            ...exercice,
            duree: dureeParExercice,
            repetitions: exports.genererRepetitions(objectif, niveau),
          })
        })
      }

      // S'assurer qu'on a bien des exercices avant de créer la séance
      if (exercicesSeance.length > 0) {
        const seance = await Seance.create({
          programmeId: programme._id,
          exercices: exercicesSeance,
          date: datesSeances[i],
          status: "planned",
        })

        seances.push(seance.toObject())
        console.log(`✅ Session ${i + 1}/${nombreDeSeances} created with ${exercicesSeance.length} exercises.`)
      }
    }

    console.log(`✅ Program generated successfully: ${seances.length} sessions created.`)

    res.status(201).json({
      programme,
      seances,
      message: `Program created with ${seances.length} sessions of ${exercicesParSeance} exercises each.`,
      config: { exercicesParSeance, nombreDeSeances, dureeParExercice },
    })
  } catch (err) {
    console.error("❌ EError in generateProgramme controller :", err.message)
    res.status(500).json({ error: err.message })
  }
}

// Fonction pour générer des répétitions adaptées
exports.genererRepetitions = (objectif, niveau) => {
  const repetitionsConfig = {
    "muscle gain": {
      beginner: "3x8-10",
      intermediate: "4x8-12",
      expert: "4x6-10",
    },
    "weight loss": {
      beginner: "3x12-15",
      intermediate: "4x15-20",
      expert: "4x20-25",
    },
    toning: {
      beginner: "3x10-12",
      intermediate: "3x12-15",
      expert: "4x12-15",
    },
  }

  return repetitionsConfig[objectif]?.[niveau] || "3x12"
}

exports.lireTousLesProgrammes = async (req, res) => {
  try {
    let programmes
    if (req.user.role === "admin") {
      programmes = await ProgrammeSport.find().populate("userId", "_id nom prenom").lean()
    } else {
      programmes = await ProgrammeSport.find({ userId: req.user.id }).populate("userId", "_id nom prenom").lean()
    }

    const programmesAvecSeances = await Promise.all(
      programmes.map(async (p) => {
        const seances = await Seance.find({ programmeId: p._id }).lean()
        return { ...p, seances }
      }),
    )
    res.json(programmesAvecSeances)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.lireProgrammeParId = async (req, res) => {
  try {
    const filtre = { _id: req.params.id }
    if (req.user.role !== "admin") {
      filtre.userId = req.user.id
    }

    const programme = await ProgrammeSport.findOne(filtre).populate("userId", "_id nom prenom").lean()

    if (!programme) return res.status(404).json({ error: "Program not found or access denied." })

    const seances = await Seance.find({ programmeId: programme._id }).lean()
    res.json({ ...programme, seances })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.mettreAJourProgramme = async (req, res) => {
  try {
    const programmeId = req.params.id
    const filtre = { _id: programmeId }
    if (req.user.role !== "admin") {
      filtre.userId = req.user.id
    }

    const updated = await ProgrammeSport.findOneAndUpdate(filtre, req.body, {
      new: true,
    })

    if (!updated) {
      return res.status(404).json({ message: "Program not found or access denied." })
    }

    // Supprimer les anciennes séances
    await Seance.deleteMany({ programmeId: updated._id })

    // Recalculer la configuration avec les nouvelles préférences
    const { exercicesParSeance, nombreDeSeances, dureeParExercice } = getSeanceConfig(
      updated.frequency,
      updated.duration,
    )

    console.log(`🔄 Program updated successfully: ${nombreDeSeances} sessions of ${exercicesParSeance} exercises each`)

    const totalExercicesNeeded = nombreDeSeances * exercicesParSeance
    const allExercices = await getExercices(
      updated.objectif,
      updated.niveau,
      updated.materiel || [],
      [],
      totalExercicesNeeded * 1.5, // 50% de plus pour avoir du choix
    )

    if (!allExercices || allExercices.length === 0) {
      return res.status(400).json({ message: "No exercise found for this program." })
    }

    const exercicesMelanges = allExercices.sort(() => 0.5 - Math.random())

    // Générer les dates des séances
    const datesSeances = genererDatesSeances(nombreDeSeances, updated.frequency)

    const seances = []
    const exercicesUtilises = new Set() // Pour éviter les doublons

    for (let i = 0; i < nombreDeSeances; i++) {
      const exercicesSeance = []
      let tentatives = 0

      // Sélectionner des exercices uniques pour cette séance
      while (exercicesSeance.length < exercicesParSeance && tentatives < exercicesMelanges.length) {
        const exercice = exercicesMelanges[tentatives]

        if (!exercicesUtilises.has(exercice._id)) {
          exercicesSeance.push({
            ...exercice,
            duree: dureeParExercice,
            repetitions: exports.genererRepetitions(updated.objectif, updated.niveau),
          })
          exercicesUtilises.add(exercice._id)
        }
        tentatives++
      }

      // Si on n'a pas assez d'exercices uniques, compléter avec les exercices disponibles
      if (exercicesSeance.length < exercicesParSeance) {
        const exercicesRestants = exercicesMelanges.slice(0, exercicesParSeance - exercicesSeance.length)
        exercicesRestants.forEach((exercice) => {
          exercicesSeance.push({
            ...exercice,
            duree: dureeParExercice,
            repetitions: exports.genererRepetitions(updated.objectif, updated.niveau),
          })
        })
      }

      // S'assurer qu'on a bien des exercices avant de créer la séance
      if (exercicesSeance.length > 0) {
        const seance = await Seance.create({
          programmeId: updated._id,
          exercices: exercicesSeance,
          date: datesSeances[i],
          status: "planned",
        })

        seances.push(seance.toObject())
        console.log(`✅ Session ${i + 1}/${nombreDeSeances} updated with ${exercicesSeance.length} exercises`)
      }
    }

    console.log(`✅ Program updated successfully: ${seances.length} sessions created`)

    return res.status(200).json({
      message: "Program updated successfully.",
      seances, // Retourner les séances créées
      config: { exercicesParSeance, nombreDeSeances, dureeParExercice },
    })
  } catch (error) {
    console.error("Error updating the program:", error)
    return res.status(500).json({ message: "Server error while updating the program." })
  }
}

exports.supprimerProgramme = async (req, res) => {
  try {
    const filtre = { _id: req.params.id }
    if (req.user.role !== "admin") {
      filtre.userId = req.user.id
    }

    const deleted = await ProgrammeSport.findOneAndDelete(filtre)

    if (!deleted) return res.status(404).json({ error: "Program not found or access denied" })

    await Seance.deleteMany({ programmeId: deleted._id })
    res.json({ message: "Program and sessions deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
