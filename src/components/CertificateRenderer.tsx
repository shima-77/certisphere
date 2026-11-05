import React, { useEffect, useState } from 'react';
import { CertificateRecord, CertificateTemplate } from '../types';
import { generateQrDataUrl } from '../utils/crypto';
import { ShieldCheck, Award, CheckCircle2, AlertTriangle, Fingerprint, Sparkles, Layers } from 'lucide-react';

interface CertificateRendererProps {
  certificate: CertificateRecord;
  template: CertificateTemplate;
  containerId?: string;
  isInteractive?: boolean;
  onQrClick?: () => void;
  scale?: number;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  certificate,
  template,
  containerId = 'printable-certificate',
  isInteractive = true,
  onQrClick,
  scale = 1
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const payload = certificate.qrPayload || `${window.location.origin}/?verify=${certificate.id}`;
    generateQrDataUrl(payload).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [certificate.id, certificate.qrPayload]);

  const isRevoked = certificate.status === 'REVOKED';

  // Render Signature Vector
  const renderSignatureSvg = (type: string) => {
    switch (type) {
      case 'dean':
        return (
          <svg viewBox="0 0 160 50" className="h-10 w-32 stroke-slate-800 dark:stroke-slate-200 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
            <path d="M10,35 C25,15 40,40 55,20 C70,10 65,45 85,25 C100,15 110,38 135,22 C145,15 150,28 155,25" />
            <path d="M40,28 L130,28" className="stroke-slate-700/60 stroke-[1.5]" />
          </svg>
        );
      case 'director':
        return (
          <svg viewBox="0 0 160 50" className="h-10 w-32 stroke-slate-800 dark:stroke-slate-200 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
            <path d="M15,40 C10,20 30,10 40,30 C50,45 60,15 80,35 C95,45 110,12 125,32 C135,42 145,25 152,18" />
            <circle cx="45" cy="22" r="3" className="fill-slate-800 dark:fill-slate-200" />
          </svg>
        );
      case 'chancellor':
        return (
          <svg viewBox="0 0 160 50" className="h-10 w-32 stroke-slate-800 dark:stroke-slate-200 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
            <path d="M10,25 Q30,5 50,30 T90,20 T130,35 T155,15" />
            <path d="M35,38 C60,42 100,40 140,36" className="stroke-slate-700/60 stroke-[1.5]" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 160 50" className="h-10 w-32 stroke-slate-800 dark:stroke-slate-200 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round">
            <path d="M12,38 C28,10 42,42 62,18 C78,35 102,12 120,30 C138,42 148,22 155,28" />
          </svg>
        );
    }
  };

  // Render Vector Institutional Seal
  const renderSeal = (type: string, accent: string) => {
    switch (type) {
      case 'gold-crest':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-amber-600/70 bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 text-amber-900 shadow-sm">
            <div className="absolute inset-1 rounded-full border border-dashed border-amber-700/60" />
            <div className="text-center p-1">
              <Award className="w-8 h-8 mx-auto text-amber-700" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-amber-900 mt-0.5">Verified</span>
              <span className="block text-[6px] tracking-tight text-amber-800 font-mono">VIGNAN · VFSTR</span>
            </div>
          </div>
        );
      case 'tech-emblem':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl border-2 border-cyan-500/80 bg-slate-900 text-cyan-400 shadow-sm">
            <div className="absolute inset-1.5 rounded-xl border border-cyan-500/30" />
            <div className="text-center p-1">
              <Fingerprint className="w-8 h-8 mx-auto text-cyan-400" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-cyan-300 mt-0.5">TAMPER-PROOF</span>
              <span className="block text-[6px] tracking-tight text-cyan-500 font-mono">SHA-256</span>
            </div>
          </div>
        );
      case 'laurel-wreath':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-amber-700/80 bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-sm">
            <div className="absolute inset-1 rounded-full border border-amber-300/60" />
            <div className="text-center p-1 text-amber-50">
              <ShieldCheck className="w-8 h-8 mx-auto text-amber-100" />
              <span className="block text-[8px] font-bold uppercase tracking-widest mt-0.5">EXCELLENCE</span>
              <span className="block text-[6px] tracking-tight font-mono text-amber-200">OFFICIAL CREST</span>
            </div>
          </div>
        );
      case 'neural-ai':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl border-2 border-violet-500/80 bg-slate-950 text-violet-400 shadow-sm">
            <div className="absolute inset-1.5 rounded-xl border border-violet-500/30" />
            <div className="text-center p-1">
              <Sparkles className="w-8 h-8 mx-auto text-violet-400" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-violet-300 mt-0.5">NEURAL CORE</span>
              <span className="block text-[6px] tracking-tight text-violet-400 font-mono">AIML · VFSTR</span>
            </div>
          </div>
        );
      case 'robotics-gear':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl border-2 border-amber-500/80 bg-slate-950 text-amber-400 shadow-sm">
            <div className="absolute inset-1.5 rounded-xl border border-amber-500/30" />
            <div className="text-center p-1">
              <Layers className="w-8 h-8 mx-auto text-amber-400" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-amber-300 mt-0.5">ROBOTICS VIIC</span>
              <span className="block text-[6px] tracking-tight text-amber-400 font-mono">AUTONOMOUS</span>
            </div>
          </div>
        );
      case 'bio-helix':
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-teal-600 bg-teal-950 text-teal-300 shadow-sm">
            <div className="absolute inset-1 rounded-full border border-teal-500/40" />
            <div className="text-center p-1">
              <Award className="w-8 h-8 mx-auto text-teal-400" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-teal-200 mt-0.5">BIO-SCIENCES</span>
              <span className="block text-[6px] tracking-tight text-teal-400 font-mono">GENOMICS</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-emerald-700 bg-emerald-50 text-emerald-900 shadow-sm">
            <div className="absolute inset-1 rounded-full border border-dashed border-emerald-500" />
            <div className="text-center p-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-700" />
              <span className="block text-[8px] font-bold uppercase tracking-widest text-emerald-900 mt-0.5">AUTHENTIC</span>
              <span className="block text-[6px] tracking-tight font-mono text-emerald-700">VIGNAN · VFSTR</span>
            </div>
          </div>
        );
    }
  };

  // Select font family for content
  const fontHeading = template.fontFamily === 'cinzel' 
    ? 'font-cinzel' 
    : template.fontFamily === 'garamond' 
      ? 'font-garamond' 
      : 'font-sans font-bold';

  return (
    <div 
      id={containerId}
      className={`relative w-full max-w-[940px] aspect-[1.414/1] mx-auto select-none overflow-hidden transition-all duration-300 shadow-xl print:shadow-none print:max-w-none ${
        template.style === 'academic-classic'
          ? 'bg-[#fcfbf7] text-slate-900'
          : template.style === 'modern-tech'
            ? 'bg-slate-950 text-slate-100'
            : template.style === 'gold-prestige'
              ? 'bg-[#fdfcf9] text-slate-900'
              : template.style === 'stem-excellence'
                ? 'bg-white text-slate-900'
                : template.style === 'cyber-neural'
                  ? 'bg-[#080b12] text-slate-100'
                  : template.style === 'robotics-industrial'
                    ? 'bg-[#0c0f17] text-slate-100'
                    : 'bg-white text-slate-900'
      }`}
      style={{
        transformOrigin: 'top center',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        backgroundImage: template.customBackgroundImage ? `url(${template.customBackgroundImage})` : undefined,
        backgroundSize: template.customBackgroundImage ? 'cover' : undefined,
        backgroundPosition: template.customBackgroundImage ? 'center' : undefined,
      }}
    >
      {/* Optional Custom Background subtle overlay if provided */}
      {template.customBackgroundImage && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] pointer-events-none" />
      )}
      {/* Revocation Overlay Watermark if Revoked */}
      {isRevoked && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-rose-950/20 backdrop-blur-[1px]">
          <div className="rotate-[-24deg] border-8 border-rose-600 bg-rose-900/90 text-white px-12 py-5 rounded-2xl shadow-2xl flex items-center gap-4">
            <AlertTriangle className="w-14 h-14 text-rose-300 shrink-0" />
            <div>
              <div className="text-4xl font-extrabold tracking-widest uppercase font-mono">REVOKED</div>
              <div className="text-xs text-rose-200 mt-1 max-w-md font-sans">
                {certificate.revocationReason || 'Invalidated by Institutional Disciplinary Committee'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Ornamentation / Borders based on Style */}
      {template.style === 'academic-classic' && (
        <div className="absolute inset-4 border-[6px] border-[#0f3a2c] pointer-events-none">
          <div className="absolute inset-1.5 border border-[#b48c36]/80" />
          {/* Corner Filigree Anchors */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#b48c36]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#b48c36]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#b48c36]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#b48c36]" />
        </div>
      )}

      {template.style === 'cyber-neural' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-3 border border-violet-500/40 rounded-lg" />
          <div className="absolute inset-4 border border-violet-900/40 rounded-md" />
          <div 
            className="absolute inset-0 opacity-[0.05]" 
            style={{ backgroundImage: `radial-gradient(#a855f7 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
          />
          <div className="absolute top-3 left-6 text-[8px] font-mono text-violet-400 tracking-wider">
            DEPT_AIML // NEURAL_HASH: 0xVFSTR
          </div>
          <div className="absolute top-3 right-6 text-[8px] font-mono text-violet-400">
            QUANTUM_VERIFIED
          </div>
        </div>
      )}

      {template.style === 'robotics-industrial' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-3 border-2 border-amber-600/50 rounded" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600" />
          <div className="absolute top-3 left-6 text-[8px] font-mono text-amber-500 tracking-wider">
            VIIC // ROBOTICS & AUTONOMOUS SYSTEMS
          </div>
        </div>
      )}

      {template.style === 'modern-tech' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-3 border border-cyan-500/30 rounded-lg" />
          <div className="absolute inset-4 border border-slate-800 rounded-md" />
          {/* Subtle grid pattern background */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
          />
          {/* Futuristic tech accents */}
          <div className="absolute top-4 left-6 text-[9px] font-mono text-cyan-400 tracking-wider">
            AUTH_SYS // SHA256:VERIFIED
          </div>
          <div className="absolute top-4 right-6 text-[9px] font-mono text-slate-500">
            SEC_LEVEL: 01_HIGH
          </div>
        </div>
      )}

      {template.style === 'gold-prestige' && (
        <div className="absolute inset-4 border-2 border-amber-600/60 pointer-events-none p-1.5">
          <div className="h-full w-full border-[5px] border-double border-amber-800/80" />
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-600" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-600" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-600" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-600" />
        </div>
      )}

      {template.style === 'stem-excellence' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-3 border-2 border-slate-900 rounded-sm" />
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900" />
        </div>
      )}

      {/* Main Certificate Content Container */}
      <div className="relative h-full flex flex-col justify-between p-10 sm:p-12 z-10">
        
        {/* Header Zone: Institution Name & Subtitle */}
        <div className="text-center pt-2">
          {template.showInstitutionHeader !== false && (
            <>
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight uppercase ${
                  template.style === 'modern-tech' ? 'text-white' : 'text-slate-900'
                }`}>
                  {template.institutionName || certificate.recipientInstitution || "University Institution"}
                </span>
              </div>
              
              {template.institutionSubtitle && (
                <div className={`text-[11px] sm:text-xs tracking-wider uppercase ${
                  template.style === 'modern-tech' ? 'text-cyan-400/80' : 'text-slate-600'
                }`}>
                  {template.institutionSubtitle}
                </div>
              )}

              <div className="w-32 h-[1.5px] mx-auto my-3 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-80" />
            </>
          )}

          {/* Certificate Title */}
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-wide uppercase ${fontHeading} ${
            template.style === 'modern-tech' ? 'text-cyan-300' : 'text-slate-900'
          }`}>
            {template.headerTitle}
          </h2>

          <div className={`text-[11px] tracking-wide mt-1 italic ${
            template.style === 'modern-tech' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {template.headerSubtitle}
          </div>
        </div>

        {/* Recipient Zone */}
        <div className="text-center my-auto py-2">
          <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${fontHeading} ${
            template.style === 'modern-tech' ? 'text-white drop-shadow-[0_2px_8px_rgba(56,189,248,0.2)]' : 'text-slate-950'
          }`}>
            {certificate.recipientName}
          </div>

          {/* Recipient Roll No & Institution */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm mt-1.5 font-medium">
            <span className={template.style === 'modern-tech' ? 'text-cyan-300' : 'text-slate-800'}>
              ID: {certificate.recipientRollNo}
            </span>
            <span className={template.style === 'modern-tech' ? 'text-slate-600' : 'text-slate-400'}>·</span>
            <span className={template.style === 'modern-tech' ? 'text-slate-400' : 'text-slate-600'}>
              {certificate.recipientInstitution}
            </span>
          </div>

          {/* Role / Achievement Badge & Event Title */}
          <div className="mt-3.5 max-w-2xl mx-auto">
            <div className={`inline-block px-3.5 py-1 text-xs font-semibold rounded ${
              template.style === 'modern-tech'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'bg-amber-100/70 text-amber-950 border border-amber-300'
            }`}>
              {certificate.role} {certificate.rank ? `— ${certificate.rank}` : ''}
            </div>

            <div className={`text-sm sm:text-base font-semibold mt-2 ${
              template.style === 'modern-tech' ? 'text-slate-200' : 'text-slate-900'
            }`}>
              {certificate.eventTitle}
            </div>

            {certificate.projectTitle && (
              <div className={`text-xs mt-0.5 italic ${
                template.style === 'modern-tech' ? 'text-cyan-200' : 'text-slate-700'
              }`}>
                Project Demonstration: "{certificate.projectTitle}"
              </div>
            )}

            {/* Citation Statement */}
            <p className={`text-xs sm:text-[13px] leading-relaxed mt-2.5 max-w-xl mx-auto ${
              template.style === 'modern-tech' ? 'text-slate-300 font-light' : 'text-slate-700'
            }`}>
              {certificate.citation}
            </p>
          </div>
        </div>

        {/* Footer Zone: Signatures, Seal, QR Code & Security Hash */}
        <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-end justify-between gap-4">
            
            {/* Signatory 1 */}
            <div className="text-center w-40 shrink-0">
              <div className="flex justify-center mb-1">
                {renderSignatureSvg(template.signatories[0]?.signatureSvgType || 'dean')}
              </div>
              <div className="w-full h-px bg-slate-400/60 mb-1" />
              <div className={`text-xs font-bold leading-tight ${template.style === 'modern-tech' ? 'text-slate-200' : 'text-slate-900'}`}>
                {template.signatories[0]?.name || 'Dr. Eleanor Vance'}
              </div>
              <div className={`text-[10px] leading-tight ${template.style === 'modern-tech' ? 'text-slate-400' : 'text-slate-600'}`}>
                {template.signatories[0]?.title || 'Dean of Academic Affairs'}
              </div>
            </div>

            {/* Center: Institutional Seal */}
            <div className="flex flex-col items-center justify-center shrink-0">
              {renderSeal(template.sealType, template.accentColor)}
              <div className={`text-[9px] font-mono mt-1 ${template.style === 'modern-tech' ? 'text-slate-400' : 'text-slate-500'}`}>
                Issued: {certificate.issueDate}
              </div>
            </div>

            {/* Signatory 2 */}
            <div className="text-center w-40 shrink-0">
              <div className="flex justify-center mb-1">
                {renderSignatureSvg(template.signatories[1]?.signatureSvgType || 'director')}
              </div>
              <div className="w-full h-px bg-slate-400/60 mb-1" />
              <div className={`text-xs font-bold leading-tight ${template.style === 'modern-tech' ? 'text-slate-200' : 'text-slate-900'}`}>
                {template.signatories[1]?.name || 'Prof. Arthur Pendelton'}
              </div>
              <div className={`text-[10px] leading-tight ${template.style === 'modern-tech' ? 'text-slate-400' : 'text-slate-600'}`}>
                {template.signatories[1]?.title || 'Principal & Director General'}
              </div>
            </div>

            {/* Right: Embedded QR Code for Immediate Authenticity Verification */}
            {template.showQrCode && (
              <div 
                className={`flex flex-col items-center shrink-0 p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 ${
                  isInteractive ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''
                }`}
                onClick={isInteractive ? onQrClick : undefined}
                title="Scan or Click to Verify Certificate Authenticity"
              >
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Authenticity Verification QR Code" 
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 font-mono">
                    QR CODE
                  </div>
                )}
                <div className="text-[7px] font-mono font-semibold text-slate-800 tracking-tighter mt-0.5">
                  SCAN TO VERIFY
                </div>
              </div>
            )}

          </div>

          {/* Cryptographic Hash Bar at bottom */}
          {template.showCryptographicHash && (
            <div className={`mt-3 pt-1.5 border-t border-slate-200/30 flex items-center justify-between text-[9px] font-mono ${
              template.style === 'modern-tech' ? 'text-slate-500' : 'text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">CERT ID: {certificate.id}</span>
                <span aria-hidden="true">·</span>
                <span>DOC NO: {certificate.certificateNumber}</span>
              </div>
              <div className="truncate max-w-[340px]" title={`Full SHA-256 Checksum: ${certificate.cryptographicHash}`}>
                SHA256: {certificate.cryptographicHash.substring(0, 24)}...
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
