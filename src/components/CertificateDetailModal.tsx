import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Download, 
  X,
  RotateCcw,
  AlertTriangle,
  Edit3,
  Save,
  Building2,
  User
} from 'lucide-react';
import { CertificateRecord, CertificateTemplate, CertificateRole } from '../types';
import { CertificateRenderer } from './CertificateRenderer';

interface CertificateDetailModalProps {
  certificate: CertificateRecord;
  template: CertificateTemplate;
  templates?: CertificateTemplate[];
  onClose: () => void;
  onVerify: (certId: string) => void;
  onUpdateCitation: (certId: string, newCitation: string) => void;
  onUpdateCertificate?: (updatedCert: CertificateRecord) => void;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  template,
  templates = [],
  onClose,
  onVerify,
  onUpdateCitation,
  onUpdateCertificate,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [toneSelection, setToneSelection] = useState<'Formal Academic' | 'Cutting-Edge Innovation' | 'Dean Commendation'>('Formal Academic');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    recipientName: certificate.recipientName,
    recipientRollNo: certificate.recipientRollNo,
    recipientInstitution: certificate.recipientInstitution,
    eventTitle: certificate.eventTitle,
    role: certificate.role,
    rank: certificate.rank || '',
    projectTitle: certificate.projectTitle || '',
    citation: certificate.citation,
    templateId: certificate.templateId
  });
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState(false);

  const activeTemplate = templates.find(t => t.id === editForm.templateId) || template;
  const activeCertificate: CertificateRecord = {
    ...certificate,
    ...editForm
  };

  const handleSaveCertificateEdits = () => {
    if (onUpdateCertificate) {
      onUpdateCertificate(activeCertificate);
    }
    setSaveSuccessFeedback(true);
    setTimeout(() => {
      setSaveSuccessFeedback(false);
      setIsEditing(false);
    }, 1200);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?verify=${certificate.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAiCitationRewrite = async () => {
    setIsAiRewriting(true);
    try {
      const res = await fetch('/api/ai/citation-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: certificate.recipientName,
          eventTitle: certificate.eventTitle,
          role: certificate.role,
          rank: certificate.rank,
          projectTitle: certificate.projectTitle,
          tone: toneSelection
        })
      });
      const data = await res.json();
      if (data.citation) {
        onUpdateCitation(certificate.id, data.citation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiRewriting(false);
    }
  };

  const isRevoked = certificate.status === 'REVOKED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-4 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:p-0">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{certificate.id}</span>
                {isRevoked ? (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    Revoked
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Cryptographically Valid
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Issued to: <strong className="text-slate-800">{certificate.recipientName}</strong> ({certificate.recipientRollNo})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isEditing 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Editor' : 'Edit Names & Details'}</span>
            </button>

            {isEditing && (
              <button
                onClick={handleSaveCertificateEdits}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {saveSuccessFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Verification Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => onVerify(certificate.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
              <span>Verify Portal</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* In-Modal Direct Editor (when isEditing is true) */}
        {isEditing && (
          <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3 print:hidden text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-700" />
                <span>Edit Certificate Recipient & Institutional Content</span>
              </span>
              <span className="text-[11px] text-amber-800">
                Changes update the live certificate preview below and save to registry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Student Name</label>
                <input
                  type="text"
                  value={editForm.recipientName}
                  onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Roll No / ID</label>
                <input
                  type="text"
                  value={editForm.recipientRollNo}
                  onChange={(e) => setEditForm({ ...editForm, recipientRollNo: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">University / Institution Name</label>
                <input
                  type="text"
                  value={editForm.recipientInstitution}
                  onChange={(e) => setEditForm({ ...editForm, recipientInstitution: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Event / Competition Title</label>
                <input
                  type="text"
                  value={editForm.eventTitle}
                  onChange={(e) => setEditForm({ ...editForm, eventTitle: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role / Participation Category</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as CertificateRole })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Participant">Participant</option>
                  <option value="Winner - 1st Place">Winner - 1st Place</option>
                  <option value="Runner Up - 2nd Place">Runner Up - 2nd Place</option>
                  <option value="2nd Runner Up - 3rd Place">2nd Runner Up - 3rd Place</option>
                  <option value="Merit Award">Merit Award</option>
                  <option value="Organizing Committee">Organizing Committee</option>
                </select>
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Visual Template</label>
                  <select
                    value={editForm.templateId}
                    onChange={(e) => setEditForm({ ...editForm, templateId: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.departmentTheme})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Citation Statement Prose</label>
              <textarea
                rows={2}
                value={editForm.citation}
                onChange={(e) => setEditForm({ ...editForm, citation: e.target.value })}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Certificate Scaled Canvas Container */}
        <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/80 overflow-hidden shadow-inner flex items-center justify-center print:p-0 print:border-none print:shadow-none print:bg-transparent">
          <div className="w-full">
            <CertificateRenderer
              certificate={activeCertificate}
              template={activeTemplate}
              containerId="printable-certificate"
              isInteractive={true}
              onQrClick={() => onVerify(certificate.id)}
            />
          </div>
        </div>

        {/* AI Citation Re-writer Strip (Hidden during print) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-800">AI Citation Customizer & Rephrase</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={toneSelection}
                onChange={(e) => setToneSelection(e.target.value as any)}
                className="p-1 text-xs bg-white border border-slate-200 rounded text-slate-700"
              >
                <option value="Formal Academic">Tone: Formal Academic</option>
                <option value="Cutting-Edge Innovation">Tone: Cutting-Edge Innovation</option>
                <option value="Dean Commendation">Tone: Dean's Commendation</option>
              </select>

              <button
                type="button"
                onClick={handleAiCitationRewrite}
                disabled={isAiRewriting}
                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded transition-colors cursor-pointer"
              >
                {isAiRewriting ? 'Generating Citation...' : 'Regenerate Citation with AI'}
              </button>
            </div>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Current Citation: <span className="italic text-slate-800">"{certificate.citation}"</span>
          </p>
        </div>

      </div>
    </div>
  );
};
