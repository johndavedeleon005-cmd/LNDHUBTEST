import React, { useState, useRef, useEffect } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  User,
  Volume2,
  Flame,
  Pause,
  FileText,
  Zap,
} from 'lucide-react';
import { TTSService } from '../services/ttsService';
import { generateLocalComplianceResponse } from '../services/localComplianceResponder';

interface ComplianceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDoc?: FoodSafetyDoc | null;
  documents?: FoodSafetyDoc[];
  onOpenDoc?: (docId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

export const ComplianceAssistantModal: React.FC<ComplianceAssistantModalProps> = ({
  isOpen,
  onClose,
  activeDoc,
  documents = [],
  onOpenDoc,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your **L&D Virtual Support** for **Jiangnan Hotpot / Imperial Kitchen Group Inc.**

I am fully grounded across all **35 official documents in file** (Station Checklist **JNLD-CHK-FOH-REC-001**, RA 10611, 21 Policies: IKQAP#001-#021 & 12 SOPs: IKQA-SOP#001-#012). 

${activeDoc ? `Currently viewing: **${activeDoc.code}: ${activeDoc.title}**` : 'Ask any question about the Receptionist Task Checklist, package rates, birthday/senior promos, temperatures, handwashing, or towel codes.'}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      TTSService.stopCurrentAudio();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const customUploadedDocs = documents.filter((d) => d.isCustom);

  const quickPrompts = [
    ...customUploadedDocs.map((cd) => `${cd.code}: ${cd.title}`),
    'JNLD-CHK-FOH-REC-001: Receptionist Task Checklist & scripts',
    'Receptionist: Weekday (₱899) vs Weekend (₱999) & Hotpot-only rates',
    'Receptionist: Birthday promo (4 vs 5 pax) & Senior 12% VAT rule',
    'SOP#001: 40-60s Handwashing & Restroom Double Wash',
    'SOP#011: Retention sample rules (100-150mL, 5-7 days)',
    'IKQAP#003: 15-Minute cold chain rule',
    'IKQA-SOP#010: Cutting boards & towel colors',
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: q };
    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Use streaming SSE endpoint for instant token delivery
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          speedMode: 'fast',
          customDocuments: customUploadedDocs,
          contextDocTitle: activeDoc ? `${activeDoc.code}: ${activeDoc.title}` : undefined,
          contextDocContent: activeDoc
            ? `${activeDoc.summary}\n${activeDoc.keyTakeaways.join('\n')}`
            : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      if (!res.body) {
        throw new Error('No body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (rawData === '[DONE]') break;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      try {
        const fbRes = await fetch('/api/compliance-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            customDocuments: customUploadedDocs,
            contextDocTitle: activeDoc ? `${activeDoc.code}: ${activeDoc.title}` : undefined,
            contextDocContent: activeDoc
              ? `${activeDoc.summary}\n${activeDoc.keyTakeaways.join('\n')}`
              : undefined,
          }),
        });
        if (!fbRes.ok) throw new Error('Static host');
        const fbData = await fbRes.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: fbData.answer || generateLocalComplianceResponse(q, documents, activeDoc), isStreaming: false }
              : m
          )
        );
      } catch {
        const localAnswer = generateLocalComplianceResponse(q, documents, activeDoc);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: localAnswer,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handlePlayAudio = async (msg: Message) => {
    if (playingMessageId === msg.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingMessageId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    TTSService.stopCurrentAudio();

    setAudioLoadingId(msg.id);

    const cleanSpeechText = msg.text
      .replace(/[#*_`]/g, '')
      .replace(/⚠️/g, 'Warning: ')
      .replace(/❄️|🧊|🔥|⚪|🟡|🔵|🟢|🟤|🔴|🟠/g, '')
      .slice(0, 1500);

    try {
      const audioUrl = await TTSService.generateSpeech({
        text: cleanSpeechText,
        voice: 'Kore',
        style: 'Clear, authoritative, and helpful food safety compliance officer',
      });

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
      };

      audio.onerror = () => {
        setPlayingMessageId(null);
        TTSService.playWebSpeechFallback(cleanSpeechText, () => setPlayingMessageId(null));
      };

      await audio.play();
      setPlayingMessageId(msg.id);
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to Web Speech API:', err);
      const fallbackSuccess = TTSService.playWebSpeechFallback(cleanSpeechText, () =>
        setPlayingMessageId(null)
      );
      if (fallbackSuccess) {
        setPlayingMessageId(msg.id);
      }
    } finally {
      setAudioLoadingId(null);
    }
  };

  const renderTextWithDocCitations = (text: string) => {
    const regex = /(IKQA-SOP#\d{3}|IKQAP#\d{3}|SOP#\d{3})/g;
    const parts = text.split(regex);

    return parts.map((part, pIdx) => {
      const isDocCode = regex.test(part);
      if (isDocCode) {
        const normalizedCode = part.startsWith('SOP#') ? `IKQA-${part}` : part;
        const matched = documents.find(
          (d) => d.code.toUpperCase() === normalizedCode.toUpperCase()
        );

        if (matched && onOpenDoc) {
          return (
            <button
              key={pIdx}
              onClick={() => {
                onOpenDoc(matched.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-800/80 text-[10px] font-mono font-bold transition-all shadow-sm active:scale-95 align-baseline"
              title={`Open ${matched.title}`}
            >
              <FileText className="w-2.5 h-2.5 text-amber-400" />
              <span>{part}</span>
            </button>
          );
        }

        return (
          <span
            key={pIdx}
            className="inline-block mx-0.5 px-1 py-0.2 rounded bg-slate-900 text-amber-300 font-mono font-bold text-[10px] border border-slate-800"
          >
            {part}
          </span>
        );
      }

      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={pIdx}>
          {boldParts.map((bp, bpIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return (
                <strong key={bpIdx} className="text-white font-bold">
                  {bp.slice(2, -2)}
                </strong>
              );
            }
            return bp;
          })}
        </span>
      );
    });
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lIdx} className="h-1" />;
      }

      if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
        return (
          <h4 key={lIdx} className="text-xs sm:text-sm font-black text-red-300 mt-2 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-red-500 rounded-full inline-block" />
            <span>{titleText}</span>
          </h4>
        );
      }

      if (trimmed.startsWith('#### ')) {
        const subTitleText = trimmed.replace(/^####\s+/, '').replace(/\*\*/g, '');
        return (
          <h5 key={lIdx} className="text-[11px] font-bold text-amber-300 mt-1.5 mb-1 flex items-center gap-1">
            <span className="w-1 h-2 bg-amber-500 rounded-sm inline-block" />
            <span>{subTitleText}</span>
          </h5>
        );
      }

      if (trimmed === '---') {
        return <hr key={lIdx} className="my-1.5 border-slate-800" />;
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemText = trimmed.replace(/^[\*\-]\s+/, '');
        return (
          <div key={lIdx} className="flex items-start gap-1.5 my-0.5 pl-1 text-slate-200">
            <span className="text-red-400 font-bold mt-0.5">•</span>
            <span className="leading-relaxed">
              {renderTextWithDocCitations(itemText)}
            </span>
          </div>
        );
      }

      return (
        <p key={lIdx} className="text-xs text-slate-200 leading-relaxed my-0.5">
          {renderTextWithDocCitations(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg h-[85vh] max-h-[640px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>L&D Virtual Support</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-950 text-red-300 border border-red-800/60 font-mono">
                  34 Docs
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {activeDoc ? `Context: ${activeDoc.code}` : 'Covering RA 10611, 21 Policies & 12 SOPs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isAudioPlaying = playingMessageId === m.id;
            const isAudioLoading = audioLoadingId === m.id;

            return (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Flame className="w-3 h-3 text-red-400 fill-red-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-2.5 leading-relaxed text-xs shadow-md ${
                    isUser
                      ? 'bg-red-600 text-white font-medium rounded-tr-sm'
                      : 'bg-slate-950 border border-slate-800 rounded-tl-sm text-slate-200'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <div>
                      {renderFormattedContent(m.text)}
                      {m.isStreaming && (
                        <span className="inline-block w-1.5 h-3 bg-red-400 animate-pulse ml-1 rounded-sm align-middle" />
                      )}
                    </div>
                  )}

                  {!isUser && m.text.length > 0 && !m.isStreaming && (
                    <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <button
                        onClick={() => handlePlayAudio(m)}
                        disabled={isAudioLoading}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all font-semibold ${
                          isAudioPlaying
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {isAudioLoading ? (
                          <>
                            <RotateCcw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                            <span>Voice...</span>
                          </>
                        ) : isAudioPlaying ? (
                          <>
                            <Pause className="w-2.5 h-2.5 fill-slate-950" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-300">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800 max-w-[200px]">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="text-[11px] text-slate-300 font-medium">Answering...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] whitespace-nowrap transition-colors border border-slate-800 flex-shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about retention samples, wire slicer, cold chain..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
