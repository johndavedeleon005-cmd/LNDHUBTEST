export interface TTSRequest {
  text: string;
  voice?: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';
  style?: string;
}

export interface TTSResponse {
  audio: string; // base64 WAV
  mimeType: string;
}

export class TTSService {
  private static currentAudio: HTMLAudioElement | null = null;
  private static audioUrl: string | null = null;

  static async generateSpeech(req: TTSRequest): Promise<string> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Speech generation failed' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    const data: TTSResponse = await res.json();
    return `data:${data.mimeType || 'audio/wav'};base64,${data.audio}`;
  }

  static stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  static playWebSpeechFallback(text: string, onEnd?: () => void): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.stopCurrentAudio();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 1000));
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (onEnd) utterance.onend = onEnd;
      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  }
}
