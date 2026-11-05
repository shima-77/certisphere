export type DepartmentTheme = 
  | 'CSE'
  | 'AIML'
  | 'IT'
  | 'ROBOTICS'
  | 'ECE'
  | 'BIOTECH'
  | 'MECHANICAL'
  | 'MANAGEMENT'
  | 'GENERAL';

export type TemplateStyle = 
  | 'academic-classic' 
  | 'modern-tech' 
  | 'gold-prestige' 
  | 'stem-excellence' 
  | 'minimalist-clean'
  | 'cyber-neural'
  | 'robotics-industrial';

export type CertificateStatus = 'VALID' | 'REVOKED' | 'EXPIRED';

export type CertificateRole = 
  | 'Participant' 
  | 'Winner - 1st Place' 
  | 'Runner Up - 2nd Place' 
  | '2nd Runner Up - 3rd Place' 
  | 'Merit Award' 
  | 'Keynote Speaker' 
  | 'Faculty Mentor' 
  | 'Organizing Committee';

export interface Signatory {
  id: string;
  name: string;
  title: string;
  department?: string;
  signatureSvgType: 'curator' | 'director' | 'chancellor' | 'dean';
}

export interface CertificateTemplate {
  id: string;
  name: string;
  departmentTheme: DepartmentTheme;
  departmentName: string;
  style: TemplateStyle;
  primaryColor: string;
  accentColor: string;
  fontFamily: 'cinzel' | 'garamond' | 'sans';
  orientation: 'landscape' | 'portrait';
  institutionName: string;
  institutionSubtitle: string;
  sealType: 'gold-crest' | 'academic-shield' | 'laurel-wreath' | 'tech-emblem' | 'neural-ai' | 'robotics-gear' | 'bio-helix';
  headerTitle: string;
  headerSubtitle: string;
  defaultCitationTemplate: string;
  signatories: Signatory[];
  showQrCode: boolean;
  showCryptographicHash: boolean;
  showWatermark: boolean;
  customBackgroundImage?: string; // Base64 or URL of custom uploaded certificate background
  customLogoUrl?: string; // Custom uploaded college logo
}

export interface InstitutionalEvent {
  id: string;
  title: string;
  code: string;
  accessCode?: string; // 6-digit passcode for students e.g. "VF-7824"
  isRegistrationLocked?: boolean; // Coordinator toggle to freeze student check-ins
  category: 'Workshop' | 'Hackathon & Competition' | 'Technical Conference' | 'Guest Seminar' | 'Cultural Festival' | 'Faculty Development';
  department: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Archived';
  coordinator: string;
  coCoordinator?: string;
  description: string;
  templateId: string;
  totalParticipants: number;
  certificatesIssued: number;
  fraudFlagsCount: number;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PENDING';

export interface ParticipantRecord {
  id: string;
  eventId: string;
  name: string;
  email: string;
  rollNo: string;
  institution: string;
  department?: string; // e.g. "CSE", "AIML", "IT", "ECE"
  yearOfStudy?: string; // e.g. "1st Year", "2nd Year", "3rd Year", "4th Year"
  section?: string; // e.g. "Section A", "Section B", "Section C"
  role: CertificateRole;
  rank?: string;
  projectTitle?: string;
  attendanceStatus?: AttendanceStatus;
  attendanceScore?: number;
  checkInTimestamp?: string;
  certificateId?: string;
  issueStatus: 'PENDING' | 'ISSUED' | 'DUPLICATE_BLOCKED';
  dispatchStatus: 'UNSENT' | 'QUEUED' | 'DELIVERED' | 'OPENED' | 'DOWNLOADED';
}

export interface CertificateRecord {
  id: string; // e.g. "APEX-2026-9F83A2"
  certificateNumber: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  participantId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRollNo: string;
  recipientInstitution: string;
  role: CertificateRole;
  rank?: string;
  projectTitle?: string;
  citation: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificateStatus;
  revocationReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  templateId: string;
  cryptographicHash: string;
  issuerAuthority: string;
  publicVerificationUrl: string;
  qrPayload: string;
  downloadsCount: number;
  verificationsCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'ISSUED' | 'BULK_GENERATED' | 'VERIFIED' | 'REVOKED' | 'DUPLICATE_BLOCKED' | 'EMAIL_DISPATCHED' | 'TEMPLATE_UPDATED';
  entityType: 'CERTIFICATE' | 'EVENT' | 'TEMPLATE' | 'DISTRIBUTION';
  entityId: string;
  details: string;
  actor: string;
  ipAddress?: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface EmailDispatchRecord {
  id: string;
  certificateId: string;
  recipientName: string;
  recipientEmail: string;
  eventTitle: string;
  sentAt: string;
  status: 'QUEUED' | 'DELIVERED' | 'OPENED' | 'DOWNLOADED';
  attempts: number;
}

export interface InstitutionProfile {
  name: string;
  code: string;
  motto: string;
  accreditation: string;
  authorizedAdmin: string;
  adminEmail: string;
  verificationBaseUrl: string;
  logoShield: 'apex' | 'crest' | 'shield';
}
