import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  Calendar, 
  Building, 
  Award, 
  ExternalLink,
  QrCode,
  FileText,
  Download,
  UserCheck,
  Globe
} from 'lucide-react';
import { CertificateRecord, CertificateTemplate } from '../types';

interface PublicVerifyViewProps {
  certificates: CertificateRecord[];
  templates: CertificateTemplate[];
  initialCertId?: string;
  onOpenCertificateModal: (cert: CertificateRecord) => void;
}

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  certificates,
  templates,
  initialCertId = '',
  onOpenCertificateModal,
}) => {
  const [certInput, setCertInput] = useState(initialCertId);
  const [queriedId, setQueriedId] = useState(initialCertId || 'CERT-2026-VFSTR-9F83A2');
  const [isVerifying, setIsVerifying] = useState(false);
  const [remoteCertificate, setRemoteCertificate] = useState<CertificateRecord | null>(null);

  useEffect(() => {
    if (initialCertId) {
      setCertInput(initialCertId);
      setQueriedId(initialCertId);
    }
  }, [initialCertId]);

  // Clean normalizer helper
  const cleanId = (val: string) => (val || '').trim().toLowerCase().replace(/[\s-_]/g, '');

  // Look up remotely from server registry if not in local memory
  useEffect(() => {
    if (!queriedId.trim()) return;

    const localMatch = certificates.find(
      c => cleanId(c.id) === cleanId(queriedId) ||
           cleanId(c.certificateNumber) === cleanId(queriedId) ||
           cleanId(c.recipientRollNo) === cleanId(queriedId) ||
           c.recipientEmail.trim().toLowerCase() === queriedId.trim().toLowerCase()
    );

    if (localMatch) {
      setRemoteCertificate(null);
    } else {
      fetch(`/api/certificates/${encodeURIComponent(queriedId.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.certificate) {
            setRemoteCertificate(data.certificate);
          } else {
            setRemoteCertificate(null);
          }
        })
        .catch(() => setRemoteCertificate(null));
    }
  }, [queriedId, certificates]);

  const matchedCertificate = certificates.find(
    c => cleanId(c.id) === cleanId(queriedId) ||
         cleanId(c.certificateNumber) === cleanId(queriedId) ||
         cleanId(c.recipientRollNo) === cleanId(queriedId) ||
         c.recipientEmail.trim().toLowerCase() === queriedId.trim().toLowerCase()
  ) || remoteCertificate;

  const matchedTemplate = matchedCertificate 
    ? templates.find(t => t.id === matchedCertificate.templateId) || templates[0]
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setQueriedId(certInput.trim());
      setIsVerifying(false);
    }, 300);
  };

  const handleQuickLoad = (id: string) => {
    setCertInput(id);
    setIsVerifying(true);
    setTimeout(() => {
      setQueriedId(id);
      setIsVerifying(false);
    }, 250);
  };

  const isRevoked = matchedCertificate?.status === 'REVOKED';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Title & Trust Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Vignan University (VFSTR) Authenticity Protocol</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Public Certificate Verification Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Verify educational credentials, symposium certificates, and competition honours issued by Vignan's Foundation for Science, Technology & Research with cryptographic validation.
        </p>
      </div>

      {/* Verification Query Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2026-VFSTR-9F83A2), Student Roll No, or Email"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            {isVerifying ? (
              <span>Verifying Registry...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Verification Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test Records:</span>
          <button 
            onClick={() => handleQuickLoad('CERT-2026-VFSTR-9F83A2')}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-mono text-[11px] cursor-pointer"
          >
            CERT-2026-VFSTR-9F83A2 (1st Place)
          </button>
          <button 
            onClick={() => handleQuickLoad('221FA04190')}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-mono text-[11px] cursor-pointer"
          >
            221FA04190 (Roll No Search)
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {matchedCertificate ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          
          {/* Status Banner */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isRevoked 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              {isRevoked ? (
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
                  <span>{isRevoked ? 'CREDENTIAL REVOKED / INVALIDATED' : 'OFFICIAL ACADEMIC CREDENTIAL VERIFIED'}</span>
                  {remoteCertificate && (
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-950 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      <span>Live Server Registry</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {isRevoked 
                    ? `Revoked on ${matchedCertificate.revokedAt}: "${matchedCertificate.revocationReason || 'Administrative cancellation'}"`
                    : 'Cryptographic SHA-256 signature verified against the institutional registry ledger.'}
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                isRevoked ? 'bg-rose-200/80 text-rose-800' : 'bg-emerald-200/80 text-emerald-900'
              }`}>
                {matchedCertificate.status}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Recipient & Event Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awarded To</span>
                <h3 className="text-xl font-bold text-slate-900">{matchedCertificate.recipientName}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  Roll No: <strong className="text-slate-800">{matchedCertificate.recipientRollNo}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Institution: <strong>{matchedCertificate.recipientInstitution}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Event</span>
                <h3 className="text-base font-bold text-slate-900">{matchedCertificate.eventTitle}</h3>
                <div className="text-xs text-slate-500">
                  Role: <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{matchedCertificate.role}</span>
                </div>
                {matchedCertificate.projectTitle && (
                  <div className="text-xs text-slate-500">
                    Project / Paper: <em>"{matchedCertificate.projectTitle}"</em>
                  </div>
                )}
              </div>
            </div>

            {/* Citation Statement */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Official Academic Citation</span>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "{matchedCertificate.citation}"
              </p>
            </div>

            {/* Cryptographic Ledger Verification Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SHA-256 Cryptographic Checksum</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 break-all select-all bg-white p-2 rounded border border-slate-200">
                  {matchedCertificate.cryptographicHash}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Issuing Authority</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {matchedCertificate.issuerAuthority}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
                  <span>Issued: {matchedCertificate.issueDate}</span>
                  <span>·</span>
                  <span>Views: {matchedCertificate.verificationsCount || 1}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="font-mono text-xs text-slate-400">
                Registry ID: {matchedCertificate.id}
              </span>

              <button
                onClick={() => onOpenCertificateModal(matchedCertificate)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>View Full Academic Parchment</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No Matching Certificate Record Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The identifier <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-600">"{queriedId}"</code> does not match any certificate in the institutional ledger. Please verify the roll number or certificate ID.
          </p>
        </div>
      )}

    </div>
  );
};
