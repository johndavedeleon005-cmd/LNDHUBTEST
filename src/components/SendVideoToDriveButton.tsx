import React, { useState } from 'react';
import { Cloud, CheckCircle2, ExternalLink, Download, Loader2, AlertCircle, Film } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            hint?: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string; hint?: string }) => void;
          };
        };
      };
    };
  }
}

interface SendVideoToDriveButtonProps {
  compact?: boolean;
  userEmailHint?: string;
}

const DRIVE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const VIDEO_ASSET_PATHS = [
  './assets/aistudio/TOP_FEATURES_SHOWCASE.mp4',
  '/assets/aistudio/TOP_FEATURES_SHOWCASE.mp4',
  './public/assets/aistudio/TOP_FEATURES_SHOWCASE.mp4',
];
const DRIVE_FILE_NAME = 'Jiangnan_Hotpot_LnD_Top_Features_Highlight.mp4';

let cachedAccessToken: string | null = null;
let cachedTokenExpiry = 0;

function ensureGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (window.google?.accounts?.oauth2) {
          clearInterval(timer);
          resolve();
        } else if (attempts > 40) {
          clearInterval(timer);
          reject(new Error('Google Identity Services script timed out while loading.'));
        }
      }, 150);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });
}

async function fetchHighlightVideoBlob(): Promise<Blob> {
  for (const url of VIDEO_ASSET_PATHS) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 1024) {
          return new Blob([blob], { type: 'video/mp4' });
        }
      }
    } catch {
      // try next path
    }
  }
  throw new Error('Could not load the generated Top Features Highlight MP4 video file.');
}

export const SendVideoToDriveButton: React.FC<SendVideoToDriveButtonProps> = ({
  compact = false,
  userEmailHint = 'johndavedeleon005@gmail.com',
}) => {
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'uploading' | 'success' | 'error'>('idle');
  const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
  const [driveFileName, setDriveFileName] = useState<string>(DRIVE_FILE_NAME);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadVideoWithToken = async (accessToken: string) => {
    setStatus('uploading');
    setErrorMessage(null);
    try {
      const videoBlob = await fetchHighlightVideoBlob();
      const metadata = {
        name: DRIVE_FILE_NAME,
        mimeType: 'video/mp4',
        description:
          'Imperial Kitchen Group Inc. & Jiangnan Hotpot — Official L&D Training Portal Top 6 Features Highlight Video (1280x720 HD MP4)',
      };

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', videoBlob, DRIVE_FILE_NAME);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          cachedAccessToken = null;
          cachedTokenExpiry = 0;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message || `Google Drive upload failed (HTTP ${res.status}).`
        );
      }

      const data = await res.json();
      const viewUrl =
        data.webViewLink ||
        (data.id ? `https://drive.google.com/file/d/${data.id}/view` : 'https://drive.google.com/drive/my-drive');

      setDriveFileName(data.name || DRIVE_FILE_NAME);
      setDriveFileLink(viewUrl);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to upload video to Google Drive.');
    }
  };

  const handleSendToGoogleDrive = async () => {
    setErrorMessage(null);

    if (cachedAccessToken && Date.now() < cachedTokenExpiry) {
      await uploadVideoWithToken(cachedAccessToken);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatus('error');
      setErrorMessage(
        'Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID) is not configured in this environment. You can still download the MP4 directly.'
      );
      return;
    }

    setStatus('authorizing');
    try {
      await ensureGoogleIdentityScript();
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) {
        throw new Error('Google OAuth client is unavailable in this browser.');
      }

      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_UPLOAD_SCOPE,
        hint: userEmailHint,
        callback: async (tokenResponse) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            setStatus('error');
            setErrorMessage(
              tokenResponse.error_description ||
                tokenResponse.error ||
                'Google Drive authorization was cancelled or declined.'
            );
            return;
          }
          cachedAccessToken = tokenResponse.access_token;
          cachedTokenExpiry = Date.now() + 50 * 60 * 1000;
          await uploadVideoWithToken(tokenResponse.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: '', hint: userEmailHint });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Could not start Google Drive authorization.');
    }
  };

  if (compact) {
    return (
      <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate">
                Top Features Highlight Video (MP4)
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                6-Chapter HD Showcase (Master Hub, Simulators, AI, TTS &amp; Certificates)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSendToGoogleDrive}
              disabled={status === 'authorizing' || status === 'uploading'}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              {status === 'authorizing' || status === 'uploading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {status === 'authorizing' ? 'Connecting Drive...' : 'Uploading to Drive...'}
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{status === 'success' ? 'Send Copy Again' : 'Send Video to Google Drive'}</span>
                </>
              )}
            </button>

            <a
              href="./assets/aistudio/TOP_FEATURES_SHOWCASE.mp4"
              download={DRIVE_FILE_NAME}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
              title="Download MP4 file directly"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>MP4</span>
            </a>
          </div>
        </div>

        {status === 'success' && driveFileLink && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Uploaded <code className="text-emerald-300 font-mono text-[11px]">{driveFileName}</code> to your Google Drive!
              </span>
            </div>
            <a
              href={driveFileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 hover:bg-emerald-400"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2 text-[11px] text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 p-4 space-y-3 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span>GOOGLE DRIVE DIRECT DELIVERY • NO IT HUB REPORTING</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white">
            Send Top Features Highlight Video (.MP4) to Your Google Drive
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Uploads <code className="text-amber-300 font-mono">{DRIVE_FILE_NAME}</code> (1280×720 HD MP4 covering SOP Library, Simulators, AI Support, Hands-Free Audio TTS, Single-Certificate Verification &amp; Master Admin Hub) directly to your Google Drive account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleSendToGoogleDrive}
            disabled={status === 'authorizing' || status === 'uploading'}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            {status === 'authorizing' || status === 'uploading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {status === 'authorizing'
                    ? 'Authorizing Google Drive...'
                    : 'Uploading Video to Google Drive...'}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>
                  {status === 'success' ? 'Upload Copy Again to Google Drive' : 'Send Video to My Google Drive'}
                </span>
              </>
            )}
          </button>

          <a
            href="./assets/aistudio/TOP_FEATURES_SHOWCASE.mp4"
            download={DRIVE_FILE_NAME}
            className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download MP4</span>
          </a>
        </div>
      </div>

      {status === 'success' && driveFileLink && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Successfully uploaded <strong>{driveFileName}</strong> to your Google Drive!
            </span>
          </div>
          <a
            href={driveFileLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow"
          >
            <span>Open Video in Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/60 flex items-start gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
