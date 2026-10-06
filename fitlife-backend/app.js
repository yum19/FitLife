const express = require('express'); 
const connectDB = require('./config/db'); 
const cors = require('cors'); 
const morgan = require('morgan'); 
require('dotenv').config(); 
const path = require("path"); 
const app = express();

const gymRoute = require("./routes/gyms")




connectDB(); 

app.use(cors()); 
app.use(express.json()); 
app.use(morgan("dev"));


// Existing routes
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/users', require('./routes/user')); 
app.use('/api/produits', require('./routes/produitRoutes')); 
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/favorites', require('./routes/favoritesRoutes'));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/gyms", gymRoute)

// Route de test
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "FitLife Backend is running!" })
})


const programmeRoutes = require('./routes/programmeRoutes'); 
app.use('/api/programme', programmeRoutes);

const seanceRoutes = require('./routes/seanceRoutes'); 
app.use('/api/seances', seanceRoutes);

const progressionRoutes = require('./routes/progressionRoutes'); 
app.use('/api/progression', progressionRoutes);

const nutritionRoutes = require('./routes/NutritionRoutes');
app.use('/api/nutrition', nutritionRoutes);



//const PORT = process.env.PORT || 5000; 
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




module.exports = app;