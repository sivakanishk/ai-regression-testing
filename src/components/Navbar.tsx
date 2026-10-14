import React from 'react';
import { 
  ShieldCheck, 
  Play, 
  Sparkles, 
  Layers, 
  Activity, 
  History, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRunningAll: boolean;
  onRunAll: () => void;
  suitesCount: number;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isRunningAll,
  onRunAll,
  suitesCount,
  hasApiKey,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'suites', label: 'Test Suites', icon: Layers, badge: suitesCount },
    { id: 'runner', label: 'Test Runner', icon: Play },
    { id: 'generator', label: 'AI Test Generator', icon: Sparkles },
    { id: 'history', label: 'Runs & Reports', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">AI Regression Studio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Semantic Drift & Quality Regression Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Engine:</span>
              <span className="text-cyan-300 font-mono font-medium">gemini-3.8-flash</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <button
              onClick={onRunAll}
              disabled={isRunningAll}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                isRunningAll
                  ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/25 active:scale-95'
              }`}
            >
              {isRunningAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                  <span>Running All Suites...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Regression</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
