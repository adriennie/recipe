// Read-aloud built on the browser's speechSynthesis (iPhone uses its built-in Siri voices).

export interface VoiceSettings { voiceURI: string | null; rate: number }

const KEY = 'voice-settings';

export function loadVoiceSettings(): VoiceSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v.rate === 'number') return v;
  } catch { /* storage unavailable */ }
  return { voiceURI: null, rate: 1 };
}

export function saveVoiceSettings(v: VoiceSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported) return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

let voiceCache: SpeechSynthesisVoice[] = [];
getVoices().then((v) => (voiceCache = v));

/** iOS can cut off long utterances, so long text is spoken in sentence-sized pieces. */
function chunks(text: string): string[] {
  const parts = text.split(/(?<=[.!?;])\s+/);
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).length > 180 && cur) { out.push(cur); cur = p; }
    else cur = cur ? cur + ' ' + p : p;
  }
  if (cur) out.push(cur);
  return out;
}

export function speak(text: string, onEnd?: () => void) {
  if (!speechSupported) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const s = loadVoiceSettings();
  const voice = voiceCache.find((v) => v.voiceURI === s.voiceURI) ?? null;
  const pieces = chunks(text);
  pieces.forEach((piece, i) => {
    const u = new SpeechSynthesisUtterance(piece);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.rate = s.rate;
    if (i === pieces.length - 1 && onEnd) { u.onend = () => onEnd(); u.onerror = () => onEnd(); }
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSupported) speechSynthesis.cancel();
}
