const nodemailer = require("nodemailer");
const { adminEmailHTML, adminEmailText } = require("../templates/adminEmail");
const { userConfirmationHTML, userConfirmationText } = require("../templates/userEmail");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEnquiryEmail = async ({ name, phone, email, service, message }) => {
  const transporter = createTransporter();
  await transporter.verify();

  const fromAddress = `"${process.env.FROM_NAME || "Anax Imperium"}" <${process.env.FROM_EMAIL}>`;
  const notifyTo = process.env.NOTIFY_EMAIL;
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const data = { name, phone, email, service, message, submittedAt };

  // 1️⃣ Admin notification
  await transporter.sendMail({
    from: fromAddress,
    to: notifyTo,
    replyTo: `"${name}" <${email}>`,
    subject: `🔔 New Enquiry: ${service} — ${name}`,
    text: adminEmailText(data),
    html: adminEmailHTML(data),
  });

  // 2️⃣ User confirmation
  await transporter.sendMail({
    from: fromAddress,
    to: `"${name}" <${email}>`,
    subject: "We've received your enquiry — Anax Imperium",
    text: userConfirmationText(data),
    html: userConfirmationHTML(data),
  });
};

const sendPaymentConfirmationEmail = async ({ name, email, phone, plan, razorpay_payment_id }) => {
  const transporter = createTransporter();
  await transporter.verify();

  const fromAddress = `"${process.env.FROM_NAME || "Anax Imperium"}" <${process.env.FROM_EMAIL}>`;
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  // 1️⃣ Admin notification
  await transporter.sendMail({
    from: fromAddress,
    to: process.env.NOTIFY_EMAIL,
    subject: `💰 Payment Received — ${plan} — ${name}`,
    html: `
      <h2>Payment Received!</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Plan:</b> ${plan}</p>
      <p><b>Payment ID:</b> ${razorpay_payment_id}</p>
      <p><b>Time:</b> ${submittedAt}</p>
    `,
  });

  // 2️⃣ User confirmation
  await transporter.sendMail({
    from: fromAddress,
    to: `"${name}" <${email}>`,
    subject: "Payment Confirmed — Anax Imperium",
    html: `
      <h2>Hi ${name}, payment received! ✅</h2>
      <p>Thank you for choosing <b>${plan}</b>.</p>
      <p>Payment ID: <b>${razorpay_payment_id}</b></p>
      <p>Our team will contact you within 24 hours.</p>
      <p>— Anax Imperium Team</p>
    `,
  });
};

module.exports = { sendEnquiryEmail, sendPaymentConfirmationEmail };