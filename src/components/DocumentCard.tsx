import React from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import { Bookmark, FileText, Headphones, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

interface DocumentCardProps {
  doc: FoodSafetyDoc;
  onSelect: (doc: FoodSafetyDoc) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isRead: boolean;
  onQuickTTS: (doc: FoodSafetyDoc, e: React.MouseEvent) => void;
  onOpenPdf: (doc: FoodSafetyDoc, e: React.MouseEvent) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  isRead,
  onQuickTTS,
  onOpenPdf,
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Station Checklists':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'Temperature & Cold Chain':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/50';
      case 'Allergens & Health':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/50';
      case 'Sanitation & Pest':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50';
      case 'Receiving & Storage':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/50';
      case 'Uniform & Visitor':
        return 'bg-blue-950/70 text-blue-300 border-blue-800/50';
      case 'Operations & Maintenance':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onSelect(doc)}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-red-950/20 active:scale-[0.99]"
    >
      {/* Top Header Line */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800/60 shadow-sm">
            {doc.code}
          </span>
          {doc.type === 'checklist' && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-sm">
              Station Checklist
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryColor(
              doc.category
            )}`}
          >
            {doc.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            Rev {doc.revision}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Read status */}
          {isRead && (
            <span
              title="Acknowledged by staff"
              className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/50"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Read</span>
            </span>
          )}

          {/* Bookmark Button */}
          <button
            onClick={(e) => onToggleBookmark(doc.id, e)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for shift'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white group-hover:text-red-300 transition-colors line-clamp-1 mb-1.5 flex items-center justify-between">
        <span>{doc.title}</span>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </h3>

      {/* Summary Snippet */}
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {doc.summary}
      </p>

      {/* Quick Rule Callout if available */}
      {doc.quickRules && doc.quickRules.length > 0 && (
        <div className="mb-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2">
          <AlertTriangle
            className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              doc.quickRules[0].type === 'critical'
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          />
          <div className="text-[11px] leading-tight">
            <span className="font-semibold text-slate-300 mr-1">
              {doc.quickRules[0].title}:
            </span>
            <span className="text-slate-400">{doc.quickRules[0].rule}</span>
          </div>
        </div>
      )}

      {/* Bottom Bar: Action Shortcuts */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-[11px] text-slate-400">
          Effective: {doc.effectiveDate}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Quick TTS Audio */}
          <button
            onClick={(e) => onQuickTTS(doc, e)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
            title="Listen to policy with Gemini TTS"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Listen</span>
          </button>

          {/* Quick Original Doc - Locked */}
          <button
            onClick={(e) => onOpenPdf(doc, e)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 transition-colors text-[11px] font-semibold active:scale-95 shadow-sm"
            title="Locked: Actual document viewing is via store documents"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Original 🔒</span>
          </button>
        </div>
      </div>
    </div>
  );
};
