# Anax Imperium — Contact Form Backend

Node.js / Express backend that powers the **Anax Imperium** contact form.
When a visitor submits an enquiry it:

1. Validates all fields server-side
2. Sends a **rich HTML notification email** to the Anax team (with Reply & WhatsApp buttons)
3. Sends a **confirmation email** to the visitor

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Email | Nodemailer + Gmail SMTP |
| Validation | express-validator |
| Rate limiting | express-rate-limit |

---

## Quick Start

### 1. Clone & install
```bash
git clone https://github.com/YOUR_ORG/anax-imperium-backend.git
cd anax-imperium-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `5000`) |
| `SMTP_USER` | Gmail address used to send emails |
| `SMTP_PASS` | 16-character **App Password** (not your real password) |
| `NOTIFY_EMAIL` | Where enquiries are delivered (team inbox) |
| `FRONTEND_URL` | Your Next.js frontend URL for CORS |

> **Gmail App Password** → Google Account → Security → 2-Step Verification → App Passwords

### 3. Run
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

---

## API Reference

### `POST /api/enquiry`

**Request body (JSON):**
```json
{
  "name":    "Rahul Sharma",
  "phone":   "+91 98765 43210",
  "email":   "rahul@example.com",
  "service": "GST Registration",
  "message": "I need help setting up GST for my new startup."
}
```

**Success `200`:**
```json
{ "success": true, "message": "Your enquiry has been received. We'll reach out shortly!" }
```

**Validation error `422`:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Enter a valid email address." }]
}
```

**Rate limit** → 5 submissions per IP per hour.

---

## Connecting to the Next.js Frontend

In your Next.js form handler:

```js
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/enquiry`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, phone, email, service, message }),
});
const data = await res.json();
```

Add to `.env.local` in your Next.js project:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Deployment (Render / Railway / VPS)

1. Push to GitHub
2. Create a new **Web Service** pointing to this repo
3. Set **Start Command**: `npm start`
4. Add all environment variables from `.env.example`
5. Update `FRONTEND_URL` to your production frontend domain

---

## Project Structure

```
anax-imperium-backend/
├── src/
│   ├── index.js              # Express app + server
│   ├── routes/
│   │   └── enquiry.js        # POST /api/enquiry (validate → email)
│   ├── services/
│   │   └── mailer.js         # Nodemailer transporter + send logic
│   └── templates/
│       ├── adminEmail.js     # HTML/text email → team
│       └── userEmail.js      # HTML/text confirmation → visitor
├── .env.example
├── .gitignore
└── package.json
```
