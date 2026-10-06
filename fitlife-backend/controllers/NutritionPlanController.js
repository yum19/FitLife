const axios = require("axios");
const PlanNutrition = require("../models/PlanNutrition");
const Repas = require("../models/Repas");
const Aliment = require("../models/Aliment");
const User = require("../models/User");

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// ----------------------
// Helpers
// ----------------------
const calculateBMR = (age, sexe, taille, poids) => {
  if (sexe === "homme") {
    return 88.362 + 13.397 * poids + 4.799 * taille - 5.677 * age;
  } else {
    return 447.593 + 9.247 * poids + 3.098 * taille - 4.33 * age;
  }
};

const calculateTDEE = (bmr, niveauActivite) => {
  switch (niveauActivite) {
    case "sédentaire": return bmr * 1.2;
    case "légèrement actif": return bmr * 1.375;
    case "modérément actif": return bmr * 1.55;
    case "très actif": return bmr * 1.725;
    case "extrêmement actif": return bmr * 1.9;
    default: throw new Error("Niveau d'activité invalide.");
  }
};

// Calcul des macros totales d'un repas
const calculerMacrosRepas = async (aliments) => {
  let totals = { calories: 0, glucides: 0, proteines: 0, lipides: 0 };
  for (let a of aliments) {
    const aliment = await Aliment.findById(a.aliment);
    if (aliment) {
      totals.calories += aliment.calories * (a.quantite / 100);
      totals.glucides += aliment.glucides * (a.quantite / 100);
      totals.proteines += aliment.proteines * (a.quantite / 100);
      totals.lipides += aliment.lipides * (a.quantite / 100);
    }
  }
  return totals;
};

// ----------------------
// Spoonacular - Recherche healthy
// ----------------------
const categoriesParRepas = {
  breakfasts: "breakfast",
  meals: "main course",
  snacks: "snack",
};

const searchAlimentsHealthy = async (mealCategory, allergies = []) => {
  try {
    const mealType = categoriesParRepas[mealCategory] || "main course";

    // Étape 1 : recherche des recettes
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch`,
      {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          type: mealType,
          diet: "healthy",
          intolerances: allergies.join(","),
          number: 5, // limiter pour éviter trop d'appels
        },
      }
    );

    const recettes = response.data.results || [];

    // Étape 2 : récupérer les détails pour chaque recette
    const recettesDetaillees = await Promise.all(
      recettes.map(async (r) => {
        try {
          const details = await axios.get(
            `https://api.spoonacular.com/recipes/${r.id}/information`,
            {
              params: {
                apiKey: SPOONACULAR_API_KEY,
                includeNutrition: true,
              },
            }
          );

          const d = details.data;

          return {
            nom: d.title,
            calories: d.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount || 0,
            glucides: d.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")?.amount || 0,
            proteines: d.nutrition?.nutrients?.find((n) => n.name === "Protein")?.amount || 0,
            lipides: d.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount || 0,
            portion: d.servings ? `${d.servings} serving(s)` : "1 serving",
            image: d.image,
            ingredients: d.extendedIngredients?.map((i) => ({
              name: i.name,
              amount: i.amount,
              unit: i.unit,
              image: i.image ? `https://spoonacular.com/cdn/ingredients_100x100/${i.image}` : null,
            })) || [],
            instructions: d.analyzedInstructions?.[0]?.steps?.map((s) => ({
              number: s.number,
              step: s.step,
            })) || [],
          };
        } catch (err) {
          console.error("Erreur détail recette:", err.response?.data || err.message);
          return null;
        }
      })
    );

    return recettesDetaillees.filter(Boolean);
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new Error("Erreur lors de la récupération depuis Spoonacular");
  }
};

// ----------------------
// Endpoints
// ----------------------

// Recherche simple pour tester Spoonacular
exports.searchAliment = async (req, res) => {
  try {
    const { query } = req.query;
    const produits = await searchAlimentsHealthy(query);
    res.json(produits);
  } catch (error) {
    res.status(500).json({ msg: "Erreur lors de la récupération Spoonacular" });
  }
};

// Création manuelle
exports.createPlan = async (req, res) => {
  try {
    const { clientId, objectif, caloriesCible, repartitionMacros, repas } = req.body;

    const newPlan = new PlanNutrition({
      client: clientId,
      objectif,
      caloriesCible,
      repartitionMacros,
      repas,
    });

    await newPlan.save();
    res.json(newPlan);
  } catch (error) {
    res.status(500).json({ msg: "Erreur création plan nutritionnel" });
  }
};

// Génération automatique quotidienne
exports.generatePlanAuto = async (req, res) => {
  try {
    const { clientId } = req.body;
    const client = await User.findById(clientId);
    if (!client) return res.status(404).json({ msg: "Client non trouvé" });

    const bmr = calculateBMR(client.age, client.sexe, client.taille, client.poids);
    const tdee = calculateTDEE(bmr, client.niveauActivite);

    let caloriesCible;
    if (client.objectif === "perte_de_poids") caloriesCible = tdee - 500;
    else if (client.objectif === "maintien") caloriesCible = tdee;
    else if (client.objectif === "prise_de_masse") caloriesCible = tdee + 300;

    let repartitionMacros = { glucides: 50, proteines: 30, lipides: 20 };
    if (client.objectif === "prise_de_masse") repartitionMacros = { glucides: 55, proteines: 25, lipides: 20 };
    else if (client.objectif === "perte_de_poids") repartitionMacros = { glucides: 40, proteines: 35, lipides: 25 };

    const mealTypes = [
      { type: "petit-dejeuner", category: "breakfasts" },
      { type: "dejeuner", category: "meals" },
      { type: "diner", category: "meals" },
      { type: "collation", category: "snacks" },
    ];

    const repasIds = [];
    for (const meal of mealTypes) {
      const produits = await searchAlimentsHealthy(meal.category, client.allergies || []);
      const selectedProduits = produits.slice(0, 2); // 2 recettes max

      const alimentsForMeal = [];
      for (const produit of selectedProduits) {
        let aliment = await Aliment.findOne({ nom: produit.nom });
        if (!aliment) {
          aliment = new Aliment(produit);
          await aliment.save();
        }
        const quantite = Math.floor(Math.random() * 100) + 50; // 50-150g
        alimentsForMeal.push({ aliment: aliment._id, quantite });
      }

      if (alimentsForMeal.length > 0) {
        const macros = await calculerMacrosRepas(alimentsForMeal);
        const newRepas = new Repas({
          type: meal.type,
          aliments: alimentsForMeal,
          totalCalories: macros.calories,
          totalGlucides: macros.glucides,
          totalProteines: macros.proteines,
          totalLipides: macros.lipides,
        });
        await newRepas.save();
        repasIds.push(newRepas._id);
      }
    }

    const plan = new PlanNutrition({
      client: clientId,
      objectif: client.objectif,
      caloriesCible,
      repartitionMacros,
      repas: repasIds,
    });

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ msg: "Erreur génération automatique" });
  }
};

// Génération hebdomadaire (7 jours)
exports.generateWeeklyPlan = async (req, res) => {
  try {
    const { clientId } = req.body;
    const client = await User.findById(clientId);
    if (!client) return res.status(404).json({ msg: "Client non trouvé" });

    const bmr = calculateBMR(client.age, client.sexe, client.taille, client.poids);
    const tdee = calculateTDEE(bmr, client.niveauActivite);

    let caloriesCible;
    if (client.objectif === "perte_de_poids") caloriesCible = tdee - 500;
    else if (client.objectif === "maintien") caloriesCible = tdee;
    else if (client.objectif === "prise_de_masse") caloriesCible = tdee + 300;

    let repartitionMacros = { glucides: 50, proteines: 30, lipides: 20 };
    if (client.objectif === "prise_de_masse") repartitionMacros = { glucides: 55, proteines: 25, lipides: 20 };
    else if (client.objectif === "perte_de_poids") repartitionMacros = { glucides: 40, proteines: 35, lipides: 25 };

    const mealTypes = [
      { type: "petit-dejeuner", category: "breakfasts" },
      { type: "dejeuner", category: "meals" },
      { type: "diner", category: "meals" },
      { type: "collation", category: "snacks" },
    ];

    const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const weeklyPlans = [];

    for (const day of daysOfWeek) {
      const repasIds = [];

      for (const meal of mealTypes) {
        const produits = await searchAlimentsHealthy(meal.category, client.allergies || []);
        const selectedProduits = produits.slice(0, 2);

        const alimentsForMeal = [];
        for (const produit of selectedProduits) {
          let aliment = await Aliment.findOne({ nom: produit.nom });
          if (!aliment) {
            aliment = new Aliment(produit);
            await aliment.save();
          }
          const quantite = Math.floor(Math.random() * 100) + 50;
          alimentsForMeal.push({ aliment: aliment._id, quantite });
        }

        if (alimentsForMeal.length > 0) {
          const macros = await calculerMacrosRepas(alimentsForMeal);
          const newRepas = new Repas({
            type: meal.type,
            aliments: alimentsForMeal,
            totalCalories: macros.calories,
            totalGlucides: macros.glucides,
            totalProteines: macros.proteines,
            totalLipides: macros.lipides,
          });
          await newRepas.save();
          repasIds.push(newRepas._id);
        }
      }

      const dailyPlan = new PlanNutrition({
        client: clientId,
        objectif: client.objectif,
        caloriesCible,
        repartitionMacros,
        repas: repasIds,
        day,
      });

      await dailyPlan.save();
      weeklyPlans.push(dailyPlan);
    }

    res.json({ week: weeklyPlans });
  } catch (error) {
    res.status(500).json({ msg: "Erreur génération plan hebdomadaire" });
  }
};
