import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  Sparkles,
  Send,
  RotateCcw,
  User,
  Volume2,
  Flame,
  Zap,
  Pause,
  FileText,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TTSService } from '../services/ttsService';
import { generateLocalComplianceResponse } from '../services/localComplianceResponder';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
  modelUsed?: string;
}

interface ComplianceAssistantViewProps {
  activeDoc?: FoodSafetyDoc | null;
  documents?: FoodSafetyDoc[];
  onOpenDoc?: (docId: string) => void;
}

export const ComplianceAssistantView: React.FC<ComplianceAssistantViewProps> = ({
  activeDoc: initialActiveDoc,
  documents = [],
  onOpenDoc,
}) => {
  // Speed & Model Mode
  // 'fast': gemini-3.1-flash-lite (default for instant token streaming)
  // 'standard': gemini-3.8-flash
  // 'complex': gemini-4-argon
  const [speedMode, setSpeedMode] = useState<'fast' | 'standard' | 'complex'>('fast');

  // Currently focused document context ('all' or document id)
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialActiveDoc ? initialActiveDoc.id : 'all'
  );

  const activeDoc = useMemo(() => {
    if (selectedDocId === 'all') return null;
    return documents.find((d) => d.id === selectedDocId) || null;
  }, [selectedDocId, documents]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your **L&D Virtual Support** for **Jiangnan Hotpot / Imperial Kitchen Group Inc.**

⚡ **Speed Mode: Ultra-Fast Active (Gemini 3.1 Flash Lite)**
I cover **all 35 documents in file**:
* **1 Station Checklist:** JNLD-CHK-FOH-REC-001 (Receptionist Task Checklist, Version 2)
* **1 Regulatory Act Guide:** RA 10611 (Food Safety Act of 2013)
* **21 Company Policies:** IKQAP#001 through IKQAP#021
* **12 Standard Operating Procedures:** IKQA-SOP#001 through IKQA-SOP#012

Ask me any question about the Receptionist Task Checklist (greeting scripts, ₱899/₱999 package rates, birthday & senior promos, soup bases, leftover policy), RA 10611, food retention samples, handwashing double-wash, or temperature control!`,
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  // Quick suggestion prompts covering Station Checklists, SOPs, Policies, and Master-Uploaded Docs
  const customUploadedDocs = useMemo(() => documents.filter((d) => d.isCustom), [documents]);

  const quickPrompts = useMemo(() => {
    const customPrompts = customUploadedDocs.map((cd) => ({
      label: `NEW · ${cd.code}: ${cd.title.slice(0, 24)}`,
      query: `What are all the key rules, steps, and requirements in the Master-uploaded document ${cd.code} (${cd.title})?`,
    }));

    return [
      ...customPrompts,
      { label: 'REC-001 Receptionist Checklist', query: 'What are all 8 sections and scripts in the Receptionist Task Checklist JNLD-CHK-FOH-REC-001?' },
      { label: 'REC-001 Rates & Upgrades', query: 'What are the Weekday (₱899) and Weekend (₱999) package rates, Hotpot-only rates, and +₱200 Premium Meat upgrade rules for Receptionists?' },
      { label: 'REC-001 Birthday & Senior Promo', query: 'How do the Birthday Promo (4 vs 5 paying guests) and Senior Citizen / PWD 12% VAT deduction work in JNLD-CHK-FOH-REC-001?' },
      { label: 'REC-001 Soups, Leftover & Waiver', query: 'What are the soup base rules (Mushroom Soup non-pork), 3 meat plate initial limit, ₱1,000 leftover fee, and Outside Food Waiver rules?' },
      { label: 'SOP#001 Double Wash (40-60s)', query: 'What is the 40-60 second handwashing and Restroom Double Wash rule in IKQA-SOP#001?' },
      { label: 'SOP#011 Retention Samples', query: 'What are the daily food retention sample volumes and 5-7 day storage rules in IKQA-SOP#011?' },
      { label: 'SOP#012 Wire Slicer', query: 'How to use and sanitize the luncheon meat wire slicer in IKQA-SOP#012 and what to do if wire breaks?' },
      { label: 'SOP#004 FEFO vs FIFO', query: 'Explain FEFO precedence over FIFO and 48-hour near expiry handling in IKQA-SOP#004.' },
      { label: 'SOP#010 Towel Colors', query: 'What are the 5 towel colors and their strict designated areas in IKQAP#015 & IKQA-SOP#010?' },
      { label: 'IKQAP#003 15-Min Intake', query: 'What is the 15-minute cold chain intake rule in IKQAP#003?' },
    ];
  }, [customUploadedDocs]);

  useEffect(() => {
    if (initialActiveDoc) {
      setSelectedDocId(initialActiveDoc.id);
    }
  }, [initialActiveDoc]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
    };

    // Prepare multi-turn history from current messages
    const currentHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      isStreaming: true,
      modelUsed:
        speedMode === 'fast'
          ? 'gemini-3.1-flash-lite'
          : speedMode === 'standard'
          ? 'gemini-3.8-flash'
          : 'gemini-4-argon',
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setLoading(true);

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Use streaming SSE endpoint for instant token delivery
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: currentHistory,
          speedMode,
          customDocuments: customUploadedDocs,
          contextDocTitle: activeDoc ? `${activeDoc.code}: ${activeDoc.title}` : undefined,
          contextDocContent: activeDoc
            ? `${activeDoc.summary}\nTakeaways:\n${(activeDoc.keyTakeaways || []).join('\n')}\nRules:\n${(activeDoc.quickRules || []).map(r => `${r.title}: ${r.rule}`).join('\n')}\nSections:\n${(activeDoc.sections || []).map(s => `${s.title}: ${s.content}`).join('\n')}`
            : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No readable response body');
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
            if (rawData === '[DONE]') {
              break;
            }
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
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Streaming fetch failed, falling back to standard Q&A:', err);

      try {
        const fallbackRes = await fetch('/api/compliance-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            speedMode,
            customDocuments: customUploadedDocs,
            contextDocTitle: activeDoc ? `${activeDoc.code}: ${activeDoc.title}` : undefined,
            contextDocContent: activeDoc
              ? `${activeDoc.summary}\nTakeaways:\n${(activeDoc.keyTakeaways || []).join('\n')}\nRules:\n${(activeDoc.quickRules || []).map(r => `${r.title}: ${r.rule}`).join('\n')}`
              : undefined,
          }),
        });
        if (!fallbackRes.ok) throw new Error('Static host');
        const fallbackData = await fallbackRes.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: fallbackData.answer || generateLocalComplianceResponse(q, documents, activeDoc),
                  isStreaming: false,
                }
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

  // TTS audio playback for assistant messages
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

  const handleClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    TTSService.stopCurrentAudio();
    setPlayingMessageId(null);
    setLoading(false);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: `Chat reset. Ask me any question covering all 33 policies and SOPs for ultra-fast guidance!`,
      },
    ]);
  };

  // Helper to detect document citations and render clickable jump badges
  const renderTextWithDocCitations = (text: string) => {
    // Matches patterns like IKQAP#001, IKQA-SOP#011, SOP#004, etc.
    const regex = /(IKQA-SOP#\d{3}|IKQAP#\d{3}|SOP#\d{3})/g;
    const parts = text.split(regex);

    return parts.map((part, pIdx) => {
      const isDocCode = regex.test(part);
      if (isDocCode) {
        // Find matching doc
        const normalizedCode = part.startsWith('SOP#') ? `IKQA-${part}` : part;
        const matched = documents.find(
          (d) => d.code.toUpperCase() === normalizedCode.toUpperCase()
        );

        if (matched && onOpenDoc) {
          return (
            <button
              key={pIdx}
              onClick={() => onOpenDoc(matched.id)}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-800/80 text-[10px] font-mono font-bold transition-all shadow-sm active:scale-95 align-baseline"
              title={`Open ${matched.title}`}
            >
              <FileText className="w-2.5 h-2.5 text-amber-400" />
              <span>{part}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
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

      // Normal text with bold support
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

  // Render markdown text cleanly
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
          <h4 key={lIdx} className="text-xs sm:text-sm font-black text-red-300 mt-2.5 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-red-500 rounded-full inline-block" />
            <span>{titleText}</span>
          </h4>
        );
      }

      if (trimmed.startsWith('#### ')) {
        const subTitleText = trimmed.replace(/^####\s+/, '').replace(/\*\*/g, '');
        return (
          <h5 key={lIdx} className="text-[11px] sm:text-xs font-bold text-amber-300 mt-2 mb-1 flex items-center gap-1">
            <span className="w-1 h-2.5 bg-amber-500 rounded-sm inline-block" />
            <span>{subTitleText}</span>
          </h5>
        );
      }

      if (trimmed === '---') {
        return <hr key={lIdx} className="my-2 border-slate-800" />;
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

      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (match) {
          const num = match[1];
          const rest = match[2];
          return (
            <div key={lIdx} className="flex items-start gap-1.5 my-0.5 pl-1 text-slate-200">
              <span className="text-amber-400 font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                {num}
              </span>
              <span className="leading-relaxed">
                {renderTextWithDocCitations(rest)}
              </span>
            </div>
          );
        }
      }

      return (
        <p key={lIdx} className="text-xs text-slate-200 leading-relaxed my-0.5">
          {renderTextWithDocCitations(trimmed)}
        </p>
      );
    });
  };

  const checklistsList = useMemo(() => documents.filter((d) => d.type === 'checklist'), [documents]);
  const guidesList = useMemo(() => documents.filter((d) => d.type === 'guide'), [documents]);
  const policiesList = useMemo(() => documents.filter((d) => d.type === 'policy'), [documents]);
  const sopsList = useMemo(() => documents.filter((d) => d.type === 'sop'), [documents]);

  return (
    <div className="space-y-3 pb-12 animate-fadeIn flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Top Banner with Model & Speed Mode Selector */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-800/40 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-950/60 ring-1 ring-red-400/40 flex-shrink-0">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white tracking-tight">
                L&D Virtual Support
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {documents.length} Docs Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Covers Station Checklists, RA 10611, Policies, SOPs & Master-Uploaded Documents
            </p>
          </div>
        </div>

        {/* Speed / Model Selection Buttons & Clear Chat */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-end sm:self-auto text-xs">
          <button
            onClick={() => setSpeedMode('fast')}
            title="gemini-3.1-flash-lite: Lightning fast responses for busy kitchen operations"
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              speedMode === 'fast'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Fast (Flash Lite)</span>
          </button>

          <button
            onClick={() => setSpeedMode('standard')}
            title="gemini-3.8-flash: General tasks with full depth and references"
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              speedMode === 'standard'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Standard (3.8 Flash)</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1"
            title="Clear conversation history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scope Selector: Target specific document or all docs */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-[11px]">Context Scope:</span>
        </div>

        <div className="relative flex-1">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-2.5 py-1 border border-slate-700/80 focus:outline-none focus:border-red-500 pr-7 appearance-none cursor-pointer font-medium"
          >
            <option value="all">🌐 All {documents.length} Documents in File (Includes Master Uploads)</option>
            {customUploadedDocs.length > 0 && (
              <optgroup label={`Master-Uploaded Documents (${customUploadedDocs.length})`}>
                {customUploadedDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    [MASTER UPLOAD] {doc.code}: {doc.title}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={`Station Checklists (${checklistsList.length})`}>
              {checklistsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.code}: {doc.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`Standard Operating Procedures (${sopsList.length})`}>
              {sopsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.code}: {doc.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`Company Quality Policies (${policiesList.length})`}>
              {policiesList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.code}: {doc.title}
                </option>
              ))}
            </optgroup>
            {guidesList.length > 0 && (
              <optgroup label={`Regulatory & Operational Guides (${guidesList.length})`}>
                {guidesList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.code}: {doc.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {activeDoc && onOpenDoc && (
          <button
            onClick={() => onOpenDoc(activeDoc.id)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap border border-slate-700 transition-colors flex-shrink-0"
          >
            <FileText className="w-3 h-3 text-red-400" />
            <span>Open Doc</span>
          </button>
        )}
      </div>

      {/* Chat Messages Scrollable Thread */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 overflow-y-auto space-y-3 shadow-inner">
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
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 leading-relaxed text-xs shadow-md ${
                  isUser
                    ? 'bg-red-600 text-white font-medium rounded-tr-sm'
                    : 'bg-slate-950 border border-slate-800 rounded-tl-sm text-slate-200'
                }`}
              >
                {/* Message body */}
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <div>
                    {renderFormattedContent(m.text)}
                    {m.isStreaming && (
                      <span className="inline-block w-2 h-3.5 bg-red-400 animate-pulse ml-1 rounded-sm align-middle" />
                    )}
                  </div>
                )}

                {/* Footer bar on assistant messages */}
                {!isUser && m.text.length > 0 && !m.isStreaming && (
                  <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <button
                      onClick={() => handlePlayAudio(m)}
                      disabled={isAudioLoading}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all font-semibold active:scale-95 ${
                        isAudioPlaying
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {isAudioLoading ? (
                        <>
                          <RotateCcw className="w-3 h-3 animate-spin text-amber-400" />
                          <span>Generating voice...</span>
                        </>
                      ) : isAudioPlaying ? (
                        <>
                          <Pause className="w-3 h-3 fill-slate-950" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-amber-400" />
                          <span>Listen (TTS)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 inline" />
                      <span>{m.modelUsed || 'gemini-3.1-flash-lite'}</span>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 max-w-[240px]">
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="text-xs text-slate-300 font-medium">
              Generating instant answer...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips covering all 33 documents */}
      <div className="flex-shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.query)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-colors border border-slate-800 flex-shrink-0 shadow-sm"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 flex-shrink-0 shadow-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            activeDoc
              ? `Ask about ${activeDoc.code}: ${activeDoc.title}...`
              : 'Ask any question across all 33 documents in file...'
          }
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
