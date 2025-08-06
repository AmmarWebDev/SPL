const mongoose = require("mongoose");

const cwcSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("Cwc", cwcSchema, "CWC");
