import React from 'react';
import {
  BookOpen,
  Zap,
  Headphones,
  CheckSquare,
  Sparkles,
  Gamepad2,
  Crown,
  Cpu,
} from 'lucide-react';
import { ItFeatureFlags } from '../types/foodSafety';

export type TabType =
  | 'library'
  | 'quickref'
  | 'game'
  | 'audio'
  | 'audit'
  | 'assistant'
  | 'master'
  | 'it';

interface AndroidBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isPlayingAudio?: boolean;
  totalDocsCount?: number;
  isMasterAccount?: boolean;
  isItAccount?: boolean;
  pendingApprovalsCount?: number;
  featureFlags?: ItFeatureFlags;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
  isPlayingAudio = false,
  totalDocsCount = 34,
  isMasterAccount = false,
  isItAccount = false,
  pendingApprovalsCount = 0,
  featureFlags,
}) => {
  const showQuickRef = featureFlags ? featureFlags.enableQuickReferenceTab : true;
  const showGames = featureFlags ? featureFlags.enableTrainingGamesTab : true;
  const showAudio = featureFlags ? featureFlags.enableAudioTtsTab : true;
  const showAudit = featureFlags ? featureFlags.enableTrainingQuizTab : true;
  const showAssistant = featureFlags ? featureFlags.enableAiAssistant : true;

  const tabs = [
    {
      id: 'library' as TabType,
      label: 'Library',
      icon: BookOpen,
      badge: String(totalDocsCount),
    },
    ...(showQuickRef
      ? [
          {
            id: 'quickref' as TabType,
            label: 'Quick Ref',
            icon: Zap,
          },
        ]
      : []),
    ...(showGames
      ? [
          {
            id: 'game' as TabType,
            label: '8-Bit Game',
            icon: Gamepad2,
            badge: 'NEW',
          },
        ]
      : []),
    ...(showAudio
      ? [
          {
            id: 'audio' as TabType,
            label: 'Audio TTS',
            icon: Headphones,
            activePulse: isPlayingAudio,
          },
        ]
      : []),
    ...(showAudit
      ? [
          {
            id: 'audit' as TabType,
            label: 'Training',
            icon: CheckSquare,
          },
        ]
      : []),
    ...(showAssistant
      ? [
          {
            id: 'assistant' as TabType,
            label: 'L&D AI',
            icon: Sparkles,
            highlight: true,
          },
        ]
      : []),
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
    ...(isItAccount || isMasterAccount
      ? [
          {
            id: 'it' as TabType,
            label: 'IT Hub',
            icon: Cpu,
            badge: 'IT',
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1 max-w-2xl mx-auto overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isMasterTab = tab.id === 'master';
          const isItTab = tab.id === 'it';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[54px] py-1.5 px-0.5 flex flex-col items-center justify-center relative group active:scale-95 transition-transform cursor-pointer ${
                isMasterTab
                  ? 'bg-amber-500/5 rounded-xl border border-amber-500/30 mx-0.5'
                  : isItTab
                  ? 'bg-cyan-500/5 rounded-xl border border-cyan-500/30 mx-0.5'
                  : ''
              }`}
            >
              {/* Material 3 active pill indicator */}
              <div
                className={`relative px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? isMasterTab
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : isItTab
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                      : 'bg-red-500/20 text-red-400 font-semibold shadow-inner'
                    : isMasterTab
                    ? 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30'
                    : isItTab
                    ? 'bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 group-hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? isMasterTab || isItTab
                        ? 'scale-110 text-slate-950'
                        : 'scale-110 text-red-400'
                      : isMasterTab
                      ? 'text-amber-400'
                      : isItTab
                      ? 'text-cyan-300'
                      : 'text-slate-400'
                  } ${tab.activePulse ? 'animate-bounce text-amber-400' : ''}`}
                />

                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] text-[9px] font-bold rounded-full flex items-center justify-center border border-slate-900 ${
                      isMasterTab
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : isItTab
                        ? 'bg-cyan-400 text-slate-950 font-black'
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
                    ? isMasterTab
                      ? 'text-amber-300 font-black'
                      : isItTab
                      ? 'text-cyan-300 font-black'
                      : 'text-red-400 font-bold'
                    : isMasterTab
                    ? 'text-amber-300 font-bold'
                    : isItTab
                    ? 'text-cyan-300 font-bold'
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


