// offscreen.js — Robust Continuous Voice Recognition Engine (Chrome MV3 Offscreen Document)
// This runs in a hidden offscreen document with real microphone access.
// Communicates with popup.js and background.js via chrome.runtime.sendMessage.

'use strict';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// State tracking
let activeRecognition = null;
let activeTarget = null;
let isJarvisVoiceActive = false; // Always listening mode for Jarvis
let jarvisVoiceLang = 'en-IN';
let isSpeaking = false;          // True while Jarvis / TTS is speaking to prevent self-echo
let restartTimeout = null;
let latestSpeechText = '';
let lastDispatchedText = '';
let lastDispatchedTime = 0;
let speechDebounceTimer = null;

// Language display name → BCP-47 code map
const LANG_CODE_MAP = {
  'english': 'en-IN', 'hindi': 'hi-IN', 'bengali': 'bn-IN',
  'telugu': 'te-IN', 'tamil': 'ta-IN', 'marathi': 'mr-IN',
  'gujarati': 'gu-IN', 'kannada': 'kn-IN', 'malayalam': 'ml-IN',
  'punjabi': 'pa-IN', 'urdu': 'ur-PK', 'spanish': 'es-ES',
  'french': 'fr-FR', 'german': 'de-DE', 'japanese': 'ja-JP',
  'chinese': 'zh-CN', 'arabic': 'ar-SA', 'russian': 'ru-RU',
  'portuguese': 'pt-BR', 'italian': 'it-IT', 'korean': 'ko-KR'
};

function getLangCode(displayLang) {
  return LANG_CODE_MAP[(displayLang || 'english').toLowerCase()] || 'en-IN';
}

function clearDebounce() {
  if (speechDebounceTimer) {
    clearTimeout(speechDebounceTimer);
    speechDebounceTimer = null;
  }
}

function stopRecognition(abort = true) {
  clearDebounce();
  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }
  if (activeRecognition) {
    const rec = activeRecognition;
    activeRecognition = null;
    try {
      if (abort) rec.abort();
      else rec.stop();
    } catch (_) {}
  }
}

function scheduleRestart(delayMs = 300) {
  if (!isJarvisVoiceActive || isSpeaking) return;
  if (restartTimeout) clearTimeout(restartTimeout);
  restartTimeout = setTimeout(() => {
    restartTimeout = null;
    if (isJarvisVoiceActive && !isSpeaking && !activeRecognition) {
      startRecognition(jarvisVoiceLang, 'jarvis');
    }
  }, delayMs);
}

function dispatchFinalSpeech(rawText, target) {
  clearDebounce();
  const cleanText = (rawText || '').trim();
  if (!cleanText) return;

  // Ignore if speech is recognized while Jarvis is actively speaking its own reply
  if (isSpeaking) {
    console.log('[Offscreen Voice] 🔇 Suppressed speech during active Jarvis reply:', cleanText);
    return;
  }

  const now = Date.now();
  if (cleanText.toLowerCase() === lastDispatchedText.toLowerCase() && (now - lastDispatchedTime) < 2000) {
    return; // Deduplicate rapid duplicate trigger
  }

  lastDispatchedText = cleanText;
  lastDispatchedTime = now;
  latestSpeechText = '';

  console.log('[Offscreen Voice] 🚀 Dispatching VOICE_FINAL:', cleanText, 'target:', target);
  chrome.runtime.sendMessage({
    action: 'VOICE_FINAL',
    target: target || 'jarvis',
    text: cleanText
  }).catch(() => {});

  // For continuous Jarvis listening, flush audio buffer cleanly so next cycle is fresh
  if (isJarvisVoiceActive) {
    setTimeout(() => {
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch (_) {}
      }
    }, 250);
  }
}

// Hardware audio stream with Auto Gain Control (vital for catching soft/quiet voices)
let micStream = null;
async function warmUpMicrophone() {
  if (micStream && micStream.active) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,    // Amplifies low / soft / whisper voices automatically
        echoCancellation: true,   // Cancels speaker feedback
        noiseSuppression: false   // Prevents clipping soft whispers and quiet speech
      }
    });
    console.log('[Offscreen Voice] 🎙️ High-sensitivity AutoGainControl microphone active.');
  } catch (e) {
    console.warn('[Offscreen Voice] Mic stream warm-up notice:', e);
  }
}

function startRecognition(lang, target = 'jarvis') {
  stopRecognition(true);
  warmUpMicrophone().catch(() => {});

  if (!SpeechRecognitionAPI) {
    chrome.runtime.sendMessage({
      action: 'VOICE_RESULT',
      target,
      error: 'not-supported',
      errorMsg: 'Speech Recognition is not supported in this browser.'
    }).catch(() => {});
    return;
  }

  activeTarget = target;
  const isContinuous = (target === 'jarvis' || target === 'background_jarvis' || isJarvisVoiceActive);
  if (isContinuous) {
    isJarvisVoiceActive = true;
    jarvisVoiceLang = lang || jarvisVoiceLang || 'en-IN';
  }

  const recognition = new SpeechRecognitionAPI();
  activeRecognition = recognition;

  recognition.lang = getLangCode(lang);
  recognition.continuous = isContinuous;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    chrome.runtime.sendMessage({ action: 'VOICE_STARTED', target }).catch(() => {});
  };

  recognition.onresult = (event) => {
    if (isSpeaking) return; // Muted while Jarvis speaks response

    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      let bestTranscript = res[0].transcript;

      // When soft speech has multiple acoustic alternatives, prioritize known command intents
      if (res.length > 1) {
        const INTENT_WORDS = [
          'youtube', 'video', 'play', 'pause', 'stop', 'roko', 'chalu', 'kholo', 'close', 'open',
          'tab', 'google', 'whatsapp', 'volume', 'awaaz', 'scroll', 'next', 'previous', 'zoom',
          'naya tab', 'website'
        ];
        for (let a = 0; a < res.length; a++) {
          const cand = (res[a].transcript || '').toLowerCase();
          if (INTENT_WORDS.some(w => cand.includes(w))) {
            bestTranscript = res[a].transcript;
            break;
          }
        }
      }

      if (res.isFinal) {
        final += bestTranscript;
      } else {
        interim += bestTranscript;
      }
    }

    const currentText = (final || interim || '').trim();
    if (currentText) {
      latestSpeechText = currentText;
    }

    if (interim) {
      chrome.runtime.sendMessage({ action: 'VOICE_INTERIM', target, text: interim }).catch(() => {});

      // Smart Debounce Timer: Wait 950ms of silence so soft speech with pauses isn't cut off
      clearDebounce();
      speechDebounceTimer = setTimeout(() => {
        if (latestSpeechText && latestSpeechText.length > 1) {
          dispatchFinalSpeech(latestSpeechText, target);
        }
      }, 950);
    }

    if (final) {
      dispatchFinalSpeech(final, target);
    }
  };

  recognition.onerror = (event) => {
    clearDebounce();
    console.warn('[Offscreen Voice] Voice error:', event.error, 'target:', target);

    // 'no-speech' is completely normal in continuous listening when room is quiet — don't panic or stop
    if (event.error === 'no-speech') {
      if (isContinuous && isJarvisVoiceActive) {
        scheduleRestart(200);
      }
      return;
    }

    if (event.error === 'aborted') {
      return;
    }

    if (event.error === 'not-allowed') {
      isJarvisVoiceActive = false;
      chrome.runtime.sendMessage({
        action: 'VOICE_RESULT',
        target,
        error: 'not-allowed',
        errorMsg: 'Microphone access denied. Please allow mic in extension settings.'
      }).catch(() => {});
      return;
    }

    // Recoverable errors (network, audio-capture)
    if (isContinuous && isJarvisVoiceActive) {
      scheduleRestart(800);
      return;
    }

    const errorMessages = {
      'audio-capture': 'No microphone found. Please connect a mic.',
      'network':       'Network error during voice recognition.'
    };
    chrome.runtime.sendMessage({
      action: 'VOICE_RESULT',
      target,
      error: event.error,
      errorMsg: errorMessages[event.error] || `Voice error: ${event.error}`
    }).catch(() => {});
  };

  recognition.onend = () => {
    clearDebounce();
    activeRecognition = null;
    chrome.runtime.sendMessage({ action: 'VOICE_ENDED', target }).catch(() => {});

    // Seamless auto-restart if always-listening is active and not currently speaking
    if (isContinuous && isJarvisVoiceActive && !isSpeaking) {
      scheduleRestart(300);
    }
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('[Offscreen Voice] recognition.start error:', err);
    activeRecognition = null;
    if (isContinuous && isJarvisVoiceActive) {
      scheduleRestart(500);
    } else {
      chrome.runtime.sendMessage({
        action: 'VOICE_RESULT',
        target,
        error: 'start-failed',
        errorMsg: 'Could not start voice recognition. Please try again.'
      }).catch(() => {});
    }
  }
}

// Listen for messages from background.js and popup.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'START_BACKGROUND_JARVIS' || (message.action === 'START_OFFSCREEN_VOICE' && (message.target === 'jarvis' || message.target === 'background_jarvis'))) {
    isJarvisVoiceActive = true;
    jarvisVoiceLang = message.lang || 'English';
    startRecognition(jarvisVoiceLang, 'jarvis');
  } else if (message.action === 'STOP_BACKGROUND_JARVIS' || (message.action === 'STOP_OFFSCREEN_VOICE' && (message.target === 'jarvis' || message.target === 'background_jarvis'))) {
    isJarvisVoiceActive = false;
    stopRecognition(true);
    chrome.runtime.sendMessage({ action: 'VOICE_ENDED', target: 'jarvis' }).catch(() => {});
  } else if (message.action === 'START_OFFSCREEN_VOICE') {
    // Single-shot targets like 'chat' or 'translate'
    isJarvisVoiceActive = false;
    startRecognition(message.lang, message.target);
  } else if (message.action === 'STOP_OFFSCREEN_VOICE') {
    stopRecognition(true);
    chrome.runtime.sendMessage({ action: 'VOICE_ENDED', target: message.target }).catch(() => {});
  } else if (message.action === 'JARVIS_SPEAKING_START') {
    // Mute microphone while Jarvis responds to avoid hearing itself
    isSpeaking = true;
    clearDebounce();
    if (activeRecognition) {
      try { activeRecognition.stop(); } catch (_) {}
    }
    const dur = Math.max(1200, Number(message.duration) || 3500);
    setTimeout(() => {
      if (isSpeaking) {
        isSpeaking = false;
        if (isJarvisVoiceActive && !activeRecognition) {
          scheduleRestart(300);
        }
      }
    }, dur + 300);
  } else if (message.action === 'JARVIS_SPEAKING_END') {
    isSpeaking = false;
    if (isJarvisVoiceActive && !activeRecognition) {
      scheduleRestart(300);
    }
  }
});

// Watchdog: Periodically guarantees continuous listening stays alive
setInterval(() => {
  if (isJarvisVoiceActive && !activeRecognition && !isSpeaking) {
    console.log('[Offscreen Voice] 🔄 Watchdog reviving voice recognition...');
    startRecognition(jarvisVoiceLang, 'jarvis');
  }
}, 2500);
