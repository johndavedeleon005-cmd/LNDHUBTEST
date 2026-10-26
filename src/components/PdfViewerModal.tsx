import React from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import { X, Lock, ExternalLink, FileText, ShieldAlert } from 'lucide-react';

interface PdfViewerModalProps {
  doc: FoodSafetyDoc | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ doc, onClose }) => {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col p-2 sm:p-4 animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl mx-auto flex-1 flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-red-400">
                  {doc.code}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {doc.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Strictly Confidential Internal Material • Rev {doc.revision}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download explicitly removed & replaced with Confidential badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs font-semibold select-none">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Protected Document</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confidential Watermark Bar */}
        <div className="bg-red-950/40 border-b border-red-900/40 px-4 py-1.5 text-center text-[10px] text-red-300 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>Confidential & Proprietary • Imperial Kitchen Group Inc. • Copying or distribution prohibited</span>
        </div>

        {/* PDF Frame with toolbar=0 to prevent browser download/print buttons */}
        <div
          className="flex-1 w-full bg-slate-950 relative"
          onContextMenu={(e) => e.preventDefault()}
        >
          <iframe
            src={`${doc.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={`PDF for ${doc.code}`}
          />
        </div>
      </div>
    </div>
  );
};
