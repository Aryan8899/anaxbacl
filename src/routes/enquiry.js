const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { sendEnquiryEmail } = require("../services/mailer");

const router = express.Router();

// ── Strict rate limit just for form submissions ───────────────────
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // max 5 enquiries per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many enquiries submitted. Please try again after an hour.",
  },
});

// ── Validation Rules ──────────────────────────────────────────────
const enquiryValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters."),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone / WhatsApp number is required.")
    .matches(/^[\+\d\s\-\(\)]{7,20}$/).withMessage("Enter a valid phone number."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email address is required.")
    .isEmail().withMessage("Enter a valid email address.")
    .normalizeEmail(),

  body("service")
    .trim()
    .notEmpty().withMessage("Please select a service.")
    .isLength({ max: 200 }).withMessage("Service name too long."),

  body("message")
    .trim()
    .notEmpty().withMessage("Brief message is required.")
.isLength({ min: 2, max: 2000 }).withMessage("Message must be 2–2000 characters."),
];

// ── POST /api/enquiry ─────────────────────────────────────────────
router.post("/", submitLimiter, enquiryValidation, async (req, res) => {
  // Return all validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { name, phone, email, service, message } = req.body;

  try {
    await sendEnquiryEmail({ name, phone, email, service, message });

    console.log(`[ENQUIRY] New submission from ${name} <${email}> — ${service}`);

    return res.status(200).json({
      success: true,
      message: "Your enquiry has been received. We'll reach out shortly!",
    });
  } catch (err) {
    console.error("[ENQUIRY] Email send failed:", err.message);
    return res.status(500).json({
      success: false,
      message: "Could not send your enquiry. Please try again or contact us directly.",
    });
  }
});

module.exports = router;
