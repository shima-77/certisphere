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
  AlertTriangle
} from 'lucide-react';
import { CertificateRecord, CertificateTemplate } from '../types';
import { CertificateRenderer } from './CertificateRenderer';

interface CertificateDetailModalProps {
  certificate: CertificateRecord;
  template: CertificateTemplate;
  onClose: () => void;
  onVerify: (certId: string) => void;
  onUpdateCitation: (certId: string, newCitation: string) => void;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  template,
  onClose,
  onVerify,
  onUpdateCitation,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [toneSelection, setToneSelection] = useState<'Formal Academic' | 'Cutting-Edge Innovation' | 'Dean Commendation'>('Formal Academic');

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

        {/* Certificate Scaled Canvas Container */}
        <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200/80 overflow-hidden shadow-inner flex items-center justify-center print:p-0 print:border-none print:shadow-none print:bg-transparent">
          <div className="w-full">
            <CertificateRenderer
              certificate={certificate}
              template={template}
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
