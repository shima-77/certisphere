import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Calendar, 
  Building, 
  Award, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { InstitutionalEvent, CertificateTemplate } from '../types';

interface AiEventWizardModalProps {
  institutionName: string;
  templates: CertificateTemplate[];
  onClose: () => void;
  onDeployEvent: (event: InstitutionalEvent) => void;
}

export const AiEventWizardModal: React.FC<AiEventWizardModalProps> = ({
  institutionName,
  templates,
  onClose,
  onDeployEvent,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplePrompts = [
    "3-day National Autonomous Robotics & Edge AI Hackathon for 120 engineering participants, with awards for 1st Place Grand Winner, 2nd Place, and Participation.",
    "2-day Faculty Development Program (FDP) on Post-Quantum Cryptography & Secure Distributed Systems by Department of Information Science.",
    "Inter-Collegiate STEM Research Colloquium with Best Paper Award and Distinguished Presenter Citations."
  ];

  const handleSynthesize = async () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/event-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput,
          institutionName
        })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setGeneratedBlueprint(data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to synthesize event blueprint');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = () => {
    if (!generatedBlueprint) return;

    // Pick matching template or first
    const matchedTemplate = templates.find(t => t.style === generatedBlueprint.suggestedTemplate) || templates[0];

    const newEvent: InstitutionalEvent = {
      id: `evt-${Date.now()}`,
      title: generatedBlueprint.title || "Institutional Technical Event",
      code: `APEX-${(generatedBlueprint.category || 'EVT').substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      category: generatedBlueprint.category || "Workshop",
      department: generatedBlueprint.department || "Department of Computer Science",
      venue: generatedBlueprint.venue || "Campus Auditorium",
      startDate: generatedBlueprint.startDate || new Date().toISOString().split('T')[0],
      endDate: generatedBlueprint.endDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: "Ongoing",
      coordinator: generatedBlueprint.coordinator || "Dr. Eleanor Vance",
      coCoordinator: generatedBlueprint.coCoordinator || "Prof. Marcus Thorne",
      description: generatedBlueprint.description || promptInput,
      templateId: matchedTemplate.id,
      totalParticipants: 0,
      certificatesIssued: 0,
      fraudFlagsCount: 0
    };

    onDeployEvent(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                CertiSphere AI Event Architect
              </h3>
              <p className="text-xs text-slate-500">
                Transform natural language event concepts into structured accreditation-ready events and certificate criteria.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Input prompt */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Describe the Institutional Activity or Competition
          </label>
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. 3-day National Autonomous AI Hackathon with 150 students, certificates for Winners and Participants with formal citations..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Preset Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Suggested Prompts:</span>
            <div className="flex flex-col gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(p)}
                  className="text-left text-xs p-2 bg-slate-50 hover:bg-indigo-50/60 rounded border border-slate-200/80 text-slate-700 hover:text-indigo-900 transition-colors cursor-pointer"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Synthesize Button */}
        <div className="flex justify-between items-center pt-2">
          {errorMessage && (
            <span className="text-xs text-rose-600 font-medium">{errorMessage}</span>
          )}
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isGenerating || !promptInput.trim()}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Architecting Event Structure...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize Event Blueprint</span>
              </>
            )}
          </button>
        </div>

        {/* Synthesized Output Display */}
        {generatedBlueprint && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in fade-in duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 text-sm">Synthesized Institutional Event Blueprint</span>
              <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                Accreditation Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 font-medium">Event Title:</span>
                <div className="font-bold text-slate-900 text-sm">{generatedBlueprint.title}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Category & Department:</span>
                <div className="font-semibold text-slate-800">{generatedBlueprint.category} · {generatedBlueprint.department}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Dates & Venue:</span>
                <div className="text-slate-800">{generatedBlueprint.startDate} to {generatedBlueprint.endDate} · {generatedBlueprint.venue}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Designated Coordinators:</span>
                <div className="text-slate-800">{generatedBlueprint.coordinator} {generatedBlueprint.coCoordinator ? `& ${generatedBlueprint.coCoordinator}` : ''}</div>
              </div>
            </div>

            {/* Generated Certificate Tiers & Citations */}
            {generatedBlueprint.certificateTypes && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-800 block">AI-Generated Certificate Tiers & Citations:</span>
                <div className="space-y-2">
                  {generatedBlueprint.certificateTypes.map((tier: any, i: number) => (
                    <div key={i} className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-700">{tier.type}</span>
                        {tier.badge && <span className="text-[10px] text-slate-500 font-medium">{tier.badge}</span>}
                      </div>
                      <p className="text-slate-600 italic">"{tier.citation}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                Recommended Styling: <strong className="text-slate-800 uppercase">{generatedBlueprint.suggestedTemplate}</strong>
              </div>
              <button
                type="button"
                onClick={handleDeploy}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <span>Deploy to Institutional Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
