import React from 'react';
import { 
  Award, 
  CalendarDays, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  QrCode, 
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  FileText
} from 'lucide-react';
import { 
  CertificateRecord, 
  InstitutionalEvent, 
  AuditLogEntry, 
  InstitutionProfile 
} from '../types';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  institution: InstitutionProfile;
  certificates: CertificateRecord[];
  events: InstitutionalEvent[];
  auditLogs: AuditLogEntry[];
  onSelectTab: (tab: NavTab) => void;
  onOpenCertificateModal: (cert: CertificateRecord) => void;
  onOpenAiWizard: () => void;
  onOpenAuditAssistant: () => void;
  onTriggerQuickVerify: (certId: string) => void;
  onClearAllData?: () => void;
  onLoadPresetData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  institution,
  certificates,
  events,
  auditLogs,
  onSelectTab,
  onOpenCertificateModal,
  onOpenAiWizard,
  onOpenAuditAssistant,
  onTriggerQuickVerify,
  onClearAllData,
  onLoadPresetData,
}) => {
  // Compute analytics
  const totalCertificates = certificates.length;
  const validCertificates = certificates.filter(c => c.status === 'VALID').length;
  const revokedCertificates = certificates.filter(c => c.status === 'REVOKED').length;
  const activeEventsCount = events.filter(e => e.status === 'Ongoing' || e.status === 'Completed').length;
  const totalVerifications = certificates.reduce((acc, c) => acc + (c.verificationsCount || 0), 0);
  const totalDownloads = certificates.reduce((acc, c) => acc + (c.downloadsCount || 0), 0);

  const recentCertificates = certificates.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 6);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Institutional Banner with Mechanism-to-Outcome clarity */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <span>{institution.code} ACADEMIC ACCREDITATION REGISTRY</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-normal">{institution.accreditation}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {institution.name}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Autonomous institutional activity management & tamper-proof credential engine. Centralized issuance, cryptographic SHA-256 validation, and public QR verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenAiWizard}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Draft Event with AI</span>
            </button>
            <button
              onClick={() => onSelectTab('verify')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Public Verification Portal</span>
            </button>
            <button
              onClick={onOpenAuditAssistant}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Compliance Copilot</span>
            </button>
            {onClearAllData && (totalCertificates > 0 || events.length > 0) && (
              <button
                onClick={onClearAllData}
                title="Wipe current events, participants, and certificates to start with a blank dataset"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Clear All Data</span>
              </button>
            )}
            {onLoadPresetData && totalCertificates === 0 && events.length === 0 && (
              <button
                onClick={onLoadPresetData}
                title="Load sample Vignan University events and participants for evaluation"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Load Vignan Demo Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Strip - Strict Tabular Numerals & Clear Units */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Certificates Issued</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalCertificates}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-600 font-semibold">{validCertificates} Valid</span>
            <span aria-hidden="true">·</span>
            <span>{revokedCertificates} Revoked</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Institutional Events</span>
            <CalendarDays className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {events.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>{activeEventsCount} Active or Concluded</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Public Verifications</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalVerifications}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>100% cryptographic match rate</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Direct Downloads & Shares</span>
            <Send className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalDownloads}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>Student self-service access</span>
          </div>
        </div>

      </div>

      {/* Two-Column Grid: Recent Issuances & Audit Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left (2 cols): Recent Issued Certificates */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Certificate Issuances</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time ledger of personalized credentials issued with unique cryptographic IDs.</p>
            </div>
            <button
              onClick={() => onSelectTab('certificates')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All ({certificates.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Event & Role</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">Fresh Clean Ledger — No Certificates Issued Yet</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your dataset is clean and ready. Go to the <strong>Events</strong> tab to create an institutional event and paste or upload your student participant roster, or load sample data to test.
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-3">
                          <button
                            onClick={() => onSelectTab('events')}
                            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Go to Events
                          </button>
                          {onLoadPresetData && (
                            <button
                              onClick={onLoadPresetData}
                              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Load Vignan Demo Dataset
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentCertificates.map((cert) => {
                    const isRevoked = cert.status === 'REVOKED';
                    return (
                      <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{cert.recipientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{cert.recipientRollNo}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 truncate max-w-[220px]" title={cert.eventTitle}>
                            {cert.eventTitle}
                          </div>
                          <div className="text-[11px] text-slate-500">{cert.role}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {cert.id}
                        </td>
                        <td className="py-3.5 px-4">
                          {isRevoked ? (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Revoked
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => onOpenCertificateModal(cert)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onTriggerQuickVerify(cert.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              {recentCertificates.length > 0 
                ? 'Showing top 5 recent credentials. All hashes validated against SHA-256 standard.' 
                : 'Zero active credentials currently in system registry.'}
            </span>
            <button
              onClick={() => onSelectTab('events')}
              className="font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Generate New Batch →
            </button>
          </div>
        </div>

        {/* Right (1 col): Institutional Audit Sentinel & Anti-Fraud Log */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-semibold text-slate-900">Audit & Fraud Sentinel</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">LIVE FEED</span>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Autonomous collision guard actively prevents duplicate participant issuances and flags credential anomalies.
            </p>

            <div className="space-y-3.5">
              {recentLogs.map((log) => {
                const isWarn = log.severity === 'WARN';
                const isCritical = log.severity === 'CRITICAL';
                return (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className={`font-semibold uppercase tracking-wider ${
                        isCritical ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-snug">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Actor: {log.actor}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={onOpenAuditAssistant}
              className="w-full py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Consult Compliance Copilot</span>
            </button>
          </div>
        </div>

      </div>

      {/* Featured Quick Workflow Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onSelectTab('events')} 
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <CalendarDays className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Bulk Certificate Generation
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Upload participant spreadsheets or paste tab-delimited rosters with instant AI typo and email sanitization.
          </p>
          <div className="text-xs font-medium text-indigo-600 mt-3 flex items-center gap-1">
            <span>Manage Events & Rosters</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onSelectTab('templates')} 
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Customizable Certificate Templates
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Customize 5 distinct visual styles: Academic Classic, Tech Modern, Gold Prestige, STEM Excellence, and Minimalist.
          </p>
          <div className="text-xs font-medium text-indigo-600 mt-3 flex items-center gap-1">
            <span>Open Template Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div 
          onClick={() => onSelectTab('vault')} 
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Student Credential Vault
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Self-service portfolio for students to query and retrieve credentials by Roll No, download high-res PNGs, or export to LinkedIn.
          </p>
          <div className="text-xs font-medium text-indigo-600 mt-3 flex items-center gap-1">
            <span>Open Student Portal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
