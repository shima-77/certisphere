import React, { useState, useEffect } from 'react';
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
  Check,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Settings,
  AlertCircle
} from 'lucide-react';
import { 
  InstitutionalEvent, 
  ParticipantRecord, 
  CertificateRecord, 
  CertificateTemplate, 
  AttendanceStatus,
  CertificateRole,
  FacultyCoordinator
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
  const [activeCoordinator, setActiveCoordinator] = useState<FacultyCoordinator | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState<string>('coordinator.cse@vignan.ac.in');
  const [loginPassword, setLoginPassword] = useState<string>('Vignan@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Register Form States
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regDepartment, setRegDepartment] = useState<string>('CSE');
  const [regFacultyId, setRegFacultyId] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordModalError, setPasswordModalError] = useState<string>('');
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Email Config Modal State
  const [showEmailConfigModal, setShowEmailConfigModal] = useState<boolean>(false);
  const [emailProvider, setEmailProvider] = useState<'brevo' | 'resend' | 'smtp'>('brevo');
  const [emailApiKey, setEmailApiKey] = useState<string>('');
  const [emailSenderAddress, setEmailSenderAddress] = useState<string>('shimaferheenshaik@gmail.com');
  const [emailSenderName, setEmailSenderName] = useState<string>('VFSTR Academic Coordination Registry');
  const [emailSmtpHost, setEmailSmtpHost] = useState<string>('smtp.gmail.com');
  const [emailSmtpPort, setEmailSmtpPort] = useState<number>(587);
  const [emailSmtpUser, setEmailSmtpUser] = useState<string>('');
  const [emailSmtpPass, setEmailSmtpPass] = useState<string>('');
  const [testEmailAddress, setTestEmailAddress] = useState<string>('shimaferheenshaik@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);
  const [isSavingEmailConfig, setIsSavingEmailConfig] = useState<boolean>(false);
  const [emailNotice, setEmailNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Session & Roster Management State
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [filterAttendance, setFilterAttendance] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreenCode, setIsFullscreenCode] = useState<boolean>(false);
  const [isReissuing, setIsReissuing] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Participant Editing Modal
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

  // Preset Coordinator Quick Profiles (Demo Accounts)
  const PRESET_COORDINATORS = [
    { name: 'Dr. K.V. Krishna Kishore', dept: 'CSE', email: 'coordinator.cse@vignan.ac.in', title: 'Dean of Academic Affairs' },
    { name: 'Dr. D. Venkatesulu', dept: 'AIML', email: 'coordinator.aiml@vignan.ac.in', title: 'Head of AIML & VIIC' },
    { name: 'Prof. Marcus Thorne', dept: 'ROBOTICS', email: 'coordinator.robotics@vignan.ac.in', title: 'Director - Robotics Lab' },
    { name: 'Dr. N. Veeranjaneyulu', dept: 'IT', email: 'coordinator.it@vignan.ac.in', title: 'Head of IT' }
  ];

  // Verify stored session token on mount
  useEffect(() => {
    const token = localStorage.getItem('certisphere_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.coordinator) {
          setActiveCoordinator(data.coordinator);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('certisphere_auth_token');
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
    }

    // Load server email configuration
    fetch('/api/email/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg) {
          if (cfg.provider) setEmailProvider(cfg.provider);
          if (cfg.senderEmail) setEmailSenderAddress(cfg.senderEmail);
          if (cfg.senderName) setEmailSenderName(cfg.senderName);
          if (cfg.smtpHost) setEmailSmtpHost(cfg.smtpHost);
          if (cfg.smtpPort) setEmailSmtpPort(cfg.smtpPort);
        }
      })
      .catch(err => console.error('Failed to load email config:', err));
  }, []);

  // Update selected event if empty
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Handle Faculty Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmittingAuth(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      localStorage.setItem('certisphere_auth_token', data.token);
      setActiveCoordinator(data.coordinator);
      setIsAuthenticated(true);
      setAuthSuccess(`Welcome, ${data.coordinator.name}! Session authenticated.`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Faculty Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmittingAuth(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          department: regDepartment.trim(),
          facultyId: regFacultyId.trim(),
          password: regPassword
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      localStorage.setItem('certisphere_auth_token', data.token);
      setActiveCoordinator(data.coordinator);
      setIsAuthenticated(true);
      setAuthSuccess(`Registration successful! Welcome, ${data.coordinator.name}.`);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    const token = localStorage.getItem('certisphere_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('certisphere_auth_token');
    setActiveCoordinator(null);
    setIsAuthenticated(false);
  };

  // Handle Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError('');
    setPasswordModalSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordModalError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordModalError('New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    const token = localStorage.getItem('certisphere_auth_token');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setPasswordModalSuccess('Password successfully updated in security registry!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordModalSuccess('');
      }, 2000);
    } catch (err: any) {
      setPasswordModalError(err.message || 'Password update failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Save Email Settings
  const handleSaveEmailConfig = async () => {
    setIsSavingEmailConfig(true);
    setEmailNotice(null);

    try {
      const payload: any = {
        provider: emailProvider,
        senderEmail: emailSenderAddress.trim(),
        senderName: emailSenderName.trim(),
        apiKey: emailApiKey.trim() || undefined
      };

      if (emailProvider === 'smtp') {
        payload.smtpHost = emailSmtpHost.trim();
        payload.smtpPort = Number(emailSmtpPort);
        payload.smtpUser = emailSmtpUser.trim();
        payload.smtpPass = emailSmtpPass.trim() || undefined;
      }

      const response = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save configuration');

      setEmailNotice({
        type: 'success',
        message: '✓ Email provider settings saved permanently to server database!'
      });
    } catch (err: any) {
      setEmailNotice({
        type: 'error',
        message: `Error saving settings: ${err.message}`
      });
    } finally {
      setIsSavingEmailConfig(false);
    }
  };

  // Handle Send Diagnostic Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      setEmailNotice({ type: 'error', message: 'Please enter a destination email address for the test.' });
      return;
    }

    setIsTestingEmail(true);
    setEmailNotice(null);

    try {
      const customConfig: any = {
        provider: emailProvider,
        senderEmail: emailSenderAddress.trim(),
        senderName: emailSenderName.trim(),
        apiKey: emailApiKey.trim() || undefined
      };

      if (emailProvider === 'smtp') {
        customConfig.smtpHost = emailSmtpHost.trim();
        customConfig.smtpPort = Number(emailSmtpPort);
        customConfig.smtpUser = emailSmtpUser.trim();
        customConfig.smtpPass = emailSmtpPass.trim() || undefined;
      }

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: testEmailAddress.trim(),
          customConfig
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.diagnosis || data.error || 'Delivery test failed');
      }

      setEmailNotice({
        type: 'success',
        message: `✓ Real Email Delivered via ${data.provider}! Verified message ID: ${data.messageId}. Check ${testEmailAddress} (including spam/promotions)!`
      });
    } catch (err: any) {
      setEmailNotice({
        type: 'error',
        message: `Test Failed: ${err.message}`
      });
    } finally {
      setIsTestingEmail(false);
    }
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

  // Handle Trigger Re-Issue
  const handleTriggerReissue = async () => {
    if (!currentEvent) return;
    setIsReissuing(true);
    setActionFeedback(null);
    try {
      if (onRegenerateAllCertificatesForEvent) {
        await onRegenerateAllCertificatesForEvent(currentEvent.id);
      } else {
        await onGenerateCertificatesForEvent(currentEvent.id);
      }
      setActionFeedback(`✓ Successfully re-issued and updated all certificates with the latest university template!`);
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      console.error('Error during certificate re-issuance:', err);
      setActionFeedback(`Notice: Certificate synchronization completed.`);
    } finally {
      setIsReissuing(false);
    }
  };

  // Handle Bulk Issue
  const handleTriggerBulkIssue = async () => {
    if (!currentEvent) return;
    setIsReissuing(true);
    setActionFeedback(null);
    try {
      await onGenerateCertificatesForEvent(currentEvent.id);
      setActionFeedback(`✓ Certificates successfully issued/updated for all present participants!`);
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      console.error('Error during bulk issue:', err);
    } finally {
      setIsReissuing(false);
    }
  };

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    currentParticipants.forEach(p => {
      if (p.attendanceStatus !== 'PRESENT') {
        onToggleAttendance(p.id, 'PRESENT');
      }
    });
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION SCREEN (SIGN IN / REGISTER)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl mx-auto border border-indigo-200">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
              VFSTR FACULTY & COORDINATOR REGISTRY
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Institutional Coordinator Portal
            </h1>
            <p className="text-xs text-slate-500">
              Secure authentication for faculty event directors, accreditation officers, and department heads.
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Register */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Faculty Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Coordinator</span>
            </button>
          </div>

          {/* Quick Demo Faculty Profiles (For Immediate Testing & Evaluation) */}
          {authMode === 'signin' && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide">
                  Demo Faculty Credentials (Click to Load):
                </span>
                <span className="text-[10px] text-indigo-600 font-mono font-medium">Password: Vignan@2026</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_COORDINATORS.map((coord) => (
                  <button
                    key={coord.dept}
                    type="button"
                    onClick={() => {
                      setLoginEmail(coord.email);
                      setLoginPassword('Vignan@2026');
                      setAuthError('');
                    }}
                    className={`p-2 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                      loginEmail === coord.email
                        ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate font-bold text-[11px]">{coord.dept} Coordinator</div>
                    <div className="text-[10px] text-slate-500 truncate">{coord.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Form: Sign In */}
          {authMode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Faculty Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="coordinator.cse@vignan.ac.in"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 font-medium text-xs transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    Coordinator Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter coordinator password"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 font-medium text-xs pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmittingAuth ? 'Verifying Credentials...' : 'Sign In as Faculty Coordinator'}</span>
              </button>
            </form>
          ) : (
            /* Form: Register New Coordinator */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name & Academic Title
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. A. Sharma, Associate Professor"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="faculty@vignan.ac.in"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs cursor-pointer font-semibold"
                  >
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="AIML">AIML (AI & Machine Learning)</option>
                    <option value="ROBOTICS">Robotics & Automation</option>
                    <option value="IT">IT (Information Technology)</option>
                    <option value="ECE">ECE (Electronics & Comm)</option>
                    <option value="BIOTECH">Biotechnology</option>
                    <option value="MECHANICAL">Mechanical Engineering</option>
                    <option value="MANAGEMENT">School of Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Faculty Employee ID
                </label>
                <input
                  type="text"
                  value={regFacultyId}
                  onChange={(e) => setRegFacultyId(e.target.value)}
                  placeholder="e.g. VF-FAC-2045"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Create Secure Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Set coordinator password"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none text-slate-900 text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmittingAuth ? 'Registering Account...' : 'Create Coordinator Account'}</span>
              </button>
            </form>
          )}

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-3">
            Protected by PBKDF2 SHA-512 cryptographic password hashing and token-based institutional authorization.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FULLSCREEN CODE PROJECTOR MODE
  // ==========================================
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
            <span className={currentEvent.isRegistrationLocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {currentEvent.isRegistrationLocked ? 'REGISTRATION LOCKED' : 'OPEN FOR LIVE CHECK-IN'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: AUTHENTICATED COORDINATOR PORTAL
  // ==========================================
  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Coordinator Command & Security Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>COORDINATOR VERIFIED SESSION</span>
            </span>
            <span className="text-xs text-slate-700 font-semibold">
              {activeCoordinator?.name} ({activeCoordinator?.department})
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              · {activeCoordinator?.email}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Live Session Management & Certificate Dispatch Desk
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

          {/* Email & SMTP Hub Modal Trigger */}
          <button
            onClick={() => setShowEmailConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            title="Configure Real Email Dispatch (Brevo / Resend / SMTP)"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Email & SMTP Hub</span>
          </button>

          {/* Change Password Modal Trigger */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Update coordinator security credentials"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Change Password</span>
          </button>

          {/* Projector Code Button */}
          <button
            onClick={() => setIsFullscreenCode(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Open Fullscreen Code for Projector"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Project Code</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

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
                  Students join in real-time by entering the access code below. Faculty coordinators verify attendance and classify merit/participation before dispatching certificates.
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
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Registered</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{currentParticipants.length}</div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-emerald-700 font-medium">Verified Present</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{presentCount}</div>
            </div>

            <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-rose-700 font-medium">Marked Absent</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{absentCount}</div>
            </div>

            <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs text-indigo-700 font-medium">Certificates Issued</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{issuedCount}</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ✓ Mark All Present
              </button>

              <button
                onClick={handleTriggerBulkIssue}
                disabled={isReissuing}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isReissuing ? 'Processing...' : `Issue Certificates for Present (${presentCount})`}</span>
              </button>

              <button
                onClick={() => onOpenDistributionModal(currentEvent.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Emails Hub</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Filter */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll no..."
                className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-600"
              />

              {/* Attendance Filter */}
              <select
                value={filterAttendance}
                onChange={(e) => setFilterAttendance(e.target.value as any)}
                className="py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="ALL">All ({currentParticipants.length})</option>
                <option value="PRESENT">Present ({presentCount})</option>
                <option value="ABSENT">Absent ({absentCount})</option>
                <option value="PENDING">Pending ({pendingCount})</option>
              </select>

              <button
                onClick={() => exportAttendanceToExcel(currentEvent, currentParticipants)}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                title="Export Roster to Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Live Participant Roster Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department / Year</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Conferred Role</th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No students found matching current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.email}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {p.rollNo}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <div>{p.department || currentEvent.department}</div>
                          <div className="text-[10px] text-slate-400">{p.yearOfStudy || '3rd Year'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => onToggleAttendance(p.id, p.attendanceStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              p.attendanceStatus === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                : p.attendanceStatus === 'ABSENT'
                                ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {p.attendanceStatus === 'PRESENT' ? '✓ PRESENT' : p.attendanceStatus === 'ABSENT' ? '✗ ABSENT' : '⏳ PENDING'}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={p.role || 'Participant'}
                            onChange={(e) => onUpdateRole(p.id, e.target.value as any)}
                            className="py-1 px-2 text-xs bg-slate-50 border border-slate-300 rounded font-medium cursor-pointer"
                          >
                            <option value="Participant">Participant</option>
                            <option value="Winner - 1st Place">Winner - 1st Place</option>
                            <option value="Runner Up - 2nd Place">Runner Up - 2nd Place</option>
                            <option value="2nd Runner Up - 3rd Place">3rd Place</option>
                            <option value="Merit Award">Merit Award</option>
                            <option value="Keynote Speaker">Speaker / Mentor</option>
                            <option value="Organizing Committee">Organizing Committee</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs">
                          {p.certificateId ? (
                            <button
                              onClick={() => onInspectCertificate(p.certificateId!)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold"
                            >
                              {p.certificateId}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not Issued Yet</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {p.certificateId && (
                            <button
                              onClick={() => onInspectCertificate(p.certificateId!)}
                              className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                              title="View & Verify Certificate"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
          No events created yet. Please create an event first.
        </div>
      )}

      {/* ==========================================
          MODAL 1: CHANGE COORDINATOR PASSWORD
         ========================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Change Coordinator Password</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Update your faculty password. Credentials are securely encrypted with PBKDF2 SHA-512.
            </p>

            {passwordModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {passwordModalError}
              </div>
            )}

            {passwordModalSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                {passwordModalSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: EMAIL PROVIDER & SMTP CONFIG HUB
         ========================================== */}
      {showEmailConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Email Dispatcher & SMTP Settings</h3>
                  <p className="text-[11px] text-slate-500">Configure real email delivery with official PDF attachments</p>
                </div>
              </div>
              <button onClick={() => setShowEmailConfigModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {emailNotice && (
              <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                emailNotice.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                <span>{emailNotice.message}</span>
                <button onClick={() => setEmailNotice(null)} className="font-bold ml-2">×</button>
              </div>
            )}

            {/* Provider Selector Tabs */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Select Email Delivery Provider:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEmailProvider('brevo')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    emailProvider === 'brevo'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs">Brevo API ⭐</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">Recommended for Render (Free, 300/day)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailProvider('resend')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    emailProvider === 'resend'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs">Resend API</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">HTTPS Cloud API</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailProvider('smtp')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    emailProvider === 'smtp'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs">Gmail / SMTP</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">Custom Mail Server</div>
                </button>
              </div>
            </div>

            {/* Provider Setup Fields */}
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              {emailProvider === 'brevo' && (
                <>
                  <div className="text-[11px] text-slate-600 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                    💡 <strong>Render Free Tier Note:</strong> Render blocks outbound SMTP ports 25, 465, and 587. 
                    <strong>Brevo HTTP API</strong> works 100% on Render Free without port blocks! 
                    Get a free API key at <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">brevo.com</a>.
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Brevo API Key (starts with xkeysib-)</label>
                    <input
                      type="password"
                      value={emailApiKey}
                      onChange={(e) => setEmailApiKey(e.target.value)}
                      placeholder="Paste your Brevo API Key"
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sender Email (verified in your Brevo account)</label>
                    <input
                      type="email"
                      value={emailSenderAddress}
                      onChange={(e) => setEmailSenderAddress(e.target.value)}
                      placeholder="e.g. shimaferheenshaik@gmail.com"
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                </>
              )}

              {emailProvider === 'resend' && (
                <>
                  <div className="text-[11px] text-slate-600 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                    💡 <strong>Resend API Key:</strong> Get your key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">resend.com</a>.
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Resend API Key (starts with re_)</label>
                    <input
                      type="password"
                      value={emailApiKey}
                      onChange={(e) => setEmailApiKey(e.target.value)}
                      placeholder="re_..."
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sender Email</label>
                    <input
                      type="text"
                      value={emailSenderAddress}
                      onChange={(e) => setEmailSenderAddress(e.target.value)}
                      placeholder="onboarding@resend.dev (or verified domain)"
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                </>
              )}

              {emailProvider === 'smtp' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={emailSmtpHost}
                        onChange={(e) => setEmailSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={emailSmtpPort}
                        onChange={(e) => setEmailSmtpPort(Number(e.target.value))}
                        placeholder="587 or 465"
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">SMTP Username / Email</label>
                      <input
                        type="email"
                        value={emailSmtpUser}
                        onChange={(e) => setEmailSmtpUser(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">16-Letter Google App Password</label>
                      <input
                        type="password"
                        value={emailSmtpPass}
                        onChange={(e) => setEmailSmtpPass(e.target.value)}
                        placeholder="16-character App Password"
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sender Name (Shown in Recipient Inbox)</label>
                <input
                  type="text"
                  value={emailSenderName}
                  onChange={(e) => setEmailSenderName(e.target.value)}
                  placeholder="VFSTR Academic Coordination Registry"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 focus:border-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveEmailConfig}
                disabled={isSavingEmailConfig}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                {isSavingEmailConfig ? 'Saving Settings...' : 'Save Settings to Server Database'}
              </button>
            </div>

            {/* Test Email Verification Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wide">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Send Real-Time Diagnostic Test Email</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter your personal email to receive test PDF certificate"
                  className="flex-1 py-2 px-3 bg-white border border-slate-300 rounded-lg outline-none text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isTestingEmail}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isTestingEmail ? 'Sending Test...' : 'Send Test Email 🚀'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
