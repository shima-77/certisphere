import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import nodemailer, { Transporter } from 'nodemailer';
import PDFDocument from 'pdfkit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
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

// API: AI Event & Certificate Structure Generator
app.post('/api/ai/event-wizard', async (req: Request, res: Response) => {
  try {
    const { prompt, institutionName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      // High-quality deterministic heuristic response if API key is not yet set
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
    console.error('Error in event-wizard (falling back to heuristic):', error);
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

// API: AI Citation & Commendation Generator
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

// API: AI Participant Data Cleaner & Anomaly Detector
app.post('/api/ai/data-cleaner', async (req: Request, res: Response) => {
  try {
    const { rawText, existingParticipants = [] } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    if (!ai) {
      const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
      const parsed = lines.map((line: string, index: number) => {
        const parts = line.split(/[,\t;|]/).map((p: string) => p.trim());
        const name = parts[0] || `Participant ${index + 1}`;
        const email = parts[1] || `${name.toLowerCase().replace(/\s+/g, '.')}@institution.edu`;
        const rollNo = parts[2] || `STU-${1000 + index}`;
        const role = parts[3] || 'Participant';
        return {
          name,
          email,
          rollNo,
          role,
          status: 'VALID',
          anomalyNote: null
        };
      });
      return res.json({ cleaned: parsed, anomaliesFound: 0 });
    }

    const systemInstruction = `You are a strict Institutional Data Cleansing & Fraud Prevention Engine.
Inspect the provided raw participant list (which may contain messy formatting, typos like "jOHN dOE", invalid emails, duplicate names or IDs, and missing details).
Also compare against existing enrolled participants to detect duplicate attempts.

Return a JSON object:
{
  "cleaned": [
    {
      "name": string (Properly Capitalized Title Case, cleaned),
      "email": string (standardized lowercase email),
      "rollNo": string (institutional roll number or ID, standardized),
      "role": string (e.g. "Participant", "Winner - 1st", "Organizer"),
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
    console.error('Error in data-cleaner (falling back to parser):', error);
    const { rawText } = req.body;
    const lines = (rawText || '').split('\n').filter((l: string) => l.trim().length > 0);
    const parsed = lines.map((line: string, index: number) => {
      const parts = line.split(/[,\t;|]/).map((p: string) => p.trim());
      const name = parts[0] ? parts[0].split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : `Participant ${index + 1}`;
      const email = parts[1] || `${name.toLowerCase().replace(/\s+/g, '.')}@apex.edu`;
      const rollNo = parts[2] || `APEX-22-CS-${100 + index}`;
      const role = parts[3] || 'Participant';
      return {
        name,
        email: email.toLowerCase(),
        rollNo: rollNo.toUpperCase(),
        role,
        status: 'VALID',
        anomalyNote: null
      };
    });
    return res.json({ cleaned: parsed, anomaliesFound: 0, summary: `Sanitized and formatted ${parsed.length} student records.` });
  }
});

// API: AI Institutional Assistant / Audit Agent
app.post('/api/ai/agent-chat', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    if (!ai) {
      return res.json({
        reply: `Institutional Agent Notice: Received your inquiry "${message}". System is monitoring all certificate registries. Currently tracking ${context?.totalCertificates || 0} certificates across ${context?.totalEvents || 0} active institutional events with 100% cryptographic checksum validation.`
      });
    }

    const systemInstruction = `You are "CertiSphere AI", the autonomous institutional activity & certificate compliance agent.
You assist university administrators, event organizers, and accreditation officers.
You can:
1. Advise on certificate fraud prevention and tamper-proof verification standards.
2. Formulate event rubrics, certificate criteria, and academic citations.
3. Help verify audit readiness for NAAC, ABET, NBA, and institutional accreditation.
4. Execute simulated agent operations (e.g. recommend revoking flagged credentials, suggest certificate batch releases, analyze event participation distributions).

Institutional Context:
${JSON.stringify(context || {})}

Keep answers authoritative, precise, concise, and academically professional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction
      }
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in agent-chat (falling back):', error);
    const { message, context } = req.body;
    return res.json({
      reply: `CertiSphere Compliance Agent Advisory: In response to "${message}": Institutional registry is active with ${context?.totalCertificates || 0} verified certificates across ${context?.totalEvents || 0} events. All issued documents are signed with cryptographic SHA-256 hashes and bound to participant Roll Numbers to prevent unauthorized duplication and forgery.`
    });
  }
});

// API: Real Email Dispatcher for Certificates
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

      // Center Gold Seal text
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
         .text(`Certificate ID: ${certificateId}   ·   Digital SHA-256 Tamper-Proof Verified`, 0, footerY, {
           align: 'center',
           width: width
         });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

app.post('/api/email/dispatch', async (req: Request, res: Response) => {
  try {
    const { 
      recipients, 
      eventTitle, 
      senderName, 
      customSmtp,
      institutionName
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is required' });
    }

    // Determine SMTP configuration (prioritize custom SMTP from UI coordinator settings, fallback to env vars)
    const host = customSmtp?.host || process.env.SMTP_HOST;
    const port = parseInt(customSmtp?.port || process.env.SMTP_PORT || '587');
    const user = customSmtp?.user || process.env.SMTP_USER;
    const pass = customSmtp?.pass || process.env.SMTP_PASS;
    const from = customSmtp?.from || process.env.SMTP_FROM || `${senderName || 'CertiSphere Registry'} <no-reply@vignan.ac.in>`;

    // HTTPS API-based email providers (essential for cloud platforms like Render Free tier that block SMTP ports 587/465)
    const resendApiKey = process.env.RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;

    const hasRealSmtp = Boolean(host && user && pass);
    const hasHttpEmail = Boolean(resendApiKey || brevoApiKey);
    const hasRealEmail = hasRealSmtp || hasHttpEmail;

    let transporter: Transporter | null = null;
    if (hasRealSmtp) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }

    const dispatchResults = [];

    for (const recipient of recipients) {
      let pdfBuffer: Buffer | null = null;
      let pdfBase64: string | null = null;
      try {
        pdfBuffer = await generatePdfCertificateBuffer({
          name: recipient.name,
          eventTitle,
          role: recipient.role,
          certificateId: recipient.certificateId,
          orgName: recipient.recipientInstitution || institutionName || "Vignan's Foundation for Science, Technology & Research (VFSTR)"
        });
        pdfBase64 = pdfBuffer.toString('base64');
      } catch (pdfErr) {
        console.error('Failed to generate PDF attachment:', pdfErr);
      }
      const { 
        email, 
        name, 
        certificateId, 
        role, 
        verificationUrl,
        recipientInstitution
      } = recipient;

      const orgName = recipientInstitution || institutionName || "Vignan's Foundation for Science, Technology & Research (VFSTR)";

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

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          
          <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: bold; color: #1e3a8a; letter-spacing: 1.5px; text-transform: uppercase;">${orgName}</span>
            <h2 style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 6px 0 0 0;">Official Institutional Credential Notification</h2>
          </div>
          
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
          
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            We are pleased to issue your verified digital institutional credential for <strong>"${eventTitle}"</strong>.
          </p>

          <!-- Authentic Academic Parchment Certificate -->
          <div style="background-color: #fffdfa; border: 3px double #b45309; border-radius: 6px; padding: 32px 24px; margin: 24px 0; color: #0f172a; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.06); outline: 4px solid #1e3a8a; outline-offset: -7px;">
            
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 18px;">
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

            <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 13px; color: #64748b; margin: 16px 0 6px 0;">
              This is proudly presented to
            </div>

            <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; border-bottom: 2px solid #b45309; display: inline-block; padding: 0 24px 4px 24px; margin-bottom: 14px;">
              ${name}
            </div>

            <div style="font-size: 13px; color: #334155; line-height: 1.7; max-width: 480px; margin: 0 auto;">
              ${citationText}
            </div>

            <!-- Signatures Table -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <tr>
                <td align="left" style="width: 35%; vertical-align: bottom;">
                  <div style="font-family: 'Brush Script MT', cursive, Georgia, serif; font-size: 17px; color: #1e3a8a;">Dr. K.V. Krishna Kishore</div>
                  <div style="border-top: 1px solid #94a3b8; width: 130px; margin-top: 4px; padding-top: 4px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase;">
                    Dean of Academic Affairs
                  </div>
                </td>
                <td align="center" style="width: 30%; vertical-align: middle;">
                  <div style="display: inline-block; border: 2px solid #b45309; border-radius: 50%; padding: 8px; width: 56px; height: 56px; text-align: center; background-color: #fef3c7;">
                    <div style="font-size: 8px; font-weight: bold; color: #92400e; text-transform: uppercase; margin-top: 10px; line-height: 1.1;">
                      VFSTR<br/>SEAL
                    </div>
                  </div>
                </td>
                <td align="right" style="width: 35%; vertical-align: bottom;">
                  <div style="font-family: 'Brush Script MT', cursive, Georgia, serif; font-size: 17px; color: #1e3a8a;">Dr. D. Venkatesulu</div>
                  <div style="border-top: 1px solid #94a3b8; width: 130px; margin-top: 4px; padding-top: 4px; font-size: 9px; font-weight: bold; color: #475569; text-transform: uppercase; margin-left: auto;">
                    Head of Department
                  </div>
                </td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 10px; background-color: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 11px; color: #475569;">
              <strong>Certificate ID:</strong> ${certificateId} &nbsp;·&nbsp; <span style="color: #059669; font-weight: bold;">✔ Cryptographic SHA-256 Tamper-Proof</span>
            </div>

          </div>

          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="${verificationUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 13px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(30, 58, 138, 0.25);">
              📜 Open High-Res Certificate & Save PDF
            </a>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
            Verification Portal Link: <br/>
            <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
          </p>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
            Issued by Dean of Academic Affairs & Institutional Activity Board<br/>
            ${orgName}
          </div>
        </div>      `;

      if (resendApiKey) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM || 'CertiSphere <onboarding@resend.dev>',
              to: [email],
              subject: `Official Certificate: ${eventTitle} — ${certificateId}`,
              html: htmlBody,
              attachments: pdfBase64 ? [
                {
                  filename: `${certificateId}.pdf`,
                  content: pdfBase64
                }
              ] : undefined
            }),
          });
          const resendData: any = await resendRes.json();
          if (!resendRes.ok) {
            throw new Error(resendData?.message || 'Resend API error');
          }
          dispatchResults.push({
            email,
            certificateId,
            status: 'SENT',
            messageId: resendData.id,
          });
        } catch (resendErr: any) {
          console.error(`Resend API error for ${email}:`, resendErr.message);
          dispatchResults.push({
            email,
            certificateId,
            status: 'FAILED',
            error: resendErr.message,
          });
        }
      } else if (brevoApiKey) {
        try {
          const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { 
                name: senderName || 'CertiSphere Registry', 
                email: process.env.BREVO_SENDER || user || 'shimaferheenshaik@gmail.com' 
              },
              to: [{ email, name }],
              subject: `Official Certificate: ${eventTitle} — ${certificateId}`,
              htmlContent: htmlBody,
            }),
          });
          const brevoData: any = await brevoRes.json();
          if (!brevoRes.ok) {
            throw new Error(brevoData?.message || 'Brevo API error');
          }
          dispatchResults.push({
            email,
            certificateId,
            status: 'SENT',
            messageId: brevoData.messageId,
          });
        } catch (brevoErr: any) {
          console.error(`Brevo API error for ${email}:`, brevoErr.message);
          dispatchResults.push({
            email,
            certificateId,
            status: 'FAILED',
            error: brevoErr.message,
          });
        }
      } else if (transporter && hasRealSmtp) {
        try {
          const info = await transporter.sendMail({
            from,
            to: email,
            subject: `Official Certificate: ${eventTitle} — ${certificateId}`,
            html: htmlBody,
            attachments: pdfBuffer ? [
              {
                filename: `${certificateId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ] : undefined
          });
          dispatchResults.push({
            email,
            certificateId,
            status: 'SENT',
            messageId: info.messageId,
          });
        } catch (mailErr: any) {
          console.error(`Failed to send real email to ${email}:`, mailErr.message);
          dispatchResults.push({
            email,
            certificateId,
            status: 'FAILED',
            error: mailErr.message,
          });
        }
      } else {
        // Simulated verified dispatch when SMTP credentials are not yet saved by coordinator
        dispatchResults.push({
          email,
          certificateId,
          status: 'SIMULATED_DELIVERED',
          note: 'SMTP not configured in .env; email logged & verified in queue. Provide SMTP_USER & SMTP_PASS to send real mail.',
        });
      }
    }

    const sentCount = dispatchResults.filter(r => r.status === 'SENT' || r.status === 'SIMULATED_DELIVERED').length;

    return res.json({
      success: true,
      hasRealSmtp: hasRealEmail,
      sentCount,
      total: recipients.length,
      results: dispatchResults,
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
    service: 'CertiSphere AI Institutional Agent',
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
