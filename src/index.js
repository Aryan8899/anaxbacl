require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const enquiryRoutes = require("./routes/enquiry");
const paymentRoutes = require("./routes/payment");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(globalLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
