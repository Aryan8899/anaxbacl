const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { sendCareerApplicationEmail } = require("../services/mailer");

const router = express.Router();

// ── Multer — memory storage (no disk write, attach directly to email) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// ── Rate limit ────────────────────────────────────────────────────
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: "Too many applications. Please try again after an hour." },
});

// ── Validation ────────────────────────────────────────────────────
const applyValidation = [
  body("name").trim().notEmpty().withMessage("Name is required.").isLength({ min: 2, max: 100 }),
  body("email").trim().isEmail().withMessage("Valid email is required.").normalizeEmail(),
  body("phone").trim().matches(/^[\+\d\s\-\(\)]{7,20}$/).withMessage("Valid phone number is required."),
  body("experience").trim().notEmpty().withMessage("Experience is required.").isLength({ max: 200 }),
  body("jobTitle").trim().notEmpty().withMessage("Job title is required."),
  body("jobDept").trim().notEmpty().withMessage("Department is required."),
];

// ── POST /api/careers/apply ───────────────────────────────────────
router.post(
  "/apply",
  applyLimiter,
  upload.single("cv"),
  applyValidation,
  async (req, res) => {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    if (!req.file) {
      return res.status(422).json({ success: false, message: "CV (PDF) is required." });
    }

    const { name, email, phone, experience, jobTitle, jobDept } = req.body;

    try {
      await sendCareerApplicationEmail({
        name,
        email,
        phone,
        experience,
        jobTitle,
        jobDept,
        cvBuffer: req.file.buffer,
        cvFilename: req.file.originalname || `${name.replace(/\s+/g, "_")}_CV.pdf`,
      });

      console.log(`[CAREERS] Application from ${name} <${email}> for ${jobTitle}`);

      return res.status(200).json({
        success: true,
        message: "Application submitted! We'll be in touch soon.",
      });
    } catch (err) {
      console.error("[CAREERS] Email failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "Could not submit application. Please try again or email us directly.",
      });
    }
  }
);

module.exports = router;