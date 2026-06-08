const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Audit & Assurance", "Tax & GST", "Legal & Secretarial", "Advisory & Finance", "Operations"],
    },
    jobType: {
      type: String,
      required: true,
      enum: ["Full-Time", "Part-Time", "Contract", "Internship"],
      default: "Full-Time",
    },
    workMode: {
      type: String,
      required: true,
      enum: ["On-Site", "Hybrid", "Remote"],
      default: "On-Site",
    },
    experience: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, default: "Gurugram, Haryana" },
    qualification: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    // Rich detail fields (shown in modal)
    about: { type: String, trim: true, default: "" },
    responsibilities: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);