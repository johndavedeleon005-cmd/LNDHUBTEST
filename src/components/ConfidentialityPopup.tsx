import React, { useState } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import { ShieldAlert, Lock, CheckCircle2, AlertOctagon, X } from 'lucide-react';

interface ConfidentialityPopupProps {
  doc: FoodSafetyDoc | null;
  isOpen: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

export const ConfidentialityPopup: React.FC<ConfidentialityPopupProps> = ({
  doc,
  isOpen,
  onAgree,
  onCancel,
}) => {
  const [hasChecked, setHasChecked] = useState(false);

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-red-600/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(220,38,38,0.25)] relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Warning Banner */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                STRICTLY CONFIDENTIAL
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800/60">
                PROPRIETARY
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Non-Disclosure & Confidentiality Notice
            </h3>
          </div>
        </div>

        {/* Targeted Document Info */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">
              Viewing Document
            </span>
            <div className="text-xs font-bold text-white truncate">
              <span className="text-red-400 mr-1.5 font-mono">{doc.code}:</span>
              {doc.title}
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
            Rev {doc.revision}
          </span>
        </div>

        {/* Legal & Policy Terms */}
        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 max-h-48 overflow-y-auto">
          <p className="font-semibold text-slate-100">
            By viewing this document page, you acknowledge and agree that:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-300">
            <li>
              <strong className="text-white">Confidential Trade Secret:</strong> All standards, operational thresholds, formulations, matrices, and procedures of Imperial Kitchen Group Inc. and Jiangnan Hotpot are strictly confidential.
            </li>
            <li>
              <strong className="text-white">No Downloading or Copying:</strong> Downloading, copying, redistributing, photographing, screenshotting, or reproducing this original document is strictly prohibited.
            </li>
            <li>
              <strong className="text-white">Authorized Internal Use Only:</strong> Access is granted solely for your direct operational duties during active work shifts.
            </li>
            <li>
              <strong className="text-white">Disciplinary & Legal Action:</strong> Any unauthorized disclosure, distribution, or leak will result in immediate termination of employment and legal prosecution under the Philippine Intellectual Property Code and company regulations.
            </li>
          </ul>
        </div>

        {/* Required Confirmation Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/20 border border-red-900/40 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={hasChecked}
            onChange={(e) => setHasChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-red-600 bg-slate-900 border-slate-700 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-slate-200 group-hover:text-white leading-tight font-medium">
            I confirm that I am an authorized employee and I agree that all information on this page is strictly confidential.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel & Exit
          </button>

          <button
            type="button"
            disabled={!hasChecked}
            onClick={() => {
              if (hasChecked) onAgree();
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              hasChecked
                ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-950/60 ring-2 ring-red-500/50 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Agree & View Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
