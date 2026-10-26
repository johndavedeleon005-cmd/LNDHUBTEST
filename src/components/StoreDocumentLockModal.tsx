import React from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import { Lock, ShieldAlert, Store, AlertCircle, X, BookOpen, Check } from 'lucide-react';

interface StoreDocumentLockModalProps {
  isOpen: boolean;
  doc: FoodSafetyDoc | null;
  onClose: () => void;
  onReadDigitalText?: () => void;
}

export const StoreDocumentLockModal: React.FC<StoreDocumentLockModalProps> = ({
  isOpen,
  doc,
  onClose,
  onReadDigitalText,
}) => {
  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(217,119,6,0.25)] relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Lock badge */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/30">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Feature Restricted
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                  Controlled Access
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight">
                Original Document Locked
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary User-Requested Prompt Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-2 border-amber-500/60 text-center space-y-1.5 shadow-inner">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 text-[10px] font-bold border border-amber-700/60">
            <Store className="w-3 h-3 text-amber-400" />
            <span>Store Policy Notice</span>
          </div>
          <h4 className="text-sm sm:text-base font-black text-amber-300 leading-snug">
            &ldquo;Actual document viewing is via store documents&rdquo;
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            Official signed and controlled original copies are restricted to physical on-site store compliance binders.
          </p>
        </div>

        {/* Targeted Document Details */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">
            Requested Document
          </span>
          <div className="text-xs font-bold text-white flex items-center justify-between gap-2">
            <span className="text-red-400 font-mono">{doc.code}:</span>
            <span className="truncate flex-1">{doc.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Rev {doc.revision}
            </span>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 space-y-1">
              <p>
                <strong className="text-white">Store Copy Procedure:</strong> To view the stamped, signed original document, please request the physical <strong>Imperial Kitchen Quality Assurance Compliance Binder</strong> from your Store Manager or Shift Supervisor.
              </p>
              <p className="text-slate-400">
                You can continue to read the complete text, rules, and take the qualification quiz inside this portal.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center justify-end gap-2">
          {onReadDigitalText && (
            <button
              onClick={() => {
                onClose();
                onReadDigitalText();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-red-400" />
              <span>Read Policy Text</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Understood</span>
          </button>
        </div>
      </div>
    </div>
  );
};
