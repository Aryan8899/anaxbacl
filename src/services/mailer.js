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

// ── Career Application Email ──────────────────────────────────────────────────
const sendCareerApplicationEmail = async ({
  name,
  email,
  phone,
  experience,
  jobTitle,
  jobDept,
  cvBuffer,
  cvFilename,
}) => {
  const transporter = createTransporter();
  await transporter.verify();

  const fromAddress = `"${process.env.FROM_NAME || "Anax Imperium"}" <${process.env.FROM_EMAIL}>`;
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const adminHTML = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="color: #D4537E;">📋 New Job Application</h2>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666; width:140px;">Name</td><td style="padding:8px; border-bottom:1px solid #f0d0dc; font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666;">Email</td><td style="padding:8px; border-bottom:1px solid #f0d0dc;">${email}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666;">Phone</td><td style="padding:8px; border-bottom:1px solid #f0d0dc;">${phone}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666;">Experience</td><td style="padding:8px; border-bottom:1px solid #f0d0dc;">${experience}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666;">Applied For</td><td style="padding:8px; border-bottom:1px solid #f0d0dc; font-weight:600;">${jobTitle}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #f0d0dc; color:#666;">Department</td><td style="padding:8px; border-bottom:1px solid #f0d0dc;">${jobDept}</td></tr>
        <tr><td style="padding:8px; color:#666;">Submitted</td><td style="padding:8px;">${submittedAt}</td></tr>
      </table>
      <p style="margin-top:16px; color:#888; font-size:13px;">CV is attached to this email.</p>
    </div>
  `;

  const userHTML = `
    <div style="font-family: sans-serif; max-width: 600px;">
      <h2 style="color: #D4537E;">Hi ${name}, we've received your application! 🎉</h2>
      <p>Thank you for applying for <b>${jobTitle}</b> at Anax Imperium.</p>
      <p>Our team will review your profile and get back to you within <b>3–5 business days</b>.</p>
      <br/>
      <p style="color:#888; font-size:13px;">— Anax Imperium Careers Team</p>
    </div>
  `;

  // 1️⃣ Admin notification with CV attached — sent to aryanpandita003@gmail.com
  await transporter.sendMail({
    from: fromAddress,
    to: "anaximperiumsolutions@gmail.com",
    replyTo: `"${name}" <${email}>`,
    subject: `📋 New Application: ${jobTitle} — ${name}`,
    html: adminHTML,
    attachments: [
      {
        filename: cvFilename,
        content: cvBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  // 2️⃣ Confirmation to applicant
  await transporter.sendMail({
    from: fromAddress,
    to: `"${name}" <${email}>`,
    subject: `Application Received — ${jobTitle} | Anax Imperium`,
    html: userHTML,
  });
};

module.exports = { sendEnquiryEmail, sendPaymentConfirmationEmail, sendCareerApplicationEmail };