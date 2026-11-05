import React, { useState } from 'react';
import { 
  KeyRound, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Building2, 
  Clock, 
  Calendar,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { InstitutionalEvent, ParticipantRecord } from '../types';

interface ParticipantCheckInViewProps {
  events: InstitutionalEvent[];
  participants: ParticipantRecord[];
  onCheckInStudent: (event: InstitutionalEvent, studentData: {
    name: string;
    email: string;
    rollNo: string;
    department: string;
    yearOfStudy: string;
    section: string;
  }) => { success: boolean; message: string; participant?: ParticipantRecord };
  onNavigateToVault: () => void;
}

export const ParticipantCheckInView: React.FC<ParticipantCheckInViewProps> = ({
  events,
  participants,
  onCheckInStudent,
  onNavigateToVault
}) => {
  // 2-Step Gate State
  const [step, setStep] = useState<'ENTER_CODE' | 'FILL_DETAILS' | 'SUCCESS'>('ENTER_CODE');
  
  // Step 1: Access Code Input
  const [inputCode, setInputCode] = useState('');
  const [matchedEvent, setMatchedEvent] = useState<InstitutionalEvent | null>(null);
  const [codeError, setCodeError] = useState('');

  // Step 2: Student Credentials Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    department: 'CSE',
    yearOfStudy: '3rd Year',
    section: 'Section A'
  });
  const [submissionError, setSubmissionError] = useState('');
  const [confirmedParticipant, setConfirmedParticipant] = useState<ParticipantRecord | null>(null);

  // Validate Access Code & Advance to Step 2
  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');

    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setCodeError('Please enter the event code announced by your coordinator.');
      return;
    }

    // Match code against events (support exact accessCode, or event.code, or fallback "VF-")
    const found = events.find(
      evt => (evt.accessCode && evt.accessCode.toUpperCase() === cleanCode) || 
             (evt.code && evt.code.toUpperCase() === cleanCode)
    );

    if (!found) {
      setCodeError(`Invalid access code "${cleanCode}". Please verify the code projected on the coordinator's screen.`);
      return;
    }

    if (found.isRegistrationLocked) {
      setCodeError(`Attendance registration for "${found.title}" has been locked by the coordinator.`);
      return;
    }

    setMatchedEvent(found);
    setStep('FILL_DETAILS');
  };

  // Submit Student Credentials
  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!matchedEvent) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.rollNo.trim()) {
      setSubmissionError('Please fill in your Name, University Email, and Registration/Roll Number.');
      return;
    }

    // Auto capitalize name
    const formattedName = formData.name
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const formattedRoll = formData.rollNo.trim().toUpperCase();
    const formattedEmail = formData.email.trim().toLowerCase();

    const result = onCheckInStudent(matchedEvent, {
      name: formattedName,
      email: formattedEmail,
      rollNo: formattedRoll,
      department: formData.department,
      yearOfStudy: formData.yearOfStudy,
      section: formData.section
    });

    if (!result.success) {
      setSubmissionError(result.message);
      return;
    }

    setConfirmedParticipant(result.participant || null);
    setStep('SUCCESS');
  };

  // Reset to check in another student
  const handleReset = () => {
    setInputCode('');
    setMatchedEvent(null);
    setFormData({
      name: '',
      email: '',
      rollNo: '',
      department: 'CSE',
      yearOfStudy: '3rd Year',
      section: 'Section A'
    });
    setCodeError('');
    setSubmissionError('');
    setStep('ENTER_CODE');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      
      {/* Top Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          <span>VIGNAN UNIVERSITY (VFSTR) · STUDENT LIVE CHECK-IN</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Participant Attendance & Certificate Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
          Enter the secret session access code announced by your event coordinator to verify your presence and register your credential record.
        </p>
      </div>

      {/* STEP 1: Enter Event Code */}
      {step === 'ENTER_CODE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-center text-slate-900 mb-1">
            Step 1: Enter Secret Event Access Code
          </h2>
          <p className="text-xs text-center text-slate-500 mb-6">
            Look at the projector screen or ask the hall faculty coordinator for the 6-character code (e.g. <code>VF-7824</code>).
          </p>

          <form onSubmit={handleValidateCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                Session Access Code
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setCodeError('');
                }}
                placeholder="e.g. VF-8492"
                maxLength={12}
                autoFocus
                className="w-full text-center text-2xl font-mono tracking-widest uppercase font-bold py-3.5 px-4 bg-slate-50 border-2 border-indigo-300 focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all text-indigo-900"
              />
            </div>

            {codeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{codeError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Verify Code & Proceed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Active events preview helper */}
          {events.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Active Campus Events Live in Hall
              </div>
              <div className="space-y-2">
                {events.filter(e => !e.isRegistrationLocked).slice(0, 3).map(evt => (
                  <div 
                    key={evt.id} 
                    onClick={() => {
                      setInputCode(evt.accessCode || evt.code);
                      setCodeError('');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-300 transition-all cursor-pointer text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{evt.title}</div>
                      <div className="text-[10px] text-slate-500">{evt.department} · {evt.venue}</div>
                    </div>
                    <div className="font-mono text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded border border-indigo-200">
                      {evt.accessCode || evt.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Fill Student Details */}
      {step === 'FILL_DETAILS' && matchedEvent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          <button
            type="button"
            onClick={() => setStep('ENTER_CODE')}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Change Event Code</span>
          </button>

          {/* Event Banner */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {matchedEvent.code}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {matchedEvent.title}
                </h3>
                <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{matchedEvent.department}</span>
                  <span aria-hidden="true">·</span>
                  <span>{matchedEvent.venue}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  CODE: {matchedEvent.accessCode || matchedEvent.code}
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-900 mb-1">
            Step 2: Enter Student Credentials
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Your name and roll number will be cryptographically bound to your official university certificate.
          </p>

          <form onSubmit={handleSubmitDetails} className="space-y-4 text-xs">
            
            {/* Student Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name (as it should appear on Certificate) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Shaik Shima Ferheen"
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none transition-all text-slate-900 text-xs"
              />
            </div>

            {/* University Email & Roll No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  University / College Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. shima.22@vignan.ac.in"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none transition-all text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registration / Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.rollNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                  placeholder="e.g. 221FA04128"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-lg outline-none transition-all text-slate-900 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Department, Year & Section */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full py-2.5 px-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 text-xs cursor-pointer"
                >
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="ROBOTICS">Robotics</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="Biotech">Biotech</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Management (MBA)">MBA / BBA</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Year of Study
                </label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                  className="w-full py-2.5 px-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 text-xs cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="PG / M.Tech">PG / M.Tech</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full py-2.5 px-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-900 text-xs cursor-pointer"
                >
                  <option value="Section A">Sec A</option>
                  <option value="Section B">Sec B</option>
                  <option value="Section C">Sec C</option>
                  <option value="Section D">Sec D</option>
                  <option value="Section E">Sec E</option>
                </select>
              </div>
            </div>

            {submissionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{submissionError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit Attendance & Register for Certificate</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* STEP 3: Success Confirmation Screen */}
      {step === 'SUCCESS' && confirmedParticipant && matchedEvent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Attendance Logged Successfully!
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            You are now registered in the coordinator's live roster for <strong>{matchedEvent.title}</strong>.
          </p>

          {/* Student Badge Card */}
          <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Participant Name</span>
              <span className="font-bold text-slate-900">{confirmedParticipant.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Registration / Roll No</span>
              <span className="font-mono font-bold text-slate-900">{confirmedParticipant.rollNo}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Department & Year</span>
              <span className="text-slate-800">{confirmedParticipant.department} · {confirmedParticipant.yearOfStudy} ({confirmedParticipant.section})</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Attendance Review Status</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PENDING COORDINATOR VERIFICATION
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-slate-400">Recorded At</span>
              <span className="font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Next steps notice */}
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl max-w-md mx-auto text-xs text-indigo-900 text-left flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">What happens next?</div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Once the coordinator verifies your attendance and concludes the event, your tamper-proof certificate with QR verification code will be generated and distributed to <strong>{confirmedParticipant.email}</strong>, or you can retrieve it directly from the <strong>Student Vault</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Check in Another Student
            </button>
            <button
              onClick={onNavigateToVault}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Open Student Vault
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
