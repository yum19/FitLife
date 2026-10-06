const axios = require("axios")

const objectifToCategories = {
  "muscle gain": [8, 10, 11],
  "weight loss": [14, 13],
  toning: [8, 9, 13],
}

const equipmentMap = {
  dumbbells: "dumbbell",
  mat: "mat",
  bar: "barbell",
  bodyweight: "bodyweight",
  bench: "bench",
}

const muscleMap = {
  biceps: 8,
  triceps: 5,
  shoulders: 2,
  chest: 4,
  legs: 10,
  quadriceps: 6,
  hamstrings: 7,
  back: 12,
  abs: 14,
}

function guessLevel(nom, instructions) {
  const text = (nom + " " + instructions).toLowerCase()
  if (text.includes("advanced") || text.includes("difficile") || text.includes("hard") || text.includes("challenging"))
    return ["expert"]
  if (text.includes("intermediate") || text.includes("moderate") || text.includes("medium"))
    return ["intermediate", "expert"]
  return ["beginner", "intermediate", "expert"]
}

// Modified filterExercises to accept imageMap and videoMap
function filterExercises(
  allExercises,
  categoriesVoulues,
  materielVoulus,
  muscleIds,
  niveau,
  relaxLevel = false,
  imageMap,
  videoMap,
) {
  return allExercises
    .filter((ex) => {
      const matchCategorie = categoriesVoulues.includes(ex.category.id)
      const exEquipments = ex.equipment.map((eq) => eq.name.toLowerCase())
      const matchMateriel = materielVoulus.length === 0 || exEquipments.every((eq) => materielVoulus.includes(eq))
      const allMuscles = [...ex.muscles, ...ex.muscles_secondary]
      const matchMuscles = muscleIds.length === 0 || muscleIds.some((m) => allMuscles.includes(m))
      return matchCategorie && matchMateriel && matchMuscles
    })
    .map((ex) => {
      const traductionFR = ex.translations.find((t) => t.language === 2)
      const traductionEN = ex.translations.find((t) => t.language === 1)
      const best = traductionFR || traductionEN
      if (!best || !best.name || !best.description || best.description.trim().length < 10) return null
      const niveaux = guessLevel(best.name, best.description)

      // Retrieve image and video URLs
      const imageUrl = imageMap[ex.id] ? imageMap[ex.id].image : null
      const videoUrl = videoMap[ex.id] ? videoMap[ex.id].video : null

      // Filter out exercises that have neither an image nor a video
      if (!imageUrl && !videoUrl) {
        console.log(`  Filtering out exercise ID ${ex.id} due to missing both image and video.`)
        return null
      }

      return {
        _id: ex.id.toString(), // Added _id for frontend keying
        nom: best.name,
        instructions: best.description.replace(/<[^>]*>/g, ""),
        niveaux,
        // Duree et repetitions ne sont plus codées en dur ici, elles seront définies par le contrôleur
        imageUrl, // Include imageUrl
        videoUrl, // Include videoUrl
      }
    })
    .filter(Boolean) // Remove nulls
}

async function getExercices(objectif, niveau, materiel, musclesCibles = [], nombreMax = 20) {
  try {
    const response = await axios.get("https://wger.de/api/v2/exerciseinfo/?language=2&limit=200")
    const allExercises = response.data.results

    // Fetch images
    const imagesResponse = await axios.get("https://wger.de/api/v2/exerciseimage/?limit=500")
    const allImages = imagesResponse.data.results
    const imageMap = allImages.reduce((acc, img) => {
      acc[img.exercise] = img
      return acc
    }, {})
    console.log(`Fetched ${allImages.length} images.`)

    // Fetch videos
    const videosResponse = await axios.get("https://wger.de/api/v2/video/?limit=500")
    const allVideos = videosResponse.data.results
    const videoMap = allVideos.reduce((acc, vid) => {
      acc[vid.exercise] = vid
      return acc
    }, {})
    console.log(`Fetched ${allVideos.length} videos.`)

    const categoriesVoulues = objectifToCategories[objectif.toLowerCase()] || []
    const materielVoulus = materiel.map((m) => equipmentMap[m.toLowerCase()]?.toLowerCase()).filter(Boolean)
    const muscleIds = musclesCibles.map((m) => muscleMap[m.toLowerCase()]).filter(Boolean)

    // Pass imageMap and videoMap to filterExercises
    let filtered = filterExercises(
      allExercises,
      categoriesVoulues,
      materielVoulus,
      muscleIds,
      niveau,
      false,
      imageMap,
      videoMap,
    )

    if (filtered.length < 5)
      filtered = filterExercises(
        allExercises,
        categoriesVoulues,
        materielVoulus,
        muscleIds,
        niveau,
        true,
        imageMap,
        videoMap,
      )
    if (filtered.length < 5)
      filtered = filterExercises(allExercises, categoriesVoulues, materielVoulus, [], niveau, true, imageMap, videoMap)
    if (filtered.length < 5)
      filtered = filterExercises(allExercises, categoriesVoulues, [], [], niveau, true, imageMap, videoMap)

    const shuffled = filtered.sort(() => 0.5 - Math.random())
    console.log(`✅ Found ${shuffled.length} exercise(s) for "${objectif}" with fallback applied.`)

    // Retourner les exercices sans durée ni répétitions fixes, elles seront ajoutées par le contrôleur
    return shuffled.slice(0, nombreMax)
  } catch (err) {
    console.error("❌ Error while calling Wger API :", err.message)
    throw new Error("Unable to fetch exercises.")
  }
}

module.exports = { getExercices }
