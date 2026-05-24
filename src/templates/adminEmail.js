const adminEmailHTML = ({ name, phone, email, service, message, submittedAt }) => `
<h2>New Enquiry from ${name}</h2>
<p><b>Phone:</b> ${phone}</p>
<p><b>Email:</b> ${email}</p>
<p><b>Service:</b> ${service}</p>
<p><b>Message:</b> ${message}</p>
<p><b>Submitted:</b> ${submittedAt}</p>
`;
const adminEmailText = ({ name, phone, email, service, message }) =>
  `New Enquiry\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`;
module.exports = { adminEmailHTML, adminEmailText };
