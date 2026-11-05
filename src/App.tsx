import React, { useState, useEffect } from 'react';
import { 
  INITIAL_INSTITUTION, 
  INITIAL_TEMPLATES, 
  INITIAL_EVENTS, 
  INITIAL_CERTIFICATES, 
  INITIAL_PARTICIPANTS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_DISPATCH_QUEUE,
  SAMPLE_VIGNAN_PRESETS
} from './utils/seedData';
import { 
  CertificateRecord, 
  InstitutionalEvent, 
  ParticipantRecord, 
  CertificateTemplate, 
  AuditLogEntry, 
  InstitutionProfile 
} from './types';
import { generateCertificateId, generateSha256, getParticipantDuplicateFingerprint } from './utils/crypto';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { EventsView } from './components/EventsView';
import { CertificatesView } from './components/CertificatesView';
import { TemplatesView } from './components/TemplatesView';
import { PublicVerifyView } from './components/PublicVerifyView';
import { StudentVaultView } from './components/StudentVaultView';
import { AiEventWizardModal } from './components/AiEventWizardModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { CertificateDetailModal } from './components/CertificateDetailModal';
import { DistributionManagerModal } from './components/DistributionManagerModal';
import { CoordinatorPortal } from './components/CoordinatorPortal';
import { ParticipantCheckInView } from './components/ParticipantCheckInView';
import { AttendanceStatus, CertificateRole } from './types';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [verifyInitialId, setVerifyInitialId] = useState<string>('');

  // Primary Entities State (persisted to localStorage with fallback - v3 has clean slate)
  const [institution, setInstitution] = useState<InstitutionProfile>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_institution');
    return saved ? JSON.parse(saved) : INITIAL_INSTITUTION;
  });

  const [templates, setTemplates] = useState<CertificateTemplate[]>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [events, setEvents] = useState<InstitutionalEvent[]>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [certificates, setCertificates] = useState<CertificateRecord[]>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_certificates');
    return saved ? JSON.parse(saved) : INITIAL_CERTIFICATES;
  });

  const [participants, setParticipants] = useState<ParticipantRecord[]>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_participants');
    return saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('certisphere_vfstr_v3_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Modal States
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  const [isAuditAssistantOpen, setIsAuditAssistantOpen] = useState(false);
  const [inspectingCert, setInspectingCert] = useState<CertificateRecord | null>(null);
  const [distributionEventId, setDistributionEventId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('certisphere_vfstr_v3_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('certisphere_vfstr_v3_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('certisphere_vfstr_v3_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('certisphere_vfstr_v3_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('certisphere_vfstr_v3_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // URL query parameter routing (e.g. ?verify=CERT-XXX or ?student=email)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify');
      const studentParam = params.get('student');

      if (verifyParam) {
        setVerifyInitialId(verifyParam);
        setActiveTab('verify');
      } else if (studentParam) {
        setActiveTab('vault');
      }
    }
  }, []);

  // Helper to append to Audit Log
  const addAuditLog = (
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: string,
    actor: string = 'Dean of Academic Affairs',
    severity: AuditLogEntry['severity'] = 'INFO'
  ) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      actor,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Add New Event
  const handleAddEvent = (newEvent: InstitutionalEvent) => {
    // Generate a default 6-character access code if not provided
    const withCode: InstitutionalEvent = {
      ...newEvent,
      accessCode: newEvent.accessCode || `VF-${Math.floor(1000 + Math.random() * 9000)}`,
      isRegistrationLocked: false
    };
    setEvents(prev => [withCode, ...prev]);
    addAuditLog('ISSUED', 'EVENT', withCode.id, `Created new institutional event: "${withCode.title}" (${withCode.code}). Access Code: ${withCode.accessCode}`);
  };

  // Student Live Check-in Handler
  const handleStudentCheckIn = (event: InstitutionalEvent, studentData: {
    name: string;
    email: string;
    rollNo: string;
    department: string;
    yearOfStudy: string;
    section: string;
  }) => {
    // Check if event is locked
    if (event.isRegistrationLocked) {
      return { success: false, message: 'Registration for this session has been locked by the coordinator.' };
    }

    // Check collision against existing participants in this event
    const exists = participants.some(
      p => p.eventId === event.id && 
      (p.rollNo.toLowerCase() === studentData.rollNo.toLowerCase() || p.email.toLowerCase() === studentData.email.toLowerCase())
    );

    if (exists) {
      return { success: false, message: `Roll number ${studentData.rollNo} or email ${studentData.email} is already checked in for this event.` };
    }

    const newParticipant: ParticipantRecord = {
      id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventId: event.id,
      name: studentData.name,
      email: studentData.email,
      rollNo: studentData.rollNo,
      institution: institution.name,
      department: studentData.department,
      yearOfStudy: studentData.yearOfStudy,
      section: studentData.section,
      role: 'Participant',
      attendanceStatus: 'PENDING',
      checkInTimestamp: new Date().toISOString(),
      attendanceScore: 100,
      issueStatus: 'PENDING',
      dispatchStatus: 'UNSENT'
    };

    setParticipants(prev => [newParticipant, ...prev]);

    // Update event participant count
    setEvents(prev => prev.map(e => e.id === event.id ? {
      ...e,
      totalParticipants: e.totalParticipants + 1
    } : e));

    addAuditLog(
      'ISSUED', 
      'EVENT', 
      event.id, 
      `Student ${studentData.name} (${studentData.rollNo}, ${studentData.department}) logged attendance via session code.`
    );

    return { success: true, message: 'Attendance logged successfully', participant: newParticipant };
  };

  // Coordinator Toggle Attendance Status (Present / Absent)
  const handleToggleAttendance = (participantId: string, status: AttendanceStatus) => {
    setParticipants(prev => prev.map(p => p.id === participantId ? {
      ...p,
      attendanceStatus: status,
      // If marked absent, issueStatus is blocked from automatic issue
      issueStatus: status === 'ABSENT' ? 'PENDING' : p.issueStatus
    } : p));
  };

  // Coordinator Update Role (Participation vs Merit 1st/2nd/3rd)
  const handleUpdateRole = (participantId: string, role: CertificateRole) => {
    setParticipants(prev => prev.map(p => p.id === participantId ? {
      ...p,
      role
    } : p));
  };

  // Coordinator Toggle Lock Registration
  const handleToggleLockRegistration = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const nextState = !e.isRegistrationLocked;
        addAuditLog(
          nextState ? 'REVOKED' : 'ISSUED',
          'EVENT',
          eventId,
          `Coordinator ${nextState ? 'locked' : 'unlocked'} student self-registration for "${e.title}".`
        );
        return { ...e, isRegistrationLocked: nextState };
      }
      return e;
    }));
  };

  // Bulk Add Participants
  const handleBulkAddParticipants = (eventId: string, newParts: Partial<ParticipantRecord>[]) => {
    const event = events.find(e => e.id === eventId);
    let duplicatesBlocked = 0;

    const processed = newParts.map((item, idx) => {
      const emailOrRoll = item.email || item.rollNo || '';
      const role = item.role || 'Participant';
      const fingerprint = getParticipantDuplicateFingerprint(eventId, emailOrRoll, role);

      // Check collision against existing issued certificates
      const hasCollision = certificates.some(
        c => c.eventId === eventId && 
        (c.recipientEmail.toLowerCase() === item.email?.toLowerCase() || c.recipientRollNo.toLowerCase() === item.rollNo?.toLowerCase()) &&
        c.role.toLowerCase() === role.toLowerCase()
      );

      if (hasCollision) {
        duplicatesBlocked++;
        return {
          id: item.id || `part-${Date.now()}-${idx}`,
          eventId,
          name: item.name || 'Participant',
          email: item.email || '',
          rollNo: item.rollNo || '',
          institution: item.institution || institution.name,
          role,
          attendanceScore: item.attendanceScore || 90,
          issueStatus: 'DUPLICATE_BLOCKED' as const,
          dispatchStatus: 'UNSENT' as const
        };
      }

      return {
        id: item.id || `part-${Date.now()}-${idx}`,
        eventId,
        name: item.name || 'Participant',
        email: item.email || '',
        rollNo: item.rollNo || '',
        institution: item.institution || institution.name,
        role,
        rank: item.rank,
        projectTitle: item.projectTitle,
        attendanceScore: item.attendanceScore || 90,
        issueStatus: 'PENDING' as const,
        dispatchStatus: 'UNSENT' as const
      };
    });

    setParticipants(prev => [...prev, ...processed]);
    
    // Update event participant count
    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      totalParticipants: e.totalParticipants + processed.length,
      fraudFlagsCount: e.fraudFlagsCount + duplicatesBlocked
    } : e));

    if (duplicatesBlocked > 0) {
      addAuditLog(
        'DUPLICATE_BLOCKED', 
        'EVENT', 
        eventId, 
        `Collision Sentinel blocked ${duplicatesBlocked} duplicate certificate creation attempts in "${event?.title || eventId}".`,
        'Collision Sentinel',
        'WARN'
      );
    } else {
      addAuditLog(
        'ISSUED', 
        'EVENT', 
        eventId, 
        `Enrolled ${processed.length} participants into "${event?.title || eventId}".`
      );
    }
  };

  // Bulk Issue Certificates for an Event
  const handleGenerateCertificatesForEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const eventTemplate = templates.find(t => t.id === event.templateId) || templates[0];
    
    // Only issue certificates to students who are PRESENT (or pending check), exclude explicit ABSENT
    const pendingParticipants = participants.filter(
      p => p.eventId === eventId && 
      p.issueStatus === 'PENDING' && 
      p.attendanceStatus !== 'ABSENT'
    );
    
    if (pendingParticipants.length === 0) {
      // If certificates have already been issued, automatically update and re-issue them with latest template
      await handleRegenerateAllCertificatesForEvent(eventId);
      return;
    }

    const newCerts: CertificateRecord[] = [];
    const updatedParticipantsMap = new Map<string, string>(); // partId -> certId

    for (let i = 0; i < pendingParticipants.length; i++) {
      const part = pendingParticipants[i];
      const certId = generateCertificateId(institution.code, i);
      const certNum = `${institution.code}/${event.category.substring(0, 3).toUpperCase()}/2026/${String(certificates.length + i + 1).padStart(4, '0')}`;
      
      const citation = eventTemplate.defaultCitationTemplate.replace('{ROLE}', part.role);
      const rawStringToHash = `${certId}::${part.name}::${part.rollNo}::${event.title}::${part.role}::${citation}::${new Date().toISOString().split('T')[0]}`;
      const hash = await generateSha256(rawStringToHash);

      const certRecord: CertificateRecord = {
        id: certId,
        certificateNumber: certNum,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        participantId: part.id,
        recipientName: part.name,
        recipientEmail: part.email,
        recipientRollNo: part.rollNo,
        recipientInstitution: eventTemplate.institutionName || institution.name,
        role: part.role,
        rank: part.rank,
        projectTitle: part.projectTitle,
        citation,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'VALID',
        templateId: eventTemplate.id,
        cryptographicHash: hash,
        issuerAuthority: `${eventTemplate.institutionName || institution.name} Academic Assessment Board`,
        publicVerificationUrl: `${window.location.origin}/?verify=${certId}`,
        qrPayload: `${window.location.origin}/?verify=${certId}`,
        downloadsCount: 0,
        verificationsCount: 0
      };

      newCerts.push(certRecord);
      updatedParticipantsMap.set(part.id, certId);
    }

    // Update state
    setCertificates(prev => [...newCerts, ...prev]);

    setParticipants(prev => prev.map(p => {
      if (updatedParticipantsMap.has(p.id)) {
        return {
          ...p,
          certificateId: updatedParticipantsMap.get(p.id),
          attendanceStatus: 'PRESENT', // Mark verified present upon certificate issue
          issueStatus: 'ISSUED',
          dispatchStatus: 'QUEUED'
        };
      }
      return p;
    }));

    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      certificatesIssued: e.certificatesIssued + newCerts.length
    } : e));

    addAuditLog(
      'BULK_GENERATED',
      'EVENT',
      eventId,
      `Generated ${newCerts.length} verified certificates for "${event.title}" with SHA-256 signatures.`
    );
  };

  // Revoke Certificate
  const handleRevokeCertificate = (certId: string, reason: string) => {
    setCertificates(prev => prev.map(c => c.id === certId ? {
      ...c,
      status: 'REVOKED',
      revocationReason: reason,
      revokedAt: new Date().toISOString(),
      revokedBy: institution.authorizedAdmin
    } : c));

    addAuditLog(
      'REVOKED',
      'CERTIFICATE',
      certId,
      `Certificate ${certId} revoked: ${reason}`,
      institution.authorizedAdmin,
      'CRITICAL'
    );
  };

  // Reactivate Certificate
  const handleReactivateCertificate = (certId: string) => {
    setCertificates(prev => prev.map(c => c.id === certId ? {
      ...c,
      status: 'VALID',
      revocationReason: undefined,
      revokedAt: undefined,
      revokedBy: undefined
    } : c));

    addAuditLog(
      'ISSUED',
      'CERTIFICATE',
      certId,
      `Certificate ${certId} status restored to VALID following review.`
    );
  };

  // Update Template (Instantly syncs University Name across app and certificates)
  const handleUpdateTemplate = (updated: CertificateTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));

    if (updated.institutionName) {
      setInstitution(prev => ({
        ...prev,
        name: updated.institutionName
      }));
      localStorage.setItem('certisphere_vfstr_v3_institution', JSON.stringify({
        ...institution,
        name: updated.institutionName
      }));
    }

    // Immediately update all existing certificates using this template
    setCertificates(prev => prev.map(c => {
      if (c.templateId === updated.id) {
        return {
          ...c,
          recipientInstitution: updated.institutionName,
          issuerAuthority: `${updated.institutionName} Academic Assessment Board`
        };
      }
      return c;
    }));

    addAuditLog('TEMPLATE_UPDATED', 'TEMPLATE', updated.id, `Template "${updated.name}" updated. University Name set to: "${updated.institutionName}".`);
  };

  // Update Participant (and sync to certificate if already issued)
  const handleUpdateParticipant = async (updatedPart: ParticipantRecord) => {
    setParticipants(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));

    if (updatedPart.certificateId) {
      const targetCert = certificates.find(c => c.id === updatedPart.certificateId);
      if (targetCert) {
        const rawStringToHash = `${targetCert.id}::${updatedPart.name}::${updatedPart.rollNo}::${targetCert.eventTitle}::${updatedPart.role}::${targetCert.citation}::${targetCert.issueDate}`;
        const newHash = await generateSha256(rawStringToHash);

        setCertificates(prev => prev.map(c => c.id === targetCert.id ? {
          ...c,
          recipientName: updatedPart.name,
          recipientRollNo: updatedPart.rollNo,
          recipientEmail: updatedPart.email,
          role: updatedPart.role,
          cryptographicHash: newHash
        } : c));

        if (inspectingCert && inspectingCert.id === targetCert.id) {
          setInspectingCert(prev => prev ? {
            ...prev,
            recipientName: updatedPart.name,
            recipientRollNo: updatedPart.rollNo,
            recipientEmail: updatedPart.email,
            role: updatedPart.role,
            cryptographicHash: newHash
          } : null);
        }
      }
    }

    addAuditLog('ISSUED', 'CERTIFICATE', updatedPart.id, `Updated participant: "${updatedPart.name}" (${updatedPart.rollNo}).`);
  };

  // Update Certificate directly from modal or viewer
  const handleUpdateCertificate = async (updatedCert: CertificateRecord) => {
    const rawStringToHash = `${updatedCert.id}::${updatedCert.recipientName}::${updatedCert.recipientRollNo}::${updatedCert.eventTitle}::${updatedCert.role}::${updatedCert.citation}::${updatedCert.issueDate}`;
    const newHash = await generateSha256(rawStringToHash);
    const finalizedCert = { ...updatedCert, cryptographicHash: newHash };

    setCertificates(prev => prev.map(c => c.id === updatedCert.id ? finalizedCert : c));
    setInspectingCert(finalizedCert);

    if (finalizedCert.participantId) {
      setParticipants(prev => prev.map(p => p.id === finalizedCert.participantId ? {
        ...p,
        name: finalizedCert.recipientName,
        rollNo: finalizedCert.recipientRollNo,
        role: finalizedCert.role
      } : p));
    }

    addAuditLog('ISSUED', 'CERTIFICATE', finalizedCert.id, `Certificate details updated for recipient: "${finalizedCert.recipientName}".`);
  };

  // Re-Generate / Update All Certificates for an Event
  const handleRegenerateAllCertificatesForEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const eventTemplate = templates.find(t => t.id === event.templateId) || templates[0];
    const eligibleParticipants = participants.filter(
      p => p.eventId === eventId && p.attendanceStatus !== 'ABSENT'
    );

    if (eligibleParticipants.length === 0) return;

    const updatedCertsMap = new Map<string, CertificateRecord>();
    const partToCertId = new Map<string, string>();

    for (let i = 0; i < eligibleParticipants.length; i++) {
      const part = eligibleParticipants[i];
      const existingCert = certificates.find(c => c.participantId === part.id || c.id === part.certificateId);
      const certId = existingCert ? existingCert.id : generateCertificateId(institution.code, i);
      const certNum = existingCert ? existingCert.certificateNumber : `${institution.code}/${event.category.substring(0, 3).toUpperCase()}/2026/${String(certificates.length + i + 1).padStart(4, '0')}`;

      const citation = eventTemplate.defaultCitationTemplate.replace('{ROLE}', part.role);
      const rawStringToHash = `${certId}::${part.name}::${part.rollNo}::${event.title}::${part.role}::${citation}::${existingCert?.issueDate || new Date().toISOString().split('T')[0]}`;
      const hash = await generateSha256(rawStringToHash);

      const record: CertificateRecord = {
        id: certId,
        certificateNumber: certNum,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        participantId: part.id,
        recipientName: part.name,
        recipientEmail: part.email,
        recipientRollNo: part.rollNo,
        recipientInstitution: eventTemplate.institutionName || institution.name,
        role: part.role,
        rank: part.rank,
        projectTitle: part.projectTitle,
        citation,
        issueDate: existingCert?.issueDate || new Date().toISOString().split('T')[0],
        status: existingCert?.status || 'VALID',
        templateId: eventTemplate.id,
        cryptographicHash: hash,
        issuerAuthority: `${eventTemplate.institutionName || institution.name} Academic Assessment Board`,
        publicVerificationUrl: `${window.location.origin}/?verify=${certId}`,
        qrPayload: `${window.location.origin}/?verify=${certId}`,
        downloadsCount: existingCert?.downloadsCount || 0,
        verificationsCount: existingCert?.verificationsCount || 0
      };

      updatedCertsMap.set(certId, record);
      partToCertId.set(part.id, certId);
    }

    setCertificates(prev => {
      const withoutThisEvent = prev.filter(c => c.eventId !== eventId);
      return [...Array.from(updatedCertsMap.values()), ...withoutThisEvent];
    });

    setParticipants(prev => prev.map(p => {
      if (partToCertId.has(p.id)) {
        return {
          ...p,
          certificateId: partToCertId.get(p.id),
          issueStatus: 'ISSUED' as const
        };
      }
      return p;
    }));

    setEvents(prev => prev.map(e => e.id === eventId ? {
      ...e,
      certificatesIssued: updatedCertsMap.size
    } : e));

    addAuditLog(
      'ISSUED', 
      'EVENT', 
      eventId, 
      `Re-issued / updated ${updatedCertsMap.size} certificates for "${event.title}" with template "${eventTemplate.name}" and university "${eventTemplate.institutionName}".`
    );
  };

  // Update Event Template
  const handleUpdateEventTemplate = (eventId: string, templateId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, templateId } : e));
    const tpl = templates.find(t => t.id === templateId);
    addAuditLog('TEMPLATE_UPDATED', 'EVENT', eventId, `Assigned template "${tpl?.name || templateId}" to event.`);
  };

  // Dispatch All Unsent Emails for an Event
  const handleDispatchAllForEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    let count = 0;
    setParticipants(prev => prev.map(p => {
      if (p.eventId === eventId && (p.dispatchStatus === 'UNSENT' || p.dispatchStatus === 'QUEUED')) {
        count++;
        return { ...p, dispatchStatus: 'DELIVERED' };
      }
      return p;
    }));

    addAuditLog(
      'EMAIL_DISPATCHED',
      'DISTRIBUTION',
      eventId,
      `Automated email dispatch completed for ${count} participants in "${event?.title || eventId}".`
    );
  };

  // Simulate student read/download
  const handleSimulateStudentAction = (participantId: string, status: 'OPENED' | 'DOWNLOADED') => {
    const part = participants.find(p => p.id === participantId);
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, dispatchStatus: status } : p));
    if (part?.certificateId) {
      setCertificates(prev => prev.map(c => c.id === part.certificateId ? {
        ...c,
        downloadsCount: c.downloadsCount + 1
      } : c));
    }
  };

  // AI Citation Update
  const handleUpdateCitation = (certId: string, newCitation: string) => {
    setCertificates(prev => prev.map(c => c.id === certId ? { ...c, citation: newCitation } : c));
    if (inspectingCert && inspectingCert.id === certId) {
      setInspectingCert(prev => prev ? { ...prev, citation: newCitation } : null);
    }
    addAuditLog('ISSUED', 'CERTIFICATE', certId, `Certificate citation prose re-written via AI engine.`);
  };

  // Trigger quick verification modal / tab
  const handleTriggerQuickVerify = (certId: string) => {
    setVerifyInitialId(certId);
    setActiveTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all data (blank slate)
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all events, participants, and certificates? This will give you a clean slate to add your own dataset.')) {
      setEvents([]);
      setParticipants([]);
      setCertificates([]);
      setAuditLogs([]);
      localStorage.removeItem('certisphere_vfstr_v3_events');
      localStorage.removeItem('certisphere_vfstr_v3_participants');
      localStorage.removeItem('certisphere_vfstr_v3_certificates');
      localStorage.removeItem('certisphere_vfstr_v3_audit_logs');
      addAuditLog('REVOKED', 'CERTIFICATE', 'ALL', 'Registry cleared by Administrator to ingest new institutional dataset.', institution.authorizedAdmin, 'INFO');
    }
  };

  // Load sample Vignan presets for testing
  const handleLoadVignanPresets = () => {
    setEvents(SAMPLE_VIGNAN_PRESETS.events);
    setParticipants(SAMPLE_VIGNAN_PRESETS.participants);
    setCertificates(SAMPLE_VIGNAN_PRESETS.certificates);
    addAuditLog('ISSUED', 'EVENT', 'DEMO-BATCH', 'Loaded Vignan University sample department events and participant dataset.');
  };

  const activeDistributionEvent = distributionEventId ? events.find(e => e.id === distributionEventId) : null;
  const inspectingTemplate = inspectingCert 
    ? templates.find(t => t.id === inspectingCert.templateId) || templates[0]
    : templates[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Universal Top Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAiWizard={() => setIsAiWizardOpen(true)}
        onOpenAuditAssistant={() => setIsAuditAssistantOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            institution={institution}
            certificates={certificates}
            events={events}
            auditLogs={auditLogs}
            onSelectTab={setActiveTab}
            onOpenCertificateModal={(cert) => setInspectingCert(cert)}
            onOpenAiWizard={() => setIsAiWizardOpen(true)}
            onOpenAuditAssistant={() => setIsAuditAssistantOpen(true)}
            onTriggerQuickVerify={handleTriggerQuickVerify}
            onClearAllData={handleClearAllData}
            onLoadPresetData={handleLoadVignanPresets}
          />
        )}

        {activeTab === 'coordinator' && (
          <CoordinatorPortal
            events={events}
            participants={participants}
            certificates={certificates}
            templates={templates}
            onToggleAttendance={handleToggleAttendance}
            onUpdateRole={handleUpdateRole}
            onToggleLockRegistration={handleToggleLockRegistration}
            onGenerateCertificatesForEvent={handleGenerateCertificatesForEvent}
            onRegenerateAllCertificatesForEvent={handleRegenerateAllCertificatesForEvent}
            onUpdateParticipant={handleUpdateParticipant}
            onUpdateEventTemplate={handleUpdateEventTemplate}
            onOpenDistributionModal={(evtId) => setDistributionEventId(evtId)}
            onInspectCertificate={(certId) => {
              const found = certificates.find(c => c.id === certId);
              if (found) setInspectingCert(found);
            }}
          />
        )}

        {activeTab === 'checkin' && (
          <ParticipantCheckInView
            events={events}
            participants={participants}
            onCheckInStudent={handleStudentCheckIn}
            onNavigateToVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            events={events}
            participants={participants}
            templates={templates}
            certificates={certificates}
            onAddEvent={handleAddEvent}
            onBulkAddParticipants={handleBulkAddParticipants}
            onGenerateCertificatesForEvent={handleGenerateCertificatesForEvent}
            onOpenDistributionModal={(evtId) => setDistributionEventId(evtId)}
            onInspectCertificate={(certId) => {
              const found = certificates.find(c => c.id === certId);
              if (found) setInspectingCert(found);
            }}
            onOpenAiWizard={() => setIsAiWizardOpen(true)}
            onLoadPresetData={handleLoadVignanPresets}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificatesView
            certificates={certificates}
            events={events}
            onOpenCertificateModal={(cert) => setInspectingCert(cert)}
            onVerifyCertificate={handleTriggerQuickVerify}
            onRevokeCertificate={handleRevokeCertificate}
            onReactivateCertificate={handleReactivateCertificate}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            templates={templates}
            onUpdateTemplate={handleUpdateTemplate}
          />
        )}

        {activeTab === 'verify' && (
          <PublicVerifyView
            certificates={certificates}
            templates={templates}
            initialCertId={verifyInitialId}
            onOpenCertificateModal={(cert) => setInspectingCert(cert)}
          />
        )}

        {activeTab === 'vault' && (
          <StudentVaultView
            certificates={certificates}
            templates={templates}
            onOpenCertificateModal={(cert) => setInspectingCert(cert)}
            onVerifyCertificate={handleTriggerQuickVerify}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{institution.name}</span>
            <span aria-hidden="true">·</span>
            <span>Accredited Academic Certification Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Tamper-Proof SHA-256</span>
            <span aria-hidden="true">·</span>
            <span>QR-Verification Standard</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAuditAssistantOpen(true)}
              className="text-indigo-600 font-semibold hover:text-indigo-800"
            >
              Compliance Agent
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {isAiWizardOpen && (
        <AiEventWizardModal
          institutionName={institution.name}
          templates={templates}
          onClose={() => setIsAiWizardOpen(false)}
          onDeployEvent={handleAddEvent}
        />
      )}

      {isAuditAssistantOpen && (
        <AiAssistantDrawer
          isOpen={isAuditAssistantOpen}
          onClose={() => setIsAuditAssistantOpen(false)}
          certificates={certificates}
          events={events}
          auditLogs={auditLogs}
        />
      )}

      {inspectingCert && (
        <CertificateDetailModal
          certificate={inspectingCert}
          template={inspectingTemplate}
          templates={templates}
          onClose={() => setInspectingCert(null)}
          onVerify={handleTriggerQuickVerify}
          onUpdateCitation={handleUpdateCitation}
          onUpdateCertificate={handleUpdateCertificate}
        />
      )}

      {activeDistributionEvent && (
        <DistributionManagerModal
          event={activeDistributionEvent}
          participants={participants}
          certificates={certificates}
          onClose={() => setDistributionEventId(null)}
          onDispatchAll={handleDispatchAllForEvent}
          onSimulateStudentAction={handleSimulateStudentAction}
        />
      )}

    </div>
  );
}
