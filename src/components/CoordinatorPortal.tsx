import React, { useState } from 'react';
import { 
  Building2, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Sparkles, 
  Lock, 
  Unlock, 
  Mail, 
  Award, 
  Send, 
  Radio, 
  LogOut, 
  FileSpreadsheet,
  QrCode,
  ShieldAlert,
  ChevronRight,
  Maximize2,
  Minimize2,
  Edit2,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';
import { 
  InstitutionalEvent, 
  ParticipantRecord, 
  CertificateRecord, 
  CertificateTemplate, 
  AttendanceStatus,
  CertificateRole 
} from '../types';
import { exportAttendanceToExcel } from '../utils/excelExport';

interface CoordinatorPortalProps {
  events: InstitutionalEvent[];
  participants: ParticipantRecord[];
  certificates: CertificateRecord[];
  templates: CertificateTemplate[];
  onToggleAttendance: (participantId: string, status: AttendanceStatus) => void;
  onUpdateRole: (participantId: string, role: CertificateRole) => void;
  onToggleLockRegistration: (eventId: string) => void;
  onGenerateCertificatesForEvent: (eventId: string) => void;
  onRegenerateAllCertificatesForEvent?: (eventId: string) => void;
  onUpdateParticipant?: (updatedParticipant: ParticipantRecord) => void;
  onUpdateEventTemplate?: (eventId: string, templateId: string) => void;
  onOpenDistributionModal: (eventId: string) => void;
  onInspectCertificate: (certId: string) => void;
}

export const CoordinatorPortal: React.FC<CoordinatorPortalProps> = ({
  events,
  participants,
  certificates,
  templates,
  onToggleAttendance,
  onUpdateRole,
  onToggleLockRegistration,
  onGenerateCertificatesForEvent,
  onRegenerateAllCertificatesForEvent,
  onUpdateParticipant,
  onUpdateEventTemplate,
  onOpenDistributionModal,
  onInspectCertificate
}) => {
  // Coordinator Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRecord | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    department: '',
    yearOfStudy: '',
    section: '',
    role: 'Participant' as CertificateRole
  });
  const [coordinatorName, setCoordinatorName] = useState<string>('Dr. K.V. Krishna Kishore');
  const [coordinatorDept, setCoordinatorDept] = useState<string>('CSE');
  const [loginEmail, setLoginEmail] = useState<string>('coordinator.cse@vignan.ac.in');
  const [loginPin, setLoginPin] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Selected Active Event State
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [isFullscreenCode, setIsFullscreenCode] = useState<boolean>(false);
  const [filterAttendance, setFilterAttendance] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Preset Coordinator Quick Profiles
  const PRESET_COORDINATORS = [
    { name: 'Dr. K.V. Krishna Kishore', dept: 'CSE', email: 'coordinator.cse@vignan.ac.in', title: 'Dean of Academic Affairs' },
    { name: 'Dr. D. Venkatesulu', dept: 'AIML', email: 'coordinator.aiml@vignan.ac.in', title: 'Head of AIML & VIIC' },
    { name: 'Prof. Marcus Thorne', dept: 'ROBOTICS', email: 'coordinator.robotics@vignan.ac.in', title: 'Director - Robotics Lab' },
    { name: 'Dr. N. Veeranjaneyulu', dept: 'IT', email: 'coordinator.it@vignan.ac.in', title: 'Head of IT' }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim()) {
      setAuthError('Please enter coordinator faculty email.');
      return;
    }
    // Simple PIN check or demo bypass
    if (loginPin && loginPin !== '1234' && loginPin !== 'admin' && loginPin !== 'vfstr') {
      setAuthError('Invalid coordinator PIN (Use demo PIN: 1234 or leave blank).');
      return;
    }
    setIsAuthenticated(true);
  };

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const currentParticipants = participants.filter(p => p.eventId === currentEvent?.id);

  // Filtered participants list
  const filteredParticipants = currentParticipants.filter(p => {
    const matchesFilter = 
      filterAttendance === 'ALL' ? true :
      filterAttendance === 'PRESENT' ? p.attendanceStatus === 'PRESENT' :
      filterAttendance === 'ABSENT' ? p.attendanceStatus === 'ABSENT' :
      (p.attendanceStatus === 'PENDING' || !p.attendanceStatus);

    const matchesSearch = 
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const presentCount = currentParticipants.filter(p => p.attendanceStatus === 'PRESENT').length;
  const absentCount = currentParticipants.filter(p => p.attendanceStatus === 'ABSENT').length;
  const pendingCount = currentParticipants.filter(p => p.attendanceStatus === 'PENDING' || !p.attendanceStatus).length;
  const issuedCount = currentParticipants.filter(p => p.issueStatus === 'ISSUED').length;

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    currentParticipants.forEach(p => {
      if (p.attendanceStatus !== 'PRESENT') {
        onToggleAttendance(p.id, 'PRESENT');
      }
    });
  };

  // 1. If not authenticated, render Coordinator Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mx-auto mb-4 border border-indigo-200">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
              VFSTR FACULTY PORTAL
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-2">
              Event Coordinator Sign-In
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Access live session controls, broadcast event codes, verify attendance, and trigger certificate dispatch.
            </p>
          </div>

          {/* Quick Demo Profile Selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Select Demo Faculty Profile:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COORDINATORS.map((coord) => (
                <button
                  key={coord.dept}
                  type="button"
                  onClick={() => {
                    setCoordinatorName(coord.name);
                    setCoordinatorDept(coord.dept);
                    setLoginEmail(coord.email);
                    setLoginPin('1234');
                  }}
                  className={`p-2 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                    coordinatorDept === coord.dept
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold truncate">{coord.dept} Coordinator</div>
                  <div className="text-[10px] text-slate-500 truncate">{coord.name}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Faculty / Institutional Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="coordinator@vignan.ac.in"
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">
                  Coordinator Access PIN
                </label>
                <span className="text-[10px] text-slate-400">Demo PIN: 1234</span>
              </div>
              <input
                type="password"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                placeholder="Enter 4-digit PIN (1234)"
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs"
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <KeyRound className="w-4 h-4" />
              <span>Authorize & Enter Session Room</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // 2. Fullscreen Projector Modal for the Secret Code
  if (isFullscreenCode && currentEvent) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-8 select-none">
        <button
          onClick={() => setIsFullscreenCode(false)}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Projector Mode</span>
        </button>

        <div className="text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-sm font-semibold tracking-wider uppercase">
            <span>VIGNAN UNIVERSITY · HALL REGISTRATION CODE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            {currentEvent.title}
          </h1>
          <p className="text-slate-400 text-base">
            Students: Open the <strong>Student Live Check-In</strong> tab and enter this code:
          </p>

          <div className="py-8">
            <div className="inline-block px-12 py-6 rounded-3xl bg-indigo-600/20 border-4 border-indigo-400 shadow-2xl backdrop-blur-md">
              <span className="text-6xl sm:text-8xl font-mono font-black tracking-widest text-indigo-300 drop-shadow-[0_0_35px_rgba(99,102,241,0.5)]">
                {currentEvent.accessCode || currentEvent.code}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-slate-400 font-mono">
            <span>DEPARTMENT: {currentEvent.department}</span>
            <span>·</span>
            <span>VENUE: {currentEvent.venue}</span>
            <span>·</span>
            <span className={currentEvent.isRegistrationLocked ? 'text-rose-400' : 'text-emerald-400'}>
              {currentEvent.isRegistrationLocked ? 'LOCKED' : 'OPEN FOR CHECK-IN'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Coordinator Dashboard & Live Roster
  return (
    <div className="space-y-6 pb-12">
      
      {/* Coordinator Top Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              COORDINATOR ACTIVE SESSION
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {coordinatorName} ({coordinatorDept})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Live Event Session Room & Attendance Desk
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Event Selector Dropdown */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none cursor-pointer text-slate-800"
          >
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.code} - {evt.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsFullscreenCode(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            title="Open Fullscreen Code for Projector"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Project Code</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {currentEvent ? (
        <>
          {/* Active Event Command Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
                  <span className="px-2 py-0.5 rounded bg-indigo-800/60 border border-indigo-500/30 font-bold">
                    {currentEvent.category}
                  </span>
                  <span>·</span>
                  <span>{currentEvent.department}</span>
                  <span>·</span>
                  <span>{currentEvent.venue}</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {currentEvent.title}
                </h2>
                
                <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                  Students join in real-time by entering the code below. Coordinators verify attendance and classify merit/participation before issuing certificates.
                </p>
              </div>

              {/* Secret Event Access Code Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center shrink-0 min-w-[240px]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200 flex items-center justify-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Student Access Code</span>
                </div>
                
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white mt-1">
                  {currentEvent.accessCode || currentEvent.code}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => onToggleLockRegistration(currentEvent.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      currentEvent.isRegistrationLocked
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 hover:bg-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {currentEvent.isRegistrationLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{currentEvent.isRegistrationLocked ? 'Registration Locked' : 'Check-In Open'}</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreenCode(true)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-indigo-200 text-xs transition-colors cursor-pointer"
                    title="Fullscreen on Projector"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Template Selector & University Brand Strip */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-indigo-200 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Certificate Template:</span>
                </span>
                <select
                  value={currentEvent.templateId}
                  onChange={(e) => onUpdateEventTemplate && onUpdateEventTemplate(currentEvent.id, e.target.value)}
                  className="bg-indigo-950/90 text-white border border-indigo-400/50 rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer font-medium"
                >
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.departmentTheme})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-indigo-200 text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-300" />
                <span>University Header:</span>
                <strong className="text-white font-semibold">
                  {templates.find(t => t.id === currentEvent.templateId)?.institutionName || 'University Institution'}
                </strong>
              </div>
            </div>
          </div>

          {/* Real-Time Live Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Logged Participants</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {currentParticipants.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Students submitted code</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>Present Verified</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {presentCount}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">Eligible for certificates</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>Absent / Pending</span>
                <XCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {absentCount + pendingCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{pendingCount} pending coordinator check</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>Certificates Issued</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                {issuedCount}
              </div>
              <div className="text-[11px] text-indigo-600/80 mt-0.5">SHA-256 sealed & ready</div>
            </div>

          </div>

          {/* Live Excel-Style Roster & Management Desk */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            
            {/* Table Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Live Student Attendance Roster</span>
                  <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {filteredParticipants.length} Records
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify presence with the toggle button, classify prize/merit winners, and export as Excel spreadsheet.
                </p>
              </div>

              {/* Action Buttons: Mark All, Export Excel, Generate */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Mark all pending students as Present"
                >
                  Mark All Present
                </button>

                <button
                  onClick={() => exportAttendanceToExcel(currentEvent, currentParticipants)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  title="Download clean Excel .CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel Sheet</span>
                </button>

                <button
                  onClick={() => onGenerateCertificatesForEvent(currentEvent.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                  title="Generate certificates only for students marked Present"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Bulk Issue Certificates ({presentCount})</span>
                </button>

                {issuedCount > 0 && (
                  <button
                    onClick={() => onRegenerateAllCertificatesForEvent ? onRegenerateAllCertificatesForEvent(currentEvent.id) : onGenerateCertificatesForEvent(currentEvent.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Update and re-issue all certificates with latest university name, template, and student names"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Re-Issue / Update All Certificates ({issuedCount})</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenDistributionModal(currentEvent.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Automated email distribution"
                >
                  <Send className="w-3.5 h-3.5 text-slate-600" />
                  <span>Email Dispatch</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Attendance Filter:</span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                  {(['ALL', 'PRESENT', 'ABSENT', 'PENDING'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilterAttendance(tab)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        filterAttendance === tab
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, roll no, or email..."
                  className="py-1 px-3 bg-white border border-slate-200 rounded-lg outline-none text-xs w-56 text-slate-800"
                />
              </div>
            </div>

            {/* Excel-Style Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name & Email</th>
                    <th className="py-2.5 px-3">Dept · Year · Sec</th>
                    <th className="py-2.5 px-3 text-center">Attendance Verification</th>
                    <th className="py-2.5 px-3">Certificate Category</th>
                    <th className="py-2.5 px-3 text-right">Certificate ID / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Users className="w-8 h-8 mx-auto text-slate-300" />
                          <div className="font-semibold text-slate-700">No participants logged yet</div>
                          <p className="text-xs text-slate-400">
                            Ask students to open the <strong>Student Live Check-In</strong> tab and enter session code <strong>{currentEvent.accessCode || currentEvent.code}</strong>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => {
                      const isPresent = p.attendanceStatus === 'PRESENT';
                      const isAbsent = p.attendanceStatus === 'ABSENT';
                      const isPending = !p.attendanceStatus || p.attendanceStatus === 'PENDING';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Roll No */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {p.rollNo}
                          </td>

                          {/* Name & Email */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{p.name}</span>
                              <button
                                onClick={() => {
                                  setEditingParticipant(p);
                                  setEditStudentForm({
                                    name: p.name,
                                    rollNo: p.rollNo,
                                    email: p.email,
                                    department: p.department || '',
                                    yearOfStudy: p.yearOfStudy || '',
                                    section: p.section || '',
                                    role: p.role
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit Student Name & Roll No"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.email}</div>
                          </td>

                          {/* Academic Context */}
                          <td className="py-3 px-3 text-slate-700">
                            <div className="font-medium">{p.department || 'CSE'}</div>
                            <div className="text-[11px] text-slate-400">
                              {p.yearOfStudy || '3rd Year'} · {p.section || 'Sec A'}
                            </div>
                          </td>

                          {/* Present / Absent Toggle Buttons */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                              <button
                                onClick={() => onToggleAttendance(p.id, 'PRESENT')}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Present</span>
                              </button>

                              <button
                                onClick={() => onToggleAttendance(p.id, 'ABSENT')}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-rose-700'
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Absent</span>
                              </button>
                            </div>
                            {isPending && (
                              <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                Pending Check
                              </div>
                            )}
                          </td>

                          {/* Role Selector: Participation vs Merit */}
                          <td className="py-3 px-3">
                            <select
                              value={p.role}
                              onChange={(e) => onUpdateRole(p.id, e.target.value as CertificateRole)}
                              className="py-1 px-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded outline-none cursor-pointer text-slate-800"
                            >
                              <option value="Participant">Participation Certificate</option>
                              <option value="Winner - 1st Place">Merit Award - 1st Place</option>
                              <option value="Runner Up - 2nd Place">Merit Award - 2nd Place</option>
                              <option value="2nd Runner Up - 3rd Place">Merit Award - 3rd Place</option>
                              <option value="Merit Award">Special Merit Award</option>
                              <option value="Organizing Committee">Organizing Committee</option>
                            </select>
                          </td>

                          {/* Certificate Status / Inspect */}
                          <td className="py-3 px-3 text-right">
                            {p.certificateId ? (
                              <button
                                onClick={() => onInspectCertificate(p.certificateId!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                              >
                                <QrCode className="w-3 h-3 text-indigo-600" />
                                <span>{p.certificateId.substring(0, 14)}...</span>
                              </button>
                            ) : isPresent ? (
                              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                Ready to Issue
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Marked Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div>
                Auto-saved real-time attendance ledger. Only students with <strong>Present</strong> status receive verifiable certificates.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAttendanceToExcel(currentEvent, currentParticipants)}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .CSV</span>
                </button>
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500">
          No events found. Please create an event in the Events tab.
        </div>
      )}

      {/* Student Edit Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Edit Student & Certificate Details</span>
              </h3>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Full Name (Prints on Certificate)</label>
                <input
                  type="text"
                  value={editStudentForm.name}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Shaik Aalima Akmal"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Roll Number / Student ID</label>
                <input
                  type="text"
                  value={editStudentForm.rollNo}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNo: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. 241FA18351"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editStudentForm.email}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="student@vignan.ac.in"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editStudentForm.department}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Year</label>
                  <input
                    type="text"
                    value={editStudentForm.yearOfStudy}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, yearOfStudy: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section</label>
                  <input
                    type="text"
                    value={editStudentForm.section}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Certificate Award Role</label>
                <select
                  value={editStudentForm.role}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, role: e.target.value as CertificateRole })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                >
                  <option value="Participant">Participation Certificate</option>
                  <option value="Winner - 1st Place">Merit Award - 1st Place</option>
                  <option value="Runner Up - 2nd Place">Merit Award - 2nd Place</option>
                  <option value="2nd Runner Up - 3rd Place">Merit Award - 3rd Place</option>
                  <option value="Merit Award">Special Merit Award</option>
                  <option value="Organizing Committee">Organizing Committee</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingParticipant(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!onUpdateParticipant) return;
                  const updated: ParticipantRecord = {
                    ...editingParticipant,
                    name: editStudentForm.name.trim() || editingParticipant.name,
                    rollNo: editStudentForm.rollNo.trim() || editingParticipant.rollNo,
                    email: editStudentForm.email.trim() || editingParticipant.email,
                    department: editStudentForm.department,
                    yearOfStudy: editStudentForm.yearOfStudy,
                    section: editStudentForm.section,
                    role: editStudentForm.role
                  };
                  onUpdateParticipant(updated);
                  setEditingParticipant(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Student & Update Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
