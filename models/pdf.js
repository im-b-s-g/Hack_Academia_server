const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema(
  {
    filename: String,
    contentType: String,
    semester: Number,
    metadata: {
      title: String,
      semester: Number,
      course: String,
    },
  },
  { timestamps: true }
);

const PDF = mongoose.model("PDF", pdfSchema);
module.exports = PDF;
