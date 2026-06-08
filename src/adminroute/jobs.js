const express = require("express");
const { body, param, validationResult } = require("express-validator");
const Job = require("./../schema/job");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ── Validation ────────────────────────────────────────────────────
const jobValidation = [
  body("title").trim().notEmpty().withMessage("Job title is required.").isLength({ max: 200 }),
  body("category")
    .trim()
    .notEmpty()
    .isIn(["Audit & Assurance", "Tax & GST", "Legal & Secretarial", "Advisory & Finance", "Operations"])
    .withMessage("Invalid category."),
  body("jobType")
    .optional()
    .isIn(["Full-Time", "Part-Time", "Contract", "Internship"])
    .withMessage("Invalid job type."),
  body("workMode")
    .optional()
    .isIn(["On-Site", "Hybrid", "Remote"])
    .withMessage("Invalid work mode."),
  body("experience").trim().notEmpty().withMessage("Experience is required."),
  body("location").trim().notEmpty().withMessage("Location is required."),
  body("qualification").trim().notEmpty().withMessage("Qualification is required."),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("about").optional().trim().isLength({ max: 3000 }),
  body("responsibilities").optional().isArray(),
  body("requirements").optional().isArray(),
];

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────

// GET /api/jobs — all active jobs (public, frontend uses this)
router.get("/", async (_req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    return res.json({ success: true, jobs });
  } catch (err) {
    console.error("[JOBS] Fetch failed:", err.message);
    return res.status(500).json({ success: false, message: "Could not fetch jobs." });
  }
});

// GET /api/jobs/:id — single job detail (public, used by modal)
router.get("/:id", param("id").isMongoId().withMessage("Invalid job ID."), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: "Invalid job ID." });
  }

  try {
    const job = await Job.findOne({ _id: req.params.id, isActive: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    return res.json({ success: true, job });
  } catch (err) {
    console.error("[JOBS] Single fetch failed:", err.message);
    return res.status(500).json({ success: false, message: "Could not fetch job." });
  }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN ROUTES (JWT protected)
// ─────────────────────────────────────────────────────────────────

// GET /api/jobs/admin/all — all jobs including inactive (admin panel)
router.get("/admin/all", authMiddleware, async (_req, res) => {
  res.set("Cache-Control", "no-store");  // ← yeh add kar
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.json({ success: true, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Could not fetch jobs." });
  }
});

// POST /api/jobs — create new job
router.post("/", authMiddleware, jobValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const job = await Job.create(req.body);
    console.log(`[JOBS] Created: "${job.title}" by admin`);
    return res.status(201).json({ success: true, message: "Job posted successfully.", job });
  } catch (err) {
    console.error("[JOBS] Create failed:", err.message);
    return res.status(500).json({ success: false, message: "Could not create job." });
  }
});

// PUT /api/jobs/:id — update job
router.put("/:id", authMiddleware, param("id").isMongoId(), jobValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    console.log(`[JOBS] Updated: "${job.title}"`);
    return res.json({ success: true, message: "Job updated.", job });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Could not update job." });
  }
});

// DELETE /api/jobs/:id — soft delete (sets isActive: false)
router.delete("/:id", authMiddleware, param("id").isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: "Invalid job ID." });
  }

  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    console.log(`[JOBS] Deleted (soft): "${job.title}"`);
    return res.json({ success: true, message: "Job removed." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Could not delete job." });
  }
});

module.exports = router;