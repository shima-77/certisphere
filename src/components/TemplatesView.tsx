import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Shield, 
  Type, 
  Layers, 
  Sliders,
  Filter,
  Upload,
  Image as ImageIcon,
  Trash2,
  Building2,
  Plus
} from 'lucide-react';
import { CertificateTemplate, CertificateRecord, DepartmentTheme } from '../types';
import { CertificateRenderer } from './CertificateRenderer';

interface TemplatesViewProps {
  templates: CertificateTemplate[];
  onUpdateTemplate: (updated: CertificateTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onUpdateTemplate,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  
  const filteredTemplates = templates.filter(t => 
    selectedDeptFilter === 'ALL' || t.departmentTheme === selectedDeptFilter
  );

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || templates[0];
  
  // Local edit copy
  const [draft, setDraft] = useState<CertificateTemplate>(activeTemplate);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Sync draft when template selection changes
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find(t => t.id === id);
    if (found) setDraft({ ...found });
  };

  const handleSave = () => {
    onUpdateTemplate(draft);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  // Mock certificate record for live preview
  const previewSampleCertificate: CertificateRecord = {
    id: "CERT-2026-VFSTR-SAMPLE",
    certificateNumber: "VFSTR/CSE/2026/DEMO",
    eventId: "demo-event",
    eventTitle: "Vignan Mahotsav 2026 - National Technical Symposium",
    eventCategory: "Hackathon & Competition",
    participantId: "demo-part",
    recipientName: "Sai Vardhan Reddy",
    recipientEmail: "saivardhan.22@vignan.ac.in",
    recipientRollNo: "221FA04128",
    recipientInstitution: draft.institutionName || "Vignan's Foundation for Science, Technology & Research (VFSTR)",
    role: "Winner - 1st Place",
    rank: "1st Place (Grand Prize)",
    projectTitle: "Autonomous Drone Swarm Architecture",
    citation: draft.defaultCitationTemplate || "In recognition of distinguished participation, technical acumen, and meritorious completion of all prescribed requirements.",
    issueDate: "2026-10-16",
    status: "VALID",
    templateId: draft.id,
    cryptographicHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    issuerAuthority: "VFSTR Academic Assessment Board · School of Computing",
    publicVerificationUrl: `${window.location.origin}/?verify=CERT-2026-VFSTR-SAMPLE`,
    qrPayload: `${window.location.origin}/?verify=CERT-2026-VFSTR-SAMPLE`,
    downloadsCount: 1,
    verificationsCount: 1
  };

  const departmentTabs: { label: string; value: string }[] = [
    { label: "All Themes", value: "ALL" },
    { label: "CSE", value: "CSE" },
    { label: "AI & ML", value: "AIML" },
    { label: "Robotics", value: "ROBOTICS" },
    { label: "IT & Cloud", value: "IT" },
    { label: "ECE", value: "ECE" },
    { label: "Biotech", value: "BIOTECH" },
    { label: "Mechanical", value: "MECHANICAL" },
    { label: "Management", value: "MANAGEMENT" },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Vignan University Department Template Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Choose and customize tailored visual themes for CSE, AI & ML, Robotics, IT, ECE, Biotech, Mechanical, and Management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSavedFeedback && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" /> Template Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {/* Department Filter Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-100 rounded-lg w-max max-w-full">
        {departmentTabs.map((tab) => {
          const isActive = selectedDeptFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedDeptFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Template Selector Pills with Department Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filteredTemplates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isSelected 
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-semibold shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {tpl.departmentTheme}
              </span>
              <span>{tpl.name}</span>
            </button>
          );
        })}
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): Controls */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Department Theme Config</span>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {draft.departmentTheme} THEME
            </span>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Department Assignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Theme</label>
                <select
                  value={draft.departmentTheme}
                  onChange={(e) => setDraft({ ...draft, departmentTheme: e.target.value as DepartmentTheme })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="AIML">AIML (Artificial Intelligence)</option>
                  <option value="ROBOTICS">Robotics & Mechatronics</option>
                  <option value="IT">IT (Information Technology)</option>
                  <option value="ECE">ECE (Electronics & Comm)</option>
                  <option value="BIOTECH">Biotechnology & Bio-Sciences</option>
                  <option value="MECHANICAL">Mechanical Engineering</option>
                  <option value="MANAGEMENT">School of Management (SMS)</option>
                  <option value="GENERAL">General University Theme</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Visual Style Engine</label>
                <select
                  value={draft.style}
                  onChange={(e) => setDraft({ ...draft, style: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="academic-classic">Academic Classic (Parchment)</option>
                  <option value="modern-tech">Modern Tech (Cyan/Slate)</option>
                  <option value="cyber-neural">Cyber Neural (Violet AI)</option>
                  <option value="robotics-industrial">Robotics Industrial (Amber/Carbon)</option>
                  <option value="stem-excellence">STEM Excellence (Emerald/Grid)</option>
                  <option value="gold-prestige">Gold Prestige Honours (Navy/Gold)</option>
                  <option value="minimalist-clean">Minimalist Clean</option>
                </select>
              </div>
            </div>

            {/* Custom Background Image Upload Card */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-indigo-950 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Custom Certificate Background / Border</span>
                </span>
                {draft.customBackgroundImage && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, customBackgroundImage: undefined })}
                    className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Upload your own certificate design, college border, or background image (PNG or JPG). Text and QR will overlay seamlessly on top.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-indigo-300 hover:border-indigo-500 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{draft.customBackgroundImage ? 'Change Background Image' : 'Upload from Computer / Drive'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setDraft({ ...draft, customBackgroundImage: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* University / Institution Name */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 block text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>University / College Name (Certificate Top Header)</span>
                </label>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                  Editable
                </span>
              </div>
              <input
                type="text"
                value={draft.institutionName}
                onChange={(e) => setDraft({ ...draft, institutionName: e.target.value })}
                placeholder="e.g. Vignan's Foundation for Science, Technology & Research"
                className="w-full p-2.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold text-slate-900 text-xs shadow-xs"
              />
              <p className="text-[10px] text-amber-900">
                Type your university name here. When saved, this updates the top header on certificates and university profile.
              </p>
              
              {/* Toggle for Show/Hide University Header */}
              <div className="pt-2 border-t border-amber-200/70 mt-1">
                <label className="flex items-center gap-2 text-xs text-amber-950 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showInstitutionHeader !== false}
                    onChange={(e) => setDraft({ ...draft, showInstitutionHeader: e.target.checked })}
                    className="rounded text-amber-700 focus:ring-amber-500"
                  />
                  <span>Display University Header Text on Certificate</span>
                </label>
                <span className="text-[10px] text-amber-800/80 block ml-5">
                  (Uncheck if your uploaded certificate border image already has the university name printed on it)
                </span>
              </div>
            </div>

            {/* Template Display Name */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Template Display Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Department Name / Subtitle */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Department / Center Subtitle</label>
              <input
                type="text"
                value={draft.institutionSubtitle}
                onChange={(e) => setDraft({ ...draft, institutionSubtitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Certificate Header Title */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Certificate Header Title</label>
              <input
                type="text"
                value={draft.headerTitle}
                onChange={(e) => setDraft({ ...draft, headerTitle: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Certificate Sub-Header Prose */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Certificate Subtitle / Conferred Prose</label>
              <input
                type="text"
                value={draft.headerSubtitle}
                onChange={(e) => setDraft({ ...draft, headerSubtitle: e.target.value })}
                placeholder="e.g. Conferred with highest university honors unto"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Typography & Seal Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Typography Family</label>
                <select
                  value={draft.fontFamily}
                  onChange={(e) => setDraft({ ...draft, fontFamily: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="cinzel">Cinzel (Classical Academic)</option>
                  <option value="garamond">Cormorant Garamond (Prestige)</option>
                  <option value="sans">Plus Jakarta Sans (Modern Clean)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Seal Style</label>
                <select
                  value={draft.sealType}
                  onChange={(e) => setDraft({ ...draft, sealType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="academic-shield">Academic Heraldic Shield</option>
                  <option value="neural-ai">Neural AI Core (AIML)</option>
                  <option value="robotics-gear">Precision Gear (Robotics/Mech)</option>
                  <option value="tech-emblem">Hexagon Tech Emblem (IT/ECE)</option>
                  <option value="bio-helix">Bio-Sciences Helix (Biotech)</option>
                  <option value="gold-crest">Gold Crest Medallion</option>
                  <option value="laurel-wreath">Laurel Wreath Gold (Management)</option>
                </select>
              </div>
            </div>

            {/* Default Citation Body Template */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Department Citation Prose</label>
              <textarea
                rows={3}
                value={draft.defaultCitationTemplate}
                onChange={(e) => setDraft({ ...draft, defaultCitationTemplate: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Signatory 1 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Signatory 1 (Department Authority)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={draft.signatories[0]?.name || ''}
                  onChange={(e) => {
                    const sigs = [...draft.signatories];
                    sigs[0] = { ...sigs[0], name: e.target.value };
                    setDraft({ ...draft, signatories: sigs });
                  }}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
                <input
                  type="text"
                  placeholder="Official Title"
                  value={draft.signatories[0]?.title || ''}
                  onChange={(e) => {
                    const sigs = [...draft.signatories];
                    sigs[0] = { ...sigs[0], title: e.target.value };
                    setDraft({ ...draft, signatories: sigs });
                  }}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
            </div>

            {/* Signatory 2 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Signatory 2 (University Executive)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={draft.signatories[1]?.name || ''}
                  onChange={(e) => {
                    const sigs = [...draft.signatories];
                    sigs[1] = { ...sigs[1], name: e.target.value };
                    setDraft({ ...draft, signatories: sigs });
                  }}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
                <input
                  type="text"
                  placeholder="Official Title"
                  value={draft.signatories[1]?.title || ''}
                  onChange={(e) => {
                    const sigs = [...draft.signatories];
                    sigs[1] = { ...sigs[1], title: e.target.value };
                    setDraft({ ...draft, signatories: sigs });
                  }}
                  className="p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
            </div>

            {/* Cryptographic Badges Checkboxes */}
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.showQrCode}
                  onChange={(e) => setDraft({ ...draft, showQrCode: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Embed Real Verification QR Code</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.showCryptographicHash}
                  onChange={(e) => setDraft({ ...draft, showCryptographicHash: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Display SHA-256 Tamper-Proof Cryptographic Hash</span>
              </label>
            </div>

          </div>
        </div>

        {/* Right Column (7 cols): Live Scaled Certificate Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Real-Time Vector Preview · {draft.departmentTheme}</span>
            <span>Style: {draft.style}</span>
          </div>

          <div className="p-3 bg-slate-200/70 rounded-xl border border-slate-300/80 overflow-hidden shadow-inner flex items-center justify-center">
            <div className="w-full transform scale-95 sm:scale-100 transition-all">
              <CertificateRenderer
                certificate={previewSampleCertificate}
                template={draft}
                containerId="preview-canvas-cert"
                isInteractive={false}
              />
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Certificates rendered with this {draft.departmentTheme} department template comply with Vignan University accreditation standards.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
