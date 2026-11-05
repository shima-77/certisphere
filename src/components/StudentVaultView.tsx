import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Download, 
  Share2, 
  ExternalLink, 
  Check, 
  Calendar, 
  Building, 
  Printer, 
  QrCode,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CertificateRecord, CertificateTemplate } from '../types';

interface StudentVaultViewProps {
  certificates: CertificateRecord[];
  templates: CertificateTemplate[];
  onOpenCertificateModal: (cert: CertificateRecord) => void;
  onVerifyCertificate: (certId: string) => void;
}

export const StudentVaultView: React.FC<StudentVaultViewProps> = ({
  certificates,
  templates,
  onOpenCertificateModal,
  onVerifyCertificate,
}) => {
  const [studentQuery, setStudentQuery] = useState('saivardhan.22@vignan.ac.in');
  const [activeQuery, setActiveQuery] = useState('saivardhan.22@vignan.ac.in');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const matchedCertificates = certificates.filter(c => 
    c.recipientEmail.toLowerCase().includes(activeQuery.toLowerCase()) ||
    c.recipientRollNo.toLowerCase().includes(activeQuery.toLowerCase()) ||
    c.recipientName.toLowerCase().includes(activeQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentQuery.trim()) {
      setActiveQuery(studentQuery.trim());
    }
  };

  const handleCopyLink = (cert: CertificateRecord) => {
    const link = `${window.location.origin}/?verify=${cert.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToLinkedIn = (cert: CertificateRecord) => {
    const issueDate = new Date(cert.issueDate);
    const year = issueDate.getFullYear();
    const month = issueDate.getMonth() + 1;
    const certUrl = encodeURIComponent(`${window.location.origin}/?verify=${cert.id}`);
    const name = encodeURIComponent(`${cert.role}: ${cert.eventTitle}`);
    const orgName = encodeURIComponent("Vignan's Foundation for Science, Technology & Research (VFSTR)");
    const certId = encodeURIComponent(cert.id);

    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${orgName}&issueYear=${year}&issueMonth=${month}&certUrl=${certUrl}&certId=${certId}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Student Self-Service Credential Repository</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Vignan University Student Credential Vault
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Access all verified certificates, symposium awards, and participation credentials earned throughout your academic tenure at VFSTR.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="Enter Student Roll No (e.g. 221FA04128) or Vignan Email..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Retrieve Credentials
          </button>
        </form>

        {/* Demo profiles quick switch */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Sample Vignan Student Portfolios:</span>
          <button
            type="button"
            onClick={() => { setStudentQuery('saivardhan.22@vignan.ac.in'); setActiveQuery('saivardhan.22@vignan.ac.in'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Sai Vardhan Reddy (221FA04128)
          </button>
          <button
            type="button"
            onClick={() => { setStudentQuery('bhavana.22@vignan.ac.in'); setActiveQuery('bhavana.22@vignan.ac.in'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Bhavana Chowdary (221FA04045)
          </button>
          <button
            type="button"
            onClick={() => { setStudentQuery('karthik.23@vignan.ac.in'); setActiveQuery('karthik.23@vignan.ac.in'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Venkata Karthik (231FA05012)
          </button>
        </div>
      </div>

      {/* Results Portfolio Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Earned Institutional Credentials ({matchedCertificates.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Retrieved for: {activeQuery}
          </span>
        </div>

        {matchedCertificates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-sm">
            <Award className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">No Credentials Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No issued certificates were found matching identifier "{activeQuery}". If you recently participated in an institutional event, certificates may still be in pending evaluation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchedCertificates.map((cert) => {
              const isRevoked = cert.status === 'REVOKED';
              return (
                <div 
                  key={cert.id} 
                  className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                    isRevoked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        {cert.id}
                      </span>
                      {isRevoked ? (
                        <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                          Revoked
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          Verified Valid
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="inline-block px-2.5 py-0.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
                        {cert.role} {cert.rank ? `— ${cert.rank}` : ''}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {cert.eventTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cert.eventCategory} · Issued on {cert.issueDate}
                      </p>
                    </div>

                    {cert.projectTitle && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        Demonstration: "{cert.projectTitle}"
                      </div>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{cert.citation}"
                    </p>
                  </div>

                  {/* Actions Strip */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenCertificateModal(cert)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect / Print
                      </button>
                      <button
                        onClick={() => onVerifyCertificate(cert.id)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Public Verify
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(cert)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy Public Verification Link"
                      >
                        {copiedId === cert.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToLinkedIn(cert)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Add to your professional LinkedIn Profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Add to LinkedIn</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
