// Utility functions for fitness calculations

export const calculateBMR = (
  weight: number, // in kg
  height: number, // in cm
  age: number,
  gender: 'homme' | 'femme'
) => {
  // Mifflin-St Jeor Equation
  if (gender === 'homme') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: string) => {
  const activityMultipliers = {
    'sedentaire': 1.2, // Sedentary (little or no exercise)
    'leger': 1.375, // Lightly active (light exercise/sports 1-3 days/week)
    'modere': 1.55, // Moderately active (moderate exercise/sports 3-5 days/week)
    'actif': 1.725, // Very active (hard exercise/sports 6-7 days/week)
    'tres_actif': 1.9 // Extra active (very hard exercise/sports & physical job)
  };
  
  return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2);
};

export const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: "Underweight", color: "#3B82F6" };
  if (bmi < 25) return { category: "Normal", color: "#10B981" };
  if (bmi < 30) return { category: "Overweight", color: "#F59E0B" };
  return { category: "Obese", color: "#EF4444" };
};
