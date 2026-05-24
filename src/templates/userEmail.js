const userConfirmationHTML = ({ name, service }) => `
<h2>Hi ${name}, we received your enquiry!</h2>
<p>Thanks for reaching out about <b>${service}</b>. We will contact you within 24 hours.</p>
<p>— Anax Imperium Team</p>
`;
const userConfirmationText = ({ name, service }) =>
  `Hi ${name}, we received your enquiry about ${service}. We will contact you within 24 hours.\n— Anax Imperium Team`;
module.exports = { userConfirmationHTML, userConfirmationText };
