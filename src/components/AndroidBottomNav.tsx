import React from 'react';
import { BookOpen, Zap, Headphones, CheckSquare, Sparkles, Gamepad2, Crown } from 'lucide-react';

export type TabType = 'library' | 'quickref' | 'game' | 'audio' | 'audit' | 'assistant' | 'master';

interface AndroidBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isPlayingAudio?: boolean;
  totalDocsCount?: number;
  isMasterAccount?: boolean;
  pendingApprovalsCount?: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
  isPlayingAudio = false,
  totalDocsCount = 34,
  isMasterAccount = false,
  pendingApprovalsCount = 0,
}) => {
  const tabs = [
    {
      id: 'library' as TabType,
      label: 'Library',
      icon: BookOpen,
      badge: String(totalDocsCount),
    },
    {
      id: 'quickref' as TabType,
      label: 'Quick Ref',
      icon: Zap,
    },
    {
      id: 'game' as TabType,
      label: '8-Bit Game',
      icon: Gamepad2,
      badge: 'NEW',
    },
    {
      id: 'audio' as TabType,
      label: 'Audio TTS',
      icon: Headphones,
      activePulse: isPlayingAudio,
    },
    {
      id: 'audit' as TabType,
      label: 'Training',
      icon: CheckSquare,
    },
    {
      id: 'assistant' as TabType,
      label: 'L&D AI',
      icon: Sparkles,
      highlight: true,
    },
    ...(isMasterAccount
      ? [
          {
            id: 'master' as TabType,
            label: 'Master Hub',
            icon: Crown,
            badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : 'ADMIN',
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 min-w-0 py-1.5 px-0.5 flex flex-col items-center justify-center relative group active:scale-95 transition-transform cursor-pointer"
            >
              {/* Material 3 active pill indicator */}
              <div
                className={`relative px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? tab.id === 'master'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-inner'
                      : 'bg-red-500/20 text-red-400 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 group-hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? tab.id === 'master'
                        ? 'scale-110 text-amber-400'
                        : 'scale-110 text-red-400'
                      : tab.id === 'master'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  } ${tab.activePulse ? 'animate-bounce text-amber-400' : ''}`}
                />

                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] text-[9px] font-bold rounded-full flex items-center justify-center border border-slate-900 ${
                      tab.id === 'master'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {tab.activePulse && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight transition-colors whitespace-nowrap truncate max-w-full ${
                  isActive
                    ? tab.id === 'master'
                      ? 'text-amber-400 font-bold'
                      : 'text-red-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

