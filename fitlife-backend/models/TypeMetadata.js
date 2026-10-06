// models/typeMetadata.js

module.exports = {
  poids: {
    unite: "kg",
    schema: {
      type: "number"
    }
  },
  menstruation: {
    unite: null,
    schema: {
      jourDuCycle: "number",
      douleurs: "boolean",
      intensiteDouleur: ["légère", "modérée", "sévère"]
    }
  },
  calories_brulees: {
    unite: "kcal",
    schema: {
      type: "number"
    }
  },
  stress: {
    unite: null,
    schema: {
      type: "number",
      min: 0,
      max: 10
    }
  },
  sommeil: {
    unite: "heures",
    schema: {
      heures: "number",
      qualite: ["bonne", "moyenne", "mauvaise"]
    }
  }
};
