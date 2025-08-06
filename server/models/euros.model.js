const mongoose = require("mongoose");

// Flexible schema (no strict structure)
const euroSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("Euro", euroSchema, "Euros"); // Explicit collection name
