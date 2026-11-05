import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Bot, 
  User, 
  RefreshCw, 
  X,
  HelpCircle
} from 'lucide-react';
import { CertificateRecord, InstitutionalEvent, AuditLogEntry } from '../types';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: CertificateRecord[];
  events: InstitutionalEvent[];
  auditLogs: AuditLogEntry[];
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  certificates,
  events,
  auditLogs,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: "Greetings. I am CertiSphere AI, your Autonomous Institutional Activity & Accreditation Compliance Agent. I monitor certificate registries, cryptographic hash integrity, and duplicate prevention protocols across all departments. How may I assist your accreditation review or event administration?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "How does CertiSphere prevent duplicate or fraudulent certificates?",
    "Summarize institutional certificate distribution for NAAC / NBA audit.",
    "Verify integrity of Alexandria Morgan's Hackathon 1st Place credential.",
    "Draft a formal Dean's commendation citation for technical innovation."
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const context = {
        totalCertificates: certificates.length,
        totalEvents: events.length,
        validCount: certificates.filter(c => c.status === 'VALID').length,
        revokedCount: certificates.filter(c => c.status === 'REVOKED').length,
        events: events.map(e => ({ title: e.title, code: e.code, participants: e.totalParticipants, issued: e.certificatesIssued })),
        recentAudits: auditLogs.slice(0, 5)
      };

      const res = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          context
        })
      });

      const data = await res.json();
      const agentReply = data.reply || "Agent request processed successfully.";

      setMessages(prev => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: agentReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: "Institutional Agent Communication Error: Could not synchronize with server engine. Local registry rules remain fully operational.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span>CertiSphere Compliance Copilot</span>
                <span className="text-[10px] font-mono bg-indigo-800 text-indigo-200 px-1.5 py-0.2 rounded">AGENT</span>
              </div>
              <div className="text-[10px] text-slate-300">
                Autonomous Verification & Audit Sentinel
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] ${
                  isUser ? 'bg-indigo-600' : 'bg-slate-800'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[9px] block mt-1.5 font-mono ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-white text-[10px]">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 bg-slate-100 text-slate-600 rounded-xl rounded-tl-none flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                <span className="text-xs">Analyzing institutional registry & formulating audit response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Suggestions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Recommended Compliance Queries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-[11px] text-left p-1.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 rounded transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask compliance agent about certificates, audits, or citations..."
              className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={isSending || !inputMessage.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
