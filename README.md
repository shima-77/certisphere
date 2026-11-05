# CertiSphere: AI-Powered Institutional Activity Management & Tamper-Proof Certificate Verification Platform

> Autonomous institutional event lifecycle, student live check-in, real-time attendance rosters, cryptographic SHA-256 certificate generation, automated email dispatch, and instant QR verification platform tailored for **Vignan's Foundation for Science, Technology & Research (VFSTR / Vignan University)**.

---

## 📌 Problem Statement

Educational institutions organize numerous workshops, technical hackathons, symposiums, conferences, and student development programs across various departments (CSE, AIML, Robotics, IT, ECE, Biotech, Mechanical, Management). 

Manual generation, distribution, and verification of participation and merit certificates is tedious, error-prone, and highly vulnerable to unauthorized forgery. Furthermore, recruiters and accreditation bodies (NAAC/NBA) lack a trustless, instant mechanism to verify student credentials.

**CertiSphere** provides an end-to-end autonomous AI Agent platform that solves this:
1. **Coordinator Command Desk:** Faculty authorize session rooms, project secret 6-digit access codes on auditorium screens, and lock registrations.
2. **2-Step Student Live Check-In:** Students join from their mobile devices using the secret session code, logging their Name, University Email, Roll Number, Department, Year, and Section.
3. **Live Attendance & Excel Export:** Real-time roster with 1-click **Present / Absent** toggle verification, merit/participation classification, and 1-click **Excel (.CSV) spreadsheet export**.
4. **Cryptographic SHA-256 Binding:** Generates tamper-proof digital credentials with immutable checksums and embedded QR code matrices.
5. **Real-time Email Dispatch:** Dispatches formal institutional notification emails with verification links to student inboxes via SMTP (`nodemailer`).
6. **Public QR Verification Portal & Student Vault:** Instant camera-scan verification and self-service credential portfolios with LinkedIn export.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend Server:** Node.js, Express (`server.ts`).
- **AI Intelligence:** Google Gemini AI API (`@google/genai`) for:
  - Event syllabus & agenda formulation (`/api/ai/event-wizard`)
  - Participant typo & email cleanser (`/api/ai/data-cleaner`)
  - Personalized citation prose writer (`/api/ai/citation-generator`)
  - Compliance & audit sentinel copilot (`/api/ai/agent-chat`)
- **Cryptography & Security:** SHA-256 message digests (`crypto.subtle`), dynamic vector QR matrix generation.
- **Email Engine:** Node.js `nodemailer` with SMTP transport.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/certisphere.git
cd certisphere
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your configuration in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"

# Optional: Real email sending (e.g. Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="CertiSphere VFSTR <your-email@gmail.com>"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Coordinator & Demo Credentials

- **Coordinator PIN:** `1234` (or `admin`)
- **Demo Faculty Profiles:** CSE Coordinator (`Dr. K.V. Krishna Kishore`), AIML Coordinator (`Dr. D. Venkatesulu`), Robotics Coordinator (`Prof. Marcus Thorne`), IT Coordinator (`Dr. N. Veeranjaneyulu`).
- **Department Templates:** CSE, AIML (Neural Core), Robotics (Industrial VIIC), IT, ECE, Biotech (Helix), Mechanical, MBA / Management.

---

## 📜 License
Licensed under the Apache-2.0 License.
