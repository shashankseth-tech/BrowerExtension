// Universal AI Explainer - In-page Overlay Content Script
// Injected into webpages to display explanations in an encapsulated Shadow DOM card
// Features: Interactive Animated Avatar, Indian English Voice Synthesis, Multilingual Translator

(function () {
  // Prevent duplicate initialization
  if (window.__universalAiExplainerInjected) return;
  window.__universalAiExplainerInjected = true;

  const SHADOW_HOST_ID = 'universal-ai-explainer-root';
  let shadowHost = null;
  let shadowRoot = null;
  let currentCard = null;
  let floatingBtn = null;
  let dragCleanups = [];

  // Speech & Voice State
  let isSpeaking = false;
  let speechKeepAliveTimer = null;
  let cachedVoices = [];
  let currentCardData = null; // { originalExplanation, originalKeyPoints, currentExplanation, currentKeyPoints, currentLanguage, voiceAccent, type }
  let translationCache = {}; // { [langName]: { explanation, key_points } }
  let lastExplainRequest = null; // stores last { text, type, theme, targetLanguage, voiceAccent, pageUrl } for retry
  let currentMentorPersona = 'maya';
  let currentAvatarSkin = 'classic';
  let autoExplainTimer = null;

  const PERSONA_CONFIGS = {
    maya: {
      name: 'Maya',
      role: 'AI Mentor',
      badge: 'Maya • AI Mentor',
      bubbleIntro: 'Breaking down complex concepts with clear analogies...'
    },
    rao: {
      name: 'Prof. Rao',
      role: 'Scholar & Academic',
      badge: 'Prof. Rao • Academic',
      bubbleIntro: 'Examining academic foundations and rigorous principles...'
    },
    priya: {
      name: 'Priya',
      role: 'Senior Staff Architect',
      badge: 'Priya • Staff Architect',
      bubbleIntro: 'Dissecting production trade-offs, architecture & edge cases...'
    },
    eli5: {
      name: 'ELI5 Buddy',
      role: 'Playground Guide',
      badge: 'ELI5 Buddy • Playground',
      bubbleIntro: 'Making big grown-up concepts super fun, friendly, and easy!'
    }
  };

  function getPersonaInfo(persona) {
    return PERSONA_CONFIGS[persona] || PERSONA_CONFIGS[currentMentorPersona] || PERSONA_CONFIGS.maya;
  }

  // Language to Speech Synthesis Code Map
  const LANGUAGE_CODE_MAP = {
    'english': 'en-IN',
    'hindi': 'hi-IN',
    'bengali': 'bn-IN',
    'telugu': 'te-IN',
    'tamil': 'ta-IN',
    'marathi': 'mr-IN',
    'gujarati': 'gu-IN',
    'kannada': 'kn-IN',
    'malayalam': 'ml-IN',
    'punjabi': 'pa-IN',
    'urdu': 'ur-PK',
    'spanish': 'es-ES',
    'french': 'fr-FR',
    'german': 'de-DE',
    'japanese': 'ja-JP',
    'chinese': 'zh-CN',
    'arabic': 'ar-SA',
    'russian': 'ru-RU',
    'portuguese': 'pt-BR',
    'italian': 'it-IT',
    'korean': 'ko-KR',
    'dutch': 'nl-NL',
    'turkish': 'tr-TR',
    'indonesian': 'id-ID'
  };

  const POPULAR_LANGUAGES = [
    { name: 'Original', code: 'en-IN', flag: '✨' },
    { name: 'Hindi', code: 'hi-IN', flag: '🇮🇳' },
    { name: 'Spanish', code: 'es-ES', flag: '🇪🇸' },
    { name: 'French', code: 'fr-FR', flag: '🇫🇷' }
  ];

  const ALL_LANGUAGES = [
    { name: 'Original (English)', val: 'Original' },
    { name: 'Hindi (हिन्दी)', val: 'Hindi' },
    { name: 'Bengali (বাংলা)', val: 'Bengali' },
    { name: 'Telugu (తెలుగు)', val: 'Telugu' },
    { name: 'Tamil (தமிழ்)', val: 'Tamil' },
    { name: 'Marathi (मराठी)', val: 'Marathi' },
    { name: 'Gujarati (ગુજરાતી)', val: 'Gujarati' },
    { name: 'Kannada (ಕನ್ನಡ)', val: 'Kannada' },
    { name: 'Malayalam (മലയാളം)', val: 'Malayalam' },
    { name: 'Punjabi (ਪੰਜਾਬੀ)', val: 'Punjabi' },
    { name: 'Urdu (اردو)', val: 'Urdu' },
    { name: 'Spanish (Español)', val: 'Spanish' },
    { name: 'French (Français)', val: 'French' },
    { name: 'German (Deutsch)', val: 'German' },
    { name: 'Japanese (日本語)', val: 'Japanese' },
    { name: 'Chinese (中文)', val: 'Chinese' },
    { name: 'Arabic (العربية)', val: 'Arabic' },
    { name: 'Russian (Русский)', val: 'Russian' },
    { name: 'Portuguese (Português)', val: 'Portuguese' },
    { name: 'Italian (Italiano)', val: 'Italian' },
    { name: 'Korean (한국어)', val: 'Korean' }
  ];

  function loadSpeechVoices() {
    if ('speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  if ('speechSynthesis' in window) {
    loadSpeechVoices();
    window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
  }

  /**
   * Finds the best matching voice, prioritizing Indian English for English text
   */
  function findBestVoice(langCode, voiceAccent = 'en-IN') {
    if (!cachedVoices.length) loadSpeechVoices();
    const targetCode = (langCode || 'en-IN').toLowerCase().replace('_', '-');

    if (targetCode.startsWith('en')) {
      const accent = (voiceAccent || 'en-IN').toLowerCase();
      // 1. Check exact accent match
      const exact = cachedVoices.find(v => v.lang.toLowerCase().replace('_', '-') === accent);
      if (exact) return exact;

      // 2. If en-IN requested, search by voice names known for Indian accent
      if (accent.includes('in')) {
        const indianVoice = cachedVoices.find(v => {
          const name = v.name.toLowerCase();
          return (name.includes('india') || name.includes('neerja') || name.includes('heera') ||
                  name.includes('ravi') || name.includes('prabhat') || name.includes('veena')) &&
                  v.lang.toLowerCase().startsWith('en');
        });
        if (indianVoice) return indianVoice;
      }

      // 3. Fallback to any English voice
      const anyEn = cachedVoices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;
    }

    // Non-English language matching
    const exactLang = cachedVoices.find(v => v.lang.toLowerCase().replace('_', '-') === targetCode);
    if (exactLang) return exactLang;

    const prefix = targetCode.split('-')[0];
    const prefixMatch = cachedVoices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    return null;
  }

  /**
   * Heartbeat to eliminate Chromium's 15-second speech freeze bug
   */
  function startSpeechKeepAlive() {
    stopSpeechKeepAlive();
    speechKeepAliveTimer = setInterval(() => {
      if (!isSpeaking || !('speechSynthesis' in window)) {
        stopSpeechKeepAlive();
        return;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 8000);
  }

  function stopSpeechKeepAlive() {
    if (speechKeepAliveTimer) {
      clearInterval(speechKeepAliveTimer);
      speechKeepAliveTimer = null;
    }
  }

  /**
   * Stops any active speech synthesis
   */
  function stopSpeech() {
    stopSpeechKeepAlive();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    updateAvatarSpeechState(false);
  }

  /**
   * Initializes or retrieves the Shadow DOM host
   */
  function getOrCreateShadowRoot() {
    if (shadowRoot && document.getElementById(SHADOW_HOST_ID)) {
      return shadowRoot;
    }

    // Remove any leftover host
    const existingHost = document.getElementById(SHADOW_HOST_ID);
    if (existingHost) existingHost.remove();

    shadowHost = document.createElement('div');
    shadowHost.id = SHADOW_HOST_ID;
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '100%';
    shadowHost.style.height = '0';
    shadowHost.style.overflow = 'visible';
    shadowHost.style.zIndex = '2147483647';
    shadowHost.style.pointerEvents = 'none';

    document.documentElement.appendChild(shadowHost);
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // Inject encapsulated styles into the Shadow DOM
    const style = document.createElement('style');
    style.textContent = getCardStyles();
    shadowRoot.appendChild(style);

    return shadowRoot;
  }

  /**
   * Encapsulated styles for the Shadow DOM card, Avatar, and Translator
   */
  function getCardStyles() {
    return `
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* Base Theme Variables (Dark Mode Default) */
      .explainer-card {
        --card-bg: #0f172a;
        --card-text: #f8fafc;
        --card-subtext: #94a3b8;
        --card-header-bg: #1e293b;
        --card-border: #334155;
        --card-snippet-bg: #1e293b;
        --card-snippet-border: #6366f1;
        --card-snippet-text: #94a3b8;
        --card-body-text: #e2e8f0;
        --card-code-bg: #1e293b;
        --card-code-color: #a5b4fc;
        --card-keypoints-bg: rgba(30, 41, 59, 0.65);
        --card-keypoints-border: rgba(51, 65, 85, 0.7);
        --card-footer-bg: #1e293b;
        --card-copy-bg: #334155;
        --card-copy-hover: #475569;
        --card-copy-text: #e2e8f0;
        --card-close-hover: #334155;
        --card-close-color: #94a3b8;
        --avatar-bg: #1e293b;
        --avatar-ring: #6366f1;
        --bubble-bg: rgba(30, 41, 59, 0.9);
        --bubble-border: rgba(99, 102, 241, 0.35);

        position: absolute;
        pointer-events: auto;
        width: 420px;
        max-width: calc(100vw - 32px);
        background: var(--card-bg);
        color: var(--card-text);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        user-select: text;
        font-size: 13.5px;
        line-height: 1.55;
        transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        animation: cardPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      /* ─── Themes ─── */
      /* Dark Slate (Explicit) */
      .explainer-card.theme-dark {
        --card-bg: #0f172a;
        --card-text: #f8fafc;
        --card-subtext: #94a3b8;
        --card-header-bg: #1e293b;
        --card-border: #334155;
        --card-snippet-bg: #1e293b;
        --card-snippet-border: #6366f1;
        --card-snippet-text: #94a3b8;
        --card-body-text: #e2e8f0;
        --card-code-bg: #1e293b;
        --card-code-color: #a5b4fc;
        --card-keypoints-bg: rgba(30, 41, 59, 0.65);
        --card-keypoints-border: rgba(51, 65, 85, 0.7);
        --card-footer-bg: #1e293b;
        --card-copy-bg: #334155;
        --card-copy-hover: #475569;
        --card-copy-text: #e2e8f0;
        --card-close-hover: #334155;
        --card-close-color: #94a3b8;
        --avatar-bg: #1e293b;
        --avatar-ring: #6366f1;
        --bubble-bg: rgba(30, 41, 59, 0.9);
        --bubble-border: rgba(99, 102, 241, 0.35);
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
      }

      /* Light Theme (Porcelain & Slate) */
      .explainer-card.theme-light {
        --card-bg: #ffffff;
        --card-text: #0f172a;
        --card-subtext: #64748b;
        --card-header-bg: #f8fafc;
        --card-border: #cbd5e1;
        --card-snippet-bg: #f1f5f9;
        --card-snippet-border: #6366f1;
        --card-snippet-text: #475569;
        --card-body-text: #1e293b;
        --card-code-bg: #f1f5f9;
        --card-code-color: #4f46e5;
        --card-keypoints-bg: #f8fafc;
        --card-keypoints-border: #e2e8f0;
        --card-footer-bg: #f8fafc;
        --card-copy-bg: #e2e8f0;
        --card-copy-hover: #cbd5e1;
        --card-copy-text: #1e293b;
        --card-close-hover: #e2e8f0;
        --card-close-color: #64748b;
        --avatar-bg: #f1f5f9;
        --avatar-ring: #6366f1;
        --bubble-bg: #f8fafc;
        --bubble-border: #cbd5e1;
        box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08);
      }

      /* Cyberpunk Neon (Electric Cyan & Magenta) */
      .explainer-card.theme-cyberpunk {
        --card-bg: #090a16;
        --card-text: #f0fdf4;
        --card-subtext: #818cf8;
        --card-header-bg: #111227;
        --card-border: rgba(0, 245, 212, 0.4);
        --card-snippet-bg: #12132b;
        --card-snippet-border: #f72585;
        --card-snippet-text: #a5b4fc;
        --card-body-text: #e0e7ff;
        --card-code-bg: #141633;
        --card-code-color: #00f5d4;
        --card-keypoints-bg: rgba(18, 19, 43, 0.85);
        --card-keypoints-border: rgba(247, 37, 133, 0.35);
        --card-footer-bg: #111227;
        --card-copy-bg: rgba(0, 245, 212, 0.12);
        --card-copy-hover: rgba(0, 245, 212, 0.25);
        --card-copy-text: #00f5d4;
        --card-close-hover: rgba(247, 37, 133, 0.25);
        --card-close-color: #f72585;
        --avatar-bg: #12132b;
        --avatar-ring: #00f5d4;
        --bubble-bg: rgba(18, 19, 43, 0.92);
        --bubble-border: rgba(0, 245, 212, 0.35);
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 245, 212, 0.15), 0 0 0 1px rgba(0, 245, 212, 0.35);
      }

      /* Midnight OLED (True Pitch Black) */
      .explainer-card.theme-midnight {
        --card-bg: #000000;
        --card-text: #ffffff;
        --card-subtext: #9ca3af;
        --card-header-bg: #0b0d11;
        --card-border: #232832;
        --card-snippet-bg: #0b0d11;
        --card-snippet-border: #3b82f6;
        --card-snippet-text: #9ca3af;
        --card-body-text: #e5e7eb;
        --card-code-bg: #0b0d11;
        --card-code-color: #60a5fa;
        --card-keypoints-bg: #07090c;
        --card-keypoints-border: #1e2430;
        --card-footer-bg: #0b0d11;
        --card-copy-bg: #191e28;
        --card-copy-hover: #262e3d;
        --card-copy-text: #ffffff;
        --card-close-hover: #191e28;
        --card-close-color: #9ca3af;
        --avatar-bg: #0b0d11;
        --avatar-ring: #3b82f6;
        --bubble-bg: #07090c;
        --bubble-border: #1e2430;
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.12);
      }

      /* Cosmic Aurora (Deep Celestial Violet & Mint Glow) */
      .explainer-card.theme-aurora {
        --card-bg: #110b29;
        --card-text: #f5f3ff;
        --card-subtext: #c4b5fd;
        --card-header-bg: #1c1240;
        --card-border: rgba(168, 85, 247, 0.35);
        --card-snippet-bg: #1c1240;
        --card-snippet-border: #10b981;
        --card-snippet-text: #ddd6fe;
        --card-body-text: #ede9fe;
        --card-code-bg: #1c1240;
        --card-code-color: #6ee7b7;
        --card-keypoints-bg: rgba(28, 18, 64, 0.75);
        --card-keypoints-border: rgba(168, 85, 247, 0.3);
        --card-footer-bg: #1c1240;
        --card-copy-bg: rgba(168, 85, 247, 0.2);
        --card-copy-hover: rgba(168, 85, 247, 0.32);
        --card-copy-text: #f5f3ff;
        --card-close-hover: rgba(168, 85, 247, 0.25);
        --card-close-color: #c4b5fd;
        --avatar-bg: #1c1240;
        --avatar-ring: #a855f7;
        --bubble-bg: rgba(28, 18, 64, 0.88);
        --bubble-border: rgba(16, 185, 129, 0.35);
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(168, 85, 247, 0.2), 0 0 0 1px rgba(168, 85, 247, 0.35);
      }

      /* Emerald Luxury (Deep Forest Onyx & Lustrous Jade) */
      .explainer-card.theme-emerald {
        --card-bg: #051814;
        --card-text: #ecfdf5;
        --card-subtext: #6ee7b7;
        --card-header-bg: #0b2e25;
        --card-border: rgba(16, 185, 129, 0.35);
        --card-snippet-bg: #0b2e25;
        --card-snippet-border: #10b981;
        --card-snippet-text: #a7f3d0;
        --card-body-text: #d1fae5;
        --card-code-bg: #0b2e25;
        --card-code-color: #6ee7b7;
        --card-keypoints-bg: rgba(11, 46, 37, 0.75);
        --card-keypoints-border: rgba(16, 185, 129, 0.25);
        --card-footer-bg: #0b2e25;
        --card-copy-bg: rgba(16, 185, 129, 0.18);
        --card-copy-hover: rgba(16, 185, 129, 0.3);
        --card-copy-text: #6ee7b7;
        --card-close-hover: rgba(16, 185, 129, 0.2);
        --card-close-color: #6ee7b7;
        --avatar-bg: #0b2e25;
        --avatar-ring: #10b981;
        --bubble-bg: rgba(11, 46, 37, 0.88);
        --bubble-border: rgba(16, 185, 129, 0.35);
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(16, 185, 129, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.3);
      }

      /* ─── Card Background Styles (Layered Over Themes) ─── */
      /* 1. Cyber Grid */
      .explainer-card.bg-style-grid {
        background-color: var(--card-bg);
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
        background-size: 22px 22px;
      }
      .explainer-card.theme-light.bg-style-grid {
        background-image:
          linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
      }

      /* 2. Dot Matrix */
      .explainer-card.bg-style-dots {
        background-color: var(--card-bg);
        background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px);
        background-size: 16px 16px;
      }
      .explainer-card.theme-light.bg-style-dots {
        background-image: radial-gradient(rgba(15, 23, 42, 0.12) 1.2px, transparent 1.2px);
      }

      /* 3. Cosmic Starfield */
      .explainer-card.bg-style-stars {
        background-color: var(--card-bg);
        background-image:
          radial-gradient(1.2px 1.2px at 15% 15%, rgba(255,255,255,0.7), transparent),
          radial-gradient(1px 1px at 35% 65%, rgba(129,140,248,0.8), transparent),
          radial-gradient(1.4px 1.4px at 60% 25%, rgba(255,255,255,0.9), transparent),
          radial-gradient(1px 1px at 80% 80%, rgba(56,189,248,0.7), transparent),
          radial-gradient(1.5px 1.5px at 90% 30%, rgba(244,63,94,0.6), transparent),
          radial-gradient(1px 1px at 20% 90%, rgba(168,85,247,0.7), transparent),
          radial-gradient(1.3px 1.3px at 50% 50%, rgba(255,255,255,0.6), transparent),
          radial-gradient(1px 1px at 70% 10%, rgba(52,211,153,0.7), transparent);
        background-size: 180px 180px;
      }
      .explainer-card.theme-light.bg-style-stars {
        background-image:
          radial-gradient(1.4px 1.4px at 15% 15%, rgba(99,102,241,0.55), transparent),
          radial-gradient(1.2px 1.2px at 35% 65%, rgba(139,92,246,0.6), transparent),
          radial-gradient(1.6px 1.6px at 60% 25%, rgba(79,70,229,0.7), transparent),
          radial-gradient(1.2px 1.2px at 80% 80%, rgba(16,185,129,0.5), transparent),
          radial-gradient(1.4px 1.4px at 90% 30%, rgba(244,63,94,0.55), transparent),
          radial-gradient(1.2px 1.2px at 50% 50%, rgba(99,102,241,0.5), transparent);
      }

      /* 4. Radiant Flowing Waves */
      .explainer-card.bg-style-waves {
        background-color: var(--card-bg);
        background-image:
          radial-gradient(circle at 10% 15%, rgba(99, 102, 241, 0.2) 0%, transparent 45%),
          radial-gradient(circle at 90% 25%, rgba(236, 72, 153, 0.16) 0%, transparent 45%),
          radial-gradient(circle at 45% 85%, rgba(16, 185, 129, 0.14) 0%, transparent 50%);
      }

      /* 5. Prism Glass */
      .explainer-card.bg-style-glass {
        background-color: var(--card-bg);
        background-image:
          linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%, rgba(255, 255, 255, 0.02) 100%),
          radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
        backdrop-filter: blur(28px);
        -webkit-backdrop-filter: blur(28px);
      }

      .explainer-card.is-dismissing {
        opacity: 0 !important;
        transform: scale(0.95) translateY(6px) !important;
        pointer-events: none !important;
      }

      @keyframes cardPopIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* Floating Selection Action Toolbar */
      .explainer-floating-toolbar {
        position: absolute;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        padding: 4px 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(99, 102, 241, 0.25);
        z-index: 2147483647;
        animation: cardPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }

      .explainer-floating-action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: none;
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s, background 0.15s, box-shadow 0.15s, color 0.15s;
        font-family: inherit;
        white-space: nowrap;
        line-height: 1;
      }

      .explainer-floating-action.btn-action-explain {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
      }

      .explainer-floating-action.btn-action-explain:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.5);
      }

      .explainer-floating-action.btn-action-bias {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.2));
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.35);
      }

      .explainer-floating-action.btn-action-bias:hover {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.32), rgba(99, 102, 241, 0.35));
        color: #bae6fd;
        border-color: rgba(56, 189, 248, 0.65);
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 3px 12px rgba(56, 189, 248, 0.3);
      }

      .explainer-floating-action svg {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
      }

      .explainer-floating-btn {
        display: none;
      }

      .explainer-floating-action.is-auto-explaining {
        background: linear-gradient(135deg, #10b981, #06b6d4) !important;
        box-shadow: 0 0 14px rgba(16, 185, 129, 0.65) !important;
        animation: autoExplainingPulse 0.45s ease-in-out infinite alternate;
      }

      @keyframes autoExplainingPulse {
        from {
          transform: scale(1);
          filter: brightness(1);
        }
        to {
          transform: scale(1.05);
          filter: brightness(1.2);
        }
      }

      .explainer-auto-pill {
        position: absolute;
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(16, 185, 129, 0.5);
        color: #34d399;
        font-size: 11.5px;
        font-weight: 600;
        border-radius: 999px;
        padding: 5px 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 14px rgba(16, 185, 129, 0.35);
        z-index: 2147483647;
        animation: cardPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1), autoExplainingPulse 0.45s ease-in-out infinite alternate;
        cursor: pointer;
        user-select: none;
        line-height: 1;
      }

      .explainer-auto-pill svg {
        width: 13px;
        height: 13px;
        flex-shrink: 0;
      }

      /* Mini Selection Prompt Toast */
      .explainer-mini-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #475569;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 2147483647;
        pointer-events: auto;
        animation: cardPopIn 0.2s ease-out;
      }


      /* Header */
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 14px;
        background: var(--card-header-bg);
        border-bottom: 1px solid var(--card-border);
        cursor: grab;
        user-select: none;
      }

      .card-header.is-dragging {
        cursor: grabbing;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .app-icon {
        width: 20px;
        height: 20px;
        color: #818cf8;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--card-text);
        letter-spacing: -0.1px;
      }

      .type-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 2px 7px;
        border-radius: 999px;
      }

      .type-tag.code {
        background: rgba(99, 102, 241, 0.18);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.4);
      }

      .type-tag.text {
        background: rgba(16, 185, 129, 0.18);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .btn-close {
        background: transparent;
        border: none;
        color: var(--card-close-color);
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .btn-close:hover {
        background: var(--card-close-hover);
        color: var(--card-text);
      }

      /* Body */
      .card-body {
        padding: 16px;
        max-height: 490px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .card-body::-webkit-scrollbar {
        width: 6px;
      }
      .card-body::-webkit-scrollbar-thumb {
        background: var(--card-border);
        border-radius: 3px;
      }

      /* Snippet Quote */
      .snippet-preview {
        background: var(--card-snippet-bg);
        border-left: 3px solid var(--card-snippet-border);
        padding: 8px 12px;
        border-radius: 4px 6px 6px 4px;
        font-size: 11.5px;
        color: var(--card-snippet-text);
        max-height: 65px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* ══════════════════════════════════════════════════
         Avatar Mentor Banner (Interactive Animated Companion)
      ══════════════════════════════════════════════════ */
      .avatar-mentor-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--bubble-bg);
        border: 1px solid var(--bubble-border);
        border-radius: 12px;
        padding: 10px 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: border-color 0.2s;
      }

      .avatar-companion {
        position: relative;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: avatarFloat 3.5s ease-in-out infinite;
      }

      @keyframes avatarFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

      .avatar-aura {
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
        opacity: 0.7;
        pointer-events: none;
        transition: opacity 0.3s;
      }

      .avatar-companion.state-thinking .avatar-aura {
        opacity: 1;
        animation: pulseAura 1.4s infinite alternate ease-in-out;
      }

      .avatar-companion.state-speaking .avatar-aura {
        opacity: 1;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%);
        animation: pulseAura 1s infinite alternate ease-in-out;
      }

      @keyframes pulseAura {
        0% { transform: scale(0.95); opacity: 0.6; }
        100% { transform: scale(1.15); opacity: 1; }
      }

      .avatar-svg {
        width: 48px;
        height: 48px;
        display: block;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
      }

      /* Eye Blinking */
      .avatar-eye {
        transform-origin: 32px 31px;
        animation: avatarBlink 4s infinite;
      }
      .left-eye { transform-origin: 24px 31px; }
      .right-eye { transform-origin: 40px 31px; }

      @keyframes avatarBlink {
        0%, 96%, 100% { transform: scaleY(1); }
        98% { transform: scaleY(0.1); }
      }

      /* Mouth Talking Animation */
      .avatar-mouth {
        transition: d 0.15s ease;
      }

      .avatar-companion.state-speaking .avatar-mouth {
        animation: avatarTalk 0.32s infinite ease-in-out alternate;
      }

      @keyframes avatarTalk {
        0% {
          d: path("M26 41 Q32 42 38 41");
        }
        100% {
          d: path("M26 40 Q32 47 38 40");
        }
      }

      .avatar-companion.state-happy .avatar-mouth {
        d: path("M25 39 Q32 47 39 39");
      }

      /* Sound Wave Indicator */
      .avatar-soundwaves {
        position: absolute;
        bottom: -3px;
        right: -3px;
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 14px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .avatar-companion.state-speaking .avatar-soundwaves {
        opacity: 1;
      }

      .sw-bar {
        width: 2.5px;
        background: #38bdf8;
        border-radius: 2px;
        animation: soundWavePulse 0.8s infinite ease-in-out alternate;
      }
      .sw-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
      .sw-bar:nth-child(2) { height: 12px; animation-delay: 0.3s; }
      .sw-bar:nth-child(3) { height: 9px; animation-delay: 0.2s; }
      .sw-bar:nth-child(4) { height: 14px; animation-delay: 0.4s; }

      @keyframes soundWavePulse {
        0% { height: 4px; }
        100% { height: 14px; }
      }

      .avatar-bubble {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .avatar-bubble-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .avatar-name {
        font-size: 11.5px;
        font-weight: 700;
        color: #818cf8;
        letter-spacing: 0.2px;
      }

      .avatar-badge {
        font-size: 10px;
        font-weight: 600;
        background: rgba(99, 102, 241, 0.18);
        color: #a5b4fc;
        padding: 1px 6px;
        border-radius: 999px;
        border: 1px solid rgba(99, 102, 241, 0.35);
      }

      .avatar-bubble-text {
        font-size: 12px;
        color: var(--card-text);
        line-height: 1.4;
        font-weight: 500;
      }

      /* ══════════════════════════════════════════════════
         Dynamic Voice Vibrator / Audio Soundwave Bar
      ══════════════════════════════════════════════════ */
      .voice-vibrator-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%);
        border: 1px solid rgba(99, 102, 241, 0.35);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        border-radius: 9px;
        padding: 6px 10px;
        gap: 8px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Theme-specific vibrator bar overrides */
      .theme-light .voice-vibrator-bar {
        background: linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%);
        border-color: rgba(99, 102, 241, 0.25);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.12);
      }
      .theme-cyberpunk .voice-vibrator-bar {
        background: linear-gradient(135deg, #0a0b1e 0%, #12132b 100%);
        border-color: rgba(0, 245, 212, 0.4);
        box-shadow: 0 4px 14px rgba(0, 245, 212, 0.12);
      }
      .theme-midnight .voice-vibrator-bar {
        background: linear-gradient(135deg, #07090c 0%, #0f1420 100%);
        border-color: rgba(59, 130, 246, 0.35);
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.1);
      }
      .theme-aurora .voice-vibrator-bar {
        background: linear-gradient(135deg, #130e2e 0%, #1c1240 100%);
        border-color: rgba(168, 85, 247, 0.35);
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.14);
      }
      .theme-emerald .voice-vibrator-bar {
        background: linear-gradient(135deg, #061a14 0%, #0b2e25 100%);
        border-color: rgba(16, 185, 129, 0.35);
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);
      }

      .voice-vibrator-bar.is-vibrating {
        border-color: rgba(129, 140, 248, 0.65);
        box-shadow: 0 0 18px rgba(99, 102, 241, 0.35), inset 0 0 10px rgba(99, 102, 241, 0.15);
      }

      .vibrator-info {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .vibrator-glow-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px #22c55e;
        transition: all 0.25s ease;
      }

      .voice-vibrator-bar.is-vibrating .vibrator-glow-pulse {
        background: #38bdf8;
        box-shadow: 0 0 10px #38bdf8;
        animation: pulseDot 0.8s infinite alternate;
      }

      @keyframes pulseDot {
        0% { transform: scale(0.85); opacity: 0.7; }
        100% { transform: scale(1.3); opacity: 1; }
      }

      .vibrator-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--card-text);
        letter-spacing: 0.2px;
      }

      .vibrator-badge {
        font-size: 9px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(99, 102, 241, 0.18);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      .voice-vibrator-bar.is-vibrating .vibrator-badge {
        background: rgba(56, 189, 248, 0.18);
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.4);
      }

      /* Animated Waveform Track */
      .vibrator-wave-track {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        height: 26px;
        flex: 1;
        padding: 0 4px;
      }

      .vib-bar {
        width: 3px;
        height: var(--base-h, 12px);
        background: linear-gradient(180deg, #38bdf8 0%, #818cf8 60%, #c084fc 100%);
        border-radius: 3px;
        transform-origin: center;
        opacity: 0.35;
        animation: none !important;
        transform: scaleY(0.35) !important;
        transition: transform 0.25s ease, opacity 0.25s ease;
      }

      .voice-vibrator-bar.is-vibrating .vib-bar {
        opacity: 1;
        animation: vibWaveAnim var(--vib-dur, 0.65s) infinite alternate ease-in-out !important;
        animation-delay: var(--vib-delay, 0s);
        filter: drop-shadow(0 0 3px rgba(99, 102, 241, 0.5));
      }

      @keyframes vibWaveAnim {
        0% {
          transform: scaleY(0.25);
          filter: drop-shadow(0 0 2px rgba(56, 189, 248, 0.4));
        }
        50% {
          transform: scaleY(1.4);
          filter: drop-shadow(0 0 6px rgba(129, 140, 248, 0.8));
        }
        100% {
          transform: scaleY(0.4);
          filter: drop-shadow(0 0 3px rgba(236, 72, 153, 0.6));
        }
      }

      /* Vibrator Action Button */
      .btn-vibrator-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(79, 70, 229, 0.35);
        transition: all 0.18s ease;
      }

      .btn-vibrator-toggle:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 10px rgba(79, 70, 229, 0.5);
        background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
      }

      .btn-vibrator-toggle.is-speaking {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }

      /* Avatar vibration ONLY when speaking audio */
      .avatar-companion.state-speaking {
        animation: avatarVibrate 0.35s infinite alternate ease-in-out !important;
      }

      @keyframes avatarVibrate {
        0% { transform: translateY(-2.5px) rotate(-1deg) scale(1.02); }
        50% { transform: translateY(1.5px) rotate(0.8deg) scale(1.03); }
        100% { transform: translateY(-1.5px) rotate(-0.5deg) scale(1.02); }
      }

      .lang-dropdown-select {
        background: var(--card-copy-bg);
        color: var(--card-copy-text);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        padding: 3px 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
      }

      .lang-dropdown-select:focus {
        border-color: #6366f1;
      }

      .trans-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(99, 102, 241, 0.3);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
      }

      /* Loading State */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
        gap: 12px;
        text-align: center;
      }

      .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(99, 102, 241, 0.2);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .loading-text {
        color: var(--card-text);
        font-size: 13px;
        font-weight: 600;
      }

      .loading-subtext {
        color: var(--card-subtext);
        font-size: 11px;
      }

      /* Explanation */
      .explanation-text {
        color: var(--card-body-text);
        font-size: 13.5px;
        line-height: 1.6;
        word-break: break-word;
      }

      .explanation-text strong {
        color: var(--card-text);
        font-weight: 700;
      }

      .explanation-text p {
        margin-bottom: 8px;
      }
      .explanation-text p:last-child {
        margin-bottom: 0;
      }

      .inline-code {
        background: var(--card-code-bg);
        color: var(--card-code-color);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
      }

      .code-block-wrapper {
        background: var(--card-code-bg);
        border: 1px solid var(--card-border);
        border-radius: 6px;
        padding: 10px 12px;
        overflow-x: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.45;
        color: var(--card-code-color);
        margin: 6px 0;
      }

      /* Key Points */
      .key-points-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--card-keypoints-bg);
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--card-keypoints-border);
      }

      .key-points-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--card-subtext);
      }

      .key-points-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .key-point-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12.5px;
        color: var(--card-body-text);
      }

      .bullet-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #818cf8;
        margin-top: 7px;
        flex-shrink: 0;
      }

      /* Error State */
      .error-container {
        padding: 12px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        color: #fca5a5;
        font-size: 12.5px;
        line-height: 1.5;
      }

      .error-title {
        font-weight: 700;
        margin-bottom: 4px;
        color: #ef4444;
      }

      /* Footer Actions */
      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: var(--card-footer-bg);
        border-top: 1px solid var(--card-border);
        font-size: 11px;
        color: var(--card-subtext);
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .btn-card-action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        background: var(--card-copy-bg);
        color: var(--card-copy-text);
        border: 1px solid transparent;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, transform 0.1s;
      }

      .btn-card-action:hover {
        background: var(--card-copy-hover);
        color: var(--card-text);
      }

      .btn-card-action:active {
        transform: scale(0.97);
      }

      .btn-card-action.copied {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
      }

      .btn-speak.speaking {
        background: rgba(99, 102, 241, 0.3);
        color: #a5b4fc;
        border-color: rgba(99, 102, 241, 0.5);
        animation: pulseSpeak 1.5s infinite ease-in-out;
      }

      @keyframes pulseSpeak {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
        50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0); }
      }

      .voice-accent-pill {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        color: var(--card-subtext);
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
      }

      /* ─── Gamified Learning / Quiz Mode Styles ─── */
      .explainer-confetti-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        border-radius: 16px;
      }

      .card-quiz-trigger-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 14px 0 10px;
        padding: 10px 14px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.12));
        border: 1px solid rgba(168, 85, 247, 0.35);
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .card-quiz-trigger-banner:hover {
        border-color: rgba(236, 72, 153, 0.6);
        box-shadow: 0 4px 16px rgba(236, 72, 153, 0.15);
      }

      .cq-banner-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .cq-banner-icon {
        font-size: 22px;
        flex-shrink: 0;
        animation: pulseIcon 2s infinite ease-in-out;
      }

      @keyframes pulseIcon {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15) rotate(5deg); }
      }

      .cq-banner-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .cq-banner-text strong {
        font-size: 12px;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: 0.3px;
      }

      .cq-banner-text span {
        font-size: 11px;
        color: var(--card-subtext);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .btn-test-knowledge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 13px;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
        transition: all 0.2s ease;
      }

      .btn-test-knowledge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.5);
        background: linear-gradient(135deg, #4f46e5, #9333ea);
      }

      .btn-card-action.btn-quiz {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
        color: #f472b6;
        border: 1px solid rgba(236, 72, 153, 0.35);
      }

      .btn-card-action.btn-quiz:hover {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.35), rgba(139, 92, 246, 0.35));
        color: #fbcfe8;
        border-color: rgba(236, 72, 153, 0.6);
      }

      /* Quiz view inside card */
      .quiz-card-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeInQuiz 0.25s ease-out;
      }

      @keyframes fadeInQuiz {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .quiz-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
      }

      .quiz-progress-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #a5b4fc;
        background: rgba(99, 102, 241, 0.16);
        padding: 3px 9px;
        border-radius: 20px;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      .quiz-score-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        color: #34d399;
        background: rgba(16, 185, 129, 0.16);
        padding: 3px 9px;
        border-radius: 20px;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .quiz-progress-bar-track {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        overflow: hidden;
      }

      .quiz-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #ec4899);
        border-radius: 10px;
        transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .quiz-question-box {
        font-size: 13.5px;
        font-weight: 600;
        line-height: 1.5;
        color: var(--card-text);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--card-border);
        padding: 12px 14px;
        border-radius: 10px;
      }

      .quiz-options-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quiz-option-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        color: var(--card-text);
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        transition: all 0.18s ease;
        line-height: 1.4;
      }

      .quiz-option-btn:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.45);
        transform: translateX(3px);
      }

      .quiz-option-letter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--card-subtext);
        font-weight: 700;
        font-size: 11px;
        flex-shrink: 0;
        transition: all 0.15s ease;
      }

      .quiz-option-btn.correct {
        background: rgba(34, 197, 94, 0.2) !important;
        border-color: #22c55e !important;
        color: #4ade80 !important;
        animation: correctPulse 0.4s ease;
      }

      .quiz-option-btn.correct .quiz-option-letter {
        background: #22c55e;
        color: #ffffff;
      }

      .quiz-option-btn.incorrect {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: #ef4444 !important;
        color: #f87171 !important;
        animation: shakeOption 0.35s ease;
      }

      .quiz-option-btn.incorrect .quiz-option-letter {
        background: #ef4444;
        color: #ffffff;
      }

      .quiz-option-btn.correct-reveal {
        border-color: #22c55e !important;
        background: rgba(34, 197, 94, 0.1) !important;
      }

      @keyframes correctPulse {
        0% { transform: scale(0.98); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }

      @keyframes shakeOption {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-4px); }
        40%, 80% { transform: translateX(4px); }
      }

      .quiz-feedback-box {
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 11.5px;
        line-height: 1.45;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        animation: fadeInQuiz 0.2s ease;
      }

      .quiz-feedback-box.correct {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #86efac;
      }

      .quiz-feedback-box.incorrect {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #fca5a5;
      }

      .quiz-next-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 9px 14px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 4px;
        transition: all 0.2s ease;
      }

      .quiz-next-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }

      /* Quiz Summary / Victory Screen */
      .quiz-summary-box {
        text-align: center;
        padding: 16px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        animation: fadeInQuiz 0.3s ease;
      }

      .quiz-trophy-icon {
        font-size: 46px;
        line-height: 1;
        animation: bounceTrophy 1s ease-in-out infinite alternate;
      }

      @keyframes bounceTrophy {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-6px) scale(1.08); }
      }

      .quiz-summary-title {
        font-size: 18px;
        font-weight: 800;
        color: #ffffff;
      }

      .quiz-score-pill-large {
        font-size: 14px;
        font-weight: 700;
        padding: 6px 18px;
        border-radius: 20px;
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.4);
      }

      .quiz-summary-praise {
        font-size: 12px;
        color: var(--card-subtext);
        max-width: 280px;
        line-height: 1.5;
      }

      .quiz-summary-actions {
        display: flex;
        gap: 10px;
        width: 100%;
        margin-top: 6px;
      }

      .quiz-summary-actions button {
        flex: 1;
      }

      /* ─── Bias Meter & Fact Checker Styles ─── */
      .card-bias-trigger-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 8px 0 10px;
        padding: 10px 14px;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12));
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 12px;
        transition: all 0.2s ease;
      }

      .card-bias-trigger-banner:hover {
        border-color: rgba(56, 189, 248, 0.6);
        box-shadow: 0 4px 16px rgba(56, 189, 248, 0.15);
      }

      .btn-check-bias {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 13px;
        background: linear-gradient(135deg, #0284c7, #6366f1);
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        transition: all 0.2s ease;
      }

      .btn-check-bias:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.5);
        background: linear-gradient(135deg, #0369a1, #4f46e5);
      }

      .btn-card-action.btn-bias {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.18));
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.35);
      }

      .btn-card-action.btn-bias:hover {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.3));
        color: #bae6fd;
        border-color: rgba(56, 189, 248, 0.6);
      }

      /* Bias Audit View inside Card */
      .bias-card-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeInQuiz 0.25s ease-out;
      }

      .bias-score-hero {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--card-border);
        border-radius: 12px;
      }

      /* Animated SVG Radial Gauge */
      .bias-gauge-radial {
        position: relative;
        width: 66px;
        height: 66px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bias-gauge-svg {
        width: 66px;
        height: 66px;
        transform: rotate(-90deg);
      }

      .bias-gauge-bg-ring {
        fill: none;
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 5;
      }

      .bias-gauge-fill-ring {
        fill: none;
        stroke-width: 5;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .bias-gauge-fill-ring.level-low {
        stroke: #22c55e;
        filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
      }

      .bias-gauge-fill-ring.level-medium {
        stroke: #f59e0b;
        filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.4));
      }

      .bias-gauge-fill-ring.level-high {
        stroke: #ef4444;
        filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));
      }

      .bias-gauge-inner {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .bias-gauge-val {
        font-size: 16px;
        font-weight: 800;
        line-height: 1;
        color: #ffffff;
      }

      .bias-gauge-sub {
        font-size: 7px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--card-subtext);
        margin-top: 2px;
      }

      .bias-hero-info {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
      }

      .bias-meta-pills {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }

      .bias-rating-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10.5px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 20px;
        width: fit-content;
      }

      .bias-rating-pill.level-low {
        background: rgba(34, 197, 94, 0.18);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.35);
      }

      .bias-rating-pill.level-medium {
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.35);
      }

      .bias-rating-pill.level-high {
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.35);
      }

      .bias-stance-tag {
        font-size: 9.5px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      .bias-summary-text {
        font-size: 11.5px;
        color: var(--card-subtext);
        line-height: 1.45;
      }

      /* Multi-metric sub-score progress bars */
      .bias-metrics-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .bias-metric-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .bias-metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: 600;
        color: #cbd5e1;
      }

      .bias-metric-val {
        font-size: 9.5px;
        font-weight: 700;
        color: #94a3b8;
      }

      .bias-bar-track {
        width: 100%;
        height: 5px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .bias-bar-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .bias-bar-fill.evidence {
        background: linear-gradient(90deg, #0ea5e9, #22c55e);
      }

      .bias-bar-fill.objectivity {
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
      }

      .bias-bar-fill.sensationalism {
        background: linear-gradient(90deg, #f59e0b, #ef4444);
      }

      /* Neutral Rewrite Section */
      .bias-neutral-section {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.1));
        border: 1px solid rgba(129, 140, 248, 0.35);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        animation: fadeInQuiz 0.25s ease-out;
      }

      .bias-neutral-box {
        font-size: 11.5px;
        line-height: 1.5;
        color: #e2e8f0;
      }

      .bias-audit-section {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .bias-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #cbd5e1;
      }

      .bias-bullet-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin: 0;
        padding: 0;
      }

      .bias-bullet-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 11.5px;
        color: var(--card-body-text);
        line-height: 1.4;
      }

      .bias-item-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
      }

      .bias-bullet-item.claims .bias-item-dot { background: #f87171; }
      .bias-bullet-item.missing .bias-item-dot { background: #fbbf24; }
      .bias-bullet-item.tips .bias-item-dot { background: #38bdf8; }

      .bias-agenda-box {
        font-size: 11.5px;
        color: var(--card-body-text);
        line-height: 1.45;
        background: rgba(99, 102, 241, 0.08);
        border-left: 3px solid #818cf8;
        padding: 6px 10px;
        border-radius: 0 6px 6px 0;
      }

      .btn-card-action.active-toggle {
        background: rgba(99, 102, 241, 0.35) !important;
        border-color: #818cf8 !important;
        color: #ffffff !important;
      }

      /* In-Page Highlights */
      mark.maya-bias-page-highlight {
        background: rgba(245, 158, 11, 0.32) !important;
        color: inherit !important;
        border-bottom: 2px wavy #ef4444 !important;
        border-radius: 3px !important;
        padding: 1px 3px !important;
        cursor: pointer !important;
        transition: background 0.2s ease !important;
      }
      mark.maya-bias-page-highlight:hover {
        background: rgba(239, 68, 68, 0.45) !important;
      }

      /* ─── Complexity & Tone Bar ─── */
      .complexity-bar {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(15, 23, 42, 0.45);
        border: 1px solid var(--card-border);
        border-radius: 9px;
        padding: 3px;
        margin-bottom: 12px;
      }

      .complexity-pill {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--card-subtext);
        font-size: 10px;
        font-weight: 600;
        padding: 4px 6px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
        white-space: nowrap;
      }

      .complexity-pill:hover {
        color: var(--card-text);
        background: rgba(255, 255, 255, 0.05);
      }

      .complexity-pill.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25));
        color: #a5b4fc;
        border-color: rgba(99, 102, 241, 0.45);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
      }

      /* ─── Smart Follow-up Chips ─── */
      .smart-chips-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed var(--card-border);
      }

      .smart-chips-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 700;
        color: #818cf8;
        letter-spacing: 0.2px;
      }

      .smart-chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .smart-chip-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(129, 140, 248, 0.25);
        color: #cbd5e1;
        font-size: 11px;
        font-weight: 500;
        padding: 5px 9px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        line-height: 1.3;
      }

      .smart-chip-btn:hover {
        background: rgba(99, 102, 241, 0.18);
        color: #e0e7ff;
        border-color: rgba(129, 140, 248, 0.5);
        transform: translateY(-1px);
      }

      .smart-chip-btn:active {
        transform: scale(0.98);
      }

      /* Accordion Drawer for Follow-up Answer */
      .followup-answer-drawer {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 8px;
        padding: 10px 12px;
        margin-top: 6px;
        animation: fadeInQuiz 0.25s ease-out;
      }

      .followup-drawer-q {
        font-size: 11.5px;
        font-weight: 700;
        color: #a5b4fc;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .followup-drawer-a {
        font-size: 12px;
        color: var(--card-text);
        line-height: 1.5;
      }

      /* ─── Jargon Buster & Tooltips ─── */
      .jargon-term {
        position: relative;
        text-decoration: underline dotted #38bdf8;
        text-underline-offset: 3px;
        cursor: help;
        color: #7dd3fc;
        font-weight: 600;
        transition: color 0.15s, text-decoration-color 0.15s;
      }

      .jargon-term:hover {
        color: #38bdf8;
        text-decoration-color: #0284c7;
      }

      .jargon-popover-box {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        border: 1px solid #38bdf8;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 11px;
        color: #f1f5f9;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
        white-space: normal;
        min-width: 180px;
        max-width: 260px;
        z-index: 2147483647;
        pointer-events: none;
        animation: cardPopIn 0.15s ease-out;
        line-height: 1.4;
      }

      .jargon-popover-title {
        font-size: 10.5px;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* ─── 1-Click Export Menu ─── */
      .btn-card-action.btn-export {
        position: relative;
      }

      .export-menu-dropdown {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        background: #0f172a;
        border: 1px solid var(--card-border);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 150px;
        z-index: 2147483647;
        animation: cardPopIn 0.15s ease-out;
      }

      .export-menu-item {
        display: flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        color: var(--card-text);
        font-size: 11px;
        font-weight: 500;
        padding: 6px 8px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.12s;
        text-align: left;
        width: 100%;
      }

      .export-menu-item:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #a5b4fc;
      }

      /* ─── 30-Second Page TL;DR Card View ─── */
      .tldr-card-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: fadeInQuiz 0.25s ease-out;
      }

      .tldr-hero-punch {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
        border: 1px solid rgba(99, 102, 241, 0.35);
        border-radius: 10px;
        padding: 12px;
      }

      .tldr-hero-tag-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .tldr-tag-punch {
        font-size: 10.5px;
        font-weight: 700;
        color: #a5b4fc;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tldr-time-saved-badge {
        font-size: 10px;
        font-weight: 700;
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.4);
        padding: 2px 7px;
        border-radius: 999px;
      }

      .tldr-punch-text {
        font-size: 13.5px;
        font-weight: 700;
        color: var(--card-text);
        line-height: 1.4;
      }

      .tldr-section {
        background: rgba(30, 41, 59, 0.45);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        padding: 10px 12px;
      }

      .tldr-section-title {
        font-size: 11px;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .tldr-body-text {
        font-size: 12px;
        color: var(--card-text);
        line-height: 1.5;
      }

      .tldr-stats-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .tldr-stat-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 11.5px;
        color: var(--card-text);
        line-height: 1.4;
      }

      .tldr-stat-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #38bdf8;
        margin-top: 6px;
        flex-shrink: 0;
      }

      /* ── Mentor Avatar Skin Variants ── */
      .explainer-card.skin-cyberpunk {
        --card-border: #f43f5e;
        --card-snippet-border: #06b6d4;
        box-shadow: 0 0 25px rgba(244, 63, 94, 0.35), 0 20px 40px rgba(0, 0, 0, 0.7);
      }
      .explainer-card.skin-cyberpunk .avatar-halo { fill: #f43f5e !important; }
      .explainer-card.skin-cyberpunk .avatar-eyes ellipse { fill: #06b6d4 !important; }
      .explainer-card.skin-cyberpunk .avatar-eyes circle { fill: #ffe4e6 !important; }
      .explainer-card.skin-cyberpunk .avatar-mouth { stroke: #f43f5e !important; }
      .explainer-card.skin-cyberpunk .avatar-bubble-header .avatar-name { color: #f43f5e !important; }

      .explainer-card.skin-monochrome {
        --card-bg: #121212;
        --card-border: #3f3f46;
        --card-header-bg: #18181b;
        --card-snippet-border: #71717a;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.85);
      }
      .explainer-card.skin-monochrome .avatar-halo { fill: #e4e4e7 !important; }
      .explainer-card.skin-monochrome .avatar-eyes ellipse { fill: #e4e4e7 !important; }
      .explainer-card.skin-monochrome .avatar-eyes circle { fill: #18181b !important; }
      .explainer-card.skin-monochrome .avatar-mouth { stroke: #a1a1aa !important; }
      .explainer-card.skin-monochrome .avatar-bubble-header .avatar-name { color: #f4f4f5 !important; }

      .explainer-card.skin-pixel {
        --card-border: #10b981;
        --card-snippet-border: #10b981;
        image-rendering: pixelated;
        border: 2px solid #10b981 !important;
        border-radius: 4px !important;
        box-shadow: 4px 4px 0px #047857, 0 16px 36px rgba(0,0,0,0.6);
      }
      .explainer-card.skin-pixel .avatar-halo { fill: #34d399 !important; }
      .explainer-card.skin-pixel .avatar-eyes ellipse { fill: #34d399 !important; }
      .explainer-card.skin-pixel .avatar-mouth { stroke: #10b981 !important; }
      .explainer-card.skin-pixel .avatar-bubble-header .avatar-name { color: #34d399 !important; font-family: monospace, monospace !important; }
    `;
  }

  /**
   * Generates Avatar SVG markup with animated vector eyes, mouth, and halo
   */
  function getAvatarMarkup(state = 'idle') {
    return `
      <div class="avatar-companion state-${state}" id="mentorAvatar">
        <div class="avatar-aura"></div>
        <svg class="avatar-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Antenna & Glowing Halo -->
          <circle class="avatar-halo" cx="32" cy="7" r="4" fill="#38bdf8"/>
          <line x1="32" y1="11" x2="32" y2="16" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Head Base -->
          <rect x="10" y="16" width="44" height="40" rx="16" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
          <!-- Face Screen -->
          <rect x="14" y="20" width="36" height="32" rx="11" fill="#090d16"/>
          <!-- Rosy Cheeks -->
          <circle cx="18" cy="38" r="2.5" fill="#f43f5e" opacity="0.65"/>
          <circle cx="46" cy="38" r="2.5" fill="#f43f5e" opacity="0.65"/>
          <!-- Vector Eyes (Animated) -->
          <g class="avatar-eyes">
            <ellipse class="avatar-eye left-eye" cx="24" cy="31" rx="3.5" ry="4.5" fill="#38bdf8"/>
            <ellipse class="avatar-eye right-eye" cx="40" cy="31" rx="3.5" ry="4.5" fill="#38bdf8"/>
            <circle cx="25" cy="30" r="1.2" fill="#ffffff"/>
            <circle cx="41" cy="30" r="1.2" fill="#ffffff"/>
          </g>
          <!-- Dynamic Mouth -->
          <path class="avatar-mouth" d="M26 41 Q32 46 38 41" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        </svg>
        <!-- Audio Waves (Active when speaking) -->
        <div class="avatar-soundwaves" id="avatarWaves">
          <span class="sw-bar"></span>
          <span class="sw-bar"></span>
          <span class="sw-bar"></span>
          <span class="sw-bar"></span>
        </div>
      </div>
    `;
  }

  /**
   * Generates dynamic vibrating audio soundwave bars
   */
  function getVibratorBarsMarkup() {
    const heights = [6, 12, 22, 16, 28, 20, 14, 26, 18, 30, 24, 16, 22, 28, 14, 20, 26, 12, 24, 18, 10, 16, 8, 5];
    const delays = [0.05, 0.2, 0.35, 0.1, 0.45, 0.25, 0.15, 0.4, 0.3, 0.5, 0.2, 0.35, 0.15, 0.45, 0.25, 0.1, 0.4, 0.3, 0.5, 0.2, 0.35, 0.15, 0.05, 0.2];
    const durs = [0.55, 0.7, 0.6, 0.8, 0.65, 0.75, 0.5, 0.85, 0.6, 0.7, 0.55, 0.8, 0.65, 0.75, 0.6, 0.7, 0.55, 0.85, 0.65, 0.7, 0.5, 0.75, 0.6, 0.65];
    return heights.map((h, i) =>
      `<span class="vib-bar" style="--base-h:${h}px; --vib-delay:${delays[i]}s; --vib-dur:${durs[i]}s;"></span>`
    ).join('');
  }

  /**
   * Updates the avatar state on the current active card
   */
  function setAvatarState(state) {
    if (!currentCard) return;
    const avatar = currentCard.querySelector('#mentorAvatar');
    if (!avatar) return;
    avatar.className = `avatar-companion state-${state}`;
  }

  /**
   * Updates the avatar speech state and audio visualizer waves
   */
  function updateAvatarSpeechState(speaking) {
    if (!currentCard) return;
    setAvatarState(speaking ? 'speaking' : 'happy');
    const badge = currentCard.querySelector('#avatarBadge');
    if (badge && !currentCardData?.currentLanguage) {
      badge.textContent = speaking ? 'Speaking' : 'Mentor';
    }

    const vibBar = currentCard.querySelector('#voiceVibratorBar');
    const vibBadge = currentCard.querySelector('#vibratorBadge');
    const vibToggleBtn = currentCard.querySelector('#vibratorToggleBtn');
    const vibPlayIcon = vibToggleBtn?.querySelector('.vib-play-icon');
    const vibStopIcon = vibToggleBtn?.querySelector('.vib-stop-icon');
    const vibBtnText = vibToggleBtn?.querySelector('.vib-btn-text');

    if (vibBar) {
      if (speaking) {
        vibBar.classList.add('is-vibrating');
        if (vibBadge) vibBadge.textContent = 'Speaking • Live';
        if (vibToggleBtn) vibToggleBtn.classList.add('is-speaking');
        if (vibPlayIcon) vibPlayIcon.style.display = 'none';
        if (vibStopIcon) vibStopIcon.style.display = 'inline-block';
        if (vibBtnText) vibBtnText.textContent = 'Stop';
      } else {
        vibBar.classList.remove('is-vibrating');
        if (vibBadge) vibBadge.textContent = 'Click Listen';
        if (vibToggleBtn) vibToggleBtn.classList.remove('is-speaking');
        if (vibPlayIcon) vibPlayIcon.style.display = 'inline-block';
        if (vibStopIcon) vibStopIcon.style.display = 'none';
        if (vibBtnText) vibBtnText.textContent = 'Listen';
      }
    }
  }

  /**
   * Calculates ideal card coordinates near the selection, bounded inside the viewport
   */
  function calculateCardPosition(preferredX, preferredY) {
    const cardWidth = 420;
    const estimatedHeight = 340;
    const padding = 16;

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let targetLeft = preferredX;
    let targetTop = preferredY;

    // Horizontal bounds clamp
    if (targetLeft + cardWidth > scrollX + viewportWidth - padding) {
      targetLeft = scrollX + viewportWidth - cardWidth - padding;
    }
    if (targetLeft < scrollX + padding) {
      targetLeft = scrollX + padding;
    }

    // Vertical position clamp
    if (targetTop + estimatedHeight > scrollY + viewportHeight - padding) {
      const alternativeTop = targetTop - estimatedHeight - 30;
      if (alternativeTop > scrollY + padding) {
        targetTop = alternativeTop;
      }
    }

    return {
      left: Math.max(scrollX + padding, targetLeft),
      top: Math.max(scrollY + padding, targetTop)
    };
  }

  /**
   * Cleans text and strips markdown/code blocks for natural speech narration
   */
  function cleanTextForSpeech(text, keyPoints = []) {
    if (!text) return '';
    let spoken = text
      .replace(/```[\s\S]*?```/g, ' Code snippet. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>-]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      spoken += '. Key takeaways: ' + keyPoints.map(kp => kp.replace(/[*_~#>-]/g, '').trim()).join('. ');
    }
    return spoken;
  }

  /**
   * Speaks the explanation text with Indian English accent and keep-alive
   */
  function speakExplanationText(text, keyPoints, language = 'English', voiceAccent = 'en-IN', onStart, onEnd) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available.');
      return;
    }
    stopSpeech();

    const clean = cleanTextForSpeech(text, keyPoints);
    if (!clean) return;

    const langKey = (language || 'english').toLowerCase();
    const langCode = LANGUAGE_CODE_MAP[langKey] || (langKey.startsWith('en') ? (voiceAccent || 'en-IN') : 'en-IN');
    const voice = findBestVoice(langCode, voiceAccent);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    if (voice) utterance.voice = voice;

    // Tune pitch and rate for crisp Indian English cadence
    if (langCode === 'en-IN') {
      utterance.rate = 0.96;
      utterance.pitch = 1.05;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => {
      isSpeaking = true;
      startSpeechKeepAlive();
      updateAvatarSpeechState(true);
      if (onStart) onStart();
    };

    const finish = () => {
      isSpeaking = false;
      stopSpeechKeepAlive();
      updateAvatarSpeechState(false);
      if (onEnd) onEnd();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Dismisses and removes the current card with smooth fade-out
   */
  function dismissCard() {
    stopSpeech();
    clearBiasPageHighlights();
    if (currentCard) {
      const cardToDismiss = currentCard;
      currentCard = null;
      cardToDismiss.classList.add('is-dismissing');
      setTimeout(() => {
        try { cardToDismiss.remove(); } catch {}
      }, 180);
    }
    dragCleanups.forEach(fn => fn());
    dragCleanups = [];
  }

  /**
   * Clears any active auto-explain debounce timer
   */
  function cancelAutoExplainTimer() {
    if (autoExplainTimer) {
      clearTimeout(autoExplainTimer);
      autoExplainTimer = null;
    }
  }

  /**
   * Dismisses floating quick-action button without canceling auto-explain unless requested
   */
  function removeFloatingButton(options = {}) {
    const { cancelAutoExplain = true } = options;
    if (cancelAutoExplain) {
      cancelAutoExplainTimer();
    }
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  /**
   * Shows a temporary mini toast when shortcut is pressed without selection
   */
  function showMiniToast(message) {
    const root = getOrCreateShadowRoot();
    const toast = document.createElement('div');
    toast.className = 'explainer-mini-toast';
    toast.textContent = message;
    root.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      setTimeout(() => toast.remove(), 200);
    }, 2200);
  }

  /**
   * Makes the card draggable via its header using requestAnimationFrame for buttery 60fps
   */
  function makeCardDraggable(card, header) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let rafId = null;

    function updatePosition() {
      if (!isDragging) return;
      const dx = currentMouseX - startX;
      const dy = currentMouseY - startY;

      const minLeft = window.scrollX + 8;
      const maxLeft = window.scrollX + window.innerWidth - card.offsetWidth - 8;
      const minTop = window.scrollY + 8;

      card.style.left = `${Math.max(minLeft, Math.min(initialLeft + dx, maxLeft))}px`;
      card.style.top = `${Math.max(minTop, initialTop + dy)}px`;
    }

    function onMouseDown(e) {
      if (e.target.closest('button') || e.target.closest('select')) return;

      isDragging = true;
      header.classList.add('is-dragging');
      startX = e.clientX;
      startY = e.clientY;
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;

      const rect = card.getBoundingClientRect();
      initialLeft = rect.left + window.scrollX;
      initialTop = rect.top + window.scrollY;

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    }

    function onMouseMove(e) {
      if (!isDragging) return;
      currentMouseX = e.clientX;
      currentMouseY = e.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updatePosition();
          rafId = null;
        });
      }
    }

    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      header.classList.remove('is-dragging');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    header.addEventListener('mousedown', onMouseDown);
    dragCleanups.push(() => {
      header.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    });
  }

  /**
   * Applies a theme class to the card element.
   * Strips any previously applied theme-* classes first.
   */
  const VALID_THEMES = ['dark', 'light', 'cyberpunk', 'midnight', 'aurora', 'emerald'];
  function applyThemeToCard(cardEl, themeName) {
    if (!cardEl) return;
    const safe = VALID_THEMES.includes(themeName) ? themeName : 'dark';
    VALID_THEMES.forEach(t => cardEl.classList.remove(`theme-${t}`));
    cardEl.classList.add(`theme-${safe}`);
  }

  const VALID_BG_STYLES = ['glow', 'grid', 'dots', 'stars', 'waves', 'glass'];
  function applyBgStyleToCard(cardEl, bgStyle) {
    if (!cardEl) return;
    const safe = VALID_BG_STYLES.includes(bgStyle) ? bgStyle : 'glow';
    VALID_BG_STYLES.forEach(s => cardEl.classList.remove(`bg-style-${s}`));
    cardEl.classList.add(`bg-style-${safe}`);
  }

  const VALID_SKINS = ['classic', 'cyberpunk', 'monochrome', 'pixel'];
  function applySkinToCard(cardEl, skinName) {
    if (!cardEl) return;
    const safe = VALID_SKINS.includes(skinName) ? skinName : 'classic';
    VALID_SKINS.forEach(s => cardEl.classList.remove(`skin-${s}`));
    cardEl.classList.add(`skin-${safe}`);
  }

  /**
   * Renders the loading overlay card with the animated Avatar in thinking state
   */
  function showLoadingCard({ text, type, theme = 'dark', bgStyle = 'glow', targetLanguage = 'English', voiceAccent = 'en-IN', pageUrl, aiSource = 'ollama', ollamaModel, mentorPersona = 'maya', avatarSkin = 'classic' }) {
    removeFloatingButton();
    dismissCard();
    translationCache = {};
    currentMentorPersona = mentorPersona || 'maya';
    currentAvatarSkin = avatarSkin || 'classic';

    const root = getOrCreateShadowRoot();

    let posX = window.scrollX + (window.innerWidth / 2) - 210;
    let posY = window.scrollY + 120;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        posX = rect.left + window.scrollX;
        posY = rect.bottom + window.scrollY + 8;
      }
    }

    const { left, top } = calculateCardPosition(posX, posY);

    const card = document.createElement('div');
    card.className = 'explainer-card';
    applyThemeToCard(card, theme);
    applyBgStyleToCard(card, bgStyle);
    applySkinToCard(card, currentAvatarSkin);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;

    const typeLabel = type === 'code' ? 'Code' : 'Text';
    const typeClass = type === 'code' ? 'code' : 'text';

    const isOllama = aiSource === 'ollama' || aiSource === 'auto';
    const providerBadge = isOllama
      ? `<span class="type-tag" style="background:rgba(34,197,94,0.18);color:#22c55e;border:1px solid rgba(34,197,94,0.35);font-weight:600;">🦙 Ollama</span>`
      : `<span class="type-tag" style="background:rgba(99,102,241,0.18);color:#a5b4fc;border:1px solid rgba(99,102,241,0.35);font-weight:600;">✨ Gemini</span>`;
    const providerText = isOllama ? `Ollama (${ollamaModel || 'llama3.2'})` : 'Gemini AI';
    const providerSubtext = isOllama ? 'Running locally & privately on your PC (100% free)' : 'Making learning simple, intuitive, and fun';
    const pConf = getPersonaInfo(currentMentorPersona);

    card.innerHTML = `
      <div class="card-header">
        <div class="header-left">
          <span class="app-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </span>
          <span class="card-title">Universal AI Explainer</span>
          <span class="type-tag ${typeClass}">${typeLabel}</span>
          ${providerBadge}
        </div>
        <div class="header-actions">
          <button type="button" class="btn-close" title="Close (Esc)" aria-label="Close">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="snippet-preview">${escapeHtml(text.slice(0, 180))}${text.length > 180 ? '...' : ''}</div>

        <!-- Animated Avatar Mentor Banner -->
        <div class="avatar-mentor-banner">
          ${getAvatarMarkup('thinking')}
          <div class="avatar-bubble">
            <div class="avatar-bubble-header">
              <span class="avatar-name">${escapeHtml(pConf.badge)}</span>
              <span class="avatar-badge" id="avatarBadge" style="${isOllama ? 'color:#22c55e;border-color:rgba(34,197,94,0.4);background:rgba(34,197,94,0.1);' : ''}">${isOllama ? '🦙 Ollama' : '✨ Gemini'}</span>
            </div>
            <div class="avatar-bubble-text" id="avatarBubbleText">
              ${escapeHtml(pConf.bubbleIntro)}
            </div>
          </div>
        </div>

        <div class="loading-container">
          <div class="spinner"></div>
          <div class="loading-text">Simplifying with ${providerText}...</div>
          <div class="loading-subtext">${providerSubtext}</div>
        </div>
      </div>

      <div class="card-footer">
        <span>Esc to dismiss</span>
      </div>
    `;

    const header = card.querySelector('.card-header');
    const closeBtn = card.querySelector('.btn-close');
    closeBtn.addEventListener('click', dismissCard);

    makeCardDraggable(card, header);
    root.appendChild(card);
    currentCard = card;
  }

  /**
   * Updates the card with the final explanation result, Avatar, and Translation Toolbar
   */
  function showResultCard({ explanation, key_points, follow_ups = [], jargon = [], type, targetLanguage = 'English', voiceAccent = 'en-IN', provider = '', mentorPersona, avatarSkin }) {
    if (!currentCard) return;

    if (mentorPersona) currentMentorPersona = mentorPersona;
    if (avatarSkin) currentAvatarSkin = avatarSkin;
    applySkinToCard(currentCard, currentAvatarSkin);

    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    // Cache original content
    currentCardData = {
      originalExplanation: explanation,
      originalKeyPoints: key_points || [],
      originalFollowUps: follow_ups || [],
      originalJargon: jargon || [],
      currentExplanation: explanation,
      currentKeyPoints: key_points || [],
      currentFollowUps: follow_ups || [],
      currentJargon: jargon || [],
      currentTone: 'balanced',
      currentLanguage: targetLanguage,
      voiceAccent: voiceAccent || 'en-IN',
      type,
      provider,
      mentorPersona: currentMentorPersona,
      avatarSkin: currentAvatarSkin
    };

    translationCache['Original'] = {
      explanation,
      key_points: key_points || [],
      follow_ups: follow_ups || [],
      jargon: jargon || []
    };
    if (targetLanguage && targetLanguage !== 'English') {
      translationCache[targetLanguage] = {
        explanation,
        key_points: key_points || [],
        follow_ups: follow_ups || [],
        jargon: jargon || []
      };
    }

    renderCardContent(currentCardData);

    // Auto-speak if setting is enabled
    chrome.storage.local.get('autoSpeak', ({ autoSpeak }) => {
      if (autoSpeak) {
        // Small delay to ensure card DOM is fully painted before speaking
        setTimeout(() => {
          speakExplanationText(
            explanation,
            key_points || [],
            targetLanguage,
            voiceAccent || 'en-IN',
            () => {
              // onStart: update speak button UI to "Stop" state & vibrate soundwave
              updateAvatarSpeechState(true);
              const speakBtn = currentCard?.shadowRoot?.querySelector('#speakExplanationBtn') ||
                               currentCard?.querySelector('#speakExplanationBtn');
              const speakLabel = speakBtn?.querySelector('.speak-label');
              if (speakBtn) speakBtn.classList.add('speaking');
              if (speakLabel) speakLabel.textContent = 'Stop';
            },
            () => {
              // onEnd: reset speak button UI to "Listen" state & relax soundwave
              updateAvatarSpeechState(false);
              const speakBtn = currentCard?.shadowRoot?.querySelector('#speakExplanationBtn') ||
                               currentCard?.querySelector('#speakExplanationBtn');
              const speakLabel = speakBtn?.querySelector('.speak-label');
              if (speakBtn) speakBtn.classList.remove('speaking');
              if (speakLabel) speakLabel.textContent = 'Listen';
            }
          );
        }, 400);
      }
    });
  }

  /**
   * Re-renders the explanation body and key takeaways
   */
  function renderCardContent(data) {
    if (!currentCard) return;
    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    const isTranslated = data.currentLanguage && data.currentLanguage !== 'English' && data.currentLanguage !== 'Original';
    const pConf = getPersonaInfo(data.mentorPersona || currentMentorPersona);

    let keyPointsHtml = '';
    if (Array.isArray(data.currentKeyPoints) && data.currentKeyPoints.length > 0) {
      const items = data.currentKeyPoints
        .map(kp => `<li class="key-point-item"><span class="bullet-dot"></span><span>${formatExplanation(kp, data.currentJargon || [])}</span></li>`)
        .join('');

      keyPointsHtml = `
        <div class="key-points-section">
          <div class="key-points-title">Key Takeaways</div>
          <ul class="key-points-list">${items}</ul>
        </div>
      `;
    }

    // Avatar bubble short takeaway
    const bubbleSummary = isTranslated
      ? `Translated to ${data.currentLanguage}. Press Listen to hear pronunciation!`
      : (data.currentKeyPoints?.[0] ? `Key tip: ${data.currentKeyPoints[0]}` : 'Here is a simple, intuitive explanation for you:');

    body.innerHTML = `
      <!-- Avatar Mentor Banner -->
      <div class="avatar-mentor-banner">
        ${getAvatarMarkup('happy')}
        <div class="avatar-bubble">
          <div class="avatar-bubble-header">
            <span class="avatar-name">${escapeHtml(pConf.badge)}</span>
            <span class="avatar-badge" id="avatarBadge">${isTranslated ? data.currentLanguage : (data.provider === 'Ollama' ? '🦙 Ollama' : data.provider === 'Gemini' ? '✨ Gemini' : 'Explained')}</span>
          </div>
          <div class="avatar-bubble-text" id="avatarBubbleText">
            ${escapeHtml(bubbleSummary)}
          </div>
        </div>
      </div>

      <!-- Complexity & Tone Switcher Bar -->
      <div class="complexity-bar" id="cardComplexityBar">
        <button type="button" class="complexity-pill ${data.currentTone === 'eli5' ? 'active' : ''}" data-tone="eli5" title="Explain Like I'm 5">
          <span>🐣</span><span>ELI5</span>
        </button>
        <button type="button" class="complexity-pill ${data.currentTone === 'desi' ? 'active' : ''}" data-tone="desi" title="Desi everyday chai & train analogies">
          <span>☕</span><span>Desi Analogy</span>
        </button>
        <button type="button" class="complexity-pill ${!data.currentTone || data.currentTone === 'balanced' ? 'active' : ''}" data-tone="balanced" title="Balanced and clear explanation">
          <span>⚖️</span><span>Balanced</span>
        </button>
        <button type="button" class="complexity-pill ${data.currentTone === 'deep_dive' ? 'active' : ''}" data-tone="deep_dive" title="In-depth technical breakdown">
          <span>🔬</span><span>Deep Dive</span>
        </button>
      </div>

      <!-- Dynamic Voice Vibrator / Audio Soundwave Bar -->
      <div class="voice-vibrator-bar" id="voiceVibratorBar">
        <div class="vibrator-info">
          <span class="vibrator-glow-pulse"></span>
          <span class="vibrator-title" id="vibratorTitle">Voice Waves</span>
          <span class="vibrator-badge" id="vibratorBadge">Click Listen</span>
        </div>
        <div class="vibrator-wave-track" id="vibratorWaveTrack" title="Live audio waveform visualizer">
          ${getVibratorBarsMarkup()}
        </div>
        <button type="button" class="btn-vibrator-toggle" id="vibratorToggleBtn" title="Listen with voice">
          <svg class="vib-play-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg class="vib-stop-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display:none;">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          <span class="vib-btn-text">Listen</span>
        </button>
      </div>

      <!-- Explanation Text with Jargon Highlighting -->
      <div class="explanation-text" id="explanationText">${formatExplanation(data.currentExplanation, data.currentJargon || [])}</div>
      ${keyPointsHtml}

      <!-- Smart Follow-up Chips -->
      ${Array.isArray(data.currentFollowUps) && data.currentFollowUps.length > 0 ? `
        <div class="smart-chips-container" id="smartChipsContainer">
          <div class="smart-chips-header">
            <span>💡 Smart Follow-Ups</span>
            <span style="font-size:10px;opacity:0.75;">Click to explore</span>
          </div>
          <div class="smart-chips-row">
            ${data.currentFollowUps.map(q => `
              <button type="button" class="smart-chip-btn" data-q="${escapeHtml(q)}">
                <span>❓</span><span>${escapeHtml(q)}</span>
              </button>
            `).join('')}
          </div>
          <div id="followupAnswerDrawer" style="display:none;" class="followup-answer-drawer">
            <div class="followup-drawer-q" id="followupDrawerQ"></div>
            <div class="followup-drawer-a" id="followupDrawerA"></div>
          </div>
        </div>
      ` : ''}

      <!-- Gamified Learning / Quiz Mode Banner -->
      <div class="card-quiz-trigger-banner" id="cardQuizTriggerBanner">
        <div class="cq-banner-left">
          <span class="cq-banner-icon">🎮</span>
          <div class="cq-banner-text">
            <strong>Test My Knowledge</strong>
            <span>Quick 3-question MCQ challenge on this concept!</span>
          </div>
        </div>
        <button type="button" class="btn-test-knowledge" id="btnTestKnowledgeDirect">
          Play Quiz ➔
        </button>
      </div>

      <!-- Bias Meter & Fact Checker Banner -->
      <div class="card-bias-trigger-banner" id="cardBiasTriggerBanner">
        <div class="cq-banner-left">
          <span class="cq-banner-icon" style="font-size:20px;">⚖️</span>
          <div class="cq-banner-text">
            <strong>Bias &amp; Hype Detector</strong>
            <span>Audit article for marketing hype &amp; hidden agenda</span>
          </div>
        </div>
        <button type="button" class="btn-check-bias" id="btnCheckBiasDirect">
          Audit ➔
        </button>
      </div>
    `;

    // Hook Jargon Tooltips in body
    setupJargonTooltips(body);

    // Hook Complexity / Tone pills
    const complexityBar = body.querySelector('#cardComplexityBar');
    if (complexityBar) {
      complexityBar.querySelectorAll('.complexity-pill').forEach(pill => {
        pill.addEventListener('click', async () => {
          const newTone = pill.getAttribute('data-tone');
          if (newTone === data.currentTone) return;

          complexityBar.querySelectorAll('.complexity-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          data.currentTone = newTone;

          setAvatarState('thinking');
          const bubbleText = body.querySelector('#avatarBubbleText');
          if (bubbleText) bubbleText.textContent = `Adapting explanation to ${newTone.replace('_', ' ')} style...`;

          try {
            const resp = await chrome.runtime.sendMessage({
              action: 'REWRITE_TONE',
              text: data.originalExplanation,
              tone: newTone,
              language: data.currentLanguage
            });

            if (resp && resp.success && resp.result) {
              data.currentExplanation = resp.result.explanation;
              data.currentKeyPoints = resp.result.key_points || [];
              data.currentFollowUps = resp.result.follow_ups || [];
              data.currentJargon = resp.result.jargon || [];
              renderCardContent(data);
            } else {
              setAvatarState('happy');
              if (bubbleText) bubbleText.textContent = 'Could not rewrite in this tone.';
            }
          } catch (err) {
            console.warn('Tone rewrite error:', err);
            setAvatarState('happy');
            if (bubbleText) bubbleText.textContent = 'Rewrite error. Please try again.';
          }
        });
      });
    }

    // Hook Smart Follow-up Chips
    const chipsContainer = body.querySelector('#smartChipsContainer');
    if (chipsContainer) {
      const drawer = chipsContainer.querySelector('#followupAnswerDrawer');
      const drawerQ = chipsContainer.querySelector('#followupDrawerQ');
      const drawerA = chipsContainer.querySelector('#followupDrawerA');

      chipsContainer.querySelectorAll('.smart-chip-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const q = btn.getAttribute('data-q');
          if (!q) return;

          drawer.style.display = 'block';
          drawerQ.innerHTML = `<span>❓</span> <span>${escapeHtml(q)}</span>`;
          drawerA.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;color:#94a3b8;padding:4px 0;">
              <div class="spinner" style="width:14px;height:14px;"></div>
              <span>${escapeHtml(pConf.name)} is explaining...</span>
            </div>
          `;
          drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          try {
            const resp = await chrome.runtime.sendMessage({
              action: 'FOLLOWUP_QUESTION',
              text: q,
              history: [
                { role: 'user', text: lastExplainRequest?.text || 'Explain concept' },
                { role: 'model', text: data.currentExplanation }
              ],
              targetLanguage: data.currentLanguage
            });

            if (resp && resp.success && resp.explanation) {
              drawerA.innerHTML = formatExplanation(resp.explanation, resp.jargon || []);
              setupJargonTooltips(drawerA);
            } else {
              drawerA.innerHTML = `<span style="color:#f87171;">Failed to load follow-up explanation.</span>`;
            }
          } catch (err) {
            drawerA.innerHTML = `<span style="color:#f87171;">Error: ${escapeHtml(err.message)}</span>`;
          }
        });
      });
    }

    // Hook Quiz Banner button
    const bannerQuizBtn = body.querySelector('#btnTestKnowledgeDirect');
    if (bannerQuizBtn) {
      bannerQuizBtn.addEventListener('click', () => startCardQuiz(data));
    }

    // Hook Bias Banner button
    const bannerBiasBtn = body.querySelector('#btnCheckBiasDirect');
    if (bannerBiasBtn) {
      bannerBiasBtn.addEventListener('click', () => startCardBiasAnalysis(data));
    }

    // Hook Vibrator Toggle Button
    const vibToggleBtn = body.querySelector('#vibratorToggleBtn');
    if (vibToggleBtn) {
      vibToggleBtn.addEventListener('click', () => {
        if (isSpeaking) {
          stopSpeech();
          updateAvatarSpeechState(false);
          updateSpeakBtnUI(false);
        } else {
          speakExplanationText(
            data.currentExplanation,
            data.currentKeyPoints,
            data.currentLanguage,
            data.voiceAccent,
            () => {
              updateAvatarSpeechState(true);
              updateSpeakBtnUI(true);
            },
            () => {
              updateAvatarSpeechState(false);
              updateSpeakBtnUI(false);
            }
          );
        }
      });
    }

    // Footer with Bias, Quiz, Export & Copy Actions
    if (footer) {
      footer.innerHTML = `
        <div class="footer-actions">
          <button type="button" class="btn-card-action btn-bias" id="cardCheckBiasBtn" title="Audit article for bias, marketing hype & missing facts">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18M3 9l9-6 9 6M6 14l-3-5h6l-3 5zm12 0l-3-5h6l-3 5z"></path>
            </svg>
            <span>⚖️ Bias</span>
          </button>
          <button type="button" class="btn-card-action btn-quiz" id="cardTestKnowledgeBtn" title="Test your knowledge with an interactive 3-question quiz!">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <line x1="6" y1="12" x2="10" y2="12"></line>
              <line x1="8" y1="10" x2="8" y2="14"></line>
              <circle cx="15" cy="11" r="1"></circle>
              <circle cx="17" cy="13" r="1"></circle>
            </svg>
            <span>🎮 Quiz</span>
          </button>
          <button type="button" class="btn-card-action btn-export" id="cardExportBtn" title="Export Explanation in various formats">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            <span>Export</span>
          </button>
          <button type="button" class="btn-card-action btn-copy" id="copyExplanationBtn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
        <span>Esc to dismiss</span>
      `;

      const cardBiasBtn = footer.querySelector('#cardCheckBiasBtn');
      if (cardBiasBtn) {
        cardBiasBtn.addEventListener('click', () => startCardBiasAnalysis(data));
      }

      const cardQuizBtn = footer.querySelector('#cardTestKnowledgeBtn');
      if (cardQuizBtn) {
        cardQuizBtn.addEventListener('click', () => startCardQuiz(data));
      }

      const exportBtn = footer.querySelector('#cardExportBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const existing = footer.querySelector('#exportMenuDropdown');
          if (existing) {
            existing.remove();
            return;
          }

          const dropdown = document.createElement('div');
          dropdown.className = 'export-menu-dropdown';
          dropdown.id = 'exportMenuDropdown';
          dropdown.innerHTML = `
            <button type="button" class="export-menu-item" data-type="markdown">
              <span>📋</span><span>Markdown</span>
            </button>
            <button type="button" class="export-menu-item" data-type="anki">
              <span>📇</span><span>Anki Flashcard</span>
            </button>
            <button type="button" class="export-menu-item" data-type="tweet">
              <span>🐦</span><span>Social Thread</span>
            </button>
            <button type="button" class="export-menu-item" data-type="notion">
              <span>📝</span><span>Notion Callout</span>
            </button>
          `;

          exportBtn.appendChild(dropdown);

          dropdown.querySelectorAll('.export-menu-item').forEach(item => {
            item.addEventListener('click', async (evt) => {
              evt.stopPropagation();
              const exportType = item.getAttribute('data-type');
              const textToCopy = generateExportContent(data, exportType);
              try {
                await navigator.clipboard.writeText(textToCopy);
                showMiniToast(`Copied as ${exportType.toUpperCase()}!`);
              } catch (_) {}
              dropdown.remove();
            });
          });
        });
      }

      const copyBtn = footer.querySelector('#copyExplanationBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          let fullCopy = data.currentExplanation;
          if (data.currentKeyPoints && data.currentKeyPoints.length > 0) {
            fullCopy += '\n\nKey Takeaways:\n' + data.currentKeyPoints.map(p => `• ${p}`).join('\n');
          }

          try {
            await navigator.clipboard.writeText(fullCopy);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Copied!</span>
            `;
            setTimeout(() => {
              if (copyBtn) {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = `
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy</span>
                `;
              }
            }, 1800);
          } catch (e) {
            console.error('Clipboard copy failed:', e);
          }
        });
      }
    }
  }

  /**
   * Confetti Particle Shower for Card
   */
  function triggerCardConfetti(containerEl) {
    if (!containerEl) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'explainer-confetti-canvas';
    containerEl.appendChild(canvas);

    const rect = containerEl.getBoundingClientRect();
    canvas.width = rect.width || 420;
    canvas.height = rect.height || 460;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7', '#f43f5e', '#eab308'];
    const particleCount = 55;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 11,
        vy: -Math.random() * 8 - 4,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        isRound: Math.random() > 0.5
      });
    }

    let start = null;
    const duration = 2200;

    function frame(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24; // gravity
        p.vx *= 0.98; // friction
        p.rotation += p.rotSpeed;
        p.opacity = Math.max(0, 1 - progress / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.isRound) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        }
        ctx.restore();
      }

      if (progress < duration) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  /**
   * Starts Gamified Learning / Quiz Mode inside current card
   */
  async function startCardQuiz(data) {
    if (!currentCard) return;
    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    if (isSpeaking) {
      stopSpeech();
      updateAvatarSpeechState(false);
    }

    setAvatarState('thinking');
    const avatarBadge = currentCard.querySelector('#avatarBadge');
    if (avatarBadge) avatarBadge.textContent = '🎮 Quiz Mode';
    const bubbleText = currentCard.querySelector('#avatarBubbleText');
    if (bubbleText) bubbleText.textContent = 'Crafting 3 fun MCQs from your text to test what you learned...';

    body.innerHTML = `
      <div class="avatar-mentor-banner">
        ${getAvatarMarkup('thinking')}
        <div class="avatar-bubble">
          <div class="avatar-bubble-header">
            <span class="avatar-name">Maya • AI Mentor</span>
            <span class="avatar-badge" style="background:rgba(236,72,153,0.18);color:#f472b6;border:1px solid rgba(236,72,153,0.35);">🎮 Quiz Challenge</span>
          </div>
          <div class="avatar-bubble-text">
            Generating 3 interactive multiple-choice questions from your text...
          </div>
        </div>
      </div>
      <div class="loading-container" style="padding:24px 0;">
        <div class="spinner"></div>
        <div class="loading-text">Crafting your knowledge challenge...</div>
        <div class="loading-subtext">3 questions • Instant feedback • Confetti celebrations!</div>
      </div>
    `;

    if (footer) {
      footer.innerHTML = `
        <div class="footer-actions">
          <button type="button" class="btn-card-action" id="cardQuizBackBtn" title="Back to explanation">
            <span>← Back to Explanation</span>
          </button>
        </div>
        <span class="voice-accent-pill">🎮 Gamified Quiz</span>
      `;
      const backBtn = footer.querySelector('#cardQuizBackBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => renderCardContent(data));
      }
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_QUIZ',
        text: data.currentExplanation || data.originalExplanation || '',
        language: data.currentLanguage || 'English'
      });

      if (!response || !response.success || !response.quiz || !response.quiz.questions?.length) {
        throw new Error(response?.error || 'Failed to generate quiz questions.');
      }

      runCardQuizEngine(response.quiz, data);
    } catch (err) {
      console.error('Quiz error:', err);
      body.innerHTML = `
        <div style="padding:16px 8px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
          <div style="font-size:13px;font-weight:600;color:#f87171;margin-bottom:6px;">Quiz Generation Failed</div>
          <div style="font-size:11px;color:var(--card-subtext);line-height:1.4;margin-bottom:14px;">${escapeHtml(err.message)}</div>
          <button type="button" class="btn-test-knowledge" id="cardQuizRetryBtn" style="margin:0 auto;">
            🔄 Try Again
          </button>
        </div>
      `;
      const retryBtn = body.querySelector('#cardQuizRetryBtn');
      if (retryBtn) retryBtn.addEventListener('click', () => startCardQuiz(data));
    }
  }

  /**
   * Runs the interactive 3-question quiz step-by-step
   */
  function runCardQuizEngine(quiz, originalData) {
    if (!currentCard) return;
    const questions = quiz.questions;
    let currentIndex = 0;
    let currentScore = 0;
    const totalQuestions = questions.length;

    function showQuestion(index) {
      if (!currentCard) return;
      const body = currentCard.querySelector('.card-body');
      const footer = currentCard.querySelector('.card-footer');
      if (!body) return;

      if (index >= totalQuestions) {
        showSummary();
        return;
      }

      const q = questions[index];
      const progressPct = Math.round(((index + 1) / totalQuestions) * 100);

      body.innerHTML = `
        <div class="quiz-card-view">
          <div class="quiz-top-bar">
            <span class="quiz-progress-badge">🎯 Question ${index + 1} of ${totalQuestions}</span>
            <span class="quiz-score-badge">⭐ Score: ${currentScore} / ${totalQuestions}</span>
          </div>

          <div class="quiz-progress-bar-track">
            <div class="quiz-progress-bar-fill" style="width: ${progressPct}%;"></div>
          </div>

          <div class="quiz-question-box">${escapeHtml(q.question)}</div>

          <div class="quiz-options-grid" id="cardQuizOptionsGrid">
            ${q.options.map((opt, optIdx) => `
              <button type="button" class="quiz-option-btn" data-opt-index="${optIdx}">
                <span class="quiz-option-letter">${String.fromCharCode(65 + optIdx)}</span>
                <span class="quiz-option-text">${escapeHtml(opt)}</span>
              </button>
            `).join('')}
          </div>

          <div id="cardQuizFeedbackArea"></div>
        </div>
      `;

      if (footer) {
        footer.innerHTML = `
          <div class="footer-actions">
            <button type="button" class="btn-card-action" id="cardQuizExitBtn">
              <span>Exit Quiz</span>
            </button>
          </div>
          <span class="voice-accent-pill">🎮 ${quiz.title || 'Knowledge Challenge'}</span>
        `;
        const exitBtn = footer.querySelector('#cardQuizExitBtn');
        if (exitBtn) {
          exitBtn.addEventListener('click', () => renderCardContent(originalData));
        }
      }

      const optionsGrid = body.querySelector('#cardQuizOptionsGrid');
      const feedbackArea = body.querySelector('#cardQuizFeedbackArea');
      let answered = false;

      optionsGrid.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;

          const chosenIdx = parseInt(btn.getAttribute('data-opt-index'), 10);
          const isCorrect = chosenIdx === q.correctIndex;

          optionsGrid.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.disabled = true;
          });

          if (isCorrect) {
            currentScore++;
            btn.classList.add('correct');
            triggerCardConfetti(currentCard);

            const scoreBadge = body.querySelector('.quiz-score-badge');
            if (scoreBadge) scoreBadge.textContent = `⭐ Score: ${currentScore} / ${totalQuestions}`;

            feedbackArea.innerHTML = `
              <div class="quiz-feedback-box correct">
                <span style="font-size:16px;">🎉</span>
                <div>
                  <strong>Correct! Sahi Jawab! (+10 XP)</strong>
                  <div style="margin-top:2px;">${escapeHtml(q.explanation)}</div>
                </div>
              </div>
              <button type="button" class="quiz-next-btn" id="cardQuizNextBtn">
                ${index + 1 < totalQuestions ? 'Next Question ➔' : 'View Final Score 🏆'}
              </button>
            `;
          } else {
            btn.classList.add('incorrect');
            const correctBtn = optionsGrid.querySelector(`[data-opt-index="${q.correctIndex}"]`);
            if (correctBtn) correctBtn.classList.add('correct-reveal');

            feedbackArea.innerHTML = `
              <div class="quiz-feedback-box incorrect">
                <span style="font-size:16px;">💡</span>
                <div>
                  <strong>Incorrect!</strong> The correct answer was <b>${escapeHtml(q.options[q.correctIndex])}</b>.
                  <div style="margin-top:2px;">${escapeHtml(q.explanation)}</div>
                </div>
              </div>
              <button type="button" class="quiz-next-btn" id="cardQuizNextBtn">
                ${index + 1 < totalQuestions ? 'Next Question ➔' : 'View Final Score 🏆'}
              </button>
            `;
          }

          const nextBtn = feedbackArea.querySelector('#cardQuizNextBtn');
          if (nextBtn) {
            nextBtn.addEventListener('click', () => {
              currentIndex++;
              showQuestion(currentIndex);
            });
          }
        });
      });
    }

    function showSummary() {
      if (!currentCard) return;
      const body = currentCard.querySelector('.card-body');
      const footer = currentCard.querySelector('.card-footer');
      if (!body) return;

      const pct = Math.round((currentScore / totalQuestions) * 100);
      let trophy = '🌟';
      let title = 'Great Effort!';
      let praise = 'You explored new concepts today. Keep challenging yourself to master every topic!';

      if (currentScore === totalQuestions) {
        trophy = '🏆';
        title = 'Quiz Master! 100%';
        praise = 'Flawless victory! You answered all questions correctly. Outstanding understanding!';
        triggerCardConfetti(currentCard);
        setTimeout(() => triggerCardConfetti(currentCard), 400);
      } else if (currentScore >= 2) {
        trophy = '🥇';
        title = 'Brilliant Score!';
        praise = 'Superb performance! You got most questions right. You have a solid grasp of this concept!';
        triggerCardConfetti(currentCard);
      }

      body.innerHTML = `
        <div class="quiz-summary-box">
          <div class="quiz-trophy-icon">${trophy}</div>
          <div class="quiz-summary-title">${title}</div>
          <div class="quiz-score-pill-large">
            Score: ${currentScore} / ${totalQuestions} (${pct}%)
          </div>
          <div class="quiz-summary-praise">${praise}</div>
          <div class="quiz-summary-actions">
            <button type="button" class="btn btn-secondary" id="cardQuizRetrySummaryBtn">
              🔄 Retry Quiz
            </button>
            <button type="button" class="btn btn-primary" id="cardQuizDoneBtn">
              📖 Back to Notes
            </button>
          </div>
        </div>
      `;

      if (footer) {
        footer.innerHTML = `
          <div class="footer-actions">
            <span style="font-size:11px;color:var(--card-subtext);">🎮 Gamified Learning Complete</span>
          </div>
          <span class="voice-accent-pill">${currentScore}/${totalQuestions} Passed</span>
        `;
      }

      const retryBtn = body.querySelector('#cardQuizRetrySummaryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          runCardQuizEngine(quiz, originalData);
        });
      }

      const doneBtn = body.querySelector('#cardQuizDoneBtn');
      if (doneBtn) {
        doneBtn.addEventListener('click', () => {
          renderCardContent(originalData);
        });
      }
    }

    showQuestion(0);
  }

  /**
   * Starts Bias & Fact Check analysis inside the current card
   */
  async function startCardBiasAnalysis(data) {
    if (!currentCard) return;
    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    if (isSpeaking) {
      stopSpeech();
      updateAvatarSpeechState(false);
    }

    setAvatarState('thinking');
    const avatarBadge = currentCard.querySelector('#avatarBadge');
    if (avatarBadge) avatarBadge.textContent = '⚖️ Fact Check';
    const bubbleText = currentCard.querySelector('#avatarBubbleText');
    if (bubbleText) bubbleText.textContent = 'Auditing article for marketing hype, biased claims, and missing context...';

    body.innerHTML = `
      <div class="avatar-mentor-banner">
        ${getAvatarMarkup('thinking')}
        <div class="avatar-bubble">
          <div class="avatar-bubble-header">
            <span class="avatar-name">Maya • Fact-Check Watchdog</span>
            <span class="avatar-badge" style="background:rgba(56,189,248,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);">⚖️ Bias Meter</span>
          </div>
          <div class="avatar-bubble-text">
            Auditing content for exaggerated claims, hidden commercial agenda, and omitted context...
          </div>
        </div>
      </div>
      <div class="loading-container" style="padding:24px 0;">
        <div class="spinner"></div>
        <div class="loading-text">Auditing article credibility &amp; bias...</div>
        <div class="loading-subtext">Checking claims • Scanning marketing hype • Analyzing agenda</div>
      </div>
    `;

    if (footer) {
      footer.innerHTML = `
        <div class="footer-actions">
          <button type="button" class="btn-card-action" id="cardBiasBackBtn" title="Back to explanation">
            <span>← Back to Explanation</span>
          </button>
        </div>
        <span>Esc to dismiss</span>
      `;
      const backBtn = footer.querySelector('#cardBiasBackBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => renderCardContent(data));
      }
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ANALYZE_BIAS',
        text: data.currentExplanation || data.originalExplanation || '',
        language: data.currentLanguage || 'English'
      });

      if (!response || !response.success || !response.analysis) {
        throw new Error(response?.error || 'Failed to analyze article bias.');
      }

      renderCardBiasResults(response.analysis, data);
    } catch (err) {
      console.error('Bias analysis error:', err);
      body.innerHTML = `
        <div style="padding:16px 8px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
          <div style="font-size:13px;font-weight:600;color:#f87171;margin-bottom:6px;">Analysis Failed</div>
          <div style="font-size:11px;color:var(--card-subtext);line-height:1.4;margin-bottom:14px;">${escapeHtml(err.message)}</div>
          <button type="button" class="btn-check-bias" id="cardBiasRetryBtn" style="margin:0 auto;">
            🔄 Try Again
          </button>
        </div>
      `;
      const retryBtn = body.querySelector('#cardBiasRetryBtn');
      if (retryBtn) retryBtn.addEventListener('click', () => startCardBiasAnalysis(data));
    }
  }

  // In-page highlight tracker
  let activePageHighlights = [];

  function highlightPhrasesOnPage(phrases) {
    clearBiasPageHighlights();
    if (!Array.isArray(phrases) || phrases.length === 0) return 0;

    let totalHighlights = 0;
    const cleanPhrases = phrases.map(p => p.trim()).filter(p => p.length >= 4);
    if (cleanPhrases.length === 0) return 0;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'textarea', 'input', 'noscript', 'code'].includes(tag)) return NodeFilter.FILTER_REJECT;
          if (parent.closest('#ai-explainer-card, .ai-floating-btn')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const textNode of textNodes) {
      if (!textNode.parentNode) continue;
      const text = textNode.nodeValue;
      for (const phrase of cleanPhrases) {
        const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
        if (idx !== -1) {
          try {
            const range = document.createRange();
            range.setStart(textNode, idx);
            range.setEnd(textNode, idx + phrase.length);
            const mark = document.createElement('mark');
            mark.className = 'maya-bias-page-highlight';
            mark.setAttribute('data-maya-highlight', 'true');
            mark.title = 'Flagged for marketing hype / bias by Maya AI';
            range.surroundContents(mark);
            activePageHighlights.push(mark);
            totalHighlights++;
            break;
          } catch (e) {
            // Ignore Range surround errors for fragmented nodes
          }
        }
      }
      if (totalHighlights >= 15) break;
    }

    return totalHighlights;
  }

  function clearBiasPageHighlights() {
    const marks = document.querySelectorAll('mark[data-maya-highlight="true"]');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    activePageHighlights = [];
  }

  /**
   * Renders the interactive Bias Meter and Fact Check report inside the card (Multi-dimensional 2.0)
   */
  function renderCardBiasResults(analysis, originalData) {
    if (!currentCard) return;
    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    const trustScore = parseInt(analysis.trustScore ?? analysis.credibilityScore ?? 65, 10);
    const level = analysis.biasLevel || (trustScore >= 75 ? 'low' : trustScore >= 50 ? 'medium' : 'high');

    setAvatarState(level === 'low' ? 'happy' : 'thinking');
    const avatarBadge = currentCard.querySelector('#avatarBadge');
    if (avatarBadge) avatarBadge.textContent = `Trust: ${trustScore}/100`;
    const bubbleText = currentCard.querySelector('#avatarBubbleText');
    if (bubbleText) bubbleText.textContent = analysis.summary;

    // Circumference for r=26 is ~163.36
    const circumference = 163.36;
    const strokeOffset = Math.round(circumference * (1 - trustScore / 100));

    // Multi-metrics sub-scores
    const evidenceScore = analysis.metrics?.evidenceScore ?? Math.max(5, trustScore - 8);
    const objectivityScore = analysis.metrics?.objectivityScore ?? trustScore;
    const sensationalismScore = analysis.metrics?.sensationalismScore ?? Math.max(5, 100 - trustScore);

    const claimsList = analysis.exaggeratedClaims.map(c => `
      <li class="bias-bullet-item claims">
        <span class="bias-item-dot"></span>
        <span>${escapeHtml(c)}</span>
      </li>
    `).join('');

    const missingList = analysis.missingContext.map(m => `
      <li class="bias-bullet-item missing">
        <span class="bias-item-dot"></span>
        <span>${escapeHtml(m)}</span>
      </li>
    `).join('');

    const tipsList = analysis.factCheckTips.map(t => `
      <li class="bias-bullet-item tips">
        <span class="bias-item-dot"></span>
        <span>${escapeHtml(t)}</span>
      </li>
    `).join('');

    // Clean potential agenda of any repeated "Author motive:" or "Motive:"
    let cleanAgenda = (analysis.potentialAgenda || 'Informational context.').replace(/^(author\s*motive|motive|agenda)\s*:\s*/i, '').trim();

    body.innerHTML = `
      <div class="bias-card-view">
        <!-- Hero Meter Score with Radial Gauge -->
        <div class="bias-score-hero">
          <div class="bias-gauge-radial">
            <svg viewBox="0 0 64 64" class="bias-gauge-svg">
              <circle cx="32" cy="32" r="26" class="bias-gauge-bg-ring"></circle>
              <circle cx="32" cy="32" r="26" class="bias-gauge-fill-ring level-${level}" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeOffset};"></circle>
            </svg>
            <div class="bias-gauge-inner">
              <span class="bias-gauge-val">${trustScore}</span>
              <span class="bias-gauge-sub">TRUST / 100</span>
            </div>
          </div>
          <div class="bias-hero-info">
            <div class="bias-meta-pills">
              <span class="bias-rating-pill level-${level}">
                ${level === 'low' ? '🟢 High Credibility' : level === 'medium' ? '🟡 Moderate Hype / Caution' : '🔴 High Bias &amp; Spin'}
              </span>
              <span class="bias-stance-tag">${escapeHtml(analysis.stanceType || 'Editorial Analysis')}</span>
            </div>
            <div class="bias-summary-text">${escapeHtml(analysis.summary)}</div>
          </div>
        </div>

        <!-- Multi-metric progress bars -->
        <div class="bias-metrics-card">
          <div class="bias-metric-row">
            <div class="bias-metric-header">
              <span>📊 Evidence &amp; Sourcing</span>
              <span class="bias-metric-val">${evidenceScore}%</span>
            </div>
            <div class="bias-bar-track">
              <div class="bias-bar-fill evidence" style="width: ${evidenceScore}%"></div>
            </div>
          </div>
          <div class="bias-metric-row">
            <div class="bias-metric-header">
              <span>⚖️ Tone Objectivity</span>
              <span class="bias-metric-val">${objectivityScore}%</span>
            </div>
            <div class="bias-bar-track">
              <div class="bias-bar-fill objectivity" style="width: ${objectivityScore}%"></div>
            </div>
          </div>
          <div class="bias-metric-row">
            <div class="bias-metric-header">
              <span>🚨 Sensationalism &amp; Hype</span>
              <span class="bias-metric-val">${sensationalismScore}%</span>
            </div>
            <div class="bias-bar-track">
              <div class="bias-bar-fill sensationalism" style="width: ${sensationalismScore}%"></div>
            </div>
          </div>
        </div>

        <!-- Optional Neutral Rewrite Box (Toggled via button) -->
        <div class="bias-neutral-section" id="cardNeutralRewriteSection" style="display:none;">
          <div class="bias-section-title" style="color:#a5b4fc;">
            <span>✨</span> Maya's Objective Rewrite (Hype-Free)
          </div>
          <div class="bias-neutral-box">${escapeHtml(analysis.neutralRewrite || analysis.summary)}</div>
        </div>

        <!-- Exaggerated Claims -->
        <div class="bias-audit-section">
          <div class="bias-section-title" style="color:#f87171;">
            <span>🚨</span> Exaggerated Claims / Hype
          </div>
          <ul class="bias-bullet-list">${claimsList}</ul>
        </div>

        <!-- Missing Facts & Counter-Evidence -->
        <div class="bias-audit-section">
          <div class="bias-section-title" style="color:#fbbf24;">
            <span>🔍</span> Missing Context &amp; Counterpoints
          </div>
          <ul class="bias-bullet-list">${missingList}</ul>
        </div>

        <!-- Potential Agenda / Commercial Motive -->
        <div class="bias-audit-section">
          <div class="bias-section-title" style="color:#818cf8;">
            <span>🎯</span> Author Motive &amp; Bias Assessment
          </div>
          <div class="bias-agenda-box">${escapeHtml(cleanAgenda)}</div>
        </div>

        <!-- Verification Tips -->
        <div class="bias-audit-section">
          <div class="bias-section-title" style="color:#38bdf8;">
            <span>💡</span> How to Verify This Topic
          </div>
          <ul class="bias-bullet-list">${tipsList}</ul>
        </div>
      </div>
    `;

    if (footer) {
      footer.innerHTML = `
        <div class="footer-actions" style="display:flex; flex-wrap:wrap; gap:6px; width:100%;">
          <button type="button" class="btn-card-action" id="cardBiasReturnBtn">
            <span>← Back</span>
          </button>
          <button type="button" class="btn-card-action" id="cardBiasNeutralToggleBtn" title="View unbiased, purely objective rewrite">
            <span>✨ Neutral Rewrite</span>
          </button>
          <button type="button" class="btn-card-action" id="cardBiasHighlightBtn" title="Highlight biased phrases on the webpage">
            <span>🔍 Highlight on Page</span>
          </button>
        </div>
      `;

      const returnBtn = footer.querySelector('#cardBiasReturnBtn');
      if (returnBtn) {
        returnBtn.addEventListener('click', () => {
          clearBiasPageHighlights();
          renderCardContent(originalData);
        });
      }

      const neutralToggleBtn = footer.querySelector('#cardBiasNeutralToggleBtn');
      const neutralSection = body.querySelector('#cardNeutralRewriteSection');
      if (neutralToggleBtn && neutralSection) {
        neutralToggleBtn.addEventListener('click', () => {
          const isHidden = neutralSection.style.display === 'none';
          neutralSection.style.display = isHidden ? 'flex' : 'none';
          neutralToggleBtn.classList.toggle('active-toggle', isHidden);
          if (isHidden) {
            neutralSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }

      const highlightBtn = footer.querySelector('#cardBiasHighlightBtn');
      let isHighlighting = false;
      if (highlightBtn) {
        highlightBtn.addEventListener('click', () => {
          if (!isHighlighting) {
            const phrasesToHighlight = (analysis.flaggedPhrases && analysis.flaggedPhrases.length)
              ? analysis.flaggedPhrases
              : analysis.exaggeratedClaims;
            const count = highlightPhrasesOnPage(phrasesToHighlight);
            isHighlighting = true;
            highlightBtn.classList.add('active-toggle');
            highlightBtn.querySelector('span').textContent = count > 0 ? `🔍 Highlighted (${count})` : '🔍 No Matches';
          } else {
            clearBiasPageHighlights();
            isHighlighting = false;
            highlightBtn.classList.remove('active-toggle');
            highlightBtn.querySelector('span').textContent = '🔍 Highlight on Page';
          }
        });
      }
    }
  }

  /**
   * Handles on-the-fly explanation translation
   */
  async function handleTranslateRequest(targetLang) {
    if (!currentCardData) return;
    stopSpeech();

    // 1. If returning to Original
    if (targetLang === 'Original') {
      currentCardData.currentExplanation = currentCardData.originalExplanation;
      currentCardData.currentKeyPoints = currentCardData.originalKeyPoints;
      currentCardData.currentLanguage = 'Original';
      renderCardContent(currentCardData);
      return;
    }

    // 2. Check in-memory translation cache
    if (translationCache[targetLang]) {
      currentCardData.currentExplanation = translationCache[targetLang].explanation;
      currentCardData.currentKeyPoints = translationCache[targetLang].key_points;
      currentCardData.currentLanguage = targetLang;
      renderCardContent(currentCardData);
      return;
    }

    // 3. Request translation from background
    setAvatarState('thinking');
    const badge = currentCard?.querySelector('#avatarBadge');
    if (badge) badge.textContent = `Translating to ${targetLang}...`;

    const bubbleText = currentCard?.querySelector('#avatarBubbleText');
    // Show correct AI source in status text
    const aiSourceLabel = (currentCardData?.provider === 'Ollama') ? 'Ollama' : 'AI';
    if (bubbleText) bubbleText.textContent = `Translating explanation into ${targetLang} with ${aiSourceLabel}...`;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'TRANSLATE_EXPLANATION',
        explanation: currentCardData.originalExplanation,
        key_points: currentCardData.originalKeyPoints,
        targetLanguage: targetLang
      });

      if (response && response.success) {
        translationCache[targetLang] = {
          explanation: response.explanation,
          key_points: response.key_points || []
        };
        currentCardData.currentExplanation = response.explanation;
        currentCardData.currentKeyPoints = response.key_points || [];
        currentCardData.currentLanguage = targetLang;
        renderCardContent(currentCardData);
      } else {
        showMiniToast(response?.error || 'Translation failed');
        setAvatarState('happy');
      }
    } catch (err) {
      showMiniToast('Error communicating with translation service');
      setAvatarState('happy');
    }
  }

  /**
   * Updates the card to show an error message
   */
  function showErrorCard({ error }) {
    if (!currentCard) return;

    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    // Detect overload vs other errors
    const isOverload = error && (error.includes('503') || error.includes('overload') || error.includes('high demand') || error.includes('temporarily'));
    const isRateLimit = error && error.includes('429');
    const isApiKey = error && (error.includes('API key') || error.includes('401') || error.includes('403'));

    let avatarMsg, errorTitle, errorDetail, retryHint;

    if (isOverload || isRateLimit) {
      avatarMsg = "Gemini is a bit busy right now — I'll try again in a moment!";
      errorTitle = isRateLimit ? '⏳ Rate limit reached' : '🌐 Gemini API busy';
      errorDetail = 'The AI is experiencing high demand right now. This is temporary — please try again in a few seconds.';
      retryHint = true;
    } else if (isApiKey) {
      avatarMsg = 'Your API key needs attention. Please check Settings.';
      errorTitle = '🔑 API Key issue';
      errorDetail = error || 'Please check your Gemini API key in the extension settings.';
      retryHint = false;
    } else {
      avatarMsg = "Oops! I couldn't complete the explanation just now.";
      errorTitle = 'Unable to generate explanation';
      errorDetail = error || 'An unexpected error occurred.';
      retryHint = !!lastExplainRequest;
    }

    body.innerHTML = `
      <div class="avatar-mentor-banner">
        ${getAvatarMarkup('idle')}
        <div class="avatar-bubble">
          <div class="avatar-bubble-header">
            <span class="avatar-name">Maya • AI Mentor</span>
            <span class="avatar-badge" style="color:#ef4444; border-color:#ef4444;">Notice</span>
          </div>
          <div class="avatar-bubble-text">${escapeHtml(avatarMsg)}</div>
        </div>
      </div>
      <div class="error-container">
        <div class="error-title">${escapeHtml(errorTitle)}</div>
        <div style="font-size:13px; line-height:1.6; margin-top:6px; color:var(--card-body-text)">${escapeHtml(errorDetail)}</div>
        ${retryHint ? `
          <button type="button" id="retryExplainBtn" style="
            margin-top:14px;
            padding:8px 20px;
            background: linear-gradient(135deg,#6366f1,#8b5cf6);
            color:#fff;
            border:none;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            gap:7px;
            transition: opacity 0.2s;
          ">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Try Again
          </button>` : ''}
      </div>
    `;

    // Wire retry button
    const retryBtn = body.querySelector('#retryExplainBtn');
    if (retryBtn && lastExplainRequest) {
      let countdown = isOverload ? 3 : 0;
      const doRetry = () => {
        retryBtn.disabled = true;
        retryBtn.style.opacity = '0.5';
        showLoadingCard(lastExplainRequest);
        chrome.runtime.sendMessage({
          action: 'TRIGGER_EXPLAIN',
          text: lastExplainRequest.text,
          pageUrl: lastExplainRequest.pageUrl
        });
      };

      if (countdown > 0) {
        retryBtn.textContent = `↺ Retrying in ${countdown}s...`;
        const tick = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(tick);
            doRetry();
          } else {
            retryBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Retrying in ${countdown}s...`;
          }
        }, 1000);
        // Allow manual early click
        retryBtn.addEventListener('click', () => { clearInterval(tick); doRetry(); });
      } else {
        retryBtn.addEventListener('click', doRetry);
      }
    }

    // Update footer
    if (footer) {
      footer.innerHTML = `
        <span style="color:var(--card-subtext);font-size:11px;">Esc to dismiss</span>
      `;
    }
  }

  /**
   * Helper to escape HTML characters
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Helper to escape special regex characters
   */
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  let activeJargonPopover = null;
  function setupJargonTooltips(container) {
    if (!container) return;
    container.querySelectorAll('.jargon-term').forEach(el => {
      el.addEventListener('mouseenter', () => {
        removeJargonPopover();
        const term = el.getAttribute('data-jargon-term') || '';
        const def = el.getAttribute('data-jargon-def') || '';
        if (!def) return;
        const popover = document.createElement('div');
        popover.className = 'jargon-popover-box';
        popover.innerHTML = `
          <div class="jargon-popover-title">📖 ${escapeHtml(term)}</div>
          <div>${escapeHtml(def)}</div>
        `;
        el.appendChild(popover);
        activeJargonPopover = popover;
      });

      el.addEventListener('mouseleave', () => {
        removeJargonPopover();
      });
    });
  }

  function removeJargonPopover() {
    if (activeJargonPopover) {
      try { activeJargonPopover.remove(); } catch (_) {}
      activeJargonPopover = null;
    }
  }

  /**
   * Generates formatted content for 1-click export
   */
  function generateExportContent(data, type) {
    const title = lastExplainRequest?.text ? lastExplainRequest.text.slice(0, 60) : 'AI Explanation';
    const explanation = data.currentExplanation || '';
    const keyPoints = (data.currentKeyPoints || []).map(p => `• ${p}`).join('\n');
    const url = lastExplainRequest?.pageUrl || window.location.href;

    switch (type) {
      case 'markdown':
        return `# Universal AI Explainer: ${title}\n\n${explanation}\n\n### Key Takeaways\n${keyPoints}\n\n*Source: ${url}*`;
      case 'anki':
        return `Front: What is ${title}?\nBack: ${explanation}\n\nKey Takeaways:\n${keyPoints}`;
      case 'tweet':
        return `🧠 ${title}\n\n${explanation.slice(0, 200)}...\n\nKey Takeaways:\n${keyPoints.slice(0, 200)}\n\nExplained via Universal AI Explainer`;
      case 'notion':
        return `> 💡 **${title}**\n>\n> ${explanation.replace(/\n/g, '\n> ')}\n>\n> **Key Takeaways:**\n${(data.currentKeyPoints || []).map(p => `> - ${p}`).join('\n')}\n>\n> *Reference: ${url}*`;
      default:
        return `${explanation}\n\n${keyPoints}`;
    }
  }

  /**
   * Formats markdown text into clean HTML elements with Jargon Term Highlighting
   */
  function formatExplanation(text, jargon = []) {
    if (!text) return '';

    // 1. Stash code blocks
    const codeBlocks = [];
    let formatted = text.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (match, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre class="code-block-wrapper"><code>${escapeHtml(code.trim())}</code></pre>`);
      return `___CODE_BLOCK_${idx}___`;
    });

    // 2. Stash inline code
    const inlineCodes = [];
    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
      return `___INLINE_CODE_${idx}___`;
    });

    // 3. Highlight Jargon terms
    if (Array.isArray(jargon) && jargon.length > 0) {
      jargon.forEach(item => {
        if (!item || !item.term || item.term.length < 2) return;
        const term = item.term.trim();
        const def = (item.definition || '').trim();
        if (!def) return;
        try {
          const reg = new RegExp(`\\b(${escapeRegExp(term)})\\b`, 'gi');
          formatted = formatted.replace(reg, `<span class="jargon-term" data-jargon-term="${escapeHtml(term)}" data-jargon-def="${escapeHtml(def)}">$1</span>`);
        } catch (_) {}
      });
    }

    // 4. Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 5. Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 6. Restore inline code
    inlineCodes.forEach((ic, i) => {
      formatted = formatted.replace(`___INLINE_CODE_${i}___`, ic);
    });

    // 7. Split into paragraphs and restore code blocks
    const paragraphs = formatted.split(/\n\n+/);
    return paragraphs
      .map(p => {
        let trimmed = p.trim();
        codeBlocks.forEach((cb, i) => {
          trimmed = trimmed.replace(`___CODE_BLOCK_${i}___`, cb);
        });
        if (trimmed.startsWith('<pre') && trimmed.endsWith('</pre>')) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
  }

  /**
   * Triggers and renders 30-Second Page TL;DR briefing
   */
  async function openPageTldrCard(initialText = '', pageUrl = '') {
    let textToSummarize = initialText;

    if (!textToSummarize || textToSummarize.length < 50) {
      const articleEl = document.querySelector('article, main, [role="main"], .post-content, .article-content, #content');
      if (articleEl) {
        textToSummarize = articleEl.innerText || '';
      } else {
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.innerText.trim())
          .filter(t => t.length > 50)
          .slice(0, 8);
        textToSummarize = paragraphs.join('\n\n');
      }
      if (!textToSummarize) textToSummarize = document.body?.innerText || '';
    }

    textToSummarize = textToSummarize.slice(0, 4500).trim();
    if (!textToSummarize) {
      showMiniToast('No page content found to summarize.');
      return;
    }

    chrome.storage.local.get(['overlayTheme', 'overlayBgStyle', 'activeAiSource', 'activeOllamaModel', 'targetLanguage', 'defaultLanguage'], async (settings) => {
      showLoadingCard({
        text: 'Analyzing webpage and synthesizing 30-second executive TL;DR...',
        type: 'text',
        theme: settings.overlayTheme || 'dark',
        bgStyle: settings.overlayBgStyle || 'glow',
        aiSource: settings.activeAiSource || 'ollama',
        ollamaModel: settings.activeOllamaModel || ''
      });

      try {
        const resp = await chrome.runtime.sendMessage({
          action: 'SUMMARIZE_PAGE_TLDR',
          text: textToSummarize,
          url: pageUrl || window.location.href,
          language: settings.defaultLanguage || settings.targetLanguage || 'English'
        });

        if (resp && resp.success && resp.summary) {
          showTldrCard(resp.summary, pageUrl || window.location.href, resp.provider);
        } else {
          showErrorCard({ error: resp?.error || 'Failed to generate 30-second TL;DR briefing.' });
        }
      } catch (err) {
        showErrorCard({ error: err.message || 'Error generating TL;DR.' });
      }
    });
  }

  /**
   * Renders the 30-Second Page TL;DR Card View
   */
  function showTldrCard(summary, pageUrl, provider = 'AI') {
    if (!currentCard) return;
    const body = currentCard.querySelector('.card-body');
    const footer = currentCard.querySelector('.card-footer');
    if (!body) return;

    setAvatarState('happy');

    const statsItems = (Array.isArray(summary.key_stats) ? summary.key_stats : [])
      .map(st => `<li class="tldr-stat-item"><span class="tldr-stat-dot"></span><span>${escapeHtml(st)}</span></li>`)
      .join('');

    body.innerHTML = `
      <!-- Avatar Banner -->
      <div class="avatar-mentor-banner">
        ${getAvatarMarkup('happy')}
        <div class="avatar-bubble">
          <div class="avatar-bubble-header">
            <span class="avatar-name">Maya • Executive Briefing</span>
            <span class="avatar-badge" id="avatarBadge">${provider === 'Ollama' ? '🦙 Ollama' : '✨ Gemini'}</span>
          </div>
          <div class="avatar-bubble-text" id="avatarBubbleText">
            30-second executive summary prepared! Click Listen to hear the audio briefing.
          </div>
        </div>
      </div>

      <!-- Dynamic Voice Vibrator Bar -->
      <div class="voice-vibrator-bar" id="voiceVibratorBar">
        <div class="vibrator-info">
          <span class="vibrator-glow-pulse"></span>
          <span class="vibrator-title">Executive Audio</span>
          <span class="vibrator-badge" id="vibratorBadge">Click Listen</span>
        </div>
        <div class="vibrator-wave-track" id="vibratorWaveTrack">
          ${getVibratorBarsMarkup()}
        </div>
        <button type="button" class="btn-vibrator-toggle" id="vibratorToggleBtn" title="Listen to 30s briefing">
          <svg class="vib-play-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg class="vib-stop-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display:none;">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          <span class="vib-btn-text">Listen</span>
        </button>
      </div>

      <!-- TLDR Card View -->
      <div class="tldr-card-view">
        <div class="tldr-hero-punch">
          <div class="tldr-hero-tag-row">
            <span class="tldr-tag-punch">⚡ 30-Second Punchline</span>
            <span class="tldr-time-saved-badge">⏱️ ${escapeHtml(summary.read_time_saved || '5 mins saved')}</span>
          </div>
          <div class="tldr-punch-text">${escapeHtml(summary.tldr)}</div>
        </div>

        <div class="tldr-section">
          <div class="tldr-section-title">
            <span>📖</span><span>Executive Summary</span>
          </div>
          <div class="tldr-body-text">${formatExplanation(summary.quick_read)}</div>
        </div>

        ${statsItems ? `
          <div class="tldr-section">
            <div class="tldr-section-title">
              <span>📊</span><span>Key Numbers &amp; Milestones</span>
            </div>
            <ul class="tldr-stats-list">${statsItems}</ul>
          </div>
        ` : ''}

        <div class="tldr-section" style="border-left: 3px solid #818cf8;">
          <div class="tldr-section-title" style="color:#a5b4fc;">
            <span>🎯</span><span>Who Should Read This</span>
          </div>
          <div class="tldr-body-text" style="color:var(--card-subtext);">${escapeHtml(summary.who_should_read || 'Anyone interested in this subject.')}</div>
        </div>
      </div>
    `;

    // Hook TLDR voice narration
    const vibToggleBtn = body.querySelector('#vibratorToggleBtn');
    if (vibToggleBtn) {
      const fullTldrText = `${summary.tldr}. Executive summary: ${summary.quick_read}. Key milestones: ${(summary.key_stats || []).join('. ')}`;
      vibToggleBtn.addEventListener('click', () => {
        if (isSpeaking) {
          stopSpeech();
          updateAvatarSpeechState(false);
        } else {
          speakExplanationText(
            fullTldrText,
            [],
            'English',
            'en-IN',
            () => updateAvatarSpeechState(true),
            () => updateAvatarSpeechState(false)
          );
        }
      });
    }

    // Hook Footer
    if (footer) {
      footer.innerHTML = `
        <div class="footer-actions">
          <button type="button" class="btn-card-action btn-copy" id="copyTldrBtn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Briefing</span>
          </button>
        </div>
        <span>Esc to dismiss</span>
      `;
      const copyBtn = footer.querySelector('#copyTldrBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const tldrCopy = `⚡ 30-Second Page TL;DR (${summary.read_time_saved || '5 mins saved'})\n\n"${summary.tldr}"\n\nExecutive Summary:\n${summary.quick_read}\n\nKey Takeaways:\n${(summary.key_stats || []).map(s => `• ${s}`).join('\n')}\n\nWho Should Read:\n${summary.who_should_read}\n\nSource: ${pageUrl}`;
          try {
            await navigator.clipboard.writeText(tldrCopy);
            copyBtn.innerHTML = `<span>✅ Copied!</span>`;
            setTimeout(() => {
              if (copyBtn) copyBtn.innerHTML = `<span>Copy Briefing</span>`;
            }, 2000);
          } catch (_) {}
        });
      }
    }
  }

  /**
   * Directly opens overlay card in Bias Audit mode for selected text
   */
  function openDirectBiasCard(text) {
    if (!text || !text.trim()) return;
    chrome.storage.local.get(['overlayTheme', 'overlayBgStyle', 'activeAiSource', 'activeOllamaModel'], (settings) => {
      showLoadingCard({
        text,
        type: 'text',
        theme: settings.overlayTheme || 'dark',
        bgStyle: settings.overlayBgStyle || 'glow',
        aiSource: settings.activeAiSource || 'ollama',
        ollamaModel: settings.activeOllamaModel || ''
      });

      const data = {
        currentExplanation: text,
        originalExplanation: text,
        currentKeyPoints: [],
        currentLanguage: 'English',
        voiceAccent: 'en-IN',
        type: 'text',
        provider: ''
      };

      startCardBiasAnalysis(data);
    });
  }

  /**
   * Displays floating quick-trigger toolbar with Explain and Bias options over selected text
   */
  function handleSelectionForFloatingButton() {
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();

    if (!text || text.length < 2 || currentCard) {
      removeFloatingButton({ cancelAutoExplain: true });
      return;
    }

    chrome.storage.local.get(['showFloatingButton', 'autoExplainOnSelect'], ({ showFloatingButton = true, autoExplainOnSelect = false }) => {
      if (!showFloatingButton && !autoExplainOnSelect) {
        removeFloatingButton({ cancelAutoExplain: true });
        return;
      }

      // 1. Instant Auto-Explain on Highlight (400ms debounce)
      if (autoExplainOnSelect && text.length >= 2 && !currentCard) {
        cancelAutoExplainTimer();
        autoExplainTimer = setTimeout(() => {
          const currentSel = window.getSelection()?.toString()?.trim();
          if (currentSel && (currentSel === text || currentSel.includes(text) || text.includes(currentSel)) && !currentCard) {
            removeFloatingButton({ cancelAutoExplain: true });
            chrome.runtime.sendMessage({
              action: 'TRIGGER_EXPLAIN',
              text,
              pageUrl: window.location.href
            }, () => {
              if (chrome.runtime.lastError) {
                console.warn('[Universal AI Explainer] Auto-Explain send error:', chrome.runtime.lastError.message);
              }
            });
          }
        }, 400);
      } else {
        cancelAutoExplainTimer();
      }

      if (selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      // Clean up previous floating button element WITHOUT cancelling autoExplainTimer
      if (floatingBtn) {
        floatingBtn.remove();
        floatingBtn = null;
      }

      const root = getOrCreateShadowRoot();

      if (!showFloatingButton) {
        // If floating toolbar is disabled but auto-explain is active, display a subtle mini auto-indicator pill
        if (autoExplainOnSelect && text.length >= 2) {
          const autoPill = document.createElement('div');
          autoPill.className = 'explainer-auto-pill';
          autoPill.title = 'Click to explain immediately';
          autoPill.innerHTML = `
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>⚡ Auto-explaining...</span>
          `;
          autoPill.addEventListener('click', (e) => {
            e.stopPropagation();
            cancelAutoExplainTimer();
            removeFloatingButton({ cancelAutoExplain: true });
            chrome.runtime.sendMessage({
              action: 'TRIGGER_EXPLAIN',
              text,
              pageUrl: window.location.href
            });
          });

          const pillTop = Math.max(window.scrollY + 6, rect.top + window.scrollY - 38);
          const pillLeft = Math.max(window.scrollX + 6, rect.left + window.scrollX + (rect.width / 2) - 65);
          autoPill.style.top = `${pillTop}px`;
          autoPill.style.left = `${pillLeft}px`;

          root.appendChild(autoPill);
          floatingBtn = autoPill;
        }
        return;
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'explainer-floating-toolbar';

      const explainBtn = document.createElement('button');
      explainBtn.type = 'button';
      explainBtn.className = `explainer-floating-action btn-action-explain ${autoExplainOnSelect ? 'is-auto-explaining' : ''}`;
      explainBtn.title = autoExplainOnSelect
        ? '⚡ Auto-explaining in 400ms (Click to explain now)'
        : 'Explain selection with AI (Alt+E)';
      explainBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>${autoExplainOnSelect ? '⚡ Auto...' : 'Explain'}</span>
      `;

      explainBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelAutoExplainTimer();
        removeFloatingButton({ cancelAutoExplain: true });
        chrome.runtime.sendMessage({
          action: 'TRIGGER_EXPLAIN',
          text,
          pageUrl: window.location.href
        });
      });

      const biasBtn = document.createElement('button');
      biasBtn.type = 'button';
      biasBtn.className = 'explainer-floating-action btn-action-bias';
      biasBtn.title = 'Audit selection for bias, marketing hype & credibility';
      biasBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18M3 9l9-6 9 6M6 14l-3-5h6l-3 5zm12 0l-3-5h6l-3 5z"></path>
        </svg>
        <span>Bias</span>
      `;

      biasBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelAutoExplainTimer();
        removeFloatingButton({ cancelAutoExplain: true });
        openDirectBiasCard(text);
      });

      const tldrBtn = document.createElement('button');
      tldrBtn.type = 'button';
      tldrBtn.className = 'explainer-floating-action btn-action-tldr';
      tldrBtn.title = '30-Second Page TL;DR';
      tldrBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>TL;DR</span>
      `;

      tldrBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelAutoExplainTimer();
        removeFloatingButton({ cancelAutoExplain: true });
        openPageTldrCard(text, window.location.href);
      });

      toolbar.appendChild(explainBtn);
      toolbar.appendChild(tldrBtn);
      toolbar.appendChild(biasBtn);

      const barWidth = 225;
      const btnTop = Math.max(window.scrollY + 6, rect.top + window.scrollY - 42);
      const btnLeft = Math.max(window.scrollX + 6, rect.left + window.scrollX + (rect.width / 2) - (barWidth / 2));

      toolbar.style.top = `${btnTop}px`;
      toolbar.style.left = `${btnLeft}px`;

      root.appendChild(toolbar);
      floatingBtn = toolbar;
    });
  }

  // Handle selection changes for floating trigger
  document.addEventListener('mouseup', () => {
    setTimeout(handleSelectionForFloatingButton, 80);
  });

  // Support keyboard text highlighting (Shift + Arrows, Ctrl + A, etc.)
  document.addEventListener('keyup', (e) => {
    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) || (e.ctrlKey && e.key.toLowerCase() === 'a')) {
      setTimeout(handleSelectionForFloatingButton, 100);
    }
  });

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection()?.toString()?.trim();
    if (!sel) {
      removeFloatingButton({ cancelAutoExplain: true });
    }
  });

  // Dismiss card on outside pointer clicks
  document.addEventListener('pointerdown', (e) => {
    if (e.composedPath().some(el => el === floatingBtn || el === currentCard || el === shadowHost)) {
      return;
    }

    cancelAutoExplainTimer();

    if (floatingBtn) {
      removeFloatingButton({ cancelAutoExplain: true });
    }

    if (!currentCard) return;
    dismissCard();
  });

  // Dismiss card on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelAutoExplainTimer();
      if (currentCard) dismissCard();
      if (floatingBtn) removeFloatingButton({ cancelAutoExplain: true });
    }
  });


  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'EXPLAIN_START':
        // Cache request so error card can retry
        lastExplainRequest = {
          text: message.text,
          type: message.type,
          theme: message.theme || 'dark',
          bgStyle: message.bgStyle || 'glow',
          targetLanguage: message.targetLanguage,
          voiceAccent: message.voiceAccent,
          pageUrl: message.pageUrl,
          aiSource: message.aiSource || 'ollama',
          ollamaModel: message.ollamaModel || '',
          mentorPersona: message.mentorPersona || 'maya',
          avatarSkin: message.avatarSkin || 'classic'
        };
        showLoadingCard(lastExplainRequest);
        sendResponse({ status: 'LOADING_SHOWN' });
        return false;

      case 'EXPLAIN_SUCCESS':
        if (currentCard) {
          if (message.theme) applyThemeToCard(currentCard, message.theme);
          if (message.bgStyle) applyBgStyleToCard(currentCard, message.bgStyle);
          if (message.avatarSkin) applySkinToCard(currentCard, message.avatarSkin);
        }
        showResultCard({
          explanation: message.explanation,
          key_points: message.key_points,
          follow_ups: message.follow_ups || [],
          jargon: message.jargon || [],
          type: message.type,
          targetLanguage: message.targetLanguage,
          voiceAccent: message.voiceAccent,
          provider: message.provider,
          mentorPersona: message.mentorPersona,
          avatarSkin: message.avatarSkin
        });
        sendResponse({ status: 'RESULT_SHOWN' });
        return false;

      case 'OPEN_PAGE_TLDR':
        openPageTldrCard(message.text || '', message.url || window.location.href);
        sendResponse({ status: 'TLDR_OPENED' });
        return false;

      case 'SET_OVERLAY_CARD_THEME':
        if (currentCard && message.theme) {
          applyThemeToCard(currentCard, message.theme);
        }
        sendResponse({ status: 'THEME_APPLIED' });
        return false;

      case 'SET_OVERLAY_CARD_BG_STYLE':
        if (currentCard && message.bgStyle) {
          applyBgStyleToCard(currentCard, message.bgStyle);
        }
        sendResponse({ status: 'BG_STYLE_APPLIED' });
        return false;

      case 'SET_OVERLAY_CARD_PERSONA':
        if (message.mentorPersona) {
          currentMentorPersona = message.mentorPersona;
          if (currentCardData) currentCardData.mentorPersona = currentMentorPersona;
          if (currentCard) {
            const pConf = getPersonaInfo(currentMentorPersona);
            const avatarName = currentCard.querySelector('.avatar-name');
            if (avatarName) avatarName.textContent = pConf.badge;
          }
        }
        sendResponse({ status: 'PERSONA_APPLIED' });
        return false;

      case 'SET_OVERLAY_CARD_SKIN':
        if (message.avatarSkin) {
          currentAvatarSkin = message.avatarSkin;
          if (currentCardData) currentCardData.avatarSkin = currentAvatarSkin;
          if (currentCard) applySkinToCard(currentCard, currentAvatarSkin);
        }
        sendResponse({ status: 'SKIN_APPLIED' });
        return false;

      case 'EXPLAIN_ERROR':
        showErrorCard({ error: message.error });
        sendResponse({ status: 'ERROR_SHOWN' });
        return false;

      case 'GET_SELECTION': {
        const sel = window.getSelection()?.toString()?.trim() || '';
        sendResponse({
          text: sel,
          url: window.location.href
        });
        return false;
      }

      case 'GET_PAGE_OR_SELECTION': {
        const sel = window.getSelection()?.toString()?.trim() || '';
        if (sel) {
          sendResponse({ text: sel, source: 'selection', url: window.location.href });
          return false;
        }

        // Extract main article content
        let articleText = '';
        const articleEl = document.querySelector('article, main, [role="main"], .post-content, .article-content, #content');
        if (articleEl) {
          articleText = articleEl.innerText || '';
        } else {
          const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.innerText.trim())
            .filter(t => t.length > 50)
            .slice(0, 8);
          articleText = paragraphs.join('\n\n');
        }

        sendResponse({
          text: (articleText || document.body?.innerText || '').slice(0, 3000).trim(),
          source: 'article',
          url: window.location.href
        });
        return false;
      }

      case 'SHOW_EMPTY_SELECTION_NOTICE':
        showMiniToast('Highlight text first, then press Alt+E');
        sendResponse({ status: 'NOTICE_SHOWN' });
        return false;

      // ── Jarvis Browser Click Automation ─────────────────────────────────────
      // Triggered when user says "is video ko click karo", "pehla link kholo", etc.
      // ── Jarvis Browser Click Automation ─────────────────────────────────────
      // Triggered when user says "keshariya song click", "start karo", "kholo", etc.
      case 'JARVIS_CLICK_ELEMENT': {
        const rawQuery = (message.query || '').toLowerCase().trim();
        const targetType = (message.target_type || 'any').toLowerCase(); // 'video', 'link', 'button', 'any'

        // Clean query to isolate subject keywords (e.g. 'keshariya song click' -> 'keshariya')
        const query = rawQuery
          .replace(/\b(click|karo|kro|kar|kr|chalu|start|open|kholo|chalao|play|dabao|pe|ko|ise|isko|ye|is|button|link|video|song|gana|gaana)\b/gi, '')
          .trim();

        let clicked = false;
        let clickedText = '';

        // ── Helper: is element visible on screen?
        function isVisible(el) {
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 &&
            rect.top < window.innerHeight + 200 && rect.bottom > -50 &&
            getComputedStyle(el).visibility !== 'hidden' &&
            getComputedStyle(el).display !== 'none';
        }

        // ── Helper: scroll element into view & click it with visual feedback
        function doClick(el, label) {
          if (!el) return;
          try {
            // If it's a YouTube video link, navigate directly to guarantee playback!
            const videoHref = el.getAttribute('href') || el.href || el.closest('a[href*="/watch?v="]')?.getAttribute('href');
            if (videoHref && (videoHref.includes('/watch?v=') || videoHref.includes('youtu.be'))) {
              const fullUrl = videoHref.startsWith('http') ? videoHref : ('https://www.youtube.com' + (videoHref.startsWith('/') ? '' : '/') + videoHref);
              const playUrl = fullUrl.includes('?') ? (fullUrl + '&autoplay=1&jarvis_play=1') : (fullUrl + '?autoplay=1&jarvis_play=1');
              if (typeof showMiniToast === 'function') showMiniToast(`▶️ Opening & Playing: ${label || 'video'}`);
              window.location.href = playUrl;
              clicked = true;
              clickedText = label || 'Video';
              return;
            }

            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Visual highlight ring
            const prevOutline = el.style.outline;
            const prevTransition = el.style.transition;
            el.style.transition = 'all 0.2s ease';
            el.style.outline = '3px solid #38bdf8';
            el.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.9)';
            setTimeout(() => {
              el.style.outline = prevOutline;
              el.style.transition = prevTransition;
            }, 1800);

            setTimeout(() => {
              el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
              el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
              el.click();
              el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            }, 250);
          } catch (_) {
            el.click();
          }
          clicked = true;
          clickedText = label || el.textContent?.trim().slice(0, 60) || el.getAttribute('aria-label') || el.href || 'element';
        }

        const isYouTube = window.location.hostname.includes('youtube.com');

        // ── Strategy 1: YouTube Video Cards (Search Results & Home Page)
        if (isYouTube && !clicked) {
          const ytCards = Array.from(document.querySelectorAll(
            'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer'
          )).filter(isVisible);

          if (query) {
            // Find card matching query words
            const words = query.split(/\s+/).filter(w => w.length > 1);
            for (const card of ytCards) {
              const cardText = (card.textContent || '').toLowerCase();
              const match = cardText.includes(query) || (words.length > 0 && words.some(w => cardText.includes(w)));
              if (match) {
                const titleLink = card.querySelector('#video-title, a#video-title, a#thumbnail, a[href*="/watch?v="]');
                if (titleLink) {
                  doClick(titleLink, card.querySelector('#video-title')?.textContent?.trim() || query);
                  break;
                }
              }
            }
          }

          // If no query match or empty query, click first visible video
          if (!clicked && (targetType === 'video' || !query)) {
            const firstCard = ytCards[0];
            if (firstCard) {
              const link = firstCard.querySelector('#video-title, a#video-title, a#thumbnail, a[href*="/watch?v="]');
              if (link) doClick(link, firstCard.querySelector('#video-title')?.textContent?.trim() || 'Top Video');
            }
          }
        }

        // ── Strategy 2: Match by text content / aria-label across all clickable elements
        if (query && !clicked) {
          const clickableSelectors = [
            'a[href]', 'button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]',
            '[role="link"]', '[role="menuitem"]', '[role="tab"]', 'summary', '[onclick]'
          ];
          const allClickables = Array.from(document.querySelectorAll(clickableSelectors.join(','))).filter(isVisible);

          // 2a. Exact match
          for (const el of allClickables) {
            const t = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
            if (t.includes(query)) {
              doClick(el, el.textContent?.trim().slice(0, 60) || query);
              break;
            }
          }

          // 2b. Word-level match
          if (!clicked) {
            const words = query.split(/\s+/).filter(w => w.length > 1);
            if (words.length > 0) {
              for (const el of allClickables) {
                const t = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
                if (words.some(w => t.includes(w))) {
                  doClick(el, el.textContent?.trim().slice(0, 60) || query);
                  break;
                }
              }
            }
          }

          // 2c. Check headings / text containers that have clickable parent
          if (!clicked) {
            const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, strong, b, div')).filter(isVisible);
            for (const tn of textNodes) {
              const t = (tn.textContent || '').toLowerCase();
              if (t.includes(query)) {
                const clickableParent = tn.closest('a[href], button, [role="button"], [onclick]');
                if (clickableParent) {
                  doClick(clickableParent, tn.textContent?.trim().slice(0, 60) || query);
                  break;
                }
              }
            }
          }
        }

        // ── Strategy 3: Fallback first visible link or button
        if (!clicked && !query) {
          const fallbackSel = targetType === 'button'
            ? 'button, [role="button"]'
            : 'a[href]:not([href="#"]):not([href=""])';
          const el = Array.from(document.querySelectorAll(fallbackSel)).find(isVisible);
          if (el) doClick(el, el.textContent?.trim().slice(0, 60) || el.href);
        }

        if (clicked) {
          showMiniToast(`✅ Clicked & Opened: ${clickedText}`);
          sendResponse({ status: 'CLICKED', element: clickedText });
        } else {
          showMiniToast(`❌ '${query || rawQuery}' page par nahi mila`);
          sendResponse({ status: 'NOT_FOUND' });
        }
        return false;
      }

      // ── Jarvis In-Page Search Automation ─────────────────────────────────────
      case 'JARVIS_SEARCH_PAGE': {
        const query = (message.query || '').trim();
        if (!query) {
          sendResponse({ status: 'NO_QUERY' });
          return false;
        }

        // On YouTube: type directly into YouTube search bar and submit
        if (window.location.hostname.includes('youtube.com')) {
          const searchInput = document.querySelector('input#search, input.ytd-searchbox');
          const searchForm = document.querySelector('form#search-form, ytd-searchbox form');
          const searchButton = document.querySelector('button#search-icon-legacy, #search-icon-legacy');
          if (searchInput) {
            searchInput.focus();
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            setTimeout(() => {
              if (searchButton) {
                searchButton.click();
              } else if (searchForm) {
                searchForm.submit();
              } else {
                window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
              }
            }, 100);
            if (typeof showMiniToast === 'function') showMiniToast(`🔍 Searching YouTube for: ${query}`);
            sendResponse({ status: 'SEARCHED', query });
            return false;
          }
        }

        // Default navigation to search query
        const destUrl = message.action_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        window.location.href = destUrl;
        sendResponse({ status: 'NAVIGATING', url: destUrl });
        return false;
      }

      // ── Jarvis Open URL in current tab ────────────────────────────────────────
      case 'JARVIS_OPEN_URL': {
        const url = message.url || '';
        if (url) {
          window.location.href = url;
          sendResponse({ status: 'NAVIGATING', url });
        } else {
          sendResponse({ status: 'NO_URL' });
        }
        return false;
      }

      // ── Jarvis In-Page Media Playback Control (Play / Pause / Resume / Stop / Start) ──
      case 'JARVIS_MEDIA_CONTROL': {
        const cmd = (message.command || 'toggle').toLowerCase();
        const videos = Array.from(document.querySelectorAll('video, audio'));
        const video = videos[0] || null;
        const isYouTube = window.location.hostname.includes('youtube.com');
        const ytPlayBtn = isYouTube ? document.querySelector('.ytp-play-button') : null;
        const largeBtn = isYouTube ? document.querySelector('.ytp-large-play-button') : null;

        if (cmd === 'play' || cmd === 'resume' || cmd === 'start' || cmd === 'chalu') {
          if (isYouTube && window.location.pathname.includes('/watch')) {
            if (largeBtn && largeBtn.offsetParent !== null) largeBtn.click();
            if (ytPlayBtn) {
              const label = (ytPlayBtn.getAttribute('aria-label') || '').toLowerCase();
              if (label.includes('play')) ytPlayBtn.click();
            }
            videos.forEach(v => { if (v.paused) v.play().catch(() => {}); });
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', keyCode: 75, which: 75, bubbles: true }));
          } else if (isYouTube) {
            // If on YouTube results or home page and user says "play", navigate directly to top video!
            const topVid = document.querySelector('ytd-video-renderer a#thumbnail[href*="/watch?v="], ytd-rich-item-renderer a#thumbnail[href*="/watch?v="], a[href*="/watch?v="]');
            if (topVid) {
              const rawHref = topVid.getAttribute('href') || topVid.href;
              const fullUrl = rawHref.startsWith('http') ? rawHref : ('https://www.youtube.com' + (rawHref.startsWith('/') ? '' : '/') + rawHref);
              const playUrl = fullUrl.includes('?') ? (fullUrl + '&autoplay=1&jarvis_play=1') : (fullUrl + '?autoplay=1&jarvis_play=1');
              if (typeof showMiniToast === 'function') showMiniToast('▶️ Opening & Playing Video');
              window.location.href = playUrl;
              sendResponse({ status: 'NAVIGATED_TOP' });
              return false;
            }
          } else if (videos.length > 0) {
            videos.forEach(v => { if (v.paused) v.play().catch(() => {}); });
          } else {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true }));
          }

          if (typeof showMiniToast === 'function') showMiniToast('▶️ Video Playing');
          sendResponse({ status: 'PLAYING' });
          return false;
        } else if (cmd === 'pause' || cmd === 'stop' || cmd === 'roko') {
          if (isYouTube && window.location.pathname.includes('/watch')) {
            if (ytPlayBtn) {
              const label = (ytPlayBtn.getAttribute('aria-label') || '').toLowerCase();
              if (label.includes('pause')) ytPlayBtn.click();
            }
            videos.forEach(v => { if (!v.paused) v.pause(); });
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', keyCode: 75, which: 75, bubbles: true }));
          } else if (videos.length > 0) {
            videos.forEach(v => { if (!v.paused) v.pause(); });
          } else {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true }));
          }
          if (typeof showMiniToast === 'function') showMiniToast('⏸️ Video Paused');
          sendResponse({ status: 'PAUSED' });
          return false;
        } else {
          // Toggle playback
          if (isYouTube) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', keyCode: 75, which: 75, bubbles: true }));
          } else if (videos.length > 0) {
            videos.forEach(v => {
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            });
          }
          if (typeof showMiniToast === 'function') showMiniToast('⏯️ Playback Toggled');
          sendResponse({ status: 'TOGGLED' });
          return false;
        }
      }

      // ── Jarvis In-Page Video / Audio Volume Control ──
      case 'JARVIS_VOLUME_CONTROL': {
        const cmd = (message.command || '').toLowerCase();
        const mediaElements = Array.from(document.querySelectorAll('video, audio'));
        const isYouTube = window.location.hostname.includes('youtube.com');

        if (cmd === 'volume_up') {
          if (isYouTube) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38, bubbles: true }));
          }
          mediaElements.forEach(m => {
            m.muted = false;
            m.volume = Math.min(1.0, Math.round((m.volume + 0.15) * 100) / 100);
          });
          if (typeof showMiniToast === 'function') showMiniToast('🔊 Volume Up');
          sendResponse({ status: 'VOLUME_UP' });
          return false;
        } else if (cmd === 'volume_down') {
          if (isYouTube) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
          }
          mediaElements.forEach(m => {
            m.volume = Math.max(0.0, Math.round((m.volume - 0.15) * 100) / 100);
          });
          if (typeof showMiniToast === 'function') showMiniToast('🔉 Volume Down');
          sendResponse({ status: 'VOLUME_DOWN' });
          return false;
        } else if (cmd === 'mute') {
          if (isYouTube) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', keyCode: 77, which: 77, bubbles: true }));
          }
          mediaElements.forEach(m => { m.muted = true; });
          if (typeof showMiniToast === 'function') showMiniToast('🔇 Muted');
          sendResponse({ status: 'MUTED' });
          return false;
        } else if (cmd === 'unmute') {
          if (isYouTube) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', keyCode: 77, which: 77, bubbles: true }));
          }
          mediaElements.forEach(m => { m.muted = false; if (m.volume < 0.1) m.volume = 0.5; });
          if (typeof showMiniToast === 'function') showMiniToast('🔊 Unmuted');
          sendResponse({ status: 'UNMUTED' });
          return false;
        }
        return false;
      }

      default:
        return false;
    }
  });

  // ── YouTube Auto-Play & Navigation Automation ─────────────────────────────
  function checkYouTubeAutoPlay() {
    if (!window.location.hostname.includes('youtube.com')) return;

    // 1. Search Results page with jarvis_play=1: immediately navigate to top video!
    if (window.location.pathname.includes('/results') && (window.location.search.includes('jarvis_play=1') || window.location.hash.includes('jarvis_play=1'))) {
      let attempts = 0;
      const autoPlayTimer = setInterval(() => {
        attempts++;
        const videoCards = Array.from(document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer'));
        for (const card of videoCards) {
          if (card.querySelector('[is-ad], .badge-style-type-ad')) continue;
          const link = card.querySelector('a#thumbnail[href*="/watch?v="], a#video-title[href*="/watch?v="], a[href*="/watch?v="]');
          if (link) {
            const rawHref = link.getAttribute('href') || link.href;
            if (rawHref && rawHref.includes('/watch?v=')) {
              clearInterval(autoPlayTimer);
              const fullUrl = rawHref.startsWith('http') ? rawHref : ('https://www.youtube.com' + (rawHref.startsWith('/') ? '' : '/') + rawHref);
              const playUrl = fullUrl.includes('?') ? (fullUrl + '&autoplay=1&jarvis_play=1') : (fullUrl + '?autoplay=1&jarvis_play=1');
              if (typeof showMiniToast === 'function') showMiniToast('▶️ Auto-playing top video...');
              window.location.href = playUrl;
              return;
            }
          }
        }
        if (attempts > 35) clearInterval(autoPlayTimer);
      }, 200);
    }

    // 2. Watch page (/watch?v=...): ensure video actually plays!
    if (window.location.pathname.includes('/watch')) {
      let playAttempts = 0;
      const playTimer = setInterval(() => {
        playAttempts++;
        const video = document.querySelector('video');
        const playBtn = document.querySelector('.ytp-play-button');
        const largeBtn = document.querySelector('.ytp-large-play-button');

        if (largeBtn && largeBtn.offsetParent !== null) {
          largeBtn.click();
        }

        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
            if (playBtn) {
              const label = (playBtn.getAttribute('aria-label') || '').toLowerCase();
              if (label.includes('play')) playBtn.click();
            }
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', keyCode: 75, which: 75, bubbles: true }));
          } else if (video.currentTime > 0.5) {
            // Confirmed playing!
            clearInterval(playTimer);
          }
        }

        if (playAttempts > 25) clearInterval(playTimer);
      }, 350);
    }
  }

  checkYouTubeAutoPlay();
  window.addEventListener('yt-navigate-finish', checkYouTubeAutoPlay);
  window.addEventListener('popstate', checkYouTubeAutoPlay);
})();
