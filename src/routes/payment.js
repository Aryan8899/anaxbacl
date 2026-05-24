const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendPaymentConfirmationEmail } = require("../services/mailer");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  income_tax: { amount: 249900, name: "Income Tax Return" },
  gst_compliance: { amount: 1999900, name: "GST Compliance" },
  incorporation: { amount: 1999900, name: "Incorporation Suite" },
  statutory_audit: { amount: 1499900, name: "Statutory Audit" },
};

// POST /api/payment/create-order
router.post("/create-order", async (req, res) => {
  const { plan, name, email, phone } = req.body;

  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, message: "Invalid plan." });
  }

  try {
    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { name, email, phone, plan },
    });

    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_name: PLANS[plan].name,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[PAYMENT] Order create failed:", err.message);
    return res.status(500).json({ success: false, message: "Could not create order." });
  }
});

// POST /api/payment/verify
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, phone, plan } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Payment verification failed." });
  }

  console.log(`[PAYMENT] ✅ Verified — ${name} paid for ${plan} | Payment ID: ${razorpay_payment_id}`);

  try {
    await sendPaymentConfirmationEmail({ name, email, phone, plan, razorpay_payment_id });
  } catch (err) {
    console.error("[PAYMENT] Email failed:", err.message);
  }

  return res.json({ success: true, message: "Payment verified!", payment_id: razorpay_payment_id });
});

module.exports = router;
