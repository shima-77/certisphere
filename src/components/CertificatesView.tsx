import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Award, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { CertificateRecord, InstitutionalEvent } from '../types';

interface CertificatesViewProps {
  certificates: CertificateRecord[];
  events: InstitutionalEvent[];
  onOpenCertificateModal: (cert: CertificateRecord) => void;
  onVerifyCertificate: (certId: string) => void;
  onRevokeCertificate: (certId: string, reason: string) => void;
  onReactivateCertificate: (certId: string) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  events,
  onOpenCertificateModal,
  onVerifyCertificate,
  onRevokeCertificate,
  onReactivateCertificate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [revocationTargetCert, setRevocationTargetCert] = useState<CertificateRecord | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState('');

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.recipientRollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.eventTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || cert.status === statusFilter;
    const matchesEvent = selectedEventFilter === 'ALL' || cert.eventId === selectedEventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  const handleExportCsv = () => {
    const headers = ['Certificate ID', 'Recipient Name', 'Roll No', 'Email', 'Event', 'Role', 'Status', 'Issue Date', 'SHA256 Hash'];
    const rows = filteredCertificates.map(c => [
      c.id,
      `"${c.recipientName}"`,
      c.recipientRollNo,
      c.recipientEmail,
      `"${c.eventTitle}"`,
      c.role,
      c.status,
      c.issueDate,
      c.cryptographicHash
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CertiSphere_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmRevoke = () => {
    if (!revocationTargetCert || !revocationReasonInput.trim()) return;
    onRevokeCertificate(revocationTargetCert.id, revocationReasonInput.trim());
    setRevocationTargetCert(null);
    setRevocationReasonInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Master Certificate Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Cryptographic institutional repository. Manage validity states, audit compliance, and disciplinary revocations.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, roll no, or cert ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({certificates.length})
            </button>
            <button
              onClick={() => setStatusFilter('VALID')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'VALID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Valid ({certificates.filter(c => c.status === 'VALID').length})
            </button>
            <button
              onClick={() => setStatusFilter('REVOKED')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'REVOKED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revoked ({certificates.filter(c => c.status === 'REVOKED').length})
            </button>
          </div>

          {/* Event Filter dropdown */}
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
          >
            <option value="ALL">All Institutional Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.code}: {e.title}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Main Certificates Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Recipient Name</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Role / Distinction</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Authenticity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div className="font-medium text-slate-700">No matching certificates found</div>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isRevoked = cert.status === 'REVOKED';
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-[11px]">
                        {cert.id}
                        <div className="text-[10px] text-slate-400 font-normal">
                          SHA: {cert.cryptographicHash.substring(0, 10)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{cert.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{cert.recipientRollNo}</div>
                        <div className="text-[10px] text-slate-400">{cert.recipientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 max-w-[220px] truncate" title={cert.eventTitle}>
                          {cert.eventTitle}
                        </div>
                        <div className="text-[11px] text-slate-500">{cert.eventCategory}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{cert.role}</span>
                        {cert.rank && <div className="text-[10px] text-indigo-600 font-medium">{cert.rank}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {cert.issueDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <div title={cert.revocationReason}>
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                              <ShieldAlert className="w-3 h-3" />
                              Revoked
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                            <ShieldCheck className="w-3 h-3" />
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => onOpenCertificateModal(cert)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => onVerifyCertificate(cert.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          Verify
                        </button>
                        {isRevoked ? (
                          <button
                            onClick={() => onReactivateCertificate(cert.id)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Restore valid status"
                          >
                            <RotateCcw className="w-3 h-3 inline" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setRevocationTargetCert(cert);
                              setRevocationReasonInput('Disciplinary review: academic integrity breach or duplicate reissue.');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredCertificates.length} of {certificates.length} total institutional records.</span>
          <span className="font-mono text-[11px]">ALL RECORDS CRYPTOGRAPHICALLY SECURED</span>
        </div>
      </div>

      {/* Revocation Reason Prompt Modal */}
      {revocationTargetCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Revoke Certificate Credential
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are invalidating Certificate <strong className="font-mono text-slate-900">{revocationTargetCert.id}</strong> issued to <strong>{revocationTargetCert.recipientName}</strong>. 
              The public verification portal will immediately warn employers and verifiers that this document has been revoked.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Institutional Revocation Reason (Recorded on Audit Trail)
              </label>
              <textarea
                rows={3}
                required
                value={revocationReasonInput}
                onChange={(e) => setRevocationReasonInput(e.target.value)}
                placeholder="Specify regulatory reason, disciplinary case number, or error citation..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevocationTargetCert(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={!revocationReasonInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
