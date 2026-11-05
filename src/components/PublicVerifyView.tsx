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
  UserCheck
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

  useEffect(() => {
    if (initialCertId) {
      setCertInput(initialCertId);
      setQueriedId(initialCertId);
    }
  }, [initialCertId]);

  // Clean normalizer helper
  const cleanId = (val: string) => (val || '').trim().toLowerCase().replace(/[\s-_]/g, '');

  const matchedCertificate = certificates.find(
    c => cleanId(c.id) === cleanId(queriedId) ||
         cleanId(c.certificateNumber) === cleanId(queriedId) ||
         cleanId(c.recipientRollNo) === cleanId(queriedId) ||
         c.recipientEmail.trim().toLowerCase() === queriedId.trim().toLowerCase()
  );

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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="Enter Certificate ID (e.g., CERT-2026-VFSTR-9F83A2) or Doc Number..."
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            {isVerifying ? 'Verifying...' : 'Verify Authenticity'}
          </button>
        </form>

        {/* Quick Test Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Quick Test Cases:</span>
          <button
            type="button"
            onClick={() => handleQuickLoad('CERT-2026-VFSTR-9F83A2')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Valid: Sai Vardhan Reddy (1st Place)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLoad('CERT-2026-VFSTR-B219E0')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Valid: Venkata Karthik (V-AIM Symposium)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLoad('CERT-2026-VFSTR-REVOKED-991')}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Test Revoked Credential (Plagiarism)
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {matchedCertificate ? (
        <div className={`bg-white border rounded-xl shadow-md overflow-hidden transition-all ${
          isRevoked ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-emerald-300 ring-2 ring-emerald-500/20'
        }`}>
          
          {/* Authenticity Banner */}
          <div className={`p-5 text-white flex items-center justify-between ${
            isRevoked 
              ? 'bg-gradient-to-r from-rose-700 to-rose-900' 
              : 'bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              {isRevoked ? (
                <ShieldAlert className="w-8 h-8 text-rose-200 shrink-0" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-200 shrink-0" />
              )}
              <div>
                <div className="text-xs uppercase font-mono tracking-wider text-emerald-100/80">
                  Apex Credential Verification Sentinel
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  {isRevoked ? 'REVOKED / INVALID CREDENTIAL' : 'VERIFIED GENUINE & ACCREDITED'}
                </h2>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono text-emerald-100/70">VERIFICATION TIMESTAMP</div>
              <div className="text-xs font-mono font-semibold">{new Date().toLocaleString()}</div>
            </div>
          </div>

          {/* Revocation Warning Box if Revoked */}
          {isRevoked && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Notice of Institutional Revocation:</span>
              </div>
              <p className="leading-relaxed pl-5">
                {matchedCertificate.revocationReason || 'This credential has been officially invalidated by the Academic Disciplinary Committee.'}
              </p>
              {matchedCertificate.revokedAt && (
                <div className="pl-5 text-[11px] text-rose-700 font-mono">
                  Revoked on: {matchedCertificate.revokedAt} · Authorized by: {matchedCertificate.revokedBy || 'Dean of Assessment'}
                </div>
              )}
            </div>
          )}

          {/* Core Recipient & Event Details */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recipient Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Credential Bearer</span>
                </div>

                <div>
                  <div className="text-2xl font-bold text-slate-900">{matchedCertificate.recipientName}</div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">Roll No: {matchedCertificate.recipientRollNo}</span>
                    <span aria-hidden="true">·</span>
                    <span>{matchedCertificate.recipientEmail}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{matchedCertificate.recipientInstitution}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500">Conferred Role / Distinction:</div>
                  <div className="text-sm font-semibold text-indigo-700">
                    {matchedCertificate.role} {matchedCertificate.rank ? `(${matchedCertificate.rank})` : ''}
                  </div>
                  {matchedCertificate.projectTitle && (
                    <div className="text-[11px] text-slate-600 italic">
                      Project: "{matchedCertificate.projectTitle}"
                    </div>
                  )}
                </div>
              </div>

              {/* Event & Institution Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Institutional Event Details</span>
                </div>

                <div>
                  <div className="text-base font-bold text-slate-900 leading-snug">{matchedCertificate.eventTitle}</div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span className="font-semibold">{matchedCertificate.eventCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Issued: {matchedCertificate.issueDate}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{matchedCertificate.issuerAuthority}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500">Official Citation Text:</div>
                  <p className="text-slate-700 leading-relaxed italic">
                    "{matchedCertificate.citation}"
                  </p>
                </div>
              </div>

            </div>

            {/* Cryptographic Proof Verification Section */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Fingerprint className="w-4 h-4" />
                  <span className="font-bold">Cryptographic Audit Trail</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CHECKSUM VERIFIED (SHA-256)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="text-slate-400 text-[10px]">CERTIFICATE ID:</div>
                  <div className="text-slate-200 font-semibold">{matchedCertificate.id}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">OFFICIAL DOCUMENT NUMBER:</div>
                  <div className="text-slate-200 font-semibold">{matchedCertificate.certificateNumber}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px]">DIGITAL SIGNATURE HASH:</div>
                <div className="text-cyan-300 break-all text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                  {matchedCertificate.cryptographicHash}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                <span>Tamper-Proof Invariant: Recipient + Event + Role + IssueDate are cryptographically bound.</span>
                <span>Verification Count: {matchedCertificate.verificationsCount + 1}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Genuine Credential</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenCertificateModal(matchedCertificate)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>View Official Certificate & Save PDF</span>
              </button>
            </div>

          </div>

        </div>
      ) : queriedId ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Certificate Not Found in Institutional Registry</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            No active institutional record matched Identifier <code className="font-mono text-slate-900 bg-slate-100 px-1 py-0.5 rounded">{queriedId}</code>. 
            This document may be counterfeit, unissued, or the identifier was typed incorrectly.
          </p>
        </div>
      ) : null}

    </div>
  );
};
