const multer = require("multer");
const path = require("path");

// Destination folder and file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // dossier racine/uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers images sont autorisés."));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: fileFilter
});

module.exports = upload;
