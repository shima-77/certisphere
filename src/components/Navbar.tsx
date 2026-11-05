import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export type NavTab = 'dashboard' | 'events' | 'coordinator' | 'checkin' | 'certificates' | 'templates' | 'verify' | 'vault';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAiWizard: () => void;
  onOpenAuditAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAiWizard,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Brand title, one line wordmark */}
          <div 
            onClick={() => onSelectTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
              <ShieldCheck className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                CertiSphere AI
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('coordinator')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors flex items-center gap-1 ${
                activeTab === 'coordinator'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-indigo-700 font-semibold hover:text-indigo-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Coordinator Desk</span>
            </button>
            <button
              onClick={() => onSelectTab('checkin')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'checkin'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-700 font-semibold hover:text-slate-900'
              }`}
            >
              Student Live Check-In
            </button>
            <button
              onClick={() => onSelectTab('events')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'events'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => onSelectTab('certificates')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'certificates'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Certificates
            </button>
            <button
              onClick={() => onSelectTab('templates')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'templates'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => onSelectTab('verify')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'verify'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verify Portal
            </button>
            <button
              onClick={() => onSelectTab('vault')}
              className={`whitespace-nowrap shrink-0 py-2 transition-colors ${
                activeTab === 'vault'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Vault
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('checkin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <span>Join with Code</span>
            </button>
            <button
              onClick={onOpenAiWizard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI Wizard</span>
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-100 bg-white overflow-x-auto text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('events')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'events' ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
        >
          Events
        </button>
        <button
          onClick={() => onSelectTab('certificates')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'certificates' ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
        >
          Certificates
        </button>
        <button
          onClick={() => onSelectTab('verify')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'verify' ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
        >
          Verify
        </button>
        <button
          onClick={() => onSelectTab('vault')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'vault' ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600'}`}
        >
          Student Vault
        </button>
      </div>
    </header>
  );
};
