// Universal AI Explainer — Popup Chat Engine (Manifest V3 · Google Gemini)
// Features: Animated Avatar Companion, Indian English Voice Synthesis, Multilingual Translator

document.addEventListener('DOMContentLoaded', async () => {

  // ─── Element References ──────────────────────────────────────────────────
  const statusBadge          = document.getElementById('statusBadge');
  const tabBtns              = document.querySelectorAll('.tab-btn');
  const tabPanes             = document.querySelectorAll('.tab-pane');

  // Animated Avatar Bar in Popup
  const popupAvatarCompanion = document.getElementById('popupAvatarCompanion');
  const popupAvatarBadge     = document.getElementById('popupAvatarBadge');
  const popupAvatarSubtext   = document.getElementById('popupAvatarSubtext');
  const popupSoundwaves      = document.getElementById('popupSoundwaves');

  // Chat tab
  const chatWindow           = document.getElementById('chatWindow');
  const chatEmptyState       = document.getElementById('chatEmptyState');
  const chatInput            = document.getElementById('chatInput');
  const sendBtn              = document.getElementById('sendBtn');
  const grabSelectionBtn     = document.getElementById('grabSelectionBtn');
  const newChatBtn           = document.getElementById('newChatBtn');
  const suggestionsBar       = document.getElementById('suggestionsBar');
  const charHint             = document.getElementById('charHint');
  const quickChips           = document.querySelectorAll('.chat-quick-chip');
  const voiceInputBtn        = document.getElementById('voiceInputBtn');
  const voiceActiveBanner    = document.getElementById('voiceActiveBanner');
  const voiceBannerText      = document.getElementById('voiceBannerText');
  const voiceStopBtn         = document.getElementById('voiceStopBtn');
  const chatLanguageSelect   = document.getElementById('chatLanguageSelect');

  // Side Panel button
  const openSidePanelBtn     = document.getElementById('openSidePanelBtn');

  // Live Talk Elements
  const startLiveTalkBtn     = document.getElementById('startLiveTalkBtn');
  const liveCallOverlay      = document.getElementById('liveCallOverlay');
  const liveCallCloseBtn     = document.getElementById('liveCallCloseBtn');
  const liveCallStatus       = document.getElementById('liveCallStatus');
  const liveAvatarOrb        = document.getElementById('liveAvatarOrb');
  const liveSoundwaveBars    = document.getElementById('liveSoundwaveBars');
  const livePersonaBadge     = document.getElementById('livePersonaBadge');
  const liveTranscriptSender = document.getElementById('liveTranscriptSender');
  const liveTranscriptBody   = document.getElementById('liveTranscriptBody');
  const liveMuteBtn          = document.getElementById('liveMuteBtn');
  const liveMuteText         = document.getElementById('liveMuteText');
  const liveEndCallBtn       = document.getElementById('liveEndCallBtn');
  const autoExplainCheckbox   = document.getElementById('autoExplainOnSelect');

  // Translator tab
  const transInput           = document.getElementById('transInput');
  const transTargetLang      = document.getElementById('transTargetLang');
  const transGrabBtn         = document.getElementById('transGrabBtn');
  const transClearBtn        = document.getElementById('transClearBtn');
  const transVoiceBtn        = document.getElementById('transVoiceBtn');
  const executeTranslateBtn  = document.getElementById('executeTranslateBtn');
  const executeTranslateText = document.getElementById('executeTranslateText');
  const transResultCard      = document.getElementById('transResultCard');
  const transResultLangBadge = document.getElementById('transResultLangBadge');
  const transResultText      = document.getElementById('transResultText');
  const transSpeakBtn        = document.getElementById('transSpeakBtn');
  const transSpeakBtnText    = document.getElementById('transSpeakBtnText');
  const transCopyBtn         = document.getElementById('transCopyBtn');

  // Quiz tab
  const tabQuizBtn           = document.getElementById('tabQuizBtn');
  const quizInputText        = document.getElementById('quizInputText');
  const quizGrabBtn          = document.getElementById('quizGrabBtn');
  const quizClearBtn         = document.getElementById('quizClearBtn');
  const startQuizBtn         = document.getElementById('startQuizBtn');
  const startQuizBtnText     = document.getElementById('startQuizBtnText');
  const quizSetupSection     = document.getElementById('quizSetupSection');
  const quizLoadingState     = document.getElementById('quizLoadingState');
  const quizActiveCard       = document.getElementById('quizActiveCard');
  const quizSummaryCard      = document.getElementById('quizSummaryCard');
  const popupConfettiCanvas  = document.getElementById('popupConfettiCanvas');
  const popupQuizProgressBadge = document.getElementById('popupQuizProgressBadge');
  const popupQuizScoreBadge  = document.getElementById('popupQuizScoreBadge');
  const popupQuizProgressFill = document.getElementById('popupQuizProgressFill');
  const popupQuizQuestionText= document.getElementById('popupQuizQuestionText');
  const popupQuizOptionsGrid = document.getElementById('popupQuizOptionsGrid');
  const popupQuizFeedbackArea= document.getElementById('popupQuizFeedbackArea');
  const popupQuizTrophy      = document.getElementById('popupQuizTrophy');
  const popupQuizSummaryTitle= document.getElementById('popupQuizSummaryTitle');
  const popupQuizScorePill   = document.getElementById('popupQuizScorePill');
  const popupQuizSummaryPraise= document.getElementById('popupQuizSummaryPraise');
  const popupQuizRetryBtn    = document.getElementById('popupQuizRetryBtn');
  const popupQuizNewBtn      = document.getElementById('popupQuizNewBtn');

  // History tab
  const historyList          = document.getElementById('historyList');
  const clearHistoryBtn      = document.getElementById('clearHistoryBtn');

  // Settings tab
  const form                 = document.getElementById('settingsForm');
  const apiKeyInput          = document.getElementById('apiKeyInput');
  const toggleVisibilityBtn  = document.getElementById('toggleVisibilityBtn');
  const testKeyBtn           = document.getElementById('testKeyBtn');
  const testBtnText          = document.getElementById('testBtnText');
  const testStatus           = document.getElementById('testStatus');
  const voiceAccentSelect    = document.getElementById('voiceAccentSelect');
  const defaultLanguageSelect= document.getElementById('defaultLanguageSelect');
  // chatLanguageSelect already declared above (Chat tab references)
  const indianAnalogiesCheck = document.getElementById('indianAnalogies');
  const showFloatingCheckbox = document.getElementById('showFloatingButton');
  const autoSpeakCheckbox    = document.getElementById('autoSpeak');
  const autoLaunchJarvisCheckbox = document.getElementById('autoLaunchJarvis');
  const jarvisContinuousListenCheckbox = document.getElementById('jarvisContinuousListen');
  const jarvisQuickAutoListen = document.getElementById('jarvisQuickAutoListen');
  const jarvisBackgroundListenToggle = document.getElementById('jarvisBackgroundListenToggle');
  const jarvisMasterCard = document.getElementById('jarvisMasterCard');
  const jarvisLivePill = document.getElementById('jarvisLivePill');

  // Ollama settings
  const ollamaStatusDot      = document.getElementById('ollamaStatusDot');
  const ollamaStatusText     = document.getElementById('ollamaStatusText');
  const checkOllamaBtn       = document.getElementById('checkOllamaBtn');
  const ollamaModelInput     = document.getElementById('ollamaModelInput');
  const pullModelBtn         = document.getElementById('pullModelBtn');

  // Toast
  const toast                = document.getElementById('toast');
  const toastMessage         = document.getElementById('toastMessage');

  // Bias Meter & Fact Checker Modal
  const biasModalOverlay     = document.getElementById('biasModalOverlay');
  const biasModalContent     = document.getElementById('biasModalContent');
  const closeBiasModalBtn    = document.getElementById('closeBiasModalBtn');

  // ─── State ───────────────────────────────────────────────────────────────
  let conversationHistory    = []; // { role: 'user'|'model', text: string }
  let isThinking             = false;
  let isPopupSpeaking        = false;
  let currentSpeakingBtn     = null;
  let toastTimer             = null;
  let speechKeepAliveTimer   = null;
  let cachedVoices           = [];

  // Active User Configuration
  let currentVoiceAccent     = 'en-IN';
  let currentDefaultLang     = 'English';
  let currentIndianAnalogies = true;
  let currentMentorPersona   = 'maya';
  let currentAvatarSkin      = 'classic';
  let isLiveTalkActive       = false;
  let isLiveMuted            = false;
  let isLiveThinking         = false;

  // Language Code Map for TTS
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
    'korean': 'ko-KR'
  };

  // ─── Voice Management ───────────────────────────────────────────────────
  function loadVoices() {
    if ('speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function findBestVoice(langCode, voiceAccent = 'en-IN') {
    if (!cachedVoices.length) loadVoices();
    const targetCode = (langCode || 'en-IN').toLowerCase().replace('_', '-');

    if (targetCode.startsWith('en')) {
      const accent = (voiceAccent || 'en-IN').toLowerCase();
      const exact = cachedVoices.find(v => v.lang.toLowerCase().replace('_', '-') === accent);
      if (exact) return exact;

      if (accent.includes('in')) {
        const indianVoice = cachedVoices.find(v => {
          const name = v.name.toLowerCase();
          return (name.includes('india') || name.includes('neerja') || name.includes('heera') ||
                  name.includes('ravi') || name.includes('prabhat')) && v.lang.toLowerCase().startsWith('en');
        });
        if (indianVoice) return indianVoice;
      }

      const anyEn = cachedVoices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;
    }

    const exactLang = cachedVoices.find(v => v.lang.toLowerCase().replace('_', '-') === targetCode);
    if (exactLang) return exactLang;

    const prefix = targetCode.split('-')[0];
    const prefixMatch = cachedVoices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    return null;
  }

  // ─── Avatar State Controller ─────────────────────────────────────────────
  function setPopupAvatarState(state, badgeText, subtext) {
    if (!popupAvatarCompanion) return;
    popupAvatarCompanion.className = `popup-avatar-companion state-${state}`;

    if (badgeText && popupAvatarBadge) {
      popupAvatarBadge.textContent = badgeText;
    }
    if (subtext && popupAvatarSubtext) {
      popupAvatarSubtext.textContent = subtext;
    }
  }

  // ─── Suggestion Sets ─────────────────────────────────────────────────────
  const SUGGESTION_SETS = [
    ['Give me a real-world example', 'Simplify this further', 'What are common mistakes?'],
    ['How does this compare to alternatives?', 'What are the use cases?', 'Explain the downsides'],
    ['Can you show a code example?', 'Why is this important?', 'What happens under the hood?'],
    ['Summarize in one sentence', 'What should I learn next?', 'Give me an everyday analogy'],
    ['What are the key benefits?', 'Is this beginner-friendly?', 'How is this used in production?'],
  ];

  // ─── Utility: Escape HTML ────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ─── Utility: Markdown → HTML ────────────────────────────────────────────
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    const parts = html.split(/(<pre>[\s\S]*?<\/pre>)/g);
    return parts.map(part => {
      if (part.startsWith('<pre>')) return part;
      return part.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }).join('');
  }

  // ─── Utility: Clean text for TTS ─────────────────────────────────────────
  function cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~#>-]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  // ─── TTS Keepalive (Chromium 15s Bug Fix) ────────────────────────────────
  function startSpeechKeepAlive() {
    stopSpeechKeepAlive();
    speechKeepAliveTimer = setInterval(() => {
      if (!isPopupSpeaking || !('speechSynthesis' in window)) {
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

  // ─── TTS Helpers ─────────────────────────────────────────────────────────
  function stopSpeech() {
    stopSpeechKeepAlive();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    isPopupSpeaking = false;
    setPopupAvatarState('happy', currentVoiceAccent === 'en-IN' ? '🇮🇳 Indian English' : 'Ready', 'I am here to make learning easy!');

    if (currentSpeakingBtn) {
      currentSpeakingBtn.classList.remove('speaking');
      const sp = currentSpeakingBtn.querySelector('span');
      if (sp) sp.textContent = 'Listen';
      currentSpeakingBtn = null;
    }
    if (transSpeakBtnText) transSpeakBtnText.textContent = 'Listen';
  }

  function speakText(text, btn, language = 'English', onEndCallback = null) {
    if (!('speechSynthesis' in window)) return;
    stopSpeech();

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (typeof onEndCallback === 'function') onEndCallback();
      return;
    }

    const langKey = (language || 'english').toLowerCase();
    const langCode = LANGUAGE_CODE_MAP[langKey] || (langKey.startsWith('en') ? currentVoiceAccent : 'en-IN');
    const voice = findBestVoice(langCode, currentVoiceAccent);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    if (voice) utterance.voice = voice;

    if (langCode === 'en-IN') {
      utterance.rate = 0.96;
      utterance.pitch = 1.05;
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => {
      isPopupSpeaking = true;
      startSpeechKeepAlive();
      setPopupAvatarState('speaking', 'Speaking...', `Narrating in ${language} voice`);

      if (btn) {
        btn.classList.add('speaking');
        currentSpeakingBtn = btn;
        const sp = btn.querySelector('span');
        if (sp) sp.textContent = 'Stop';
      }
    };

    const cleanup = () => {
      isPopupSpeaking = false;
      stopSpeechKeepAlive();
      setPopupAvatarState('happy', currentVoiceAccent === 'en-IN' ? '🇮🇳 Indian English' : 'Ready', 'Feel free to ask follow-up questions!');

      if (btn) {
        btn.classList.remove('speaking');
        const sp = btn.querySelector('span');
        if (sp) sp.textContent = 'Listen';
      }
      if (transSpeakBtnText) transSpeakBtnText.textContent = 'Listen';
      currentSpeakingBtn = null;

      if (typeof onEndCallback === 'function') {
        try { onEndCallback(); } catch (_) {}
      }
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    window.speechSynthesis.speak(utterance);
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  function showToast(message, isError = false) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.className = isError ? 'toast show error' : 'toast show';
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2600);
  }

  // ─── Popup Panel Theming & Background Styles ─────────────────────────────
  const POPUP_VALID_THEMES = ['dark', 'light', 'cyberpunk', 'midnight', 'aurora', 'emerald'];
  function applyPopupTheme(themeName) {
    const safe = POPUP_VALID_THEMES.includes(themeName) ? themeName : 'dark';
    POPUP_VALID_THEMES.forEach(t => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${safe}`);
  }

  const POPUP_VALID_BG_STYLES = ['glow', 'grid', 'dots', 'stars', 'waves', 'glass'];
  function applyPopupBgStyle(bgStyle) {
    const safe = POPUP_VALID_BG_STYLES.includes(bgStyle) ? bgStyle : 'glow';
    POPUP_VALID_BG_STYLES.forEach(s => document.body.classList.remove(`bg-style-${s}`));
    document.body.classList.add(`bg-style-${safe}`);
  }

  // ─── Avatar Skin & Persona Helpers ───────────────────────────────────────
  const POPUP_VALID_SKINS = ['classic', 'cyberpunk', 'monochrome', 'pixel'];
  function applyAvatarSkin(skinName) {
    const safe = POPUP_VALID_SKINS.includes(skinName) ? skinName : 'classic';
    currentAvatarSkin = safe;
    POPUP_VALID_SKINS.forEach(s => document.body.classList.remove(`skin-${s}`));
    document.body.classList.add(`skin-${safe}`);
  }

  function updatePopupAvatarPersona(persona) {
    currentMentorPersona = persona || 'maya';
    const personaMap = {
      maya: {
        name: 'Maya • AI Mentor',
        badge: '🇮🇳 Indian English',
        subtext: 'Ask anything or paste text — I explain simply with relatable analogies!'
      },
      rao: {
        name: 'Prof. Rao • Academic Scholar',
        badge: '🎓 First Principles',
        subtext: 'Inquire about theoretical mechanisms, math, and scholarly literature.'
      },
      priya: {
        name: 'Priya • FAANG Architect',
        badge: '⚡ Senior Architect',
        subtext: 'Ask about system design, Big-O, trade-offs, and production engineering.'
      },
      eli5: {
        name: 'ELI5 Buddy • Playground Guide',
        badge: '🐣 Kindergarten ELI5',
        subtext: 'Playground & block analogies for beginners. Zero confusing jargon!'
      }
    };
    const info = personaMap[currentMentorPersona] || personaMap.maya;
    const nameEl = document.querySelector('.popup-avatar-name');
    if (nameEl) nameEl.textContent = info.name;
    if (popupAvatarBadge) popupAvatarBadge.textContent = info.badge;
    if (popupAvatarSubtext) popupAvatarSubtext.textContent = info.subtext;
    if (livePersonaBadge) livePersonaBadge.textContent = `${info.name}`;
  }

  // ─── Status Badge & Quick Source Switcher ──────────────────────────────────
  async function updateBadge() {
    const data = await chrome.storage.local.get(['aiSource', 'apiKey', 'geminiApiKey']).catch(() => ({}));
    const aiSource = data.aiSource || 'ollama'; // Default to Ollama
    const hasKey = Boolean(data.apiKey || data.geminiApiKey);

    const activeAiLabel = document.getElementById('activeAiLabel');
    const quickOllamaBtn = document.getElementById('quickOllamaBtn');
    const quickGeminiBtn = document.getElementById('quickGeminiBtn');
    const quickAutoBtn = document.getElementById('quickAutoBtn');

    if (statusBadge) {
      if (aiSource === 'ollama') {
        statusBadge.textContent = '🦙 Ollama (Local)';
        statusBadge.className = 'badge configured';
        statusBadge.style.background = 'rgba(34, 197, 94, 0.18)';
        statusBadge.style.color = '#22c55e';
        statusBadge.style.borderColor = 'rgba(34, 197, 94, 0.35)';
      } else if (aiSource === 'gemini') {
        statusBadge.textContent = hasKey ? '✨ Gemini Active' : 'No Gemini Key';
        statusBadge.className = hasKey ? 'badge configured' : 'badge unconfigured';
        statusBadge.style.background = '';
        statusBadge.style.color = '';
        statusBadge.style.borderColor = '';
      } else {
        statusBadge.textContent = '⚡ Auto';
        statusBadge.className = 'badge configured';
        statusBadge.style.background = 'rgba(99, 102, 241, 0.18)';
        statusBadge.style.color = '#a5b4fc';
        statusBadge.style.borderColor = 'rgba(99, 102, 241, 0.35)';
      }
    }

    if (activeAiLabel) {
      if (aiSource === 'ollama') {
        activeAiLabel.textContent = '🦙 Ollama (Local & Free)';
        activeAiLabel.style.color = '#22c55e';
      } else if (aiSource === 'gemini') {
        activeAiLabel.textContent = '✨ Gemini (Google AI)';
        activeAiLabel.style.color = '#a5b4fc';
      } else {
        activeAiLabel.textContent = '⚡ Auto (Ollama → Gemini)';
        activeAiLabel.style.color = '#38bdf8';
      }
    }

    const highlightBtn = (btn, active, color, bg, border) => {
      if (!btn) return;
      if (active) {
        btn.style.background = bg;
        btn.style.color = color;
        btn.style.borderColor = border;
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    };

    highlightBtn(quickOllamaBtn, aiSource === 'ollama', '#22c55e', 'rgba(34, 197, 94, 0.18)', 'rgba(34, 197, 94, 0.4)');
    highlightBtn(quickGeminiBtn, aiSource === 'gemini', '#a5b4fc', 'rgba(99, 102, 241, 0.18)', 'rgba(99, 102, 241, 0.4)');
    highlightBtn(quickAutoBtn, aiSource === 'auto', '#38bdf8', 'rgba(56, 189, 248, 0.18)', 'rgba(56, 189, 248, 0.4)');

    const radio = document.querySelector(`input[name="aiSource"][value="${aiSource}"]`);
    if (radio && !radio.checked) radio.checked = true;
  }

  async function switchAiSource(source) {
    await chrome.storage.local.set({ aiSource: source });
    await updateBadge();
    const label = source === 'ollama' ? '🦙 Ollama' : source === 'gemini' ? '✨ Gemini' : '⚡ Auto';
    showToast(`Switched AI to ${label}`);
    if (source === 'ollama') checkOllamaStatus();
  }

  const qOllama = document.getElementById('quickOllamaBtn');
  const qGemini = document.getElementById('quickGeminiBtn');
  const qAuto = document.getElementById('quickAutoBtn');
  if (qOllama) qOllama.addEventListener('click', () => switchAiSource('ollama'));
  if (qGemini) qGemini.addEventListener('click', () => switchAiSource('gemini'));
  if (qAuto) qAuto.addEventListener('click', () => switchAiSource('auto'));

  // ─── Tab Switching ────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stopSpeech();
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
      if (targetId === 'tab-jarvis') {
        if (typeof initJarvis3DAvatar === 'function') initJarvis3DAvatar();
        if (typeof checkJarvisServerStatus === 'function') checkJarvisServerStatus();
        chrome.storage.local.get(['jarvisContinuousListen', 'jarvisBackgroundActive'], (res) => {
          if (res.jarvisContinuousListen !== false || Boolean(res.jarvisBackgroundActive)) {
            setTimeout(() => {
              if (typeof startJarvisListening === 'function') {
                startJarvisListening(true);
              }
            }, 300);
          }
        });
      }
    });
  });

  // ─── Chat: Scroll to bottom ───────────────────────────────────────────────
  function scrollToBottom() {
    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
  }

  // ─── Chat: Show / hide empty state ───────────────────────────────────────
  function setEmptyState(visible) {
    if (visible) {
      if (!chatEmptyState.parentNode) chatWindow.prepend(chatEmptyState);
      chatEmptyState.style.display = 'flex';
    } else {
      chatEmptyState.style.display = 'none';
    }
  }

  // ─── Chat: Append user bubble ─────────────────────────────────────────────
  function appendUserBubble(text) {
    setEmptyState(false);
    const row = document.createElement('div');
    row.className = 'chat-bubble-row user';
    row.innerHTML = `
      <div class="bubble-avatar user-avatar">U</div>
      <div class="bubble-content">
        <span class="bubble-sender">You</span>
        <div class="bubble-body">${escapeHtml(text)}</div>
      </div>`;
    chatWindow.appendChild(row);
    scrollToBottom();
  }

  // ─── Chat: Append AI bubble with Avatar and Live Translate ────────────────
  function appendAIBubble(explanation, keyPoints = [], rawText = '', provider = '') {
    const id = 'ai-bubble-' + Date.now();
    const kpHtml = (Array.isArray(keyPoints) && keyPoints.length > 0)
      ? `<div class="bubble-key-points">
           <div class="bubble-key-points-title">Key Takeaways</div>
           <ul>${keyPoints.map(k => `<li>${formatMarkdown(k)}</li>`).join('')}</ul>
         </div>`
      : '';

    const fullText = rawText || explanation + (keyPoints.length ? '\n\nKey Takeaways:\n' + keyPoints.map(k => '• ' + k).join('\n') : '');

    const providerBadgeHtml = provider ? `
      <span class="bubble-provider-badge" style="
        font-size:9px;
        font-weight:600;
        padding:2px 6px;
        border-radius:4px;
        ${provider === 'Ollama' ? 'background:rgba(34,197,94,0.18); color:#22c55e; border:1px solid rgba(34,197,94,0.35);' : 'background:rgba(99,102,241,0.18); color:#a5b4fc; border:1px solid rgba(99,102,241,0.35);'}
      ">${provider === 'Ollama' ? '🦙 Ollama' : '✨ Gemini'}</span>
    ` : '';

    const row = document.createElement('div');
    row.className = 'chat-bubble-row ai';
    row.id = id;
    row.innerHTML = `
      <div class="bubble-avatar ai-avatar" style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #818cf8; overflow: hidden; padding: 2px;">
        <svg viewBox="0 0 64 64" width="24" height="24" fill="none">
          <circle cx="32" cy="7" r="4" fill="#38bdf8"/>
          <line x1="32" y1="11" x2="32" y2="16" stroke="#818cf8" stroke-width="2.5"/>
          <rect x="10" y="16" width="44" height="40" rx="14" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
          <rect x="14" y="20" width="36" height="32" rx="10" fill="#090d16"/>
          <circle cx="18" cy="38" r="2.5" fill="#f43f5e" opacity="0.7"/>
          <circle cx="46" cy="38" r="2.5" fill="#f43f5e" opacity="0.7"/>
          <ellipse cx="24" cy="31" rx="3" ry="4" fill="#38bdf8"/>
          <ellipse cx="40" cy="31" rx="3" ry="4" fill="#38bdf8"/>
          <path d="M26 41 Q32 46 38 41" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="bubble-content">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:5px;">
            <span class="bubble-sender">Maya • AI Mentor</span>
            ${providerBadgeHtml}
          </div>
          <span class="bubble-lang-badge" style="font-size:9px; color:#818cf8; background:rgba(99,102,241,0.15); padding:1px 5px; border-radius:4px;">${escapeHtml(currentDefaultLang)}</span>
        </div>
        <div class="bubble-body">
          <div class="bubble-text-content">${formatMarkdown(explanation)}</div>
          ${kpHtml}
        </div>
        <div class="bubble-actions">
          <button class="bubble-action-btn speak-ai-btn" title="Listen" data-text="${escapeHtml(fullText)}">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Listen</span>
          </button>
          <button class="bubble-action-btn copy-ai-btn" title="Copy" data-text="${escapeHtml(fullText)}">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
          <button class="bubble-action-btn trans-bubble-btn" title="Translate to Hindi/other languages">
            🌐 <span>Translate ▾</span>
          </button>
          <button class="bubble-action-btn btn-chat-quiz quiz-ai-btn" title="Test your knowledge with an interactive 3-question quiz!">
            <span>🎮 Quiz Me</span>
          </button>
          <button class="bubble-action-btn btn-chat-bias bias-ai-btn" title="Audit this text for credibility, hidden bias & exaggerated claims">
            <span>⚖️ Fact Check</span>
          </button>
        </div>
      </div>`;

    chatWindow.appendChild(row);

    // Quiz action
    const quizBtn = row.querySelector('.quiz-ai-btn');
    if (quizBtn) {
      quizBtn.addEventListener('click', () => {
        switchToQuizTabWithText(fullText);
      });
    }

    // Bias audit action
    const biasBtn = row.querySelector('.bias-ai-btn');
    if (biasBtn) {
      biasBtn.addEventListener('click', () => {
        openBiasAudit(fullText);
      });
    }

    // Speak action
    row.querySelector('.speak-ai-btn').addEventListener('click', function () {
      if (this.classList.contains('speaking')) {
        stopSpeech();
      } else {
        speakText(this.dataset.text, this, currentDefaultLang);
      }
    });

    // Copy action
    row.querySelector('.copy-ai-btn').addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(this.dataset.text);
        const sp = this.querySelector('span');
        sp.textContent = 'Copied!';
        setTimeout(() => { sp.textContent = 'Copy'; }, 1800);
      } catch {
        showToast('Copy failed.', true);
      }
    });

    // Translate action
    row.querySelector('.trans-bubble-btn').addEventListener('click', async function () {
      const targetLang = prompt('Translate this explanation to which language? (e.g. Hindi, Spanish, Telugu, French, Bengali):', 'Hindi');
      if (!targetLang) return;

      const sp = this.querySelector('span');
      const originalLabel = sp.textContent;
      sp.textContent = 'Translating...';

      setPopupAvatarState('thinking', `Translating...`, `Translating response to ${targetLang}`);

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'TRANSLATE_EXPLANATION',
          explanation,
          key_points: keyPoints,
          targetLanguage: targetLang
        });

        if (response && response.success) {
          appendAIBubble(response.explanation, response.key_points || []);
          showToast(`Translated to ${targetLang}!`);
          setPopupAvatarState('happy', targetLang, `Translated into ${targetLang}!`);
        } else {
          showToast(response?.error || 'Translation failed', true);
        }
      } catch {
        showToast('Translation service unavailable.', true);
      } finally {
        sp.textContent = originalLabel;
      }
    });

    scrollToBottom();
    return id;
  }

  // ─── Chat: Typing indicator ───────────────────────────────────────────────
  let typingRow = null;
  function showTypingIndicator() {
    typingRow = document.createElement('div');
    typingRow.className = 'typing-indicator-row';
    typingRow.innerHTML = `
      <div class="bubble-avatar ai-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>`;
    chatWindow.appendChild(typingRow);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    if (typingRow) { typingRow.remove(); typingRow = null; }
  }

  // ─── Chat: Suggested chips ────────────────────────────────────────────────
  function showSuggestions(turnIndex = 0, dynamicFollowUps = null) {
    const set = (Array.isArray(dynamicFollowUps) && dynamicFollowUps.length > 0)
      ? dynamicFollowUps
      : SUGGESTION_SETS[turnIndex % SUGGESTION_SETS.length];
    suggestionsBar.innerHTML = `<span class="suggestions-label">✨ Follow up</span>`;
    set.forEach(label => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => {
        sendMessage(label);
        suggestionsBar.style.display = 'none';
      });
      suggestionsBar.appendChild(chip);
    });
    suggestionsBar.style.display = 'flex';
  }

  function hideSuggestions() { suggestionsBar.style.display = 'none'; }

  // ─── Chat: New Chat ───────────────────────────────────────────────────────
  function resetChat() {
    conversationHistory = [];
    chatWindow.querySelectorAll('.chat-bubble-row, .typing-indicator-row').forEach(el => el.remove());
    setEmptyState(true);
    hideSuggestions();
    stopSpeech();
    chatInput.value = '';
    charHint.textContent = '';
    chatInput.style.height = 'auto';
    setPopupAvatarState('idle', currentVoiceAccent === 'en-IN' ? '🇮🇳 Indian English' : 'Ready', 'Ask anything — I explain with everyday analogies & voice!');
  }

  newChatBtn.addEventListener('click', () => {
    if (conversationHistory.length === 0) return;
    resetChat();
  });

  // ─── Chat: Auto-resize textarea ───────────────────────────────────────────
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    const len = chatInput.value.length;
    charHint.textContent = len > 0 ? `${len} chars` : '';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  });

  sendBtn.addEventListener('click', triggerSend);

  // ─── Voice Recognizer (Speech-to-Text) ──────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let chatRecognition = null;
  let isChatListening = false;
  let transRecognition = null;
  let isTransListening = false;

  const VOICE_LANG_MAP = {
    'English': 'en-IN',
    'Hindi': 'hi-IN',
    'Bengali': 'bn-IN',
    'Telugu': 'te-IN',
    'Tamil': 'ta-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
    'Kannada': 'kn-IN',
    'Malayalam': 'ml-IN',
    'Punjabi': 'pa-IN',
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Japanese': 'ja-JP',
    'Chinese': 'zh-CN',
    'Arabic': 'ar-SA'
  };

  function updateVoiceUI(listening) {
    isChatListening = listening;
    if (listening) {
      if (voiceInputBtn) {
        voiceInputBtn.classList.add('listening');
        voiceInputBtn.title = 'Listening... Click to finish';
      }
      if (voiceActiveBanner) {
        voiceActiveBanner.classList.add('active');
        const selectedLang = chatLanguageSelect ? chatLanguageSelect.value : 'English';
        if (voiceBannerText) {
          voiceBannerText.textContent = `Listening in ${selectedLang}... Speak now 🎙️`;
        }
      }
      setPopupAvatarState('speaking', 'Listening 🎙️', 'I am listening to your voice...');
    } else {
      if (voiceInputBtn) {
        voiceInputBtn.classList.remove('listening');
        voiceInputBtn.title = 'Speak to Ask (Voice Recognizer)';
      }
      if (voiceActiveBanner) {
        voiceActiveBanner.classList.remove('active');
      }
      setPopupAvatarState('idle', currentVoiceAccent === 'en-IN' ? '🇮🇳 Indian English' : 'Ready', 'Ask anything — I explain with everyday analogies & voice!');
    }
  }

  function startChatVoiceInput() {
    if (!SpeechRecognition) {
      showToast('Speech Recognition not supported in this browser.', true);
      return;
    }

    if (isChatListening) {
      stopChatVoiceInput();
      return;
    }

    stopSpeech(); // Stop any avatar audio speech

    try {
      chatRecognition = new SpeechRecognition();
      chatRecognition.continuous = false;
      chatRecognition.interimResults = true;
      chatRecognition.maxAlternatives = 1;

      const selectedLang = chatLanguageSelect ? chatLanguageSelect.value : 'English';
      chatRecognition.lang = VOICE_LANG_MAP[selectedLang] || (currentVoiceAccent || 'en-IN');

      let recognizedSpeech = '';

      chatRecognition.onstart = () => {
        updateVoiceUI(true);
      };

      chatRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          recognizedSpeech = currentText;
          chatInput.value = currentText;
          chatInput.dispatchEvent(new Event('input'));
        }
      };

      chatRecognition.onerror = (event) => {
        console.warn('[Voice Recognition Error]', event.error);
        updateVoiceUI(false);

        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          showToast('Microphone access needed. Opening permission page...', true);
          chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
        } else if (event.error === 'no-speech') {
          showToast('No speech detected. Click the mic and speak clearly.');
        } else if (event.error === 'network') {
          showToast('Voice service network error. Check internet connection.', true);
        } else if (event.error !== 'aborted') {
          showToast(`Voice error: ${event.error}`, true);
        }
      };

      chatRecognition.onend = () => {
        updateVoiceUI(false);
        if (recognizedSpeech.trim()) {
          chatInput.focus();
          showToast('🎙️ Question captured! Press Send or Enter to ask.');
        }
      };

      chatRecognition.start();
    } catch (err) {
      console.error('[Voice Recognizer Start Failed]', err);
      updateVoiceUI(false);
      showToast('Could not start microphone: ' + (err.message || 'Check permissions'), true);
    }
  }

  function stopChatVoiceInput() {
    if (chatRecognition && isChatListening) {
      try {
        chatRecognition.stop();
      } catch {}
    }
    updateVoiceUI(false);
  }

  if (voiceInputBtn) {
    voiceInputBtn.addEventListener('click', startChatVoiceInput);
  }
  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', stopChatVoiceInput);
  }

  function triggerSend() {
    stopChatVoiceInput();
    const text = chatInput.value.trim();
    if (!text || isThinking) return;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    charHint.textContent = '';
    sendMessage(text);
  }

  // ─── Chat: Core send logic ────────────────────────────────────────────────
  async function sendMessage(userText) {
    if (!userText || isThinking) return;

    hideSuggestions();
    appendUserBubble(userText);

    conversationHistory.push({ role: 'user', text: userText });

    isThinking = true;
    sendBtn.disabled = true;
    showTypingIndicator();
    setPopupAvatarState('thinking', 'Thinking...', 'Breaking down concepts simply & preparing takeaways...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageUrl = tab?.url || '';

      const isFirstTurn = conversationHistory.length === 1;
      const action = isFirstTurn ? 'EXPLAIN_TEXT_DIRECT' : 'FOLLOWUP_QUESTION';

      const response = await chrome.runtime.sendMessage({
        action,
        text: userText,
        history: conversationHistory.slice(0, -1),
        targetLanguage: currentDefaultLang,
        indianAccentNuance: currentIndianAnalogies,
        pageUrl
      });

      hideTypingIndicator();

      if (response && response.success) {
        const { explanation, key_points } = response;
        conversationHistory.push({ role: 'model', text: explanation });

        appendAIBubble(explanation, key_points || [], '', response.provider || '');
        setPopupAvatarState('happy', 'Explained!', 'Feel free to listen or ask follow-ups!');

        // Auto-speak if enabled
        const { autoSpeak } = await chrome.storage.local.get('autoSpeak').catch(() => ({}));
        if (autoSpeak) speakText(explanation, null, currentDefaultLang);

        const turnCount = conversationHistory.filter(t => t.role === 'model').length;
        showSuggestions(turnCount - 1, response.follow_ups);
      } else {
        const errMsg = response?.error || 'Failed to get a response.';
        appendErrorBubble(errMsg);
        setPopupAvatarState('idle', 'Notice', 'Could not get response.');
      }
    } catch (err) {
      hideTypingIndicator();
      appendErrorBubble(err.message || 'Error communicating with extension.');
      setPopupAvatarState('idle', 'Notice', 'Connection error.');
    } finally {
      isThinking = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  function appendErrorBubble(message) {
    const row = document.createElement('div');
    row.className = 'chat-bubble-row ai';
    row.innerHTML = `
      <div class="bubble-avatar ai-avatar" style="background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3);">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </div>
      <div class="bubble-content">
        <span class="bubble-sender" style="color: #ef4444;">Error</span>
        <div class="bubble-body" style="border-color: rgba(239,68,68,0.3); color: #fca5a5;">${escapeHtml(message)}</div>
      </div>`;
    chatWindow.appendChild(row);
    scrollToBottom();
  }

  // Quick chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) sendMessage(prompt);
    });
  });

  // Grab Selection for Chat
  grabSelectionBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { showToast('No active tab found.', true); return; }
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_SELECTION' }).catch(() => null);
      if (response?.text) {
        chatInput.value = response.text;
        chatInput.dispatchEvent(new Event('input'));
        chatInput.focus();
        showToast('Selection grabbed!');
      } else {
        showToast('No text selected on page.', true);
      }
    } catch {
      showToast('Could not grab selection from page.', true);
    }
  });

  // 30-Second Page TL;DR for Chat
  const popupPageTldrBtn = document.getElementById('popupPageTldrBtn');
  if (popupPageTldrBtn) {
    popupPageTldrBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) { showToast('No active tab found.', true); return; }

        showToast('Synthesizing 30s Page TL;DR...');
        const pageResp = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_OR_SELECTION' }).catch(() => null);
        const textToSummarize = pageResp?.text || '';
        if (!textToSummarize) {
          showToast('No readable content on page.', true);
          return;
        }

        setEmptyState(false);
        showTypingIndicator();
        setPopupAvatarState('thinking', 'Analyzing', 'Synthesizing 30-second executive TL;DR...');

        const tldrResp = await chrome.runtime.sendMessage({
          action: 'SUMMARIZE_PAGE_TLDR',
          text: textToSummarize,
          url: tab.url || '',
          language: currentDefaultLang
        });

        hideTypingIndicator();

        if (tldrResp && tldrResp.success && tldrResp.summary) {
          const s = tldrResp.summary;
          const formattedTldr = `**⚡ 30-Second Page TL;DR (${s.read_time_saved || '5 mins saved'})**\n\n> "${s.tldr}"\n\n**Executive Summary:**\n${s.quick_read}\n\n**Key Takeaways:**\n${(s.key_stats || []).map(p => `• ${p}`).join('\n')}\n\n**Target Audience:** ${s.who_should_read || 'General readers'}`;
          appendAIBubble(formattedTldr, s.key_stats || [], '', tldrResp.provider || 'AI');
          setPopupAvatarState('happy', 'TL;DR Ready', 'Here is your 30-second executive briefing!');
          showSuggestions(0, [
            "Explain in simpler terms",
            "What are the main risks?",
            "Give me a real-world example"
          ]);
        } else {
          appendErrorBubble(tldrResp?.error || 'Failed to generate page TL;DR.');
          setPopupAvatarState('idle', 'Notice', 'TL;DR generation failed.');
        }
      } catch (err) {
        hideTypingIndicator();
        appendErrorBubble(err.message || 'Error creating TL;DR.');
        setPopupAvatarState('idle', 'Notice', 'Error connecting to tab.');
      }
    });
  }

  // ─── Translator Tab Logic ────────────────────────────────────────────────
  if (transGrabBtn) {
    transGrabBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) { showToast('No active tab found.', true); return; }
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_SELECTION' }).catch(() => null);
        if (response?.text) {
          transInput.value = response.text;
          transInput.focus();
          showToast('Text grabbed from page!');
        } else {
          showToast('No text selected on page.', true);
        }
      } catch {
        showToast('Could not grab selection.', true);
      }
    });
  }

  if (transClearBtn) {
    transClearBtn.addEventListener('click', () => {
      transInput.value = '';
      if (transResultCard) transResultCard.style.display = 'none';
      stopSpeech();
    });
  }

  // ─── Translate Tab Voice Input ──────────────────────────────────────────
  if (transVoiceBtn) {
    transVoiceBtn.addEventListener('click', () => {
      if (!SpeechRecognition) {
        showToast('Speech Recognition not supported in this browser.', true);
        return;
      }

      if (isTransListening) {
        if (transRecognition) {
          try { transRecognition.stop(); } catch {}
        }
        isTransListening = false;
        transVoiceBtn.classList.remove('listening');
        transVoiceBtn.textContent = '🎙️ Speak';
        return;
      }

      try {
        transRecognition = new SpeechRecognition();
        transRecognition.continuous = false;
        transRecognition.interimResults = true;
        transRecognition.maxAlternatives = 1;

        // Use source language if available, or default
        const sourceLang = document.getElementById('transSourceLang')?.value || 'English';
        transRecognition.lang = VOICE_LANG_MAP[sourceLang] || 'en-IN';

        transRecognition.onstart = () => {
          isTransListening = true;
          transVoiceBtn.classList.add('listening');
          transVoiceBtn.textContent = '🔴 Listening...';
          showToast(`Listening in ${sourceLang}... Speak now 🎙️`);
        };

        transRecognition.onresult = (event) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          if (text) {
            transInput.value = text;
          }
        };

        transRecognition.onerror = (event) => {
          console.warn('[Translate Voice Error]', event.error);
          isTransListening = false;
          transVoiceBtn.classList.remove('listening');
          transVoiceBtn.textContent = '🎙️ Speak';
          if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            showToast('Microphone access needed. Opening permission page...', true);
            chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
          } else if (event.error === 'no-speech') {
            showToast('No speech detected. Try speaking again.');
          }
        };

        transRecognition.onend = () => {
          isTransListening = false;
          transVoiceBtn.classList.remove('listening');
          transVoiceBtn.textContent = '🎙️ Speak';
          if (transInput.value.trim()) {
            showToast('🎙️ Text captured into translator!');
            transInput.focus();
          }
        };

        transRecognition.start();
      } catch (err) {
        console.error('[Trans Voice Start Failed]', err);
        isTransListening = false;
        transVoiceBtn.classList.remove('listening');
        transVoiceBtn.textContent = '🎙️ Speak';
      }
    });
  }

  if (executeTranslateBtn) {
    executeTranslateBtn.addEventListener('click', async () => {
      const text = transInput.value.trim();
      const targetLang = transTargetLang.value;

      if (!text) {
        showToast('Please enter or paste text to translate.', true);
        transInput.focus();
        return;
      }

      executeTranslateBtn.disabled = true;
      executeTranslateText.textContent = 'Translating...';
      setPopupAvatarState('thinking', 'Translating...', `Translating text into ${targetLang}...`);

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'TRANSLATE_TEXT',
          text,
          targetLanguage: targetLang
        });

        if (response && response.success && response.translatedText) {
          transResultLangBadge.textContent = targetLang;
          transResultText.textContent = response.translatedText;
          transResultCard.style.display = 'flex';
          setPopupAvatarState('happy', targetLang, `Translated into ${targetLang}!`);
          showToast(`Translated to ${targetLang}!`);
        } else {
          showToast(response?.error || 'Translation failed.', true);
          setPopupAvatarState('idle', 'Ready', 'Translation failed.');
        }
      } catch (err) {
        showToast('Error communicating with translation service.', true);
        setPopupAvatarState('idle', 'Ready', 'Connection error.');
      } finally {
        executeTranslateBtn.disabled = false;
        executeTranslateText.textContent = 'Translate Now';
      }
    });
  }

  if (transSpeakBtn) {
    transSpeakBtn.addEventListener('click', () => {
      const text = transResultText.textContent;
      const lang = transTargetLang.value;
      if (isPopupSpeaking) {
        stopSpeech();
      } else {
        speakText(text, transSpeakBtn, lang);
      }
    });
  }

  if (transCopyBtn) {
    transCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(transResultText.textContent);
        const sp = transCopyBtn.querySelector('span');
        if (sp) {
          sp.textContent = 'Copied!';
          setTimeout(() => { sp.textContent = 'Copy'; }, 1800);
        }
        showToast('Translation copied!');
      } catch {
        showToast('Copy failed.', true);
      }
    });
  }

  // ─── Load Settings ────────────────────────────────────────────────────────
  try {
    const data = await chrome.storage.local.get(null);

    const savedKey = data.geminiApiKey || data.apiKey || '';
    if (savedKey) {
      apiKeyInput.value = savedKey;
    }
    await updateBadge();

    // Side panel detection
    if (window.innerWidth > 440 || window.innerHeight > 680 || window.location.search.includes('sidepanel')) {
      document.body.classList.add('is-sidepanel');
    }

    // Side panel opening button
    if (openSidePanelBtn) {
      openSidePanelBtn.addEventListener('click', async () => {
        try {
          const win = await chrome.windows.getCurrent();
          await chrome.runtime.sendMessage({
            action: 'OPEN_SIDE_PANEL',
            windowId: win.id
          });
          window.close();
        } catch (err) {
          console.warn('Failed to open side panel:', err);
          showToast('Could not open side panel', true);
        }
      });
    }

    // Restore Mentor Persona
    currentMentorPersona = data.mentorPersona || 'maya';
    const personaRadio = document.querySelector(`input[name="mentorPersona"][value="${currentMentorPersona}"]`);
    if (personaRadio) personaRadio.checked = true;
    updatePopupAvatarPersona(currentMentorPersona);

    document.querySelectorAll('input[name="mentorPersona"]').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const selectedPersona = e.target.value;
          updatePopupAvatarPersona(selectedPersona);
          await chrome.storage.local.set({ mentorPersona: selectedPersona });
          showToast(`Mentor Persona: ${radio.closest('.persona-card-opt')?.querySelector('strong')?.textContent || selectedPersona}`);
        }
      });
    });

    // Restore Avatar Skin
    currentAvatarSkin = data.avatarSkin || 'classic';
    const skinRadio = document.querySelector(`input[name="avatarSkin"][value="${currentAvatarSkin}"]`);
    if (skinRadio) skinRadio.checked = true;
    applyAvatarSkin(currentAvatarSkin);

    document.querySelectorAll('input[name="avatarSkin"]').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const selectedSkin = e.target.value;
          applyAvatarSkin(selectedSkin);
          await chrome.storage.local.set({ avatarSkin: selectedSkin });
          showToast(`Avatar Skin: ${selectedSkin}`);
        }
      });
    });

    // Restore Instant Auto-Explain toggle
    if (autoExplainCheckbox) {
      autoExplainCheckbox.checked = Boolean(data.autoExplainOnSelect);
      autoExplainCheckbox.addEventListener('change', async (e) => {
        await chrome.storage.local.set({ autoExplainOnSelect: e.target.checked });
        showToast(e.target.checked ? '⚡ Auto-Explain on Highlight enabled!' : 'Auto-Explain disabled');
      });
    }

    // Restore AI source radio
    const aiSource = data.aiSource || 'auto';
    const aiSourceRadio = document.querySelector(`input[name="aiSource"][value="${aiSource}"]`);
    if (aiSourceRadio) aiSourceRadio.checked = true;

    // Restore Ollama model
    if (ollamaModelInput) ollamaModelInput.value = data.ollamaModel || '';

    currentVoiceAccent = data.voiceAccent || 'en-IN';
    if (voiceAccentSelect) voiceAccentSelect.value = currentVoiceAccent;

    currentDefaultLang = data.defaultLanguage || data.targetLanguage || 'English';
    if (defaultLanguageSelect) defaultLanguageSelect.value = currentDefaultLang;
    if (chatLanguageSelect) chatLanguageSelect.value = currentDefaultLang;

    // Auto-save and sync language immediately when user changes either selector
    async function updateSelectedLanguage(newLang) {
      if (!newLang) return;
      currentDefaultLang = newLang;
      if (defaultLanguageSelect) defaultLanguageSelect.value = newLang;
      if (chatLanguageSelect) chatLanguageSelect.value = newLang;
      await chrome.storage.local.set({
        defaultLanguage: newLang,
        targetLanguage: newLang
      });
    }

    if (chatLanguageSelect && !chatLanguageSelect.dataset.listenerAttached) {
      chatLanguageSelect.dataset.listenerAttached = 'true';
      chatLanguageSelect.addEventListener('change', async (e) => {
        await updateSelectedLanguage(e.target.value);
        showToast(`Language set to ${e.target.value}`);
      });
    }

    if (defaultLanguageSelect && !defaultLanguageSelect.dataset.listenerAttached) {
      defaultLanguageSelect.dataset.listenerAttached = 'true';
      defaultLanguageSelect.addEventListener('change', async (e) => {
        await updateSelectedLanguage(e.target.value);
        showToast(`Default language: ${e.target.value}`);
      });
    }

    currentIndianAnalogies = data.indianAnalogies !== false;
    if (indianAnalogiesCheck) indianAnalogiesCheck.checked = currentIndianAnalogies;

    const style = data.explainStyle || 'simple';
    const styleRadio = document.querySelector(`input[name="explainStyle"][value="${style}"]`);
    if (styleRadio) styleRadio.checked = true;

    const theme = data.overlayTheme || 'dark';
    const themeRadio = document.querySelector(`input[name="overlayTheme"][value="${theme}"]`);
    if (themeRadio) themeRadio.checked = true;
    applyPopupTheme(theme);

    // Instant auto-save & live update on theme selection
    document.querySelectorAll('input[name="overlayTheme"]').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const selectedTheme = e.target.value;
          applyPopupTheme(selectedTheme);
          try {
            await chrome.storage.local.set({ overlayTheme: selectedTheme });
            const themeNames = {
              dark: 'Dark Slate',
              light: 'Pure Light',
              cyberpunk: 'Cyberpunk Neon',
              midnight: 'Midnight OLED',
              aurora: 'Cosmic Aurora',
              emerald: 'Emerald Luxury'
            };
            showToast(`Theme: ${themeNames[selectedTheme] || selectedTheme}`);
            // Inform active tabs to switch active card theme immediately
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'SET_OVERLAY_CARD_THEME',
                theme: selectedTheme
              }).catch(() => {});
            }
          } catch (err) {
            console.error('[Settings] Theme save error:', err);
          }
        }
      });
    });

    const bgStyle = data.overlayBgStyle || 'glow';
    const bgRadio = document.querySelector(`input[name="overlayBgStyle"][value="${bgStyle}"]`);
    if (bgRadio) bgRadio.checked = true;
    applyPopupBgStyle(bgStyle);

    // Instant auto-save & live update on background style selection
    document.querySelectorAll('input[name="overlayBgStyle"]').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const selectedBgStyle = e.target.value;
          applyPopupBgStyle(selectedBgStyle);
          try {
            await chrome.storage.local.set({ overlayBgStyle: selectedBgStyle });
            const bgNames = {
              glow: 'Soft Glow',
              grid: 'Cyber Grid',
              dots: 'Dot Matrix',
              stars: 'Starfield',
              waves: 'Radiant Flow',
              glass: 'Glass Prism'
            };
            showToast(`Background: ${bgNames[selectedBgStyle] || selectedBgStyle}`);
            // Inform active tabs to switch active card background immediately
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'SET_OVERLAY_CARD_BG_STYLE',
                bgStyle: selectedBgStyle
              }).catch(() => {});
            }
          } catch (err) {
            console.error('[Settings] Background save error:', err);
          }
        }
      });
    });

    showFloatingCheckbox.checked = typeof data.showFloatingButton === 'boolean' ? data.showFloatingButton : true;
    if (autoSpeakCheckbox) autoSpeakCheckbox.checked = data.autoSpeak !== false;
    if (autoLaunchJarvisCheckbox) {
      autoLaunchJarvisCheckbox.checked = Boolean(data.autoLaunchJarvis);
      autoLaunchJarvisCheckbox.addEventListener('change', async (e) => {
        await chrome.storage.local.set({ autoLaunchJarvis: e.target.checked });
        showToast(e.target.checked ? '🚀 Auto-Launch Jarvis Tab enabled!' : 'Auto-Launch Jarvis disabled');
      });
    }

    async function syncAlwaysListening(enabled) {
      await chrome.storage.local.set({
        jarvisContinuousListen: enabled,
        jarvisBackgroundActive: enabled
      });
      if (jarvisContinuousListenCheckbox) jarvisContinuousListenCheckbox.checked = enabled;
      if (jarvisQuickAutoListen) jarvisQuickAutoListen.checked = enabled;
      if (jarvisBackgroundListenToggle) jarvisBackgroundListenToggle.checked = enabled;
      if (jarvisMasterCard) {
        if (enabled) jarvisMasterCard.classList.add('active');
        else jarvisMasterCard.classList.remove('active');
      }
      if (jarvisLivePill) {
        jarvisLivePill.style.display = enabled ? 'inline-flex' : 'none';
      }

      if (enabled) {
        const { micPermissionGranted } = await chrome.storage.local.get('micPermissionGranted').catch(() => ({}));
        if (!micPermissionGranted) {
          chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
          showToast('🎙️ Please allow microphone permission in the opened tab!');
        }
        showToast('🎙️ Always Listening Mode ON!');
        await chrome.runtime.sendMessage({
          action: 'START_BACKGROUND_JARVIS',
          lang: currentDefaultLang || 'English'
        }).catch(() => {});
        startJarvisListening(true);
      } else {
        showToast('Voice Mode: Manual (Always Listen OFF)');
        await chrome.runtime.sendMessage({
          action: 'STOP_BACKGROUND_JARVIS'
        }).catch(() => {});
        stopJarvisListening();
      }
    }

    const isAlwaysListening = (data.jarvisContinuousListen !== false) || Boolean(data.jarvisBackgroundActive);
    if (jarvisContinuousListenCheckbox) {
      jarvisContinuousListenCheckbox.checked = isAlwaysListening;
      jarvisContinuousListenCheckbox.addEventListener('change', (e) => syncAlwaysListening(e.target.checked));
    }

    if (jarvisQuickAutoListen) {
      jarvisQuickAutoListen.checked = isAlwaysListening;
      jarvisQuickAutoListen.addEventListener('change', (e) => syncAlwaysListening(e.target.checked));
    }

    // Restore Background Voice Mode
    if (jarvisBackgroundListenToggle) {
      jarvisBackgroundListenToggle.checked = isAlwaysListening;
      jarvisBackgroundListenToggle.addEventListener('change', (e) => syncAlwaysListening(e.target.checked));
      if (isAlwaysListening) {
        if (jarvisMasterCard) jarvisMasterCard.classList.add('active');
        if (jarvisLivePill) jarvisLivePill.style.display = 'inline-flex';
      } else {
        if (jarvisMasterCard) jarvisMasterCard.classList.remove('active');
        if (jarvisLivePill) jarvisLivePill.style.display = 'none';
      }
    }

    if (popupAvatarBadge) {
      popupAvatarBadge.textContent = currentVoiceAccent === 'en-IN' ? '🇮🇳 Indian English' : currentVoiceAccent;
    }

    // Auto-launch Jarvis tab on open if enabled in settings
    if (data.autoLaunchJarvis) {
      setTimeout(() => {
        const tabBtn = document.getElementById('tabJarvisBtn');
        if (tabBtn) tabBtn.click();
      }, 50);
    }
  } catch (err) {
    console.error('[Settings] Load error:', err);
    updateBadge(false);
  }

  // ─── Ollama Status Checker ────────────────────────────────────────────────
  async function checkOllamaStatus() {
    if (!ollamaStatusDot || !ollamaStatusText) return;
    ollamaStatusText.textContent = 'Checking Ollama...';
    ollamaStatusDot.style.background = '#94a3b8';
    try {
      const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map(m => m.name);
        if (models.length > 0) {
          ollamaStatusDot.style.background = '#22c55e';
          ollamaStatusText.textContent = `✅ Ollama running — ${models.length} model${models.length > 1 ? 's' : ''}: ${models.slice(0, 3).join(', ')}`;
        } else {
          ollamaStatusDot.style.background = '#f59e0b';
          ollamaStatusText.textContent = '⚠️ Ollama running but no models downloaded yet. Run: ollama pull llama3.2';
        }
      } else if (res.status === 403) {
        ollamaStatusDot.style.background = '#f59e0b';
        ollamaStatusText.textContent = '⚠️ Ollama running, but CORS blocked (403). Quit Ollama from tray & restart it.';
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch {
      ollamaStatusDot.style.background = '#ef4444';
      ollamaStatusText.textContent = '❌ Ollama not running — start Ollama from Start menu';
    }
  }

  // Run Ollama check when Settings tab is opened
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'settings') checkOllamaStatus();
    });
  });

  document.querySelectorAll('input[name="aiSource"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) {
        await switchAiSource(e.target.value);
      }
    });
  });

  if (checkOllamaBtn) checkOllamaBtn.addEventListener('click', checkOllamaStatus);

  if (pullModelBtn && ollamaModelInput) {
    pullModelBtn.addEventListener('click', () => {
      const modelName = ollamaModelInput.value.trim() || 'llama3.2';
      // Open terminal instructions since we can't exec terminal from extension popup
      const msg = `To download ${modelName}, open a terminal and run:\n\nollama pull ${modelName}\n\nThis will download the model (~2GB). Once done, click Refresh.`;
      alert(msg);
    });
  }

  // Initial Ollama check and badge update
  checkOllamaStatus();
  updateBadge();

  // ─── History Tab ─────────────────────────────────────────────────────────
  async function loadHistoryUI() {
    try {
      const { history = [] } = await chrome.storage.local.get('history');
      if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No explanations yet.<br>Start a chat or highlight text to see history here!</div>';
        return;
      }
      historyList.innerHTML = history.map(item => {
        const dateStr = item.timestamp
          ? new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
          : '';
        const tagClass = item.type === 'code' ? 'code' : 'text';
        const langTag = item.language && item.language !== 'English' ? `<span style="font-size:9px; color:#a5b4fc; background:rgba(99,102,241,0.2); padding:1px 5px; border-radius:3px;">${escapeHtml(item.language)}</span>` : '';
        const fullText = item.explanation + (item.key_points?.length ? '\n\nKey Takeaways:\n' + item.key_points.map(k => '• ' + k).join('\n') : '');

        return `
          <div class="history-item">
            <div class="history-item-header">
              <span class="history-tag ${tagClass}">${escapeHtml(item.type || 'text')}</span>
              ${langTag}
              <span>${dateStr}</span>
            </div>
            <div class="history-snippet">"${escapeHtml((item.text || '').substring(0, 80))}${item.text?.length > 80 ? '…' : ''}"</div>
            <div class="history-explanation">${formatMarkdown(item.explanation)}</div>
            <div class="history-footer">
              <button type="button" class="btn-action-small speak-history-btn" data-speak="${escapeHtml(fullText)}" data-lang="${escapeHtml(item.language || 'English')}">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <span>Listen</span>
              </button>
              <button type="button" class="btn-copy-small copy-history-btn" data-copy="${escapeHtml(fullText)}">Copy</button>
            </div>
          </div>`;
      }).join('');

      historyList.querySelectorAll('.speak-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('speaking')) {
            stopSpeech();
            btn.classList.remove('speaking');
            btn.querySelector('span').textContent = 'Listen';
          } else {
            historyList.querySelectorAll('.speak-history-btn').forEach(b => {
              b.classList.remove('speaking');
              b.querySelector('span').textContent = 'Listen';
            });
            stopSpeech();
            speakText(btn.dataset.speak, btn, btn.dataset.lang || 'English');
          }
        });
      });

      historyList.querySelectorAll('.copy-history-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
        });
      });
    } catch (err) {
      console.error('[History] Failed:', err);
      historyList.innerHTML = '<div class="empty-history">Failed to load history.</div>';
    }
  }

  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Clear all saved explanation history?')) {
      await chrome.storage.local.set({ history: [] });
      loadHistoryUI();
      showToast('History cleared.');
    }
  });

  // ─── Settings: Password visibility ───────────────────────────────────────
  toggleVisibilityBtn.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
    toggleVisibilityBtn.title = isPass ? 'Hide API key' : 'Show API key';
  });

  // ─── Settings: Test Key ───────────────────────────────────────────────────
  testKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      testStatus.textContent = 'Please enter a key first.';
      testStatus.className = 'test-status-msg error';
      apiKeyInput.focus();
      return;
    }
    testKeyBtn.disabled = true;
    testBtnText.textContent = 'Testing...';
    testStatus.textContent = 'Validating key with Gemini...';
    testStatus.className = 'test-status-msg loading';

    try {
      let isValid = false;
      let errorMsg = '';

      // Direct Gemini fallback
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with OK.' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });

      if (res.ok) {
        isValid = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        errorMsg = errData.error?.message || `Gemini API error (${res.status})`;
      }

      if (isValid) {
        testStatus.textContent = '✓ Gemini key verified successfully!';
        testStatus.className = 'test-status-msg success';
        updateBadge(true);
      } else {
        testStatus.textContent = `✗ ${errorMsg || 'Invalid key.'}`;
        testStatus.className = 'test-status-msg error';
      }
    } catch {
      testStatus.textContent = '✗ Connection error.';
      testStatus.className = 'test-status-msg error';
    } finally {
      testKeyBtn.disabled = false;
      testBtnText.textContent = 'Test Key';
    }
  });


  // ─── Voice Recognition via Offscreen Document ────────────────────────────
  // Chrome MV3 popup pages cannot access microphone directly.
  // We use a persistent port to background.js → offscreen.html → SpeechRecognition.

  // Track which target is currently listening ('chat' | 'translate' | null)
  let voiceActiveTarget = null;

  // Establish persistent port to background for receiving voice results
  const voicePort = chrome.runtime.connect({ name: 'voice-channel' });

  voicePort.onMessage.addListener((msg) => {
    if (msg.action === 'VOICE_STARTED') {
      if (msg.target === 'live') {
        if (liveCallStatus) liveCallStatus.textContent = 'Listening...';
        const pill = document.querySelector('.live-call-status-pill');
        if (pill) pill.className = 'live-call-status-pill listening';
        if (liveSoundwaveBars) liveSoundwaveBars.classList.add('active');
      } else if (msg.target === 'jarvis') {
        isJarvisListening = true;
        if (jarvisMicBtn) jarvisMicBtn.classList.add('active');
        if (jarvisOrb) jarvisOrb.classList.add('listening');
        if (jarvisMicIndicator) {
          jarvisMicIndicator.style.display = 'flex';
          const label = jarvisMicIndicator.querySelector('.mic-listening-text');
          if (label) label.textContent = 'Listening... Speak now';
        }
      }
    }

    if (msg.action === 'VOICE_INTERIM') {
      if (msg.target === 'chat') {
        if (voiceBannerText) voiceBannerText.textContent = `🎙️ "${msg.text}"`;
      } else if (msg.target === 'live') {
        if (liveTranscriptSender) liveTranscriptSender.textContent = 'You:';
        if (liveTranscriptBody) liveTranscriptBody.textContent = `"${msg.text}..."`;
      } else if (msg.target === 'jarvis') {
        if (jarvisCommandInput) jarvisCommandInput.value = msg.text;
        if (jarvisMicIndicator) {
          const label = jarvisMicIndicator.querySelector('.mic-listening-text');
          if (label) label.textContent = `Hearing: "${msg.text}..."`;
        }
      }
    }

    if (msg.action === 'VOICE_FINAL') {
      if (msg.target === 'live') {
        if (liveTranscriptSender) liveTranscriptSender.textContent = 'You:';
        if (liveTranscriptBody) liveTranscriptBody.textContent = `"${msg.text}"`;
        if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
        handleLiveTalkSpeech(msg.text);
      } else if (msg.target === 'jarvis' || msg.target === 'background_jarvis') {
        if (jarvisCommandInput) jarvisCommandInput.value = msg.text;
        executeJarvisCommand(msg.text);
      } else {
        const textarea = msg.target === 'chat' ? chatInput : transInput;
        if (textarea) {
          const existing = textarea.value.trim();
          textarea.value = existing ? `${existing} ${msg.text.trim()}` : msg.text.trim();
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }

    if (msg.action === 'JARVIS_FEED_UPDATE') {
      appendJarvisFeed(msg.feedType || 'assistant', msg.sender || 'Jarvis', msg.message || '', msg.feedType === 'user' ? '👤' : '🤖');
    }

    if (msg.action === 'VOICE_RESULT' && msg.error) {
      if (msg.error === 'aborted') return;
      if (msg.target === 'live') {
        if (msg.error === 'not-allowed') {
          chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
        }
        if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
        if (isLiveTalkActive && !isLiveMuted) {
          setTimeout(() => {
            if (isLiveTalkActive && !isLiveMuted && !isLiveThinking && !isPopupSpeaking) {
              startVoice('live', currentDefaultLang);
            }
          }, 800);
        }
      } else if (msg.target === 'jarvis' || msg.target === 'background_jarvis') {
        if (msg.error === 'no-speech' || msg.error === 'aborted') {
          return; // Normal silence / debounce in continuous mode
        }
        if (msg.error === 'not-allowed') {
          stopJarvisListeningUI();
          showToast('🎙️ Microphone access denied.');
          return;
        }
        showToast(`🎙️ ${msg.errorMsg || msg.error}`);
      } else {
        showToast(`🎙️ ${msg.errorMsg || msg.error}`, true);
        cleanupAllVoiceUI();
      }
    }

    if (msg.action === 'VOICE_ENDED') {
      if (msg.target === 'live') {
        if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
        if (isLiveTalkActive && !isLiveThinking && !isPopupSpeaking && !isLiveMuted) {
          setTimeout(() => {
            if (isLiveTalkActive && !isLiveThinking && !isPopupSpeaking && !isLiveMuted) {
              startVoice('live', currentDefaultLang);
            }
          }, 350);
        }
      } else if (msg.target === 'jarvis' || msg.target === 'background_jarvis') {
        chrome.storage.local.get(['jarvisContinuousListen', 'jarvisBackgroundActive'], (res) => {
          const isAlways = res.jarvisContinuousListen !== false || Boolean(res.jarvisBackgroundActive);
          if (!isAlways && !isJarvisExecutingCommand) {
            stopJarvisListeningUI();
          }
        });
      } else {
        cleanupAllVoiceUI();
      }
    }
  });

  voicePort.onDisconnect.addListener(() => {
    cleanupAllVoiceUI();
  });

  function cleanupAllVoiceUI() {
    voiceActiveTarget = null;
    if (voiceInputBtn)     voiceInputBtn.classList.remove('listening');
    if (voiceActiveBanner) voiceActiveBanner.classList.remove('visible');
    if (voiceBannerText)   voiceBannerText.textContent = 'Listening… Speak now';
    if (transVoiceBtn)     transVoiceBtn.classList.remove('listening');
    if (!isLiveTalkActive && liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
    stopJarvisListeningUI();
  }

  async function stopVoice(target) {
    await chrome.runtime.sendMessage({ action: 'STOP_VOICE', target: target || voiceActiveTarget }).catch(() => {});
    cleanupAllVoiceUI();
  }

  async function startVoice(target, lang, forceStart = false) {
    // Toggle: if already listening this target, stop it (unless forceStart is requested)
    if (!forceStart && voiceActiveTarget === target) {
      await chrome.runtime.sendMessage({ action: 'STOP_VOICE', target }).catch(() => {});
      cleanupAllVoiceUI();
      return;
    }

    // Stop any other active session
    if (voiceActiveTarget && voiceActiveTarget !== target) {
      await chrome.runtime.sendMessage({ action: 'STOP_VOICE', target: voiceActiveTarget }).catch(() => {});
      cleanupAllVoiceUI();
    }

    voiceActiveTarget = target;

    // Show listening UI
    if (target === 'chat') {
      if (voiceInputBtn)     voiceInputBtn.classList.add('listening');
      if (voiceActiveBanner) voiceActiveBanner.classList.add('visible');
      if (voiceBannerText)   voiceBannerText.textContent = '🎙️ Listening… speak now';
    } else if (target === 'translate') {
      if (transVoiceBtn) transVoiceBtn.classList.add('listening');
    }

    try {
      const resp = await chrome.runtime.sendMessage({ action: 'START_VOICE', lang, target });
      if (resp && !resp.success) {
        showToast(`🎙️ ${resp.error || 'Could not start voice'}`, true);
        cleanupAllVoiceUI();
      }
    } catch (err) {
      showToast('🎙️ Voice error: ' + (err.message || 'unknown'), true);
      cleanupAllVoiceUI();
    }
  }

  // ── Chat tab: mic button ───────────────────────────────────────────────────
  if (voiceInputBtn) {
    voiceInputBtn.addEventListener('click', () => {
      const lang = chatLanguageSelect ? chatLanguageSelect.value : 'English';
      startVoice('chat', lang);
    });
  }

  // ── Chat tab: "Done" stop button ───────────────────────────────────────────
  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'STOP_VOICE', target: 'chat' }).catch(() => {});
      cleanupAllVoiceUI();
    });
  }

  // ── Translate tab: 🎙️ Speak button ───────────────────────────────────────
  if (transVoiceBtn) {
    transVoiceBtn.addEventListener('click', () => {
      const lang = transTargetLang ? transTargetLang.value : 'English';
      startVoice('translate', lang);
    });
  }

  // ─── Hands-Free "Maya Live Talk" Engine ──────────────────────────────────
  async function handleLiveTalkSpeech(userText) {
    if (!userText || !userText.trim() || !isLiveTalkActive) return;

    if (userText.trim().toLowerCase() === 'stop' || userText.trim().toLowerCase() === 'end call') {
      stopLiveTalk();
      return;
    }

    isLiveThinking = true;
    if (liveCallStatus) liveCallStatus.textContent = 'Thinking...';
    const pill = document.querySelector('.live-call-status-pill');
    if (pill) pill.className = 'live-call-status-pill thinking';
    if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');

    // Add to chat history so conversational notes are preserved
    conversationHistory.push({ role: 'user', text: userText });
    appendUserBubble(userText);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageUrl = tab?.url || '';

      const isFirstTurn = conversationHistory.length === 1;
      const action = isFirstTurn ? 'EXPLAIN_TEXT_DIRECT' : 'FOLLOWUP_QUESTION';

      const response = await chrome.runtime.sendMessage({
        action,
        text: userText,
        history: conversationHistory.slice(0, -1),
        targetLanguage: currentDefaultLang,
        indianAccentNuance: currentIndianAnalogies,
        pageUrl
      });

      isLiveThinking = false;
      if (!isLiveTalkActive) return;

      if (response && response.success) {
        const { explanation, key_points } = response;
        conversationHistory.push({ role: 'model', text: explanation });
        appendAIBubble(explanation, key_points || [], '', response.provider || '');

        const mentorName = currentMentorPersona === 'rao' ? 'Prof. Rao' :
                           currentMentorPersona === 'priya' ? 'Priya' :
                           currentMentorPersona === 'eli5' ? 'ELI5 Buddy' : 'Maya';

        if (liveTranscriptSender) liveTranscriptSender.textContent = `${mentorName}:`;
        if (liveTranscriptBody) liveTranscriptBody.textContent = `"${explanation}"`;

        if (liveCallStatus) liveCallStatus.textContent = 'Speaking...';
        if (pill) pill.className = 'live-call-status-pill speaking';
        if (liveSoundwaveBars) liveSoundwaveBars.classList.add('active');

        speakText(explanation, null, currentDefaultLang, () => {
          if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
          if (isLiveTalkActive && !isLiveMuted) {
            if (liveCallStatus) liveCallStatus.textContent = 'Listening...';
            if (pill) pill.className = 'live-call-status-pill listening';
            setTimeout(() => {
              if (isLiveTalkActive && !isLiveMuted && !isLiveThinking) {
                startVoice('live', currentDefaultLang);
              }
            }, 350);
          }
        });
      } else {
        const errMsg = response?.error || 'Could not get an answer.';
        if (liveTranscriptBody) liveTranscriptBody.textContent = `"${errMsg}"`;
        if (isLiveTalkActive && !isLiveMuted) {
          setTimeout(() => {
            if (isLiveTalkActive && !isLiveMuted) {
              startVoice('live', currentDefaultLang);
            }
          }, 1200);
        }
      }
    } catch (err) {
      isLiveThinking = false;
      if (!isLiveTalkActive) return;
      if (liveTranscriptBody) liveTranscriptBody.textContent = `"Connection error: ${err.message}"`;
      if (isLiveTalkActive && !isLiveMuted) {
        setTimeout(() => {
          if (isLiveTalkActive && !isLiveMuted) {
            startVoice('live', currentDefaultLang);
          }
        }, 1200);
      }
    }
  }

  function startLiveTalk() {
    isLiveTalkActive = true;
    isLiveMuted = false;
    isLiveThinking = false;

    if (liveCallOverlay) liveCallOverlay.style.display = 'flex';
    if (liveCallStatus) liveCallStatus.textContent = 'Connecting...';
    const pill = document.querySelector('.live-call-status-pill');
    if (pill) pill.className = 'live-call-status-pill';

    const mentorName = currentMentorPersona === 'rao' ? 'Prof. Rao' :
                       currentMentorPersona === 'priya' ? 'Priya' :
                       currentMentorPersona === 'eli5' ? 'ELI5 Buddy' : 'Maya';
    if (livePersonaBadge) {
      livePersonaBadge.textContent = `${mentorName} • Active Mentor`;
    }
    if (liveTranscriptSender) liveTranscriptSender.textContent = `${mentorName}:`;
    if (liveTranscriptBody) {
      liveTranscriptBody.textContent = `"Hey! I'm ready. Speak naturally and I will listen and answer hands-free."`;
    }

    startVoice('live', currentDefaultLang);
  }

  function stopLiveTalk() {
    isLiveTalkActive = false;
    isLiveMuted = false;
    isLiveThinking = false;

    chrome.runtime.sendMessage({ action: 'STOP_VOICE', target: 'live' }).catch(() => {});
    stopSpeech();

    if (liveCallOverlay) liveCallOverlay.style.display = 'none';
    if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
    showToast('Live Talk ended');
  }

  function toggleLiveMute() {
    isLiveMuted = !isLiveMuted;
    if (isLiveMuted) {
      chrome.runtime.sendMessage({ action: 'STOP_VOICE', target: 'live' }).catch(() => {});
      if (liveMuteBtn) liveMuteBtn.classList.add('muted');
      if (liveMuteText) liveMuteText.textContent = 'Unmute';
      if (liveCallStatus) liveCallStatus.textContent = 'Muted';
      if (liveSoundwaveBars) liveSoundwaveBars.classList.remove('active');
      showToast('Microphone muted');
    } else {
      if (liveMuteBtn) liveMuteBtn.classList.remove('muted');
      if (liveMuteText) liveMuteText.textContent = 'Mute';
      if (liveCallStatus) liveCallStatus.textContent = 'Listening...';
      startVoice('live', currentDefaultLang);
      showToast('Microphone active');
    }
  }

  if (startLiveTalkBtn) {
    startLiveTalkBtn.addEventListener('click', startLiveTalk);
  }
  if (liveCallCloseBtn) {
    liveCallCloseBtn.addEventListener('click', stopLiveTalk);
  }
  if (liveEndCallBtn) {
    liveEndCallBtn.addEventListener('click', stopLiveTalk);
  }
  if (liveMuteBtn) {
    liveMuteBtn.addEventListener('click', toggleLiveMute);
  }

  // ─── Settings: Save ───────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = apiKeyInput.value.trim();
    const explainStyle = document.querySelector('input[name="explainStyle"]:checked')?.value || 'simple';
    const overlayTheme = document.querySelector('input[name="overlayTheme"]:checked')?.value || 'dark';
    const showFloatingButton = showFloatingCheckbox.checked;
    const autoSpeak = autoSpeakCheckbox ? autoSpeakCheckbox.checked : false;
    const voiceAccent = voiceAccentSelect ? voiceAccentSelect.value : 'en-IN';
    const defaultLanguage = defaultLanguageSelect ? defaultLanguageSelect.value : 'English';
    const indianAnalogies = indianAnalogiesCheck ? indianAnalogiesCheck.checked : true;
    const aiSource = document.querySelector('input[name="aiSource"]:checked')?.value || 'auto';
    const ollamaModel = ollamaModelInput ? ollamaModelInput.value.trim() : '';
    const mentorPersona = document.querySelector('input[name="mentorPersona"]:checked')?.value || 'maya';
    const avatarSkin = document.querySelector('input[name="avatarSkin"]:checked')?.value || 'classic';
    const autoExplainOnSelect = autoExplainCheckbox ? autoExplainCheckbox.checked : false;
    const autoLaunchJarvis = autoLaunchJarvisCheckbox ? autoLaunchJarvisCheckbox.checked : false;
    const jarvisContinuousListen = jarvisContinuousListenCheckbox ? jarvisContinuousListenCheckbox.checked : false;

    currentVoiceAccent = voiceAccent;
    currentDefaultLang = defaultLanguage;
    currentIndianAnalogies = indianAnalogies;
    currentMentorPersona = mentorPersona;
    currentAvatarSkin = avatarSkin;

    if (jarvisQuickAutoListen) jarvisQuickAutoListen.checked = jarvisContinuousListen;

    try {
      await chrome.storage.local.set({
        apiKey,
        geminiApiKey: apiKey,
        explainStyle,
        overlayTheme,
        showFloatingButton,
        autoSpeak,
        voiceAccent,
        defaultLanguage,
        targetLanguage: defaultLanguage,
        indianAnalogies,
        aiSource,
        ollamaModel,
        mentorPersona,
        avatarSkin,
        autoExplainOnSelect,
        autoLaunchJarvis,
        jarvisContinuousListen
      });
      updateBadge(Boolean(apiKey));
      updatePopupAvatarPersona(mentorPersona);
      applyAvatarSkin(avatarSkin);
      if (popupAvatarBadge) {
        popupAvatarBadge.textContent = voiceAccent === 'en-IN' ? '🇮🇳 Indian English' : voiceAccent;
      }
      showToast('Settings saved!');
    } catch {
      showToast('Failed to save settings.', true);
    }
  });

  // ─── Gamified Learning / Quiz Mode Engine ────────────────────────────────
  let currentActiveQuiz = null;
  let currentQuizIndex = 0;
  let currentQuizScore = 0;

  function triggerPopupConfetti() {
    if (!popupConfettiCanvas) return;
    const canvas = popupConfettiCanvas;
    const parent = canvas.parentElement || document.body;
    canvas.width = parent.clientWidth || 420;
    canvas.height = parent.clientHeight || 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7', '#f43f5e', '#eab308'];
    const particleCount = 65;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 11,
        vy: -Math.random() * 9 - 4,
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
        p.vx *= 0.98; // air resistance
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    requestAnimationFrame(frame);
  }

  function switchToQuizTabWithText(text) {
    const quizBtn = document.getElementById('tabQuizBtn');
    if (quizBtn) {
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      tabPanes.forEach(p => p.classList.remove('active'));
      quizBtn.classList.add('active');
      quizBtn.setAttribute('aria-selected', 'true');
      const pane = document.getElementById('tab-quiz');
      if (pane) pane.classList.add('active');
    }

    if (quizInputText) {
      quizInputText.value = text;
    }
    startQuizFlow(text);
  }

  async function startQuizFlow(textToQuiz) {
    const text = (textToQuiz || quizInputText?.value || '').trim();
    if (!text) {
      showToast('Please enter text or grab article content first!', true);
      quizInputText?.focus();
      return;
    }

    if (quizSetupSection) quizSetupSection.style.display = 'none';
    if (quizActiveCard) quizActiveCard.style.display = 'none';
    if (quizSummaryCard) quizSummaryCard.style.display = 'none';
    if (quizLoadingState) quizLoadingState.style.display = 'flex';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_QUIZ',
        text,
        language: currentDefaultLang
      });

      if (!response || !response.success || !response.quiz || !response.quiz.questions?.length) {
        throw new Error(response?.error || 'Failed to generate quiz.');
      }

      if (quizLoadingState) quizLoadingState.style.display = 'none';
      runPopupQuizEngine(response.quiz);
    } catch (err) {
      console.error('Popup quiz error:', err);
      showToast(err.message || 'Quiz generation failed.', true);
      if (quizLoadingState) quizLoadingState.style.display = 'none';
      if (quizSetupSection) quizSetupSection.style.display = 'flex';
    }
  }

  function runPopupQuizEngine(quiz) {
    currentActiveQuiz = quiz;
    currentQuizIndex = 0;
    currentQuizScore = 0;

    if (quizSetupSection) quizSetupSection.style.display = 'none';
    if (quizLoadingState) quizLoadingState.style.display = 'none';
    if (quizSummaryCard) quizSummaryCard.style.display = 'none';
    if (quizActiveCard) quizActiveCard.style.display = 'flex';

    renderPopupQuestion(0);
  }

  function renderPopupQuestion(index) {
    if (!currentActiveQuiz || !currentActiveQuiz.questions) return;
    const questions = currentActiveQuiz.questions;
    const total = questions.length;

    if (index >= total) {
      showPopupQuizSummary();
      return;
    }

    const q = questions[index];
    const pct = Math.round(((index + 1) / total) * 100);

    if (popupQuizProgressBadge) popupQuizProgressBadge.textContent = `🎯 Question ${index + 1} of ${total}`;
    if (popupQuizScoreBadge) popupQuizScoreBadge.textContent = `⭐ Score: ${currentQuizScore} / ${total}`;
    if (popupQuizProgressFill) popupQuizProgressFill.style.width = `${pct}%`;
    if (popupQuizQuestionText) popupQuizQuestionText.textContent = q.question;
    if (popupQuizFeedbackArea) popupQuizFeedbackArea.innerHTML = '';

    if (popupQuizOptionsGrid) {
      popupQuizOptionsGrid.innerHTML = q.options.map((opt, optIdx) => `
        <button type="button" class="quiz-option-btn" data-opt-index="${optIdx}">
          <span class="quiz-option-letter">${String.fromCharCode(65 + optIdx)}</span>
          <span class="quiz-option-text">${escapeHtml(opt)}</span>
        </button>
      `).join('');

      let answered = false;
      popupQuizOptionsGrid.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;

          const chosenIdx = parseInt(btn.getAttribute('data-opt-index'), 10);
          const isCorrect = chosenIdx === q.correctIndex;

          popupQuizOptionsGrid.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.disabled = true;
          });

          if (isCorrect) {
            currentQuizScore++;
            btn.classList.add('correct');
            triggerPopupConfetti();

            if (popupQuizScoreBadge) popupQuizScoreBadge.textContent = `⭐ Score: ${currentQuizScore} / ${total}`;

            if (popupQuizFeedbackArea) {
              popupQuizFeedbackArea.innerHTML = `
                <div class="quiz-feedback-box correct">
                  <span style="font-size:16px;">🎉</span>
                  <div>
                    <strong>Correct! Sahi Jawab! (+10 XP)</strong>
                    <div style="margin-top:2px;">${escapeHtml(q.explanation)}</div>
                  </div>
                </div>
                <button type="button" class="quiz-next-btn" id="popupQuizNextBtn">
                  ${index + 1 < total ? 'Next Question ➔' : 'View Final Score 🏆'}
                </button>
              `;
            }
          } else {
            btn.classList.add('incorrect');
            const correctBtn = popupQuizOptionsGrid.querySelector(`[data-opt-index="${q.correctIndex}"]`);
            if (correctBtn) correctBtn.classList.add('correct-reveal');

            if (popupQuizFeedbackArea) {
              popupQuizFeedbackArea.innerHTML = `
                <div class="quiz-feedback-box incorrect">
                  <span style="font-size:16px;">💡</span>
                  <div>
                    <strong>Incorrect!</strong> The right answer was <b>${escapeHtml(q.options[q.correctIndex])}</b>.
                    <div style="margin-top:2px;">${escapeHtml(q.explanation)}</div>
                  </div>
                </div>
                <button type="button" class="quiz-next-btn" id="popupQuizNextBtn">
                  ${index + 1 < total ? 'Next Question ➔' : 'View Final Score 🏆'}
                </button>
              `;
            }
          }

          const nextBtn = popupQuizFeedbackArea?.querySelector('#popupQuizNextBtn');
          if (nextBtn) {
            nextBtn.addEventListener('click', () => {
              currentQuizIndex++;
              renderPopupQuestion(currentQuizIndex);
            });
          }
        });
      });
    }
  }

  function showPopupQuizSummary() {
    if (quizActiveCard) quizActiveCard.style.display = 'none';
    if (quizSummaryCard) quizSummaryCard.style.display = 'flex';

    const total = currentActiveQuiz?.questions?.length || 3;
    const pct = Math.round((currentQuizScore / total) * 100);

    let trophy = '🌟';
    let title = 'Great Effort!';
    let praise = 'You explored new concepts today. Keep challenging yourself to master every topic!';

    if (currentQuizScore === total) {
      trophy = '🏆';
      title = 'Quiz Master! 100%';
      praise = 'Flawless victory! You answered all questions correctly. Outstanding understanding!';
      triggerPopupConfetti();
      setTimeout(() => triggerPopupConfetti(), 450);
    } else if (currentQuizScore >= 2) {
      trophy = '🥇';
      title = 'Brilliant Score!';
      praise = 'Superb performance! You got most questions right. You have a solid grasp of this concept!';
      triggerPopupConfetti();
    }

    if (popupQuizTrophy) popupQuizTrophy.textContent = trophy;
    if (popupQuizSummaryTitle) popupQuizSummaryTitle.textContent = title;
    if (popupQuizScorePill) popupQuizScorePill.textContent = `Score: ${currentQuizScore} / ${total} (${pct}%)`;
    if (popupQuizSummaryPraise) popupQuizSummaryPraise.textContent = praise;
  }

  // Hook Quiz tab buttons
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', () => {
      startQuizFlow();
    });
  }

  if (quizClearBtn) {
    quizClearBtn.addEventListener('click', () => {
      if (quizInputText) quizInputText.value = '';
    });
  }

  if (quizGrabBtn) {
    quizGrabBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          showToast('No active tab found.', true);
          return;
        }

        const res = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_OR_SELECTION' }).catch(() => null);
        if (res && res.text) {
          if (quizInputText) {
            quizInputText.value = res.text;
            showToast(res.source === 'selection' ? 'Grabbed highlighted selection!' : 'Grabbed article from page!');
          }
        } else {
          showToast('Could not grab content. Highlight text or paste directly.', true);
        }
      } catch {
        showToast('Could not grab page content.', true);
      }
    });
  }

  if (popupQuizRetryBtn) {
    popupQuizRetryBtn.addEventListener('click', () => {
      if (currentActiveQuiz) {
        runPopupQuizEngine(currentActiveQuiz);
      }
    });
  }

  if (popupQuizNewBtn) {
    popupQuizNewBtn.addEventListener('click', () => {
      if (quizSummaryCard) quizSummaryCard.style.display = 'none';
      if (quizActiveCard) quizActiveCard.style.display = 'none';
      if (quizSetupSection) quizSetupSection.style.display = 'flex';
      if (quizInputText) {
        quizInputText.value = '';
        quizInputText.focus();
      }
    });
  }

  // ─── Bias Meter & Fact Checker Engine ──────────────────────────────────────
  async function openBiasAudit(textToAudit) {
    const text = (textToAudit || '').trim();
    if (!text) {
      showToast('No text available to fact check!', true);
      return;
    }

    if (!biasModalOverlay || !biasModalContent) return;

    biasModalOverlay.style.display = 'flex';
    biasModalContent.innerHTML = `
      <div class="bias-loading-state">
        <div class="bias-spinner"></div>
        <div class="bias-loading-title">Auditing Credibility &amp; Bias...</div>
        <div class="bias-loading-sub">Maya is analyzing claims, omitted facts, and author bias...</div>
      </div>
    `;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'ANALYZE_BIAS',
        text: text,
        language: currentDefaultLang || 'English'
      });

      if (!response || !response.success || !response.analysis) {
        throw new Error(response?.error || 'Failed to analyze bias.');
      }

      renderPopupBiasResults(response.analysis, text);
    } catch (err) {
      biasModalContent.innerHTML = `
        <div style="text-align:center; padding: 28px 14px;">
          <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
          <div style="font-size:13px; font-weight:700; color:#f87171; margin-bottom:6px;">Analysis Failed</div>
          <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:16px; line-height:1.4;">${escapeHtml(err.message || 'Could not verify content.')}</div>
          <button type="button" class="btn btn-secondary" id="biasRetryAuditBtn" style="padding:6px 14px; font-size:11.5px; border-radius:6px; cursor:pointer;">Retry Audit</button>
        </div>
      `;
      const retryBtn = biasModalContent.querySelector('#biasRetryAuditBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => openBiasAudit(text));
      }
    }
  }

  function renderPopupBiasResults(analysis, originalText) {
    if (!biasModalContent) return;

    const trustScore = parseInt(analysis.trustScore ?? analysis.credibilityScore ?? 65, 10);
    const level = analysis.biasLevel || (trustScore >= 75 ? 'low' : trustScore >= 50 ? 'medium' : 'high');

    // Circumference for r=26 is ~163.36
    const circumference = 163.36;
    const strokeOffset = Math.round(circumference * (1 - trustScore / 100));

    // Multi-metrics sub-scores
    const evidenceScore = analysis.metrics?.evidenceScore ?? Math.max(5, trustScore - 8);
    const objectivityScore = analysis.metrics?.objectivityScore ?? trustScore;
    const sensationalismScore = analysis.metrics?.sensationalismScore ?? Math.max(5, 100 - trustScore);

    const claimsList = (Array.isArray(analysis.exaggeratedClaims) && analysis.exaggeratedClaims.length > 0)
      ? analysis.exaggeratedClaims.map(c => `
          <li class="bias-bullet-item claims">
            <span class="bias-item-dot"></span>
            <span>${escapeHtml(c)}</span>
          </li>
        `).join('')
      : `<li class="bias-bullet-item" style="color:var(--text-muted); font-style:italic;">None detected. Text appears objective.</li>`;

    const missingList = (Array.isArray(analysis.missingContext) && analysis.missingContext.length > 0)
      ? analysis.missingContext.map(m => `
          <li class="bias-bullet-item missing">
            <span class="bias-item-dot"></span>
            <span>${escapeHtml(m)}</span>
          </li>
        `).join('')
      : `<li class="bias-bullet-item" style="color:var(--text-muted); font-style:italic;">No major context omissions identified.</li>`;

    const tipsList = (Array.isArray(analysis.factCheckTips) && analysis.factCheckTips.length > 0)
      ? analysis.factCheckTips.map(t => `
          <li class="bias-bullet-item tips">
            <span class="bias-item-dot"></span>
            <span>${escapeHtml(t)}</span>
          </li>
        `).join('')
      : `<li class="bias-bullet-item" style="color:var(--text-muted); font-style:italic;">Cross-reference claims with authoritative primary sources.</li>`;

    let cleanAgenda = (analysis.potentialAgenda || 'No conspicuous hidden motive detected.').replace(/^(author\s*motive|motive|agenda)\s*:\s*/i, '').trim();

    biasModalContent.innerHTML = `
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
            <div class="bias-summary-text">${escapeHtml(analysis.summary || '')}</div>
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

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn-bias-action-pill" id="popupBiasNeutralToggleBtn">
            <span>✨ Show Neutral Rewrite</span>
          </button>
        </div>

        <!-- Optional Neutral Rewrite Box -->
        <div class="bias-neutral-section" id="popupNeutralRewriteSection" style="display:none;">
          <div class="bias-section-title" style="color:#a5b4fc;">
            <span>✨</span> Maya's Objective Rewrite (Hype-Free)
          </div>
          <div class="bias-neutral-box">${escapeHtml(analysis.neutralRewrite || analysis.summary || '')}</div>
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

    const neutralToggleBtn = biasModalContent.querySelector('#popupBiasNeutralToggleBtn');
    const neutralSection = biasModalContent.querySelector('#popupNeutralRewriteSection');
    if (neutralToggleBtn && neutralSection) {
      neutralToggleBtn.addEventListener('click', () => {
        const isHidden = neutralSection.style.display === 'none';
        neutralSection.style.display = isHidden ? 'flex' : 'none';
        neutralToggleBtn.classList.toggle('active', isHidden);
        neutralToggleBtn.querySelector('span').textContent = isHidden ? '✕ Hide Neutral Rewrite' : '✨ Show Neutral Rewrite';
      });
    }
  }

  // Bias Modal Close Listeners
  if (closeBiasModalBtn) {
    closeBiasModalBtn.addEventListener('click', () => {
      if (biasModalOverlay) biasModalOverlay.style.display = 'none';
    });
  }

  if (biasModalOverlay) {
    biasModalOverlay.addEventListener('click', (e) => {
      if (e.target === biasModalOverlay) {
        biasModalOverlay.style.display = 'none';
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && biasModalOverlay && biasModalOverlay.style.display !== 'none') {
      biasModalOverlay.style.display = 'none';
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // JARVIS AI Assistant (Python Server & Voice Automation)
  // ═══════════════════════════════════════════════════════════════════════════
  const JARVIS_API_BASE = 'http://127.0.0.1:8000';
  let jarvisIsOnline = false;
  let jarvisRecognition = null;
  let isJarvisListening = false;

  const jarvisOrb             = document.getElementById('jarvisOrb');
  const jarvisStatusBadge     = document.getElementById('jarvisStatusBadge');
  const jarvisStatusText      = document.getElementById('jarvisStatusText');
  const jarvisSubtitle        = document.getElementById('jarvisSubtitle');
  const jarvisCommandInput    = document.getElementById('jarvisCommandInput');
  const jarvisMicBtn          = document.getElementById('jarvisMicBtn');
  const jarvisSendBtn         = document.getElementById('jarvisSendBtn');
  const jarvisMicIndicator    = document.getElementById('jarvisMicIndicator');
  const jarvisFeed            = document.getElementById('jarvisFeed');
  const jarvisClearFeedBtn    = document.getElementById('jarvisClearFeedBtn');
  const jarvisRetryConnBtn    = document.getElementById('jarvisRetryConnBtn');
  const jarvisChips           = document.querySelectorAll('.jarvis-chip');
  const jarvisVoiceFemaleBtn  = document.getElementById('jarvisVoiceFemaleBtn');
  const jarvisVoiceMaleBtn    = document.getElementById('jarvisVoiceMaleBtn');

  // ── 3D VRoid Character Controller for Assistant UI ────────────────────────
  function initJarvis3DAvatar() {
    const wrapper = document.getElementById('jarvisVrmWrapper');
    const orbWrapper = document.getElementById('jarvisOrbWrapper');
    const toggleOrbBtn = document.getElementById('jarvisToggleOrbBtn');
    const toggle3DBtn = document.getElementById('jarvisToggle3DBtn');
    const frame = document.getElementById('jarvisAvatarFrame');

    if (frame) {
      try {
        const modelUrl = chrome.runtime.getURL('AvatarSample_A.vrm');
        const targetSrc = `avatar-view.html?model=${encodeURIComponent(modelUrl)}`;
        if (!frame.src || !frame.src.includes('?model=')) {
          frame.src = targetSrc;
        }
      } catch (_) {}
    }

    if (toggleOrbBtn && !toggleOrbBtn._hasListener) {
      toggleOrbBtn._hasListener = true;
      toggleOrbBtn.addEventListener('click', () => {
        if (wrapper) wrapper.style.display = 'none';
        if (orbWrapper) orbWrapper.style.display = 'flex';
      });
    }

    if (toggle3DBtn && !toggle3DBtn._hasListener) {
      toggle3DBtn._hasListener = true;
      toggle3DBtn.addEventListener('click', () => {
        if (orbWrapper) orbWrapper.style.display = 'none';
        if (wrapper) wrapper.style.display = 'flex';
      });
    }
  }

  function notifyAvatarSpeech(durationMs = 3000) {
    const frame = document.getElementById('jarvisAvatarFrame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'SPEAK_START', duration: durationMs }, '*');
    }
    const vrmWrap = document.getElementById('jarvisVrmWrapper');
    if (vrmWrap) {
      vrmWrap.classList.add('speaking');
      setTimeout(() => { vrmWrap.classList.remove('speaking'); }, durationMs + 300);
    }
  }

  function updateJarvisVoiceUI(profile) {
    if (!jarvisVoiceFemaleBtn || !jarvisVoiceMaleBtn) return;
    if (profile && profile.includes('male') && !profile.includes('female')) {
      jarvisVoiceMaleBtn.classList.add('active');
      jarvisVoiceFemaleBtn.classList.remove('active');
    } else {
      jarvisVoiceFemaleBtn.classList.add('active');
      jarvisVoiceMaleBtn.classList.remove('active');
    }
  }

  async function setJarvisVoice(profile) {
    updateJarvisVoiceUI(profile);
    try {
      await fetch(`${JARVIS_API_BASE}/api/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_profile: profile })
      });
      showToast(profile.includes('male') ? '🤖 Male Voice Active' : '🌸 Sweet Female Voice Active');
    } catch {
      showToast(profile.includes('male') ? '🤖 Male Voice Active' : '🌸 Sweet Female Voice Active');
    }
  }

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function appendJarvisFeed(type, sender, message, icon = '🤖') {
    if (!jarvisFeed) return;
    const item = document.createElement('div');
    item.className = `jarvis-feed-item ${type}`;
    item.innerHTML = `
      <span class="feed-icon">${icon}</span>
      <div class="feed-content">
        <strong>${escapeHtml(sender)}:</strong> ${escapeHtml(message)}
        <span class="feed-time">${getFormattedTime()}</span>
      </div>
    `;
    jarvisFeed.appendChild(item);
    jarvisFeed.scrollTo({ top: jarvisFeed.scrollHeight, behavior: 'smooth' });
  }

  async function checkJarvisServerStatus() {
    if (!jarvisStatusBadge) return false;
    try {
      const resp = await fetch(`${JARVIS_API_BASE}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (resp.ok) {
        const data = await resp.json();
        jarvisIsOnline = true;
        jarvisStatusBadge.className = 'jarvis-badge online';
        jarvisStatusBadge.innerHTML = `<span class="jarvis-dot"></span><span>Python Online</span>`;
        if (jarvisSubtitle) {
          const feats = [];
          if (data.features?.edge_tts) feats.push('Neural Voice');
          else if (data.features?.pyttsx3) feats.push('Voice TTS');
          if (data.features?.speech_recognition) feats.push('Mic');
          feats.push('Apps & Web');
          jarvisSubtitle.textContent = `Python Bridge v${data.version || '1.5.0'} • ${feats.join(' • ')}`;
        }
        if (data.voice?.current_profile) {
          updateJarvisVoiceUI(data.voice.current_profile);
        }
        return true;
      }
    } catch {
      // Server unreachable
    }
    jarvisIsOnline = false;
    if (jarvisStatusBadge) {
      jarvisStatusBadge.className = 'jarvis-badge offline';
      jarvisStatusBadge.innerHTML = `<span class="jarvis-dot"></span><span>Browser Fallback</span>`;
    }
    if (jarvisSubtitle) {
      jarvisSubtitle.textContent = `Browser mode ready. Run start_python_assistant.bat for desktop apps`;
    }
    return false;
  }

  async function closeMatchingTabs(target) {
    try {
      const norm = (target || 'current').toLowerCase().trim();
      if (!norm || norm === 'current' || norm === 'tab' || norm === 'this tab' || norm === 'page') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          await chrome.tabs.remove(activeTab.id);
        }
      } else {
        const allTabs = await chrome.tabs.query({});
        const matching = allTabs.filter(t => {
          const u = (t.url || '').toLowerCase();
          const title = (t.title || '').toLowerCase();
          return u.includes(norm) || title.includes(norm);
        });
        if (matching.length > 0) {
          await chrome.tabs.remove(matching.map(t => t.id));
        } else {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab?.id) await chrome.tabs.remove(activeTab.id);
        }
      }
    } catch (e) {
      console.warn('[Jarvis Tab Close Error]:', e);
    }
  }

  async function executeBrowserFallback(cmd) {
    const lower = cmd.toLowerCase().trim();
    let reply = '';

    // 0a. In-Page Media Control Fallback (play, pause, resume, start, stop, chalu)
    const isMediaPause = /\b(pause|roko|rok do)\b/.test(lower) || (/\b(stop)\b/.test(lower) && /\b(video|playback|song|movie|audio|stream)\b/.test(lower)) || /^(pause|roko|rok do|stop)$/.test(lower);
    const isMediaPlay = /\b(play video|video play|start video|video start|resume video|video resume|chalu karo|video chalu|start playback)\b/.test(lower)
      || (/^(play|resume|start|chalu)$/.test(lower))
      || (/\b(play|resume|start|chalu)\b/.test(lower) && /\b(video|playback)\b/.test(lower) && !/\b(song|gana|gaana|kesariya|arijit)\b/.test(lower));

    if (isMediaPause || isMediaPlay) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'JARVIS_MEDIA_CONTROL',
          command: isMediaPause ? 'pause' : 'play'
        }).catch(() => {});
      }
      reply = isMediaPause ? 'Video paused Sir.' : 'Playing video Sir.';
      appendJarvisFeed('assistant', 'Jarvis', reply, isMediaPause ? '⏸️' : '▶️');
      speakText(reply, null, 'English');
      return;
    }

    // 0b. Website & Tab Closing Fallback
    const isCloseCommand = /\b(close|band karo|band kar do|band krdo|band kr do|band kro|band krna|hata do|hatao|exit|quit)\b/.test(lower);
    if (isCloseCommand) {
      if (/\b(tab|current tab|this tab|page|window|ye tab|is tab|website|site|webpage)\b/.test(lower)) {
        await closeMatchingTabs('current');
        reply = 'Closed tab Sir.';
        appendJarvisFeed('assistant', 'Jarvis', reply, '❌');
        speakText(reply, null, 'English');
        return;
      }
      const CLOSE_SITES = ['youtube', 'google', 'instagram', 'facebook', 'twitter', 'linkedin', 'amazon', 'flipkart', 'netflix', 'hotstar', 'jiocinema', 'maps', 'gmail', 'github', 'chatgpt', 'wikipedia', 'spotify', 'reddit'];
      for (const s of CLOSE_SITES) {
        if (lower.includes(s)) {
          await closeMatchingTabs(s);
          reply = `Closed ${s.toUpperCase()} Sir.`;
          appendJarvisFeed('assistant', 'Jarvis', reply, '❌');
          speakText(reply, null, 'English');
          return;
        }
      }
    }

    // 0c. Media Control Fallback (play / pause / resume / stop / video roko / chalu)
    if (lower === 'pause' || lower === 'stop' || lower === 'roko' || lower === 'video pause' || lower === 'video roko' || lower === 'rok do' || lower === 'pause video') {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_MEDIA_CONTROL', command: 'pause' }).catch(() => {});
      }
      reply = 'Paused video Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '⏸️');
      speakText(reply, null, 'English');
      return;
    }
    if (lower === 'play' || lower === 'resume' || lower === 'chalu' || lower === 'video play' || lower === 'video chalu' || lower === 'chalu karo' || lower === 'play video') {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_MEDIA_CONTROL', command: 'play' }).catch(() => {});
      }
      reply = 'Playing video Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '▶️');
      speakText(reply, null, 'English');
      return;
    }

    // 0d. Volume Control Fallback
    if (/\b(volume up|increase volume|awaaz badhao|sound badhao|sound up|volume badhao|awaaz tez)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_VOLUME_CONTROL', command: 'volume_up' }).catch(() => {});
      }
      reply = 'Volume increased Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔊');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(volume down|decrease volume|awaaz kam|sound kam|sound down|volume kam|awaaz dheere)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_VOLUME_CONTROL', command: 'volume_down' }).catch(() => {});
      }
      reply = 'Volume decreased Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔉');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(mute|sound mute|volume mute|awaaz band|sound band|chup rho|chup ho jao)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_VOLUME_CONTROL', command: 'mute' }).catch(() => {});
      }
      reply = 'Sound muted Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔇');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(unmute|sound unmute|volume unmute|awaaz chalu|sound on)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'JARVIS_VOLUME_CONTROL', command: 'unmute' }).catch(() => {});
      }
      reply = 'Sound unmuted Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔊');
      speakText(reply, null, 'English');
      return;
    }

    // 0e. Tabs, Zoom & Chrome Pages Fallback
    if (/\b(new tab|naya tab|open new tab|create tab)\b/.test(lower)) {
      chrome.tabs.create({});
      reply = 'Opened new tab Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '📑');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(next tab|agla tab|switch tab|dusra tab)\b/.test(lower)) {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 1 && activeTab) {
        const currentIdx = tabs.findIndex(t => t.id === activeTab.id);
        const nextIdx = (currentIdx + 1) % tabs.length;
        await chrome.tabs.update(tabs[nextIdx].id, { active: true });
      }
      reply = 'Switched to next tab Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '📑');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(previous tab|pichla tab)\b/.test(lower)) {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 1 && activeTab) {
        const currentIdx = tabs.findIndex(t => t.id === activeTab.id);
        const prevIdx = (currentIdx - 1 + tabs.length) % tabs.length;
        await chrome.tabs.update(tabs[prevIdx].id, { active: true });
      }
      reply = 'Switched to previous tab Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '📑');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(full screen|fullscreen|bada screen|maximize screen)\b/.test(lower)) {
      const win = await chrome.windows.getCurrent();
      const newState = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
      await chrome.windows.update(win.id, { state: newState });
      reply = 'Toggled fullscreen Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🖥️');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(zoom in|page bada|increase zoom)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        const currentZoom = await chrome.tabs.getZoom(activeTab.id);
        await chrome.tabs.setZoom(activeTab.id, Math.min(3.0, Math.round((currentZoom + 0.2) * 10) / 10));
      }
      reply = 'Zoomed in Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔍');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(zoom out|page chhota|page chota|decrease zoom)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        const currentZoom = await chrome.tabs.getZoom(activeTab.id);
        await chrome.tabs.setZoom(activeTab.id, Math.max(0.3, Math.round((currentZoom - 0.2) * 10) / 10));
      }
      reply = 'Zoomed out Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔍');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(reset zoom|normal zoom|default zoom)\b/.test(lower)) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) await chrome.tabs.setZoom(activeTab.id, 1.0);
      reply = 'Zoom reset to 100% Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🔍');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(open history|show history|history dekho)\b/.test(lower) || lower === 'history') {
      chrome.tabs.create({ url: 'chrome://history' });
      reply = 'Opening history Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '📜');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(open downloads|show downloads|downloads dekho)\b/.test(lower) || lower === 'downloads') {
      chrome.tabs.create({ url: 'chrome://downloads' });
      reply = 'Opening downloads Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '📥');
      speakText(reply, null, 'English');
      return;
    }
    if (/\b(open bookmarks|show bookmarks|bookmarks dekho)\b/.test(lower) || lower === 'bookmarks') {
      chrome.tabs.create({ url: 'chrome://bookmarks' });
      reply = 'Opening bookmarks Sir.';
      appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '⭐');
      speakText(reply, null, 'English');
      return;
    }

    // 1. Website Quick Launch Map
    const WEBSITE_MAP = {
      'instagram': 'https://www.instagram.com',
      'facebook': 'https://www.facebook.com',
      'twitter': 'https://www.twitter.com',
      ' x ': 'https://www.x.com',
      'linkedin': 'https://www.linkedin.com',
      'amazon': 'https://www.amazon.in',
      'flipkart': 'https://www.flipkart.com',
      'netflix': 'https://www.netflix.com',
      'hotstar': 'https://www.hotstar.com',
      'jiocinema': 'https://www.jiocinema.com',
      'maps': 'https://maps.google.com',
      'gmail': 'https://mail.google.com',
      'google': 'https://www.google.com',
      'youtube': 'https://www.youtube.com',
      'github': 'https://www.github.com',
      'chatgpt': 'https://www.chatgpt.com',
      'wikipedia': 'https://www.wikipedia.org',
      'spotify': 'https://open.spotify.com'
    };
    for (const [siteName, siteUrl] of Object.entries(WEBSITE_MAP)) {
      if (lower.includes(siteName) && (lower.includes('kholo') || lower.includes('open') || lower.includes('chalao'))) {
        chrome.tabs.create({ url: siteUrl });
        reply = `Opened ${siteName.toUpperCase()}`;
        appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🌐');
        speakText(reply, null, 'English');
        return;
      }
    }

    // 2. In-Page Click & Video Play Automation
    const isClickIntent = /\b(click|start|chalu|play|chalao|dabao|kholo)\b/.test(lower);
    if (isClickIntent && !lower.startsWith('search ') && !lower.startsWith('google ')) {
      const cleanSubject = lower
        .replace(/\b(click karo|click kro|click kar|click kr|click|start karo|start kro|start|chalu karo|chalu|play karo|play|chalao|kholo|dabao|pe|ko|ise|isko|ye|is|video|song|gana|gaana)\b/gi, '')
        .trim();

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'JARVIS_CLICK_ELEMENT',
          query: cleanSubject || lower,
          target_type: (lower.includes('song') || lower.includes('video') || activeTab.url?.includes('youtube.com')) ? 'video' : 'any'
        }, (res) => {
          if (chrome.runtime.lastError || res?.status === 'NOT_FOUND') {
            // If song or video, open YouTube search with jarvis_play=1
            if (cleanSubject || lower.includes('song') || lower.includes('video') || lower.includes('youtube')) {
              const q = cleanSubject || lower;
              chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&jarvis_play=1` });
              const rep = `Playing "${q}" on YouTube`;
              appendJarvisFeed('assistant', 'Jarvis (Browser)', rep, '▶️');
              speakText(rep, null, 'English');
            } else {
              const rep = `Element '${cleanSubject}' page par nahi mila`;
              appendJarvisFeed('assistant', 'Jarvis (Browser)', rep, '❌');
              speakText(rep, null, 'English');
            }
          } else if (res?.status === 'CLICKED') {
            const rep = `Clicked & opened: ${res.element}`;
            appendJarvisFeed('assistant', 'Jarvis (Browser)', rep, '✅');
            speakText(rep, null, 'English');
          }
        });
        return;
      }
    }

    // 3. Google Search
    if (lower.startsWith('search ') || lower.startsWith('google ')) {
      let query = lower.replace(/^(search on google for|search on google|search for|search|google)\s+/i, '').replace(/\s+on google$/i, '');
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      chrome.tabs.create({ url: searchUrl });
      reply = `Searching Google for "${query}" in browser`;
    } else if (lower.includes('youtube') || lower.includes('song') || lower.includes('gana')) {
      let query = lower
        .replace(/^(open youtube and search for|open youtube and search|open youtube and play|search on youtube for|search on youtube|play on youtube|youtube pe ye song search karo|youtube pe song search karo|youtube pe gana chalao|youtube search karo|youtube pe chalao|youtube pe|youtube par|youtube me|search|play|open youtube|youtube|yotube|you tube)\s*/gi, '')
        .replace(/\s*(on youtube|in youtube|pe search karo|par search karo|search karo|chalao|bajao|sunao|karo|song|gana|gaana)$/gi, '')
        .trim();
      const isPlay = /\b(play|chalao|bajao|sunao|lagao)\b/.test(lower);
      const ytUrl = query
        ? (isPlay
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&jarvis_play=1`
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)
        : 'https://www.youtube.com';
      chrome.tabs.create({ url: ytUrl });
      reply = query ? (isPlay ? `Playing "${query}" on YouTube` : `Searching YouTube for "${query}"`) : 'Opened YouTube';
    } else if (lower.includes('github')) {
      chrome.tabs.create({ url: 'https://github.com' });
      reply = 'Opened GitHub in new tab';
    } else if (lower.includes('time')) {
      const timeStr = new Date().toLocaleTimeString();
      reply = `Current time is ${timeStr}`;
    } else if (lower.includes('date') || lower.includes('today')) {
      const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      reply = `Today is ${dateStr}`;
    } else if (lower.includes('close') || lower.includes('band karo') || lower.includes('band kar do') || lower.includes('band kardo') || lower.includes('exit')) {
      reply = 'Closing desktop applications requires the Python assistant server. Please run start_python_assistant.bat to enable desktop control.';
    } else if (lower.includes('notepad') || lower.includes('calculator') || lower.includes('calc') || lower.includes('command prompt') || lower.includes('cmd') || lower.includes('whatsapp') || lower.includes('spotify') || lower.includes('camera')) {
      reply = 'Desktop apps require Python server. Please run start_python_assistant.bat to launch Windows apps!';
    } else {
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(cmd)}` });
      reply = `Searched Google for "${cmd}"`;
    }

    appendJarvisFeed('assistant', 'Jarvis (Browser)', reply, '🌐');
    speakText(reply, null, 'English');
  }

  // ── Natural Language Normalizer ──────────────────────────────────────────
  // Converts casual Hindi/English commands into structured commands Jarvis understands
  function normalizeNaturalLanguage(raw) {
    let t = (raw || '').toLowerCase().trim();

    // Scroll commands
    if (/\b(scroll|neeche|neecha|upar|oopar|page.*neeche|page.*upar)\b/.test(t)) {
      if (/\b(upar|oopar|up|top)\b/.test(t)) return 'scroll up';
      if (/\b(neeche|neecha|down|bottom)\b/.test(t)) return 'scroll down';
    }
    // Page refresh
    if (/\b(refresh|reload|dobara|phir se load)\b/.test(t)) return 'refresh page';
    // Go back / forward
    if (/\b(back|peeche|wapas|pichhe)\b/.test(t)) return 'go back';
    if (/\b(aage|forward|next page)\b/.test(t)) return 'go forward';
    // Click first video
    if (/\b(pehla|first|1st)\b/.test(t) && /\b(video|film|reel|clip)\b/.test(t)) return 'pehla video click karo';
    // Click any video
    if (/\b(ye|is|isko|ise|this)\b/.test(t) && /\b(video|film|reel)\b/.test(t) && /\b(click|chalu|start|open|chalao|kholo|play)\b/.test(t)) return 'is video click karo';
    // Generic click
    if (/\b(click kro|click karo|click kar|click krna|isko click|is pe click|click do)\b/.test(t)) return t.replace(/\b(click kro|click karo|click kar|click krna|isko click|is pe click|click do)\b/g, 'click karo');
    // Open website
    if (/\b(kholo|kholna|open karo|open kr|open krna|open krdena)\b/.test(t)) return t.replace(/\b(kholo|kholna|open karo|open kr|open krna|open krdena)\b/g, 'open');
    // Close website / tab / app
    if (/\b(band kro|band karo|band kr|band krna|band krdena|close kro|hata do|hatao)\b/.test(t)) return t.replace(/\b(band kro|band karo|band kr|band krna|band krdena|close kro|hata do|hatao)\b/g, 'close');
    // Search
    if (/\b(dhundho|dhoondho|search kro|search karo|khojo)\b/.test(t)) return t.replace(/\b(dhundho|dhoondho|search kro|search karo|khojo)\b/g, 'search');
    // Media Play / Pause
    if (/\b(video pause|pause video|video roko|rok do|pause karo|pause krdo|pause kro)\b/.test(t) || t === 'pause' || t === 'roko') return 'pause';
    if (/\b(video play|play video|video chalu|video start|chalu karo|chalu krdo|play karo|play kro)\b/.test(t) || t === 'play' || t === 'chalu') return 'play';

    // Tab Management
    if (/\b(naya tab|naya tab kholo|new tab kholo|new tab open karo)\b/.test(t)) return 'new tab';
    if (/\b(agla tab|agla tab kholo|tab switch karo|dusra tab)\b/.test(t)) return 'next tab';
    if (/\b(pichla tab|pichla tab kholo)\b/.test(t)) return 'previous tab';

    // Volume
    if (/\b(awaaz|sound|volume).*(tez|badhao|badho|zyada|increase|up)\b/.test(t) || /\b(sound up|volume up)\b/.test(t)) return 'volume up';
    if (/\b(awaaz|sound|volume).*(kam|dheere|ghatao|decrease|down)\b/.test(t) || /\b(sound down|volume down)\b/.test(t)) return 'volume down';
    // Mute / Unmute
    if (/\b(mute kro|mute karo|chup krao|sound band|awaaz band|chup ho jao)\b/.test(t) || t === 'mute') return 'mute';
    if (/\b(unmute kro|unmute karo|sound chalu|awaaz chalu|sound on)\b/.test(t) || t === 'unmute') return 'unmute';
    // Fullscreen
    if (/\b(full screen|fullscreen|bada kro|bada karo|bada screen)\b/.test(t)) return 'fullscreen';
    // Zoom
    if (/\b(zoom in|page bada|screen bada|bada zoom)\b/.test(t)) return 'zoom in';
    if (/\b(zoom out|page chota|page chhota|screen chota|chota zoom)\b/.test(t)) return 'zoom out';
    if (/\b(reset zoom|normal zoom|zoom reset)\b/.test(t)) return 'reset zoom';
    // Time / date
    if (/\b(time kya|kitna baja|baje|time batao|time bata)\b/.test(t)) return 'time';
    if (/\b(aaj kya|aaj ki date|date batao|date kya|din batao)\b/.test(t)) return 'date';
    // Greeting
    if (/\b(hello|hi|hey|namaste|helo|hii)\b/.test(t) && t.length < 20) return 'hello jarvis';
    return raw; // return original if no match
  }

  let isJarvisExecutingCommand = false;

  async function executeJarvisCommand(rawCommand) {
    if (isJarvisExecutingCommand) return;
    const rawNorm = normalizeNaturalLanguage(rawCommand);
    const cmd = (rawNorm || '').trim();
    if (!cmd) return;

    isJarvisExecutingCommand = true;
    if (jarvisCommandInput) jarvisCommandInput.value = '';
    appendJarvisFeed('user', 'You', rawCommand || cmd, '👤');
    if (jarvisOrb) jarvisOrb.classList.add('speaking');

    try {
      // ── Handle scroll/back/forward/refresh directly in browser ───────────────
      const lc = cmd.toLowerCase();
      if (lc === 'scroll down' || lc === 'scroll up' || lc === 'go back' || lc === 'go forward' || lc === 'refresh page') {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            if (lc === 'scroll down') await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.scrollBy({ top: 400, behavior: 'smooth' }) });
            else if (lc === 'scroll up') await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.scrollBy({ top: -400, behavior: 'smooth' }) });
            else if (lc === 'go back') await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => history.back() });
            else if (lc === 'go forward') await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => history.forward() });
            else if (lc === 'refresh page') await chrome.tabs.reload(tab.id);
          }
          const replyMap = { 'scroll down': 'Neeche scroll kiya Sir.', 'scroll up': 'Upar scroll kiya Sir.', 'go back': 'Peeche gaya Sir.', 'go forward': 'Aage gaya Sir.', 'refresh page': 'Page refresh kiya Sir.' };
          appendJarvisFeed('assistant', 'Jarvis', replyMap[lc] || 'Done Sir.', '🤖');
          return;
        } catch (e) { console.warn('Direct browser action failed:', e); }
      }

      // Always try Python Assistant Server first
      const resp = await fetch(`${JARVIS_API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Python server does the speaking; don't send speak flags to avoid duplicate speech
        body: JSON.stringify({ command: cmd, speak_reply: true, speak_response: true }),
        signal: AbortSignal.timeout(1800)
      });

      if (resp.ok) {
        const res = await resp.json();
        jarvisIsOnline = true;
        if (jarvisStatusBadge) {
          jarvisStatusBadge.className = 'jarvis-badge online';
          jarvisStatusBadge.innerHTML = `<span class="jarvis-dot"></span><span>Python Online</span>`;
        }
        // Always show non-empty response in chat feed
        const msg = res.message || res.response || '';
        if (msg) {
          appendJarvisFeed('assistant', 'Jarvis', msg, '🤖');

          // ── 3D VRoid Avatar Speaking Lip-Sync Animation & Mic Mute ──
          const estDuration = Math.max(1600, Math.min(8500, msg.split(' ').length * 340));
          chrome.runtime.sendMessage({ action: 'JARVIS_SPEAKING_START', duration: estDuration }).catch(() => {});
          notifyAvatarSpeech(estDuration);

          // Also notify active tab floating companion
          chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, { type: 'JARVIS_SPEAKING_START', duration: estDuration, text: msg }).catch(() => {});
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, { type: 'JARVIS_SPEAKING_END' }).catch(() => {});
              }, estDuration);
            }
          }).catch(() => {});
        }

        // ── Voice Mode Control from Python Server ──
        if (res.action_type === 'voice_mode') {
          if (res.action_details === 'background_on') {
            await syncAlwaysListening(true);
          } else if (res.action_details === 'background_off') {
            await syncAlwaysListening(false);
          } else if (res.action_details === 'continuous_on') {
            if (jarvisContinuousListenCheckbox) jarvisContinuousListenCheckbox.checked = true;
            await chrome.storage.local.set({ jarvisContinuousListen: true });
          } else if (res.action_details === 'continuous_off') {
            if (jarvisContinuousListenCheckbox) jarvisContinuousListenCheckbox.checked = false;
            await chrome.storage.local.set({ jarvisContinuousListen: false });
          }
        }

        // ── Close Tab / Website Action from Python Server ──
        if (res.action_type === 'close_tab') {
          const target = (res.action_details || 'current').toLowerCase().trim();
          await closeMatchingTabs(target);
        }

        // ── In-Page Media Control Action from Python Server ──
        if (res.action_type === 'media_control') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'JARVIS_MEDIA_CONTROL',
                command: res.action_details || 'toggle'
              }).catch(() => {});
            }
          } catch (_) {}
        }

        // ── Volume Control Action from Python Server ──
        if (res.action_type === 'volume_control') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'JARVIS_VOLUME_CONTROL',
                command: res.action_details || 'volume_up'
              }).catch(() => {});
            }
          } catch (_) {}
        }

        // ── Tab Management Actions from Python Server ──
        if (res.action_type === 'new_tab') {
          chrome.tabs.create({ url: res.action_url || 'chrome://newtab' });
        }
        if (res.action_type === 'next_tab' || res.action_type === 'previous_tab') {
          try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 1 && activeTab) {
              const currentIdx = tabs.findIndex(t => t.id === activeTab.id);
              const nextIdx = res.action_type === 'next_tab'
                ? (currentIdx + 1) % tabs.length
                : (currentIdx - 1 + tabs.length) % tabs.length;
              await chrome.tabs.update(tabs[nextIdx].id, { active: true });
            }
          } catch (_) {}
        }

        // ── Fullscreen Toggle ──
        if (res.action_type === 'browser_fullscreen') {
          try {
            const win = await chrome.windows.getCurrent();
            const newState = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
            await chrome.windows.update(win.id, { state: newState });
          } catch (_) {}
        }

        // ── Zoom In / Out / Reset ──
        if (res.action_type === 'browser_zoom_in' || res.action_type === 'browser_zoom_out' || res.action_type === 'browser_zoom_reset') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              if (res.action_type === 'browser_zoom_reset') {
                await chrome.tabs.setZoom(activeTab.id, 1.0);
              } else {
                const currentZoom = await chrome.tabs.getZoom(activeTab.id);
                const delta = res.action_type === 'browser_zoom_in' ? 0.2 : -0.2;
                const newZoom = Math.min(3.0, Math.max(0.3, Math.round((currentZoom + delta) * 10) / 10));
                await chrome.tabs.setZoom(activeTab.id, newZoom);
              }
            }
          } catch (_) {}
        }

        // ── Browser Scroll Action (down / up) ──
        if (res.action_type === 'browser_scroll') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              const scrollAmount = (res.action_details === 'up') ? -450 : 450;
              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: (amount) => window.scrollBy({ top: amount, behavior: 'smooth' }),
                args: [scrollAmount]
              });
            }
          } catch (_) {}
        }

        // ── Direct Play YouTube: open or update tab with jarvis_play=1 ──
        if (res.action_type === 'play_youtube') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
              chrome.tabs.update(activeTab.id, { url: res.action_url });
            } else if (res.action_url) {
              chrome.tabs.create({ url: res.action_url });
            }
          } catch (_) {
            if (res.action_url) chrome.tabs.create({ url: res.action_url });
          }
        }

        if (res.action_url && res.action_type !== 'browser_click' && res.action_type !== 'search_youtube' && res.action_type !== 'play_youtube') {
          chrome.tabs.create({ url: res.action_url });
        }
        // ── Search YouTube: in-page search if already on YouTube, else open search results ──
        if (res.action_type === 'search_youtube') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'JARVIS_SEARCH_PAGE',
                query: res.click_query || '',
                action_url: res.action_url
              }, (response) => {
                if (chrome.runtime.lastError || response?.status !== 'SEARCHED') {
                  chrome.tabs.update(activeTab.id, { url: res.action_url });
                }
              });
            } else if (res.action_url) {
              chrome.tabs.create({ url: res.action_url });
            }
          } catch (_) {
            if (res.action_url) chrome.tabs.create({ url: res.action_url });
          }
        }
        // ── Browser Click: Python returned browser_click — send to content.js ──
        if (res.action_type === 'browser_click') {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'JARVIS_CLICK_ELEMENT',
                query: res.click_query || '',
                target_type: res.click_target || 'any'
              }, (response) => {
                if (chrome.runtime.lastError || response?.status === 'NOT_FOUND') {
                  if (res.action_url) {
                    chrome.tabs.create({ url: res.action_url });
                    appendJarvisFeed('assistant', 'Jarvis', `Opening '${res.click_query || 'video'}' on YouTube...`, '▶️');
                  } else {
                    appendJarvisFeed('assistant', 'Jarvis', `❌ Element '${res.click_query}' page par nahi mila`, '🤖');
                  }
                } else if (response?.status === 'CLICKED') {
                  appendJarvisFeed('assistant', 'Jarvis', `✅ Clicked & Opened: ${response.element}`, '🤖');
                }
              });
            } else if (res.action_url) {
              chrome.tabs.create({ url: res.action_url });
            }
          } catch (clickErr) {
            console.warn('[Jarvis Click] Error:', clickErr);
            if (res.action_url) chrome.tabs.create({ url: res.action_url });
          }
        }
        if (res.voice_profile) {
          updateJarvisVoiceUI(res.voice_profile);
        }
      } else {
        throw new Error(`Server returned ${resp.status}`);
      }
    } catch (err) {
      console.warn('Jarvis Python Server unreachable, using browser fallback:', err);
      jarvisIsOnline = false;
      if (jarvisStatusBadge) {
        jarvisStatusBadge.className = 'jarvis-badge offline';
        jarvisStatusBadge.innerHTML = `<span class="jarvis-dot"></span><span>Browser Fallback</span>`;
      }
      await executeBrowserFallback(cmd);
    } finally {
      isJarvisExecutingCommand = false;
      if (jarvisOrb) jarvisOrb.classList.remove('speaking');
      // Continuous Listening: ensure UI reflects active listening state
      chrome.storage.local.get(['jarvisContinuousListen', 'jarvisBackgroundActive'], (res) => {
        const isAlways = res.jarvisContinuousListen !== false || Boolean(res.jarvisBackgroundActive);
        if (isAlways) {
          setTimeout(() => {
            const activePane = document.querySelector('.tab-pane.active');
            if (activePane && activePane.id === 'tab-jarvis') {
              startJarvisListening(true);
            }
          }, 800);
        }
      });
    }
  }

  function stopJarvisListeningUI() {
    isJarvisListening = false;
    if (voiceActiveTarget === 'jarvis') voiceActiveTarget = null;
    if (jarvisMicBtn) jarvisMicBtn.classList.remove('active');
    if (jarvisOrb) jarvisOrb.classList.remove('listening');
    if (jarvisMicIndicator) jarvisMicIndicator.style.display = 'none';
  }

  function setupJarvisVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        jarvisRecognition = new SpeechRecognition();
        jarvisRecognition.continuous = false;
        jarvisRecognition.interimResults = false;
        jarvisRecognition.maxAlternatives = 3;
        jarvisRecognition.lang = 'en-IN';

        // Pre-warm hardware microphone with Auto Gain Control to amplify soft voices
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({
            audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: false }
          }).catch(() => {});
        }

        jarvisRecognition.onstart = () => {
          isJarvisListening = true;
          if (jarvisMicBtn) jarvisMicBtn.classList.add('active');
          if (jarvisOrb) jarvisOrb.classList.add('listening');
          if (jarvisMicIndicator) jarvisMicIndicator.style.display = 'flex';
        };

        jarvisRecognition.onresult = (event) => {
          let transcript = '';
          const res = event.results[event.resultIndex || 0];
          if (res) {
            transcript = res[0].transcript;
            if (res.length > 1) {
              const INTENT_WORDS = [
                'youtube', 'video', 'play', 'pause', 'stop', 'roko', 'chalu', 'kholo', 'close', 'open',
                'tab', 'google', 'whatsapp', 'volume', 'awaaz', 'scroll', 'next', 'previous', 'zoom',
                'naya tab', 'website'
              ];
              for (let a = 0; a < res.length; a++) {
                const cand = (res[a].transcript || '').toLowerCase();
                if (INTENT_WORDS.some(w => cand.includes(w))) {
                  transcript = res[a].transcript;
                  break;
                }
              }
            }
          }
          if (transcript) {
            if (jarvisCommandInput) jarvisCommandInput.value = transcript;
            executeJarvisCommand(transcript);
          }
        };

        jarvisRecognition.onerror = (event) => {
          console.warn('Jarvis Voice Recognition error:', event.error);
          stopJarvisListening();
        };

        jarvisRecognition.onend = () => {
          stopJarvisListening();
        };
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  async function startJarvisListening(forceStart = false) {
    if (!forceStart && isJarvisListening) {
      stopJarvisListening();
      return;
    }

    isJarvisListening = true;
    if (jarvisMicBtn) jarvisMicBtn.classList.add('active');
    if (jarvisOrb) jarvisOrb.classList.add('listening');
    if (jarvisMicIndicator) {
      jarvisMicIndicator.style.display = 'flex';
      const label = jarvisMicIndicator.querySelector('.mic-listening-text');
      if (label) label.textContent = '🎙️ Always Listening... Speak now';
    }

    // 1. Primary: Extension Offscreen Document Voice Recognition
    try {
      await startVoice('jarvis', currentDefaultLang || 'English', true);
      return;
    } catch (err) {
      console.warn('Offscreen voice start error, falling back:', err);
    }

    // 2. Secondary: Python server mic endpoint (/api/listen) if online
    if (jarvisIsOnline) {
      if (jarvisMicIndicator) {
        const label = jarvisMicIndicator.querySelector('.mic-listening-text');
        if (label) label.textContent = 'Listening via Python mic...';
      }
      try {
        const resp = await fetch(`${JARVIS_API_BASE}/api/listen`, { method: 'POST', signal: AbortSignal.timeout(12000) });
        const data = await resp.json();
        if (data.command) {
          if (jarvisCommandInput) jarvisCommandInput.value = data.command;
          executeJarvisCommand(data.command);
        } else {
          showToast(data.error || 'No speech detected');
        }
      } catch (err) {
        console.warn('Python listen error:', err);
        showToast('Mic unavailable');
      } finally {
        stopJarvisListeningUI();
      }
    } else {
      stopJarvisListeningUI();
      showToast('Voice recognition unavailable');
    }
  }

  function stopJarvisListening() {
    stopJarvisListeningUI();
    stopVoice('jarvis');
    if (jarvisRecognition) {
      try { jarvisRecognition.stop(); } catch { /* ignore */ }
    }
  }

  function initJarvisPanel() {
    setupJarvisVoice();
    checkJarvisServerStatus();

    if (jarvisSendBtn && jarvisCommandInput) {
      jarvisSendBtn.addEventListener('click', () => {
        executeJarvisCommand(jarvisCommandInput.value);
      });

      jarvisCommandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeJarvisCommand(jarvisCommandInput.value);
        }
      });
    }

    if (jarvisMicBtn) {
      jarvisMicBtn.addEventListener('click', () => {
        if (isJarvisListening) {
          stopJarvisListening();
        } else {
          startJarvisListening();
        }
      });
    }

    if (jarvisChips) {
      jarvisChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const cmd = chip.getAttribute('data-cmd');
          if (cmd) {
            if (jarvisCommandInput) jarvisCommandInput.value = cmd;
            executeJarvisCommand(cmd);
          }
        });
      });
    }

    if (jarvisClearFeedBtn && jarvisFeed) {
      jarvisClearFeedBtn.addEventListener('click', () => {
        jarvisFeed.innerHTML = `
          <div class="jarvis-feed-item system">
            <span class="feed-icon">🤖</span>
            <div class="feed-content">
              <strong>Jarvis Ready:</strong> Feed cleared. Type or speak your command.
            </div>
          </div>
        `;
      });
    }

    if (jarvisVoiceFemaleBtn) {
      jarvisVoiceFemaleBtn.addEventListener('click', () => setJarvisVoice('female_neural'));
    }
    if (jarvisVoiceMaleBtn) {
      jarvisVoiceMaleBtn.addEventListener('click', () => setJarvisVoice('male_david'));
    }

    if (jarvisRetryConnBtn) {
      jarvisRetryConnBtn.addEventListener('click', async () => {
        showToast('Testing Python connection...');
        const ok = await checkJarvisServerStatus();
        if (ok) {
          showToast('Connected to Python Server!');
        } else {
          showToast('Python server offline (running browser fallback)');
        }
      });
    }
  }

  initJarvisPanel();
  // Lazy-load heavy 3D avatar only if Jarvis tab is active on startup
  const startupActivePane = document.querySelector('.tab-pane.active');
  if (startupActivePane && startupActivePane.id === 'tab-jarvis') {
    initJarvis3DAvatar();
  }
});

