import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Upload, 
  Sparkles, 
  Users, 
  Award, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Search, 
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  InstitutionalEvent, 
  ParticipantRecord, 
  CertificateRecord, 
  CertificateTemplate 
} from '../types';
import confetti from 'canvas-confetti';

interface EventsViewProps {
  events: InstitutionalEvent[];
  participants: ParticipantRecord[];
  templates: CertificateTemplate[];
  certificates: CertificateRecord[];
  onAddEvent: (newEvent: InstitutionalEvent) => void;
  onBulkAddParticipants: (eventId: string, rawParticipants: Partial<ParticipantRecord>[]) => void;
  onGenerateCertificatesForEvent: (eventId: string) => void;
  onOpenDistributionModal: (eventId: string) => void;
  onInspectCertificate: (certId: string) => void;
  onOpenAiWizard: () => void;
  onLoadPresetData?: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  participants,
  templates,
  certificates,
  onAddEvent,
  onBulkAddParticipants,
  onGenerateCertificatesForEvent,
  onOpenDistributionModal,
  onInspectCertificate,
  onOpenAiWizard,
  onLoadPresetData,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [rawInputText, setRawInputText] = useState('');
  const [isAiCleaning, setIsAiCleaning] = useState(false);
  const [cleanedPreview, setCleanedPreview] = useState<any[] | null>(null);
  const [cleanSummary, setCleanSummary] = useState<string>('');

  // New Event Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<InstitutionalEvent['category']>('Workshop');
  const [newEventDept, setNewEventDept] = useState('Department of Computer Science');
  const [newEventCoordinator, setNewEventCoordinator] = useState('Dr. Eleanor Vance');
  const [newEventVenue, setNewEventVenue] = useState('Central Campus Auditorium');
  const [newEventStartDate, setNewEventStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventEndDate, setNewEventEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventTemplateId, setNewEventTemplateId] = useState(templates[0]?.id || 'tpl-academic-classic');

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];
  const eventParticipants = participants.filter(p => p.eventId === selectedEventId);
  const pendingCount = eventParticipants.filter(p => p.issueStatus === 'PENDING').length;
  const issuedCount = eventParticipants.filter(p => p.issueStatus === 'ISSUED').length;

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sampleCsvSnippet = `Tarun Kumar, tarun.22@vignan.ac.in, 221FA04190, Participant, 95
Sai Keerthi, keerthi.23@vignan.ac.in, 231FA05044, Winner - 1st Place, 100, Project: Edge AI Agro Drone
Ananya Chowdary, ananya.22@vignan.ac.in, 221FA04112, Runner Up - 2nd Place, 94, Project: Medical Vision Pipeline
Zaid Al-Hassan, zaid.21@vignan.ac.in, 211FA04088, Participant, 88
maya devi, maya.23@vignan.ac.in, 231FA06019, Participant, 92`;

  const handleRunAiClean = async () => {
    if (!rawInputText.trim()) return;
    setIsAiCleaning(true);
    try {
      const existingRolls = eventParticipants.map(p => p.rollNo);
      const res = await fetch('/api/ai/data-cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawInputText,
          existingParticipants: existingRolls
        })
      });
      const data = await res.json();
      if (data.cleaned) {
        setCleanedPreview(data.cleaned);
        setCleanSummary(data.summary || `Sanitized ${data.cleaned.length} records. Identified ${data.anomaliesFound || 0} formatting anomalies.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiCleaning(false);
    }
  };

  const handleConfirmBulkEnroll = () => {
    if (!cleanedPreview || cleanedPreview.length === 0) return;
    const mapped = cleanedPreview.map((item, idx) => ({
      id: `part-${Date.now()}-${idx}`,
      eventId: selectedEventId,
      name: item.name,
      email: item.email,
      rollNo: item.rollNo,
      institution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
      role: (item.role as any) || 'Participant',
      attendanceScore: 90,
      issueStatus: (item.status === 'SUSPECT_DUPLICATE' ? 'DUPLICATE_BLOCKED' : 'PENDING') as 'DUPLICATE_BLOCKED' | 'PENDING',
      dispatchStatus: 'UNSENT' as const
    }));

    onBulkAddParticipants(selectedEventId, mapped);
    setCleanedPreview(null);
    setRawInputText('');
    setIsBulkModalOpen(false);
  };

  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    const newEvt: InstitutionalEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle,
      code: `VFSTR-${newEventCategory.substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      category: newEventCategory,
      department: newEventDept,
      venue: newEventVenue,
      startDate: newEventStartDate,
      endDate: newEventEndDate,
      status: 'Ongoing',
      coordinator: newEventCoordinator,
      description: newEventDesc || 'Institutional event organized under academic curriculum standards.',
      templateId: newEventTemplateId,
      totalParticipants: 0,
      certificatesIssued: 0,
      fraudFlagsCount: 0
    };

    onAddEvent(newEvt);
    setSelectedEventId(newEvt.id);
    setIsCreateModalOpen(false);
    setNewEventTitle('');
    setNewEventDesc('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Institutional Events & Certification Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Organize workshops, hackathons, and technical symposiums. Manage participant rosters and execute bulk generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAiWizard}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Event Draft</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* If No Events Exist (Clean Slate) */}
      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Institutional Event Ledger is Fresh</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No events have been created yet. You can create your first event, synthesize one with the AI Event Architect, or load Vignan University sample datasets.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
            >
              + Create First Event
            </button>
            <button
              onClick={onOpenAiWizard}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              <span>Draft with AI Agent</span>
            </button>
            {onLoadPresetData && (
              <button
                onClick={onLoadPresetData}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Load Vignan Demo Dataset
              </button>
            )}
          </div>
        </div>
      ) : (
      /* Main Grid: Event Selector Sidebar + Event Workspace */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Event Directory */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search events by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            {filteredEvents.map((evt) => {
              const isSelected = evt.id === selectedEventId;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/30' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-500">
                      {evt.code}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      evt.status === 'Completed' 
                        ? 'bg-slate-100 text-slate-700' 
                        : evt.status === 'Ongoing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {evt.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mt-1.5 leading-snug line-clamp-1">
                    {evt.title}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>{evt.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{evt.startDate}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 font-mono">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{participants.filter(p => p.eventId === evt.id).length} Enrolled</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      <span>{evt.certificatesIssued} Issued</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column (8 cols): Event Workspace & Participant Roster */}
        {selectedEvent ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Selected Event Card Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    <span>{selectedEvent.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedEvent.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 font-normal">{selectedEvent.department}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                    <div>Coordinator: <strong className="text-slate-800">{selectedEvent.coordinator}</strong></div>
                    <div>Venue: <strong className="text-slate-800">{selectedEvent.venue}</strong></div>
                    <div>Schedule: <strong className="text-slate-800">{selectedEvent.startDate} to {selectedEvent.endDate}</strong></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onOpenDistributionModal(selectedEvent.id)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-600" />
                    <span>Email Distribution</span>
                  </button>
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Participants</span>
                  </button>
                </div>
              </div>

              {/* Roster Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500">Total Enrolled</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{eventParticipants.length}</div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <div className="text-xs text-emerald-700">Certificates Issued</div>
                  <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">{issuedCount}</div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <div className="text-xs text-amber-700">Pending Generation</div>
                  <div className="text-lg font-bold text-amber-800 font-mono mt-0.5">{pendingCount}</div>
                </div>
              </div>
            </div>

            {/* Participant Roster & Generation Action Bar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Participant Roster</h3>
                  <p className="text-xs text-slate-500">Verified participant entries with role classification and credential ID mapping.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  {pendingCount > 0 && (
                    <button
                      onClick={() => {
                        onGenerateCertificatesForEvent(selectedEvent.id);
                        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all rounded-lg shadow-sm cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Issue {pendingCount} Pending Certificates</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Participants Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Name & Roll No</th>
                      <th className="py-3 px-4">Institutional Email</th>
                      <th className="py-3 px-4">Role / Distinction</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Issue Status</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <div className="font-medium text-slate-700">No participants enrolled yet</div>
                          <p className="text-xs text-slate-500 mt-1">Import a spreadsheet or paste raw data to begin generating credentials.</p>
                          <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Import Participants
                          </button>
                        </td>
                      </tr>
                    ) : (
                      eventParticipants.map((part) => {
                        const isIssued = part.issueStatus === 'ISSUED';
                        const isBlocked = part.issueStatus === 'DUPLICATE_BLOCKED';
                        return (
                          <tr key={part.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{part.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{part.rollNo}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                              {part.email}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-800">{part.role}</span>
                              {part.rank && <span className="text-[10px] text-indigo-600 block">{part.rank}</span>}
                              {part.projectTitle && <span className="text-[10px] text-slate-500 italic block truncate max-w-[160px]">"{part.projectTitle}"</span>}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                              {part.certificateId || '—'}
                            </td>
                            <td className="py-3 px-4">
                              {isIssued ? (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  Issued
                                </span>
                              ) : isBlocked ? (
                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                  Duplicate Blocked
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {part.certificateId ? (
                                <button
                                  onClick={() => onInspectCertificate(part.certificateId!)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  View Cert
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        ) : null}

      </div>
      )}

      {/* Bulk Participant Import & AI Cleanser Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Bulk Participant Import & AI Cleansing
                </h3>
              </div>
              <button 
                onClick={() => { setIsBulkModalOpen(false); setCleanedPreview(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste comma, tab, or pipe-separated student records. The AI engine automatically corrects capitalization errors, normalizes institutional emails, formats roll numbers, and blocks duplicate attempts.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Raw Participant Data (Name, Email, RollNo, Role, Score, Project)</label>
                <button
                  type="button"
                  onClick={() => setRawInputText(sampleCsvSnippet)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Load Sample Roster
                </button>
              </div>

              <textarea
                rows={5}
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                placeholder="Paste participant rows here..."
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleRunAiClean}
                disabled={isAiCleaning || !rawInputText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                {isAiCleaning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Analyzing & Cleansing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Cleansing & Anomaly Check</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Cleaned Preview Table */}
            {cleanedPreview && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                  <span className="font-medium">{cleanSummary}</span>
                  <span className="font-bold">{cleanedPreview.length} Records Ready</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Sanitization Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {cleanedPreview.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-sans font-medium text-slate-900">{item.name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{item.email}</td>
                          <td className="py-1.5 px-3 text-slate-600">{item.rollNo}</td>
                          <td className="py-1.5 px-3 text-slate-800 font-sans">{item.role}</td>
                          <td className="py-1.5 px-3">
                            {item.status === 'VALID' ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">Clean</span>
                            ) : item.status === 'SUSPECT_DUPLICATE' ? (
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">Duplicate</span>
                            ) : (
                              <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px]">Corrected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => { setCleanedPreview(null); }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleConfirmBulkEnroll}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm & Enroll {cleanedPreview.length} Participants
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Manual Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form 
            onSubmit={handleCreateNewEvent}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Create New Institutional Event</h3>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Annual Technical Symposium on Distributed Systems"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon & Competition">Hackathon & Competition</option>
                    <option value="Technical Conference">Technical Conference</option>
                    <option value="Guest Seminar">Guest Seminar</option>
                    <option value="Cultural Festival">Cultural Festival</option>
                    <option value="Faculty Development">Faculty Development</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newEventDept}
                    onChange={(e) => setNewEventDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lead Coordinator</label>
                  <input
                    type="text"
                    value={newEventCoordinator}
                    onChange={(e) => setNewEventCoordinator(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Venue / Platform</label>
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newEventStartDate}
                    onChange={(e) => setNewEventStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEventEndDate}
                    onChange={(e) => setNewEventEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Certificate Template</label>
                <select
                  value={newEventTemplateId}
                  onChange={(e) => setNewEventTemplateId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>[{t.departmentTheme}] {t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event Description & Objectives</label>
                <textarea
                  rows={2}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Outline syllabus, key topics, and evaluation standards..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
