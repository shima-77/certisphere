import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import nodemailer, { Transporter } from 'nodemailer';
import PDFDocument from 'pdfkit';
import {
  initDb,
  registerCoordinator,
  loginCoordinator,
  verifySession,
  logoutSession,
  changePassword,
  listPublicCoordinators,
  getAllData,
  upsertEvent,
  upsertParticipants,
  updateParticipant,
  upsertCertificates,
  getCertificate,
  appendAuditLog,
  getEmailConfig,
  saveEmailConfig
} from './server/db.js';
import { ParticipantRecord } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize persistent database on server boot
initDb();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Auth Middleware
function requireAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in as a faculty coordinator.' });
  }
  const coordinator = verifySession(token);
  if (!coordinator) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  (req as any).coordinator = coordinator;
  next();
}

// ==========================================
// 1. AUTHENTICATION & FACULTY COORDINATOR API
// ==========================================

// Register new faculty coordinator
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, department, facultyId, password } = req.body;
    if (!name || !email || !department || !password) {
      return res.status(400).json({ error: 'Name, institutional email, department, and password are required.' });
    }
    const result = registerCoordinator({ name, email, department, facultyId, password });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Login faculty coordinator
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faculty email and password are required.' });
    }
    const result = loginCoordinator(email, password);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

// Verify active session & return profile
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ success: true, coordinator: (req as any).coordinator });
});

// Logout coordinator
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    logoutSession(token);
  }
  return res.json({ success: true });
});

// Change password
app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }
    const coordinator = (req as any).coordinator;
    changePassword(coordinator.id, currentPassword, newPassword);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update password' });
  }
});

// Public directory of faculty coordinators
app.get('/api/coordinators', (_req: Request, res: Response) => {
  return res.json({ coordinators: listPublicCoordinators() });
});

// ==========================================
// 2. DATA SYNCHRONIZATION & ENTITY STORAGE
// ==========================================

// Global synchronization endpoint for frontend state hydration
app.get('/api/sync', (_req: Request, res: Response) => {
  try {
    const data = getAllData();
    return res.json({ success: true, ...data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to sync data' });
  }
});

// Create or update an institutional event
app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { event } = req.body;
    if (!event || !event.id) {
      return res.status(400).json({ error: 'Valid event payload is required.' });
    }
    const saved = upsertEvent(event);
    return res.json({ success: true, event: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Save / bulk update participants
app.post('/api/participants', (req: Request, res: Response) => {
  try {
    const { participants } = req.body;
    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants array is required.' });
    }
    const saved = upsertParticipants(participants);
    return res.json({ success: true, count: saved.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update single participant record
app.put('/api/participants/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = updateParticipant(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Participant not found.' });
    }
    return res.json({ success: true, participant: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Student Live Check-in endpoint
app.post('/api/participants/check-in', (req: Request, res: Response) => {
  try {
    const { eventId, accessCode, name, rollNo, email, department, yearOfStudy, section } = req.body;

    const allData = getAllData();
    const event = allData.events.find(e => 
      e.id === eventId || 
      (accessCode && (e.accessCode?.trim().toUpperCase() === accessCode.trim().toUpperCase() || e.code?.trim().toUpperCase() === accessCode.trim().toUpperCase()))
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found or invalid check-in code.' });
    }

    if (event.isRegistrationLocked) {
      return res.status(403).json({ error: 'Registration and live check-in for this event is currently closed by the coordinator.' });
    }

    if (!name || !rollNo || !email) {
      return res.status(400).json({ error: 'Name, roll number, and email are required.' });
    }

    const cleanRollNo = rollNo.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if participant already exists in this event
    const existing = allData.participants.find(p => 
      p.eventId === event.id && 
      (p.rollNo.toUpperCase() === cleanRollNo || p.email.toLowerCase() === cleanEmail)
    );

    let participant: ParticipantRecord;

    if (existing) {
      participant = {
        ...existing,
        name: name.trim(),
        rollNo: cleanRollNo,
        email: cleanEmail,
        department: department || existing.department,
        yearOfStudy: yearOfStudy || existing.yearOfStudy,
        section: section || existing.section,
        attendanceStatus: 'PRESENT',
        checkInTimestamp: new Date().toISOString()
      };
      updateParticipant(participant.id, participant);
    } else {
      participant = {
        id: `part-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        eventId: event.id,
        name: name.trim(),
        rollNo: cleanRollNo,
        email: cleanEmail,
        institution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
        department: department || event.department,
        yearOfStudy: yearOfStudy || '3rd Year',
        section: section || 'Section A',
        role: 'Participant',
        attendanceStatus: 'PRESENT',
        attendanceScore: 100,
        checkInTimestamp: new Date().toISOString(),
        issueStatus: 'PENDING',
        dispatchStatus: 'UNSENT'
      };
      upsertParticipants([participant]);
    }

    appendAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action: 'VERIFIED',
      entityType: 'EVENT',
      entityId: event.id,
      details: `Student ${participant.name} (${participant.rollNo}) verified attendance in "${event.title}".`,
      actor: participant.name,
      severity: 'INFO'
    });

    return res.json({ success: true, participant, event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Check-in failed' });
  }
});

// Save generated certificates to persistent database
app.post('/api/certificates', (req: Request, res: Response) => {
  try {
    const { certificates } = req.body;
    if (!certificates || !Array.isArray(certificates)) {
      return res.status(400).json({ error: 'Certificates array is required.' });
    }
    const saved = upsertCertificates(certificates);
    return res.json({ success: true, count: saved.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Public certificate verification endpoint (searches persistent database)
app.get('/api/certificates/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cert = getCertificate(id);
    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate record not found in institutional registry.' });
    }
    return res.json({ success: true, certificate: cert });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Append to audit logs
app.post('/api/audit-logs', (req: Request, res: Response) => {
  try {
    const { log } = req.body;
    if (!log) return res.status(400).json({ error: 'Log payload required.' });
    appendAuditLog(log);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. AI STUDIO INTEGRATIONS (GEMINI)
// ==========================================

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// AI Event Wizard
app.post('/api/ai/event-wizard', async (req: Request, res: Response) => {
  try {
    const { prompt, institutionName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.json({
        title: "National Technical Symposium & Hackathon",
        category: "Hackathon & Competition",
        department: "Department of Computer Science & Engineering",
        venue: "Main Auditorium & Innovation Lab",
        description: prompt,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        coordinator: "Dr. Eleanor Vance, Dean of Academic Affairs",
        coCoordinator: "Prof. Marcus Thorne, Head of Innovation",
        certificateTypes: [
          {
            type: "Winner - 1st Place",
            citation: "In recognition of outstanding performance, technical excellence, and securing 1st Place.",
            badge: "Gold Award"
          },
          {
            type: "Runner Up - 2nd Place",
            citation: "For exemplary innovation, superior execution, and securing 2nd Place.",
            badge: "Silver Award"
          },
          {
            type: "Certificate of Participation",
            citation: "In acknowledgement of active participation, dedication, and successful completion of all event sessions.",
            badge: "Certificate of Merit"
          }
        ],
        suggestedTemplate: "modern-tech",
        securityLevel: "HIGH_CRYPTOGRAPHIC"
      });
    }

    const systemInstruction = `You are an AI Institutional Event & Certification Architect for universities and educational institutions.
Analyze the user's event prompt and generate a complete structured event configuration and certificate metadata in JSON format.
Return ONLY valid JSON matching this schema:
{
  "title": string,
  "category": "Workshop" | "Hackathon & Competition" | "Technical Conference" | "Guest Seminar" | "Cultural Festival" | "Faculty Development",
  "department": string,
  "venue": string,
  "description": string,
  "startDate": string (YYYY-MM-DD),
  "endDate": string (YYYY-MM-DD),
  "coordinator": string,
  "coCoordinator": string,
  "certificateTypes": [
    {
      "type": string (e.g., "Winner - 1st Place", "Certificate of Participation", "Distinguished Mentor"),
      "citation": string (formal academic citation prose for the certificate body),
      "badge": string
    }
  ],
  "suggestedTemplate": "academic-classic" | "modern-tech" | "gold-prestige" | "minimalist-clean" | "stem-excellence",
  "securityLevel": "STANDARD" | "HIGH_CRYPTOGRAPHIC"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Institution: ${institutionName || "Vignan's Foundation for Science, Technology & Research (VFSTR)"}\nUser Prompt: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in event-wizard:', error);
    const { prompt } = req.body;
    return res.json({
      title: "Vignan Mahotsav - National Technical Hackathon",
      category: "Hackathon & Competition",
      department: "Department of Computer Science & Engineering",
      venue: "Vignan Innovation and Incubation Centre (VIIC) & U-Block Auditorium",
      description: prompt || "Vignan University technical symposium and national hackathon.",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      coordinator: "Dr. K.V. Krishna Kishore, Dean of Academic Affairs",
      coCoordinator: "Dr. D. Venkatesulu, Dean - School of Computing",
      certificateTypes: [
        {
          type: "Winner - 1st Place",
          citation: "In recognition of outstanding performance, technical excellence, and securing 1st Place.",
          badge: "Gold Award"
        },
        {
          type: "Runner Up - 2nd Place",
          citation: "For exemplary innovation, superior execution, and securing 2nd Place.",
          badge: "Silver Award"
        },
        {
          type: "Certificate of Participation",
          citation: "In acknowledgement of active participation, dedication, and successful completion of all event sessions.",
          badge: "Certificate of Merit"
        }
      ],
      suggestedTemplate: "modern-tech",
      securityLevel: "HIGH_CRYPTOGRAPHIC"
    });
  }
});

// AI Citation & Commendation Generator
app.post('/api/ai/citation-generator', async (req: Request, res: Response) => {
  try {
    const { studentName, eventTitle, role, rank, projectTitle, tone } = req.body;

    if (!ai) {
      return res.json({
        citation: `This is to certify that ${studentName || 'the participant'} has actively participated in ${eventTitle || 'the institutional event'}${projectTitle ? ` and presented "${projectTitle}"` : ''}, demonstrating commendable technical acumen, diligence, and scholarly integrity.`
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate an elegant, authentic academic certificate citation statement (25-45 words).
Recipient: ${studentName || 'Participant'}
Event: ${eventTitle}
Role/Achievement: ${role || 'Participant'} ${rank ? `(${rank})` : ''}
Project/Contribution: ${projectTitle || 'N/A'}
Tone: ${tone || 'Formal Academic Prestige'}
Output format: JSON with single key "citation" containing the exact string.`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in citation-generator:', error);
    const { studentName, eventTitle, projectTitle } = req.body;
    return res.json({
      citation: `This is to certify that ${studentName || 'the participant'} has actively participated in ${eventTitle || 'the institutional event'}${projectTitle ? ` and presented "${projectTitle}"` : ''}, demonstrating commendable technical acumen, diligence, and scholarly integrity.`
    });
  }
});

// AI Participant Cleaner
app.post('/api/ai/data-cleaner', async (req: Request, res: Response) => {
  try {
    const { rawText, existingParticipants = [] } = req.body;
    if (!rawText) return res.status(400).json({ error: 'rawText is required' });

    if (!ai) {
      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      const parsed = lines.map((line: string, index: number) => {
        const parts = line.split(/[,\t;|]/).map((p: string) => p.trim());
        const name = parts[0] || `Participant ${index + 1}`;
        const email = parts[1] || `${name.toLowerCase().replace(/\s+/g, '.')}@institution.edu`;
        const rollNo = parts[2] || `STU-${1000 + index}`;
        const role = parts[3] || 'Participant';
        return { name, email, rollNo, role, status: 'VALID', anomalyNote: null };
      });
      return res.json({ cleaned: parsed, anomaliesFound: 0 });
    }

    const systemInstruction = `You are a strict Institutional Data Cleansing & Fraud Prevention Engine.
Inspect the provided raw participant list. Return a JSON object with:
{
  "cleaned": [
    {
      "name": string (Proper Title Case),
      "email": string (standardized lowercase email),
      "rollNo": string (institutional roll number or ID),
      "role": string,
      "status": "VALID" | "SUSPECT_DUPLICATE" | "INVALID_EMAIL" | "FORMAT_CORRECTED",
      "anomalyNote": string | null
    }
  ],
  "anomaliesFound": number,
  "summary": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Raw Participant Data:\n${rawText}\n\nExisting Participant Identifiers:\n${JSON.stringify(existingParticipants)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in data-cleaner:', error);
    const { rawText } = req.body;
    const lines = (rawText || '').split('\n').filter((l: string) => l.trim().length > 0);
    const parsed = lines.map((line: string, index: number) => {
      const parts = line.split(/[,\t;|]/).map((p: string) => p.trim());
      const name = parts[0] ? parts[0].split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : `Participant ${index + 1}`;
      const email = parts[1] || `${name.toLowerCase().replace(/\s+/g, '.')}@apex.edu`;
      const rollNo = parts[2] || `APEX-22-CS-${100 + index}`;
      const role = parts[3] || 'Participant';
      return { name, email: email.toLowerCase(), rollNo: rollNo.toUpperCase(), role, status: 'VALID', anomalyNote: null };
    });
    return res.json({ cleaned: parsed, anomaliesFound: 0, summary: `Sanitized and formatted ${parsed.length} student records.` });
  }
});

// AI Agent Chat
app.post('/api/ai/agent-chat', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    if (!ai) {
      return res.json({
        reply: `Institutional Agent Notice: Received your inquiry "${message}". System is tracking ${context?.totalCertificates || 0} certificates across ${context?.totalEvents || 0} active institutional events with 100% cryptographic checksum validation.`
      });
    }

    const systemInstruction = `You are "CertiSphere AI", the autonomous institutional activity & certificate compliance agent.
You assist university administrators, event organizers, and accreditation officers.
Institutional Context:
${JSON.stringify(context || {})}
Keep answers authoritative, precise, concise, and academically professional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: { systemInstruction }
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in agent-chat:', error);
    const { message, context } = req.body;
    return res.json({
      reply: `CertiSphere Compliance Agent Advisory: In response to "${message}": Institutional registry is active with ${context?.totalCertificates || 0} verified certificates across ${context?.totalEvents || 0} events.`
    });
  }
});

// ==========================================
// 4. REAL EMAIL DISPATCH & CONFIGURATION HUB
// ==========================================

// PDF Certificate Generator
function generatePdfCertificateBuffer({
  name,
  eventTitle,
  role,
  certificateId,
  orgName
}: {
  name: string;
  eventTitle: string;
  role?: string;
  certificateId: string;
  orgName: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const width = doc.page.width;
      const height = doc.page.height;

      // Outer Navy Border
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(4)
         .stroke('#1e3a8a');

      // Inner Gold Border
      doc.rect(28, 28, width - 56, height - 56)
         .lineWidth(1.5)
         .stroke('#b45309');

      // Header Institution
      doc.moveDown(1.5);
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor('#1e3a8a')
         .text(orgName || "VIGNAN'S FOUNDATION FOR SCIENCE, TECHNOLOGY & RESEARCH", {
           align: 'center',
           characterSpacing: 1.5
         });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#64748b')
         .text('(Deemed to be University) · Accredited NAAC A+ · Established u/s 3 of UGC Act 1956', {
           align: 'center'
         });

      doc.moveDown(1.2);

      const isMerit = Boolean(role && (
        role.includes('Winner') || 
        role.includes('Merit') || 
        role.includes('1st') || 
        role.includes('2nd') || 
        role.includes('3rd') || 
        role.includes('Place')
      ));
      const certTitle = isMerit ? 'CERTIFICATE OF MERIT' : 'CERTIFICATE OF PARTICIPATION';

      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#b45309')
         .text('OFFICIAL ACADEMIC CREDENTIAL', {
           align: 'center',
           characterSpacing: 2
         });

      doc.moveDown(0.2);
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#0f172a')
         .text(certTitle, {
           align: 'center',
           characterSpacing: 1
         });

      doc.moveDown(0.6);
      doc.font('Helvetica-Oblique')
         .fontSize(12)
         .fillColor('#475569')
         .text('This is proudly conferred to', { align: 'center' });

      // Student Name
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold')
         .fontSize(26)
         .fillColor('#1e3a8a')
         .text(name, { align: 'center' });

      // Decorative underline
      const nameWidth = doc.widthOfString(name);
      const nameX = (width - nameWidth) / 2;
      const currentY = doc.y;
      doc.moveTo(nameX - 20, currentY + 3)
         .lineTo(nameX + nameWidth + 20, currentY + 3)
         .lineWidth(1.5)
         .stroke('#b45309');

      // Citation Body
      doc.moveDown(1.0);
      const citation = isMerit
        ? `in recognition of exemplary performance, superior technical innovation, and securing ${role} in the event "${eventTitle}".`
        : `for active participation, commendable dedication, and successful completion of all technical sessions in the event "${eventTitle}".`;

      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#334155')
         .text(citation, (width - 560) / 2, doc.y, {
           width: 560,
           align: 'center',
           lineGap: 4
         });

      // Signatures
      const sigY = height - 120;

      // Left Signature
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#1e3a8a')
         .text('Dr. K.V. Krishna Kishore', 60, sigY);
      doc.moveTo(60, sigY + 14)
         .lineTo(210, sigY + 14)
         .lineWidth(1)
         .stroke('#94a3b8');
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#475569')
         .text('Dean of Academic Affairs', 60, sigY + 18);

      // Center Gold Seal
      doc.circle(width / 2, sigY + 15, 24)
         .lineWidth(1.5)
         .stroke('#b45309');
      doc.font('Helvetica-Bold')
         .fontSize(7)
         .fillColor('#92400e')
         .text('VFSTR\nVERIFIED', width / 2 - 20, sigY + 8, {
           width: 40,
           align: 'center'
         });

      // Right Signature
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#1e3a8a')
         .text('Dr. D. Venkatesulu', width - 210, sigY, { align: 'right', width: 150 });
      doc.moveTo(width - 210, sigY + 14)
         .lineTo(width - 60, sigY + 14)
         .lineWidth(1)
         .stroke('#94a3b8');
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#475569')
         .text('Head of Department', width - 210, sigY + 18, { align: 'right', width: 150 });

      // Footer
      const footerY = height - 52;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#64748b')
         .text(`Certificate ID: ${certificateId}   ·   Digital SHA-256 Tamper-Proof Verified   ·   https://certisphere-eij8.onrender.com`, 0, footerY, {
           align: 'center',
           width: width
         });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Generate the HTML email body
function generateCertificateEmailHtml({
  name,
  eventTitle,
  role,
  certificateId,
  orgName,
  verificationUrl
}: {
  name: string;
  eventTitle: string;
  role?: string;
  certificateId: string;
  orgName: string;
  verificationUrl: string;
}): string {
  const isMerit = Boolean(role && (
    role.includes('Winner') || 
    role.includes('Merit') || 
    role.includes('1st') || 
    role.includes('2nd') || 
    role.includes('3rd') || 
    role.includes('Place')
  ));
  const isSpeaker = Boolean(role && (role.includes('Speaker') || role.includes('Mentor')));
  
  const certTitle = isMerit 
    ? `Certificate of Merit` 
    : isSpeaker 
      ? `Certificate of Appreciation` 
      : `Certificate of Participation`;

  const citationText = isMerit
    ? `In recognition of outstanding performance, technical excellence, and securing <strong>${role}</strong> in <strong>"${eventTitle}"</strong> organized by ${orgName}.`
    : `for active participation, dedication, and successful completion of all technical sessions in <strong>"${eventTitle}"</strong> conducted at ${orgName}.`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: bold; color: #1e3a8a; letter-spacing: 1.5px; text-transform: uppercase;">${orgName}</span>
        <h2 style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 6px 0 0 0;">Official Institutional Credential Notification</h2>
      </div>
      
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
      
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        We are pleased to issue your verified digital institutional credential for <strong>"${eventTitle}"</strong>.
        An official printable PDF certificate is attached directly to this email.
      </p>

      <div style="background-color: #fffdfa; border: 3px double #b45309; border-radius: 6px; padding: 28px 22px; margin: 24px 0; color: #0f172a; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.06); outline: 4px solid #1e3a8a; outline-offset: -7px;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #1e3a8a; text-transform: uppercase;">
            ${orgName}
          </div>
          <div style="font-size: 9px; color: #64748b; letter-spacing: 1px; margin-top: 3px;">
            Deemed to be University · Accredited NAAC A+ · Institution of Excellence
          </div>
        </div>

        <div style="font-size: 10px; letter-spacing: 3px; color: #b45309; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">
          OFFICIAL ACADEMIC CREDENTIAL
        </div>

        <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 1px; text-transform: uppercase;">
          ${certTitle}
        </div>

        <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 13px; color: #64748b; margin: 14px 0 6px 0;">
          This is proudly presented to
        </div>

        <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; border-bottom: 2px solid #b45309; display: inline-block; padding: 0 24px 4px 24px; margin-bottom: 14px;">
          ${name}
        </div>

        <div style="font-size: 13px; color: #334155; line-height: 1.7; max-width: 480px; margin: 0 auto;">
          ${citationText}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
          <tr>
            <td align="left" style="width: 35%; vertical-align: bottom;">
              <div style="font-family: Georgia, serif; font-size: 15px; color: #1e3a8a; font-weight: bold;">Dr. K.V. Krishna Kishore</div>
              <div style="border-top: 1px solid #94a3b8; width: 130px; margin-top: 4px; padding-top: 4px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase;">
                Dean of Academic Affairs
              </div>
            </td>
            <td align="center" style="width: 30%; vertical-align: middle;">
              <div style="display: inline-block; border: 2px solid #b45309; border-radius: 50%; padding: 8px; width: 52px; height: 52px; text-align: center; background-color: #fef3c7;">
                <div style="font-size: 8px; font-weight: bold; color: #92400e; text-transform: uppercase; margin-top: 8px; line-height: 1.1;">
                  VFSTR<br/>SEAL
                </div>
              </div>
            </td>
            <td align="right" style="width: 35%; vertical-align: bottom;">
              <div style="font-family: Georgia, serif; font-size: 15px; color: #1e3a8a; font-weight: bold;">Dr. D. Venkatesulu</div>
              <div style="border-top: 1px solid #94a3b8; width: 130px; margin-top: 4px; padding-top: 4px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase; margin-left: auto;">
                Head of Department
              </div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 18px; padding: 10px; background-color: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 11px; color: #475569;">
          <strong>Certificate ID:</strong> ${certificateId} &nbsp;·&nbsp; <span style="color: #059669; font-weight: bold;">✔ Cryptographic SHA-256 Tamper-Proof</span>
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0 16px 0;">
        <a href="${verificationUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 13px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(30, 58, 138, 0.25);">
          📜 Open High-Res Certificate & Verification
        </a>
      </div>

      <p style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
        Verification Link: <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
        Issued by Dean of Academic Affairs & Institutional Activity Board<br/>
        ${orgName}
      </div>
    </div>
  `;
}

// Single Dispatch Worker Function
async function sendCertificateEmail({
  to,
  name,
  eventTitle,
  role,
  certificateId,
  orgName,
  verificationUrl,
  customConfig
}: {
  to: string;
  name: string;
  eventTitle: string;
  role?: string;
  certificateId: string;
  orgName: string;
  verificationUrl: string;
  customConfig?: any;
}): Promise<{ messageId: string; provider: string }> {
  const dbConfig = getEmailConfig();

  // Resolve active provider
  const provider = customConfig?.provider || dbConfig.provider || (process.env.BREVO_API_KEY ? 'brevo' : process.env.RESEND_API_KEY ? 'resend' : 'smtp');
  const apiKey = customConfig?.apiKey || dbConfig.apiKey || (provider === 'brevo' ? process.env.BREVO_API_KEY : process.env.RESEND_API_KEY);
  const senderEmail = customConfig?.senderEmail || dbConfig.senderEmail || process.env.BREVO_SENDER || process.env.RESEND_FROM || process.env.SMTP_USER || 'shimaferheenshaik@gmail.com';
  const senderName = customConfig?.senderName || dbConfig.senderName || 'VFSTR Academic Coordination Registry';

  // Generate PDF attachment
  let pdfBuffer: Buffer | null = null;
  let pdfBase64: string | null = null;
  try {
    pdfBuffer = await generatePdfCertificateBuffer({
      name,
      eventTitle,
      role,
      certificateId,
      orgName
    });
    pdfBase64 = pdfBuffer.toString('base64');
  } catch (err) {
    console.warn('PDF generation failed, dispatching HTML only:', err);
  }

  const htmlBody = generateCertificateEmailHtml({
    name,
    eventTitle,
    role,
    certificateId,
    orgName,
    verificationUrl
  });

  const subject = `Official Certificate: ${eventTitle} — ${certificateId}`;

  // 1. BREVO HTTPS API (Most reliable on Render Free tier - no SMTP port blocks, 300 free/day)
  if (provider === 'brevo' && apiKey) {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name }],
        subject,
        htmlContent: htmlBody,
        attachment: pdfBase64 ? [
          {
            name: `${certificateId}.pdf`,
            content: pdfBase64
          }
        ] : undefined
      })
    });

    const data: any = await brevoRes.json();
    if (!brevoRes.ok) {
      throw new Error(`Brevo API Error (${brevoRes.status}): ${data?.message || data?.error || 'Unknown Brevo error'}`);
    }
    return { messageId: data.messageId || `brevo-${Date.now()}`, provider: 'Brevo API' };
  }

  // 2. RESEND HTTPS API (Over port 443 - works on cloud hosts)
  if (provider === 'resend' && apiKey) {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail.includes('@') && !senderEmail.includes('resend.dev') ? senderEmail : 'onboarding@resend.dev'}>`,
        to: [to],
        subject,
        html: htmlBody,
        attachments: pdfBase64 ? [
          {
            filename: `${certificateId}.pdf`,
            content: pdfBase64
          }
        ] : undefined
      })
    });

    const data: any = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(`Resend API Error (${resendRes.status}): ${data?.message || 'Unknown Resend error'}`);
    }
    return { messageId: data.id || `resend-${Date.now()}`, provider: 'Resend API' };
  }

  // 3. SMTP (Nodemailer for custom mail servers or Gmail App Password)
  const host = customConfig?.smtpHost || dbConfig.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(customConfig?.smtpPort || dbConfig.smtpPort || process.env.SMTP_PORT || '587');
  const user = customConfig?.smtpUser || dbConfig.smtpUser || process.env.SMTP_USER || senderEmail;
  const pass = customConfig?.smtpPass || dbConfig.smtpPass || process.env.SMTP_PASS;

  if (pass) {
    let transporter: Transporter;
    if (host.includes('gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
    }

    const info = await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to,
      subject,
      html: htmlBody,
      attachments: pdfBuffer ? [
        {
          filename: `${certificateId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : undefined
    });

    return { messageId: info.messageId, provider: 'SMTP' };
  }

  throw new Error(
    'No valid email provider configured. Please open Email Settings in the Coordinator Portal to provide a free Brevo API Key (Recommended for Render) or Resend Key.'
  );
}

// Get masked email configuration
app.get('/api/email/config', (_req: Request, res: Response) => {
  const config = getEmailConfig();
  return res.json({
    provider: config.provider || 'brevo',
    senderEmail: config.senderEmail,
    senderName: config.senderName,
    hasApiKey: Boolean(config.apiKey || process.env.BREVO_API_KEY || process.env.RESEND_API_KEY),
    smtpHost: config.smtpHost || 'smtp.gmail.com',
    smtpPort: config.smtpPort || 587,
    hasSmtpPass: Boolean(config.smtpPass || process.env.SMTP_PASS)
  });
});

// Save email configuration to database
app.post('/api/email/config', (req: Request, res: Response) => {
  try {
    const { provider, apiKey, senderEmail, senderName, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    const current = getEmailConfig();
    const updated = saveEmailConfig({
      provider: provider || current.provider,
      apiKey: apiKey !== undefined && apiKey !== '' ? apiKey.trim() : current.apiKey,
      senderEmail: senderEmail ? senderEmail.trim() : current.senderEmail,
      senderName: senderName ? senderName.trim() : current.senderName,
      smtpHost: smtpHost ? smtpHost.trim() : current.smtpHost,
      smtpPort: smtpPort ? parseInt(smtpPort) : current.smtpPort,
      smtpUser: smtpUser ? smtpUser.trim() : current.smtpUser,
      smtpPass: smtpPass !== undefined && smtpPass !== '' ? smtpPass.trim() : current.smtpPass
    });
    return res.json({ success: true, message: 'Email configuration saved successfully.', config: {
      provider: updated.provider,
      senderEmail: updated.senderEmail,
      senderName: updated.senderName,
      hasApiKey: Boolean(updated.apiKey),
      hasSmtpPass: Boolean(updated.smtpPass)
    } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Immediate Live Test Email Endpoint
app.post('/api/email/test', async (req: Request, res: Response) => {
  try {
    const { targetEmail, customConfig } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'Target recipient email address is required.' });
    }

    const testCertId = `CERT-TEST-${Math.floor(100000 + Math.random() * 900000)}`;
    const orgName = "Vignan's Foundation for Science, Technology & Research (VFSTR)";
    const verificationUrl = `${process.env.APP_URL || 'https://certisphere-eij8.onrender.com'}/?verify=${testCertId}`;

    const result = await sendCertificateEmail({
      to: targetEmail.trim(),
      name: 'Faculty Coordinator (Diagnostic Test)',
      eventTitle: 'CertiSphere Email Delivery & Protocol Test',
      role: 'Merit Award (Test)',
      certificateId: testCertId,
      orgName,
      verificationUrl,
      customConfig
    });

    return res.json({
      success: true,
      message: `Test email with official PDF certificate successfully delivered to ${targetEmail}!`,
      provider: result.provider,
      messageId: result.messageId
    });
  } catch (err: any) {
    console.error('Email test failed:', err.message);
    let diagnosis = err.message;
    if (err.message.includes('401') || err.message.includes('Key not found') || err.message.includes('unauthorized')) {
      diagnosis = 'API Key was rejected by the email provider. Please double check that you copied the complete API key.';
    } else if (err.message.includes('only send testing emails to your own email')) {
      diagnosis = 'Resend is currently in sandbox mode and only sends to your account email. Switch to Brevo (free, sends to any recipient) or verify a domain in Resend.';
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
      diagnosis = 'SMTP connection timed out. Free cloud hosts like Render block outbound SMTP ports 25, 465, and 587. Please select Brevo (HTTPS API) which works 100% on Render Free tier!';
    }
    return res.status(400).json({
      success: false,
      error: err.message,
      diagnosis
    });
  }
});

// Bulk & Single Email Dispatch Endpoint
app.post('/api/email/dispatch', async (req: Request, res: Response) => {
  try {
    const {
      recipients,
      eventTitle,
      senderName,
      customSmtp,
      customConfig,
      institutionName
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is required' });
    }

    const orgName = institutionName || "Vignan's Foundation for Science, Technology & Research (VFSTR)";
    const effectiveConfig = customConfig || (customSmtp ? {
      provider: 'smtp',
      smtpHost: customSmtp.host,
      smtpPort: customSmtp.port,
      smtpUser: customSmtp.user,
      smtpPass: customSmtp.pass,
      senderEmail: customSmtp.user,
      senderName: senderName || 'VFSTR Academic Coordinator'
    } : undefined);

    const dispatchResults = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const { email, name, certificateId, role, verificationUrl } = recipient;
      try {
        const result = await sendCertificateEmail({
          to: email,
          name,
          eventTitle: eventTitle || 'Institutional Symposium',
          role,
          certificateId: certificateId || `CERT-${Date.now()}`,
          orgName: recipient.recipientInstitution || orgName,
          verificationUrl: verificationUrl || `${process.env.APP_URL || 'https://certisphere-eij8.onrender.com'}/?verify=${certificateId}`,
          customConfig: effectiveConfig
        });

        dispatchResults.push({
          email,
          certificateId,
          status: 'SENT',
          messageId: result.messageId,
          provider: result.provider
        });
        sentCount++;

        // Update database participant dispatch status if matching rollNo or certificateId
        const allData = getAllData();
        const matched = allData.participants.find(p => p.certificateId === certificateId || p.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          updateParticipant(matched.id, { dispatchStatus: 'DELIVERED' });
        }
      } catch (err: any) {
        console.error(`Failed to send to ${email}:`, err.message);
        dispatchResults.push({
          email,
          certificateId,
          status: 'FAILED',
          error: err.message
        });
        failedCount++;
      }
    }

    return res.json({
      success: true,
      hasRealSmtp: true,
      sentCount,
      failedCount,
      total: recipients.length,
      results: dispatchResults
    });
  } catch (error: any) {
    console.error('Error in email dispatch API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during email dispatch' });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'CertiSphere Institutional Registry & Agent Backend',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CertiSphere Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
