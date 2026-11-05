import { ParticipantRecord, InstitutionalEvent } from '../types';

/**
 * Generates and triggers download of a standardized CSV (Excel compatible) spreadsheet
 * of all registered participants, attendance status, roles, and certificate linkage.
 */
export function exportAttendanceToExcel(event: InstitutionalEvent, participants: ParticipantRecord[]) {
  const headers = [
    'Registration / Roll No',
    'Student Full Name',
    'University Email',
    'Department',
    'Year of Study',
    'Section',
    'Attendance Status',
    'Certificate Category',
    'Rank / Award',
    'Project / Topic Title',
    'Check-in Timestamp',
    'Certificate ID',
    'Issue Status'
  ];

  const rows = participants.map((p) => {
    return [
      `"${p.rollNo || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.email || ''}"`,
      `"${p.department || ''}"`,
      `"${p.yearOfStudy || ''}"`,
      `"${p.section || ''}"`,
      `"${p.attendanceStatus || (p.issueStatus === 'ISSUED' ? 'PRESENT' : 'PENDING')}"`,
      `"${p.role || 'Participant'}"`,
      `"${p.rank || ''}"`,
      `"${(p.projectTitle || '').replace(/"/g, '""')}"`,
      `"${p.checkInTimestamp || new Date().toISOString()}"`,
      `"${p.certificateId || 'NOT_ISSUED'}"`,
      `"${p.issueStatus}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${event.code}_${sanitizedTitle}_Attendance_Roster.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
