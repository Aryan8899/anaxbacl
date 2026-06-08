require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./src/connection/dbconnection");
const enquiryRoutes = require("./src/routes/enquiry");
const careerRoutes = require("./src/routes/Carrer");
const adminRoutes = require("./src/adminroute/admin");
const jobRoutes = require("./src/adminroute/jobs");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// ── MongoDB ───────────────────────────────────────────────────────
connectDB();

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://anix-new.vercel.app",
  "https://adminanix.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body Parser ───────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Global Rate Limiter ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// ── Health Check ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/careers", careerRoutes);   // CV application (existing)
app.use("/api/admin", adminRoutes);       // Admin login
app.use("/api/jobs", jobRoutes);          // Job CRUD + public listing

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ── Global Error Handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Anax Imperium backend running on port ${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Admin:     POST /api/admin/login`);
  console.log(`   Jobs:      GET  /api/jobs`);
  console.log(`   Env:       ${process.env.NODE_ENV || "development"}\n`);
});