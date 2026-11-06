import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Download, 
  ExternalLink, 
  Eye, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Settings, 
  AlertCircle 
} from 'lucide-react';
import { InstitutionalEvent, ParticipantRecord, CertificateRecord } from '../types';

interface DistributionManagerModalProps {
  event: InstitutionalEvent;
  participants: ParticipantRecord[];
  certificates: CertificateRecord[];
  onClose: () => void;
  onDispatchAll: (eventId: string) => void;
  onSimulateStudentAction: (participantId: string, status: 'OPENED' | 'DOWNLOADED') => void;
}

export const DistributionManagerModal: React.FC<DistributionManagerModalProps> = ({
  event,
  participants,
  certificates,
  onClose,
  onDispatchAll,
  onSimulateStudentAction,
}) => {
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedPreviewPart, setSelectedPreviewPart] = useState<ParticipantRecord | null>(participants[0] || null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Email Provider Configuration
  const [provider, setProvider] = useState<'brevo' | 'resend' | 'smtp'>('brevo');
  const [apiKey, setApiKey] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('shimaferheenshaik@gmail.com');
  const [senderName, setSenderName] = useState<string>('VFSTR Academic Coordination Registry');
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Direct Live Test Dispatch States
  const [directRecipientEmail, setDirectRecipientEmail] = useState<string>('shimaferheenshaik@gmail.com');
  const [directRecipientName, setDirectRecipientName] = useState<string>('Shima Ferheen');
  const [directRole, setDirectRole] = useState<'Participant' | 'Winner - 1st Place'>('Participant');
  const [isDirectSending, setIsDirectSending] = useState<boolean>(false);

  // Load saved email configuration on mount
  useEffect(() => {
    fetch('/api/email/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg) {
          if (cfg.provider) setProvider(cfg.provider);
          if (cfg.senderEmail) setSenderEmail(cfg.senderEmail);
          if (cfg.senderName) setSenderName(cfg.senderName);
          if (cfg.smtpHost) setSmtpHost(cfg.smtpHost);
          if (cfg.smtpPort) setSmtpPort(cfg.smtpPort);
          setHasServerKey(Boolean(cfg.hasApiKey || cfg.hasSmtpPass));
        }
      })
      .catch(err => console.error('Failed to load email config:', err));
  }, []);

  // Filter participants: ONLY PRESENT or those with generated certificates
  const eventParticipants = participants.filter(p => p.eventId === event.id);
  const presentParticipants = eventParticipants.filter(p => p.attendanceStatus === 'PRESENT' || (p.certificateId && p.attendanceStatus !== 'ABSENT'));
  const unsentCount = presentParticipants.filter(p => p.dispatchStatus === 'UNSENT' || p.dispatchStatus === 'QUEUED').length;
  const deliveredCount = presentParticipants.filter(p => p.dispatchStatus === 'DELIVERED').length;
  const downloadedCount = presentParticipants.filter(p => p.dispatchStatus === 'DOWNLOADED').length;

  // Build custom configuration payload
  const getActiveConfig = () => {
    const cfg: any = {
      provider,
      senderEmail: senderEmail.trim(),
      senderName: senderName.trim()
    };
    if (apiKey.trim()) cfg.apiKey = apiKey.trim();
    if (provider === 'smtp') {
      cfg.smtpHost = smtpHost.trim();
      cfg.smtpPort = Number(smtpPort);
      cfg.smtpUser = smtpUser.trim() || senderEmail.trim();
      if (smtpPass.trim()) cfg.smtpPass = smtpPass.trim();
    }
    return cfg;
  };

  // Save Config to Server
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setDispatchNotice(null);
    try {
      const cfg = getActiveConfig();
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setHasServerKey(true);
      setDispatchNotice({
        type: 'success',
        message: '✓ Email provider settings saved permanently to the server!'
      });
    } catch (err: any) {
      setDispatchNotice({
        type: 'error',
        message: `Failed to save configuration: ${err.message}`
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle Direct Test Dispatch (Sends 1 live email with attached PDF)
  const handleDirectTestDispatch = async () => {
    if (!directRecipientEmail.trim()) {
      setDispatchNotice({ type: 'error', message: 'Please enter a recipient email address.' });
      return;
    }
    setIsDirectSending(true);
    setDispatchNotice(null);

    try {
      const directCertId = `CERT-VFSTR-${Date.now().toString().slice(-6)}`;
      const customConfig = getActiveConfig();

      const response = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [
            {
              email: directRecipientEmail.trim(),
              name: directRecipientName.trim() || 'Verified Student',
              certificateId: directCertId,
              role: directRole,
              recipientInstitution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
              verificationUrl: `${window.location.origin}/?verify=${directCertId}`
            }
          ],
          eventTitle: event.title,
          senderName: senderName.trim(),
          customConfig
        })
      });

      const data = await response.json();
      if (data.sentCount > 0) {
        setDispatchNotice({
          type: 'success',
          message: `✓ Real Email with Official PDF Attachment successfully delivered to ${directRecipientEmail}! Check your inbox (and spam/promotions)!`
        });
      } else {
        const err = data.results?.[0]?.error || data.error || 'Delivery failed';
        setDispatchNotice({
          type: 'error',
          message: `Delivery Error: ${err}`
        });
      }
    } catch (err: any) {
      setDispatchNotice({
        type: 'error',
        message: `Failed to connect to email API: ${err.message}`
      });
    } finally {
      setIsDirectSending(false);
    }
  };

  // Handle Bulk Dispatch to all PRESENT participants
  const handleBulkDispatch = async () => {
    setIsDispatching(true);
    setDispatchNotice(null);

    const targetList = unsentCount > 0 
      ? presentParticipants.filter(p => (p.dispatchStatus === 'UNSENT' || p.dispatchStatus === 'QUEUED') && p.email)
      : presentParticipants.filter(p => p.email);

    const recipientsToDispatch = targetList.map(p => {
      const cert = certificates.find(c => c.id === p.certificateId);
      return {
        email: p.email,
        name: p.name,
        certificateId: p.certificateId || `CERT-${p.rollNo}`,
        role: p.role,
        recipientInstitution: cert?.recipientInstitution || p.institution,
        verificationUrl: cert ? `${window.location.origin}/?verify=${cert.id}` : `${window.location.origin}/?student=${encodeURIComponent(p.email)}`
      };
    });

    if (recipientsToDispatch.length === 0) {
      setDispatchNotice({
        type: 'info',
        message: 'No students marked Present found. Mark attendance as Present first!'
      });
      setIsDispatching(false);
      return;
    }

    try {
      const customConfig = getActiveConfig();

      const response = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipientsToDispatch,
          eventTitle: event.title,
          senderName: senderName.trim(),
          customConfig
        })
      });

      const data = await response.json();
      onDispatchAll(event.id);

      if (data.sentCount > 0) {
        setDispatchNotice({
          type: 'success',
          message: `✓ Real Emails Dispatched! Successfully delivered official PDF certificates to ${data.sentCount} PRESENT students.`
        });
      } else {
        const firstErr = data.results?.find((r: any) => r.status === 'FAILED')?.error || data.error || 'Failed to dispatch emails';
        setDispatchNotice({
          type: 'error',
          message: `Dispatch Issue: ${firstErr}`
        });
      }
    } catch (err: any) {
      console.error('Failed to trigger email API:', err);
      onDispatchAll(event.id);
      setDispatchNotice({
        type: 'error',
        message: `Network error during dispatch: ${err.message}`
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyLink = (part: ParticipantRecord) => {
    const cert = certificates.find(c => c.id === part.certificateId);
    const link = cert 
      ? `${window.location.origin}/?verify=${cert.id}`
      : `${window.location.origin}/?student=${encodeURIComponent(part.email)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(part.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Automated Certificate Distribution Hub
              </h3>
              <p className="text-xs text-slate-500">
                Event: {event.title} ({event.code}) · PDF Attachments Auto-Generated
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {dispatchNotice && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            dispatchNotice.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : dispatchNotice.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
          }`}>
            <span className="font-medium">{dispatchNotice.message}</span>
            <button 
              onClick={() => setDispatchNotice(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Delivery Metrics Strip */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs text-slate-500 font-medium">Total Enrolled</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{eventParticipants.length}</div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="text-xs text-indigo-700 font-medium">Pending Dispatch</div>
            <div className="text-xl font-bold font-mono text-indigo-800 mt-0.5">{unsentCount}</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="text-xs text-emerald-700 font-medium">Delivered</div>
            <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">{deliveredCount}</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-xs text-amber-700 font-medium">Downloaded / Verified</div>
            <div className="text-xl font-bold font-mono text-amber-800 mt-0.5">{downloadedCount}</div>
          </div>
        </div>

        {/* Instant Live Email & PDF Attachment Dispatch Box */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-300 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Direct Live Email Dispatch (With PDF Attachment)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              📎 Official PDF Attached
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Recipient Email:
              </label>
              <input
                type="email"
                value={directRecipientEmail}
                onChange={(e) => setDirectRecipientEmail(e.target.value)}
                placeholder="student@gmail.com"
                className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Recipient Student Name:
              </label>
              <input
                type="text"
                value={directRecipientName}
                onChange={(e) => setDirectRecipientName(e.target.value)}
                placeholder="Student Name"
                className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Certificate Conferred:
              </label>
              <select
                value={directRole}
                onChange={(e) => setDirectRole(e.target.value as any)}
                className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-lg text-slate-900 font-medium cursor-pointer outline-none focus:border-indigo-600"
              >
                <option value="Participant">Certificate of Participation</option>
                <option value="Winner - 1st Place">Certificate of Merit (1st Place)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDirectTestDispatch}
            disabled={isDirectSending}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isDirectSending ? 'Generating PDF & Dispatching Email...' : 'Send Live Email With Attached PDF 🚀'}</span>
          </button>
        </div>

        {/* Sender Email & Provider Configuration Accordion */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-bold text-slate-900">
                Email Dispatcher Provider ({provider === 'brevo' ? 'Brevo HTTPS API' : provider === 'resend' ? 'Resend API' : 'Custom SMTP'})
              </span>
              {hasServerKey && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓ Configured
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {showConfigPanel ? '▲ Collapse Settings' : '▼ Configure Providers & Keys'}
            </button>
          </div>

          {showConfigPanel && (
            <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('brevo')}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    provider === 'brevo'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">Brevo API ⭐</div>
                  <div className="text-[9px] text-slate-500">Free, works on Render Free</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('resend')}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    provider === 'resend'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">Resend API</div>
                  <div className="text-[9px] text-slate-500">Modern HTTPS API</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('smtp')}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    provider === 'smtp'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">Gmail / SMTP</div>
                  <div className="text-[9px] text-slate-500">Custom Mail Server</div>
                </button>
              </div>

              {provider === 'brevo' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Brevo API Key (starts with xkeysib-):
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste Brevo API Key"
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                  />
                </div>
              )}

              {provider === 'resend' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resend API Key (starts with re_):
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="re_..."
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                  />
                </div>
              )}

              {provider === 'smtp' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">App Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="16-letter App Password"
                      className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sender Email</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="coordinator@vignan.ac.in"
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="VFSTR Registry"
                    className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer"
              >
                {isSavingConfig ? 'Saving...' : 'Save Provider Settings to Server'}
              </button>
            </div>
          )}
        </div>

        {/* Two-Column: Distribution Queue & Quick Copy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Present Participants Distribution Queue ({presentParticipants.length})</span>
            <button
              onClick={handleBulkDispatch}
              disabled={isDispatching}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Real Emails...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Real Emails to All Present ({presentParticipants.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {eventParticipants.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No participants enrolled in this event.</div>
            ) : (
              eventParticipants.map((part) => {
                const isPresent = part.attendanceStatus === 'PRESENT' || (part.certificateId && part.attendanceStatus !== 'ABSENT');
                return (
                  <div key={part.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{part.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isPresent ? 'PRESENT' : 'ABSENT / PENDING'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{part.email} · {part.rollNo}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        part.dispatchStatus === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : part.dispatchStatus === 'DOWNLOADED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {part.dispatchStatus}
                      </span>

                      <button
                        onClick={() => handleCopyLink(part)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                        title="Copy direct certificate link"
                      >
                        {copiedLink === part.id ? '✓ Copied' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
