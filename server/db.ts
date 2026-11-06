import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { SAMPLE_VIGNAN_PRESETS } from '../src/utils/seedData.js';
import { 
  InstitutionalEvent, 
  ParticipantRecord, 
  CertificateRecord, 
  AuditLogEntry, 
  FacultyCoordinator 
} from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredCoordinator extends FacultyCoordinator {
  salt: string;
  passwordHash: string;
}

export interface StoredSession {
  token: string;
  coordinatorId: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredEmailConfig {
  provider: 'brevo' | 'resend' | 'smtp';
  apiKey?: string;
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface DatabaseSchema {
  coordinators: StoredCoordinator[];
  sessions: StoredSession[];
  emailConfig: StoredEmailConfig;
  events: InstitutionalEvent[];
  participants: ParticipantRecord[];
  certificates: CertificateRecord[];
  auditLogs: AuditLogEntry[];
}

let db: DatabaseSchema = {
  coordinators: [],
  sessions: [],
  emailConfig: {
    provider: 'brevo',
    senderEmail: 'shimaferheenshaik@gmail.com',
    senderName: 'VFSTR Academic Coordination Registry'
  },
  events: [],
  participants: [],
  certificates: [],
  auditLogs: []
};

// Cryptographic Password Hashing using PBKDF2 (100,000 iterations, SHA-512)
export function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function persistDb(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export function initDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = JSON.parse(content);
      db = {
        coordinators: loaded.coordinators || [],
        sessions: loaded.sessions || [],
        emailConfig: loaded.emailConfig || {
          provider: 'brevo',
          senderEmail: 'shimaferheenshaik@gmail.com',
          senderName: 'VFSTR Academic Coordination Registry'
        },
        events: loaded.events || [],
        participants: loaded.participants || [],
        certificates: loaded.certificates || [],
        auditLogs: loaded.auditLogs || []
      };
      console.log(`[Database] Loaded persistent data: ${db.coordinators.length} coordinators, ${db.events.length} events, ${db.certificates.length} certificates.`);
    } catch (err) {
      console.error('[Database] Corrupt db file, re-initializing from seeds...', err);
    }
  }

  // Pre-seed default faculty coordinators if empty
  if (db.coordinators.length === 0) {
    const defaultCredentials = 'Vignan@2026';
    const initialFaculties = [
      {
        id: 'coord-cse',
        name: 'Dr. K.V. Krishna Kishore',
        email: 'coordinator.cse@vignan.ac.in',
        department: 'CSE',
        facultyId: 'VF-CSE-1001',
        role: 'DEAN_ADMIN' as const
      },
      {
        id: 'coord-aiml',
        name: 'Dr. D. Venkatesulu',
        email: 'coordinator.aiml@vignan.ac.in',
        department: 'AIML',
        facultyId: 'VF-AIML-1002',
        role: 'FACULTY_COORDINATOR' as const
      },
      {
        id: 'coord-robotics',
        name: 'Prof. Marcus Thorne',
        email: 'coordinator.robotics@vignan.ac.in',
        department: 'ROBOTICS',
        facultyId: 'VF-ROB-1003',
        role: 'FACULTY_COORDINATOR' as const
      },
      {
        id: 'coord-it',
        name: 'Dr. N. Veeranjaneyulu',
        email: 'coordinator.it@vignan.ac.in',
        department: 'IT',
        facultyId: 'VF-IT-1004',
        role: 'FACULTY_COORDINATOR' as const
      }
    ];

    db.coordinators = initialFaculties.map(f => {
      const { salt, hash } = hashPassword(defaultCredentials);
      return {
        ...f,
        salt,
        passwordHash: hash,
        createdAt: new Date().toISOString()
      };
    });
    console.log('[Database] Seeded 4 institutional faculty coordinators with initial credentials.');
  }

  // Seed events, participants, certificates if empty
  if (db.events.length === 0) {
    db.events = [...(SAMPLE_VIGNAN_PRESETS.events as any)];
  }
  if (db.participants.length === 0) {
    db.participants = [...(SAMPLE_VIGNAN_PRESETS.participants as any)];
  }
  if (db.certificates.length === 0) {
    db.certificates = [...(SAMPLE_VIGNAN_PRESETS.certificates as any)];
  }
  if (db.auditLogs.length === 0) {
    db.auditLogs = [];
  }

  // Check environment variables to hydrate email config if available
  if (process.env.BREVO_API_KEY && !db.emailConfig.apiKey) {
    db.emailConfig.provider = 'brevo';
    db.emailConfig.apiKey = process.env.BREVO_API_KEY;
    if (process.env.BREVO_SENDER) db.emailConfig.senderEmail = process.env.BREVO_SENDER;
  } else if (process.env.RESEND_API_KEY && !db.emailConfig.apiKey) {
    db.emailConfig.provider = 'resend';
    db.emailConfig.apiKey = process.env.RESEND_API_KEY;
    if (process.env.RESEND_FROM) db.emailConfig.senderEmail = process.env.RESEND_FROM;
  }

  persistDb();
}

// Auth operations
export function registerCoordinator(data: {
  name: string;
  email: string;
  department: string;
  facultyId?: string;
  password: string;
}): { coordinator: FacultyCoordinator; token: string } {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = db.coordinators.find(c => c.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('A faculty coordinator is already registered with this institutional email.');
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { salt, hash } = hashPassword(data.password);
  const newCoord: StoredCoordinator = {
    id: `coord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: data.name.trim(),
    email: normalizedEmail,
    department: data.department.trim().toUpperCase(),
    facultyId: data.facultyId?.trim() || `VF-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    role: 'FACULTY_COORDINATOR',
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  db.coordinators.push(newCoord);

  const token = generateToken();
  db.sessions.push({
    token,
    coordinatorId: newCoord.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() // 7 days
  });

  persistDb();

  const { salt: _s, passwordHash: _p, ...publicCoord } = newCoord;
  return { coordinator: publicCoord, token };
}

export function loginCoordinator(email: string, password: string): { coordinator: FacultyCoordinator; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const coord = db.coordinators.find(c => c.email.toLowerCase() === normalizedEmail);
  
  if (!coord) {
    throw new Error('No registered faculty coordinator found with this email.');
  }

  const isValid = verifyPassword(password, coord.passwordHash, coord.salt);
  if (!isValid) {
    throw new Error('Invalid credentials. Please verify your password.');
  }

  const token = generateToken();
  db.sessions.push({
    token,
    coordinatorId: coord.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
  });

  persistDb();

  const { salt: _s, passwordHash: _p, ...publicCoord } = coord;
  return { coordinator: publicCoord, token };
}

export function verifySession(token: string): FacultyCoordinator | null {
  if (!token) return null;
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    db.sessions = db.sessions.filter(s => s.token !== token);
    persistDb();
    return null;
  }

  const coord = db.coordinators.find(c => c.id === session.coordinatorId);
  if (!coord) return null;

  const { salt: _s, passwordHash: _p, ...publicCoord } = coord;
  return publicCoord;
}

export function logoutSession(token: string): void {
  db.sessions = db.sessions.filter(s => s.token !== token);
  persistDb();
}

export function changePassword(coordinatorId: string, currentPass: string, newPass: string): void {
  const coord = db.coordinators.find(c => c.id === coordinatorId);
  if (!coord) {
    throw new Error('Coordinator record not found.');
  }

  const isValid = verifyPassword(currentPass, coord.passwordHash, coord.salt);
  if (!isValid) {
    throw new Error('Current password does not match records.');
  }

  if (!newPass || newPass.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const { salt, hash } = hashPassword(newPass);
  coord.salt = salt;
  coord.passwordHash = hash;

  persistDb();
}

export function listPublicCoordinators(): { name: string; dept: string; email: string; title: string }[] {
  return db.coordinators.map(c => ({
    name: c.name,
    dept: c.department,
    email: c.email,
    title: c.role === 'DEAN_ADMIN' ? 'Dean of Academic Affairs' : `${c.department} Department Coordinator`
  }));
}

// Entities access
export function getAllData() {
  return {
    events: db.events,
    participants: db.participants,
    certificates: db.certificates,
    auditLogs: db.auditLogs
  };
}

export function upsertEvent(event: InstitutionalEvent): InstitutionalEvent {
  const idx = db.events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    db.events[idx] = { ...db.events[idx], ...event };
  } else {
    db.events.unshift(event);
  }
  persistDb();
  return event;
}

export function upsertParticipants(participants: ParticipantRecord[]): ParticipantRecord[] {
  for (const p of participants) {
    const idx = db.participants.findIndex(item => item.id === p.id);
    if (idx >= 0) {
      db.participants[idx] = { ...db.participants[idx], ...p };
    } else {
      db.participants.push(p);
    }
  }
  persistDb();
  return participants;
}

export function updateParticipant(id: string, updates: Partial<ParticipantRecord>): ParticipantRecord | null {
  const idx = db.participants.findIndex(p => p.id === id);
  if (idx >= 0) {
    db.participants[idx] = { ...db.participants[idx], ...updates };
    persistDb();
    return db.participants[idx];
  }
  return null;
}

export function upsertCertificates(certificates: CertificateRecord[]): CertificateRecord[] {
  for (const c of certificates) {
    const idx = db.certificates.findIndex(item => item.id === c.id);
    if (idx >= 0) {
      db.certificates[idx] = { ...db.certificates[idx], ...c };
    } else {
      db.certificates.unshift(c);
    }
  }
  persistDb();
  return certificates;
}

export function getCertificate(id: string): CertificateRecord | null {
  const clean = (val: string) => (val || '').trim().toLowerCase().replace(/[\s-_]/g, '');
  const target = clean(id);
  return db.certificates.find(c => 
    clean(c.id) === target || 
    clean(c.certificateNumber) === target ||
    clean(c.recipientRollNo) === target ||
    c.recipientEmail.trim().toLowerCase() === id.trim().toLowerCase()
  ) || null;
}

export function appendAuditLog(log: AuditLogEntry): void {
  db.auditLogs.unshift(log);
  persistDb();
}

// Email config
export function getEmailConfig(): StoredEmailConfig {
  return db.emailConfig;
}

export function saveEmailConfig(config: Partial<StoredEmailConfig>): StoredEmailConfig {
  db.emailConfig = {
    ...db.emailConfig,
    ...config
  };
  persistDb();
  return db.emailConfig;
}
