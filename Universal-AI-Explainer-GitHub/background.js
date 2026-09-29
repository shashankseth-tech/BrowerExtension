// Background service worker for Universal AI Explainer (Manifest V3 - Powered by Ollama / Google Gemini)

const CONTEXT_MENU_ID = 'explain-selection';
const DEFAULT_BACKEND_URL = 'http://localhost:3000/api/explain';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.6-flash'];
const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2'; // Best free local model for explanations
const JARVIS_BASE_URL = 'http://127.0.0.1:8000'; // Python Automation Bridge

// Register context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      // Consumed lastError to prevent Chrome error badge
    }
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Explain with AI',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        // Consumed lastError to prevent Chrome error badge
      }
    });

    chrome.contextMenus.create({
      id: 'tldr-page',
      title: '⚡ 30-Second Page TL;DR',
      contexts: ['page', 'selection']
    }, () => {
      if (chrome.runtime.lastError) {
        // Consumed lastError to prevent Chrome error badge
      }
    });

    chrome.contextMenus.create({
      id: 'jarvis-cmd',
      title: '🤖 Ask Jarvis AI',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        // Consumed lastError to prevent Chrome error badge
      }
    });
  });
});

// Configure Side Panel behavior (do not force open when extension action icon is clicked)
if (typeof chrome !== 'undefined' && chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => { });
}

// ─── Offscreen Document: Voice Recognition ────────────────────────────────────
// Chrome MV3 popup pages cannot access the microphone directly.
// We use an offscreen document which CAN access the mic and runs SpeechRecognition.

const OFFSCREEN_URL = chrome.runtime.getURL('offscreen.html');

async function ensureOffscreenDocument() {
  // Check if an offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [OFFSCREEN_URL]
  }).catch(() => []);

  if (existingContexts.length > 0) return; // Already exists

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA'],
    justification: 'Microphone access for voice recognition (SpeechRecognition API)'
  });
}

// Track popup port for sending voice results back
let voicePopupPort = null;

// Listen for long-lived connections from popup (for voice result forwarding)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'voice-channel') {
    voicePopupPort = port;
    port.onDisconnect.addListener(() => {
      voicePopupPort = null;
    });
  }
});

// Forward voice results from offscreen → popup or handle in background
chrome.runtime.onMessage.addListener((message, sender) => {
  const voiceActions = ['VOICE_STARTED', 'VOICE_INTERIM', 'VOICE_FINAL', 'VOICE_RESULT', 'VOICE_ENDED'];
  if (voiceActions.includes(message.action)) {
    // 1. Forward to popup if open
    if (voicePopupPort) {
      try { voicePopupPort.postMessage(message); } catch (_) { }
    }

    // Handle mic permission denied
    if (message.action === 'VOICE_RESULT' && message.error === 'not-allowed') {
      try {
        chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
      } catch (_) {}
    }

    // 2. If Jarvis captured a voice command and popup is closed, execute it automatically in background!
    if (message.action === 'VOICE_FINAL' && (message.target === 'jarvis' || message.target === 'background_jarvis')) {
      const speechCmd = (message.text || '').trim();
      if (speechCmd && !voicePopupPort) {
        console.log('[Universal AI Explainer] 🎙️ Background Voice Command received:', speechCmd);
        (async () => {
          chrome.action.setBadgeText({ text: '⚡' });
          chrome.action.setBadgeBackgroundColor({ color: '#38bdf8' });
          notifyVoicePopup('user', 'You', speechCmd);
          try {
            await executeJarvisCommandDirect(speechCmd);
          } catch (e) {
            console.warn('[Universal AI Explainer] Background execute error:', e);
          }
          setTimeout(async () => {
            const { jarvisBackgroundActive, jarvisContinuousListen } = await chrome.storage.local.get(['jarvisBackgroundActive', 'jarvisContinuousListen']).catch(() => ({}));
            if (jarvisBackgroundActive !== false && jarvisContinuousListen !== false) {
              chrome.action.setBadgeText({ text: 'ON' });
              chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
            } else {
              chrome.action.setBadgeText({ text: '' });
            }
          }, 3000);
        })();
      }
    }
    return false;
  }
  return false; // let other handlers process remaining messages
});

// Natural Language Normalizer for Hindi and English commands
function normalizeJarvisVoiceCommand(raw) {
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
  // Open website
  if (/\b(kholo|kholna|open karo|open kr|open krna|open krdena)\b/.test(t)) return t.replace(/\b(kholo|kholna|open karo|open kr|open krna|open krdena)\b/g, 'open');
  // Close website / tab / app
  if (/\b(band kro|band karo|band kr|band krna|band krdena|close kro|hata do|hatao)\b/.test(t)) return t.replace(/\b(band kro|band karo|band kr|band krna|band krdena|close kro|hata do|hatao)\b/g, 'close');
  // Search
  if (/\b(dhundho|dhoondho|search kro|search karo|khojo)\b/.test(t)) return t.replace(/\b(dhundho|dhoondho|search kro|search karo|khojo)\b/g, 'search');
  // Time / date
  if (/\b(time kya|kitna baja|baje|time batao|time bata|what time)\b/.test(t)) return 'time';
  if (/\b(aaj kya|aaj ki date|date batao|date kya|din batao|what date)\b/.test(t)) return 'date';
  // Greeting
  if (/\b(hello|hi|hey|namaste|helo|hii)\b/.test(t) && t.length < 20) return 'hello jarvis';

  return raw;
}

function speakJarvisReply(text) {
  if (!text || typeof chrome === 'undefined' || !chrome.tts || typeof chrome.tts.speak !== 'function') return;
  try {
    chrome.tts.stop();
    const estDuration = Math.max(1600, Math.min(8500, text.split(' ').length * 340));
    chrome.runtime.sendMessage({ action: 'JARVIS_SPEAKING_START', duration: estDuration }).catch(() => {});
    chrome.tts.speak(text, {
      rate: 1.0,
      lang: 'en-US',
      onEvent: (event) => {
        if (event.type === 'end' || event.type === 'cancelled' || event.type === 'error') {
          chrome.runtime.sendMessage({ action: 'JARVIS_SPEAKING_END' }).catch(() => {});
        }
      }
    });
  } catch (_) {}
}

function animateTabAvatarSpeech(text, durationMs = 3000) {
  chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
    if (activeTab?.id) {
      chrome.tabs.sendMessage(activeTab.id, {
        type: 'JARVIS_SPEAKING_START',
        duration: durationMs,
        text: text
      }).catch(() => {});
      setTimeout(() => {
        chrome.tabs.sendMessage(activeTab.id, { type: 'JARVIS_SPEAKING_END' }).catch(() => {});
      }, durationMs);
    }
  }).catch(() => {});
}

function notifyVoicePopup(type, sender, message) {
  if (voicePopupPort) {
    try {
      voicePopupPort.postMessage({
        action: 'JARVIS_FEED_UPDATE',
        feedType: type,
        sender,
        message
      });
    } catch (_) {}
  }
}

// Helper to close browser tabs matching target website or active tab
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

// Direct background Jarvis command executor (Python server or rich browser fallback)
async function executeJarvisCommandDirect(speechCmd) {
  const normCmd = normalizeJarvisVoiceCommand(speechCmd);
  const cmd = (normCmd || '').trim();
  if (!cmd) return null;

  console.log('[Universal AI Explainer] 🤖 Executing background command:', speechCmd, '→', cmd);

  // 1. Direct browser page controls (scroll, back, forward, reload)
  const lc = cmd.toLowerCase();
  if (lc === 'scroll down' || lc === 'scroll up' || lc === 'go back' || lc === 'go forward' || lc === 'refresh page') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        if (lc === 'scroll down') {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.scrollBy({ top: 450, behavior: 'smooth' }) });
        } else if (lc === 'scroll up') {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.scrollBy({ top: -450, behavior: 'smooth' }) });
        } else if (lc === 'go back') {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => history.back() });
        } else if (lc === 'go forward') {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => history.forward() });
        } else if (lc === 'refresh page') {
          await chrome.tabs.reload(tab.id);
        }
      }
      const replyMap = {
        'scroll down': 'Page scrolled down.',
        'scroll up': 'Page scrolled up.',
        'go back': 'Going back.',
        'go forward': 'Going forward.',
        'refresh page': 'Page refreshed.'
      };
      const reply = replyMap[lc] || 'Done.';
      speakJarvisReply(reply);
      animateTabAvatarSpeech(reply, 2000);
      notifyVoicePopup('assistant', 'Jarvis', reply);
      return { success: true, message: reply };
    } catch (e) {
      console.warn('[Universal AI Explainer] Browser page action error:', e);
    }
  }

  // 2. Try Python Assistant Server first (short 1500ms timeout so offline doesn't lag)
  try {
    const resp = await fetch(`${JARVIS_BASE_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: cmd,
        speak_reply: true,
        speak_response: true
      }),
      signal: AbortSignal.timeout(1500)
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log('[Universal AI Explainer] ✅ Python Server executed command:', data.message || data.response);

      const replyMsg = data.message || data.response || '';
      if (replyMsg) {
        const estDuration = Math.max(1600, Math.min(8000, replyMsg.split(' ').length * 320));
        chrome.runtime.sendMessage({ action: 'JARVIS_SPEAKING_START', duration: estDuration }).catch(() => {});
        animateTabAvatarSpeech(replyMsg, estDuration);
        notifyVoicePopup('assistant', 'Jarvis', replyMsg);
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'JARVIS_SPEAKING_END' }).catch(() => {});
        }, estDuration);
      }

      // Voice Mode Control (Background Voice & Continuous Listening)
      if (data.action_type === 'voice_mode') {
        if (data.action_details === 'background_on') {
          await chrome.storage.local.set({ jarvisBackgroundActive: true, jarvisContinuousListen: true });
          chrome.action.setBadgeText({ text: 'ON' });
          chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
          injectAvatarToActiveTab();
        } else if (data.action_details === 'background_off') {
          await chrome.storage.local.set({ jarvisBackgroundActive: false, jarvisContinuousListen: false });
          chrome.action.setBadgeText({ text: '' });
          removeAvatarFromActiveTab();
        } else if (data.action_details === 'continuous_on') {
          await chrome.storage.local.set({ jarvisContinuousListen: true });
        } else if (data.action_details === 'continuous_off') {
          await chrome.storage.local.set({ jarvisContinuousListen: false });
        }
      }

      // Close Tab Action from Python Server
      if (data.action_type === 'close_tab') {
        const target = (data.action_details || 'current').toLowerCase().trim();
        await closeMatchingTabs(target);
      }
      // In-Page Media Control from Python Server
      if (data.action_type === 'media_control') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'JARVIS_MEDIA_CONTROL',
            command: data.action_details || 'toggle'
          }).catch(() => {});
        }
      }

      // New Tab Action
      if (data.action_type === 'new_tab') {
        await chrome.tabs.create({});
      }

      // Next / Previous Tab Switching
      if (data.action_type === 'next_tab' || data.action_type === 'previous_tab') {
        const tabs = await chrome.tabs.query({ currentWindow: true }).catch(() => []);
        const activeIdx = tabs.findIndex(t => t.active);
        if (tabs.length > 1 && activeIdx !== -1) {
          const nextIdx = data.action_type === 'next_tab' 
            ? (activeIdx + 1) % tabs.length 
            : (activeIdx - 1 + tabs.length) % tabs.length;
          await chrome.tabs.update(tabs[nextIdx].id, { active: true });
        }
      }

      // Browser Fullscreen Action
      if (data.action_type === 'browser_fullscreen') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              if (!document.fullscreenElement) {
                const target = document.querySelector('video') || document.documentElement;
                target.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }
          }).catch(() => {});
        }
      }

      // Browser Zoom Controls
      if (data.action_type === 'browser_zoom_in' || data.action_type === 'browser_zoom_out' || data.action_type === 'browser_zoom_reset') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          if (data.action_type === 'browser_zoom_reset') {
            await chrome.tabs.setZoom(activeTab.id, 1.0).catch(() => {});
          } else {
            const currentZoom = await chrome.tabs.getZoom(activeTab.id).catch(() => 1.0);
            const delta = data.action_type === 'browser_zoom_in' ? 0.2 : -0.2;
            const newZoom = Math.max(0.3, Math.min(3.0, Math.round((currentZoom + delta) * 10) / 10));
            await chrome.tabs.setZoom(activeTab.id, newZoom).catch(() => {});
          }
        }
      }

      // Volume Control for In-Page Video/Audio
      if (data.action_type === 'volume_control') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'JARVIS_VOLUME_CONTROL',
            command: data.action_details
          }).catch(() => {});
        }
      }

      // Browser Scroll Action (down / up)
      if (data.action_type === 'browser_scroll') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          const scrollAmount = (data.action_details === 'up') ? -450 : 450;
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: (amount) => window.scrollBy({ top: amount, behavior: 'smooth' }),
            args: [scrollAmount]
          }).catch(() => {});
        }
      }

      if (data.action_type === 'play_youtube') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
          chrome.tabs.update(activeTab.id, { url: data.action_url });
        } else if (data.action_url) {
          chrome.tabs.create({ url: data.action_url });
        }
      }

      if (data.action_url && data.action_type !== 'browser_click' && data.action_type !== 'search_youtube' && data.action_type !== 'play_youtube') {
        chrome.tabs.create({ url: data.action_url });
      }
      if (data.action_type === 'search_youtube') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'JARVIS_SEARCH_PAGE',
            query: data.click_query || '',
            action_url: data.action_url
          }, (resp) => {
            if (chrome.runtime.lastError || resp?.status !== 'SEARCHED') {
              chrome.tabs.update(activeTab.id, { url: data.action_url });
            }
          });
        } else if (data.action_url) {
          chrome.tabs.create({ url: data.action_url });
        }
      }
      if (data.action_type === 'browser_click') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: 'JARVIS_CLICK_ELEMENT',
            query: data.click_query || '',
            target_type: data.click_target || 'any'
          }, (resp) => {
            if (chrome.runtime.lastError || resp?.status === 'NOT_FOUND') {
              if (data.action_url) {
                chrome.tabs.create({ url: data.action_url });
              }
            }
          });
        } else if (data.action_url) {
          chrome.tabs.create({ url: data.action_url });
        }
      }
      return data;
    }
  } catch (err) {
    // Python server offline, run rich browser fallback immediately
  }

  // 3. Robust Browser Fallback
  let reply = '';
  const lower = cmd.toLowerCase();

  // 3a. In-Page Media Control Fallback (play, pause, resume, start, stop, chalu)
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
    const rep = isMediaPause ? 'Video paused Sir.' : 'Playing video Sir.';
    speakJarvisReply(rep);
    animateTabAvatarSpeech(rep, 2000);
    notifyVoicePopup('assistant', 'Jarvis', rep);
    return { success: true, message: rep };
  }

  // 3b. Website & Tab Closing Fallback
  const isCloseCommand = /\b(close|band karo|band kar do|band krdo|band kr do|band kro|band krna|hata do|hatao|exit|quit)\b/.test(lower);
  if (isCloseCommand) {
    if (/\b(tab|current tab|this tab|page|window|ye tab|is tab|website|site|webpage)\b/.test(lower)) {
      await closeMatchingTabs('current');
      const rep = 'Closed tab Sir.';
      speakJarvisReply(rep);
      notifyVoicePopup('assistant', 'Jarvis', rep);
      return { success: true, message: rep };
    }
    const CLOSE_SITES = ['youtube', 'google', 'instagram', 'facebook', 'twitter', 'linkedin', 'amazon', 'flipkart', 'netflix', 'hotstar', 'jiocinema', 'maps', 'gmail', 'github', 'chatgpt', 'wikipedia', 'spotify', 'reddit'];
    for (const s of CLOSE_SITES) {
      if (lower.includes(s)) {
        await closeMatchingTabs(s);
        const rep = `Closed ${s.toUpperCase()} Sir.`;
        speakJarvisReply(rep);
        notifyVoicePopup('assistant', 'Jarvis', rep);
        return { success: true, message: rep };
      }
    }
  }

  // 3c. Quick Website Map
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
      speakJarvisReply(reply);
      animateTabAvatarSpeech(reply, 2000);
      notifyVoicePopup('assistant', 'Jarvis (Browser)', reply);
      return { success: true, message: reply };
    }
  }

  // 3b. In-Page Click & Video Play Automation
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
          if (cleanSubject || lower.includes('song') || lower.includes('video') || lower.includes('youtube')) {
            const q = cleanSubject || lower;
            chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&jarvis_play=1` });
            const rep = `Playing "${q}" on YouTube`;
            speakJarvisReply(rep);
            animateTabAvatarSpeech(rep, 2500);
            notifyVoicePopup('assistant', 'Jarvis (Browser)', rep);
          } else {
            const rep = `Element '${cleanSubject}' page par nahi mila`;
            speakJarvisReply(rep);
            notifyVoicePopup('assistant', 'Jarvis (Browser)', rep);
          }
        } else if (res?.status === 'CLICKED') {
          const rep = `Clicked & opened: ${res.element}`;
          speakJarvisReply(rep);
          animateTabAvatarSpeech(rep, 2500);
          notifyVoicePopup('assistant', 'Jarvis (Browser)', rep);
        }
      });
      return { success: true, message: 'Processing click command.' };
    }
  }

  // 3c. Google Search & Web Fallback
  if (lower.startsWith('search ') || lower.startsWith('google ')) {
    const query = lower.replace(/^(search on google for|search on google|search for|search|google)\s+/i, '').replace(/\s+on google$/i, '').trim();
    chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(query)}` });
    reply = `Searching Google for ${query}`;
  } else if (lower.includes('youtube') || lower.includes('song') || lower.includes('gana') || lower.includes('gaana') || lower.includes('music')) {
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
    reply = 'Opened GitHub';
  } else if (lower.includes('chatgpt')) {
    chrome.tabs.create({ url: 'https://chat.openai.com' });
    reply = 'Opened ChatGPT';
  } else if (lower.includes('reddit')) {
    chrome.tabs.create({ url: 'https://reddit.com' });
    reply = 'Opened Reddit';
  } else if (lower.includes('twitter') || lower.includes(' x ')) {
    chrome.tabs.create({ url: 'https://x.com' });
    reply = 'Opened X Twitter';
  } else if (lower.includes('instagram')) {
    chrome.tabs.create({ url: 'https://instagram.com' });
    reply = 'Opened Instagram';
  } else if (lower.startsWith('open ') || lower.includes('open site') || lower.includes('open website')) {
    const site = lower.replace(/^open\s+(site|website)?\s*/i, '').trim();
    if (site.includes('.')) {
      chrome.tabs.create({ url: site.startsWith('http') ? site : `https://${site}` });
      reply = `Opening ${site}`;
    } else {
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(site)}` });
      reply = `Searching for ${site}`;
    }
  } else if (lower.includes('time')) {
    const timeStr = new Date().toLocaleTimeString();
    reply = `The current time is ${timeStr}`;
  } else if (lower.includes('date') || lower.includes('day') || lower.includes('today')) {
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    reply = `Today is ${dateStr}`;
  } else if (lower.includes('hello') || lower.includes('namaste') || lower.includes('hi jarvis')) {
    reply = 'Hello! I am Jarvis, your AI assistant. How can I help you?';
  } else if (lower.includes('close') || lower.includes('band karo') || lower.includes('band kar do') || lower.includes('exit')) {
    reply = 'Closing desktop applications requires the Python assistant server. Run start_python_assistant.bat to enable desktop control.';
  } else if (lower.includes('notepad') || lower.includes('calculator') || lower.includes('calc') || lower.includes('cmd') || lower.includes('whatsapp') || lower.includes('spotify') || lower.includes('camera')) {
    reply = 'Opening Windows apps requires the Python assistant server. Run start_python_assistant.bat to enable desktop control.';
  } else {
    chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(cmd)}` });
    reply = `Searching for ${cmd}`;
  }

  // Speak aloud via chrome.tts
  speakJarvisReply(reply);

  // Animate 3D avatar mouth & show speech bubble on active tab
  const estDur = Math.max(1600, Math.min(8000, reply.split(' ').length * 320));
  animateTabAvatarSpeech(reply, estDur);

  // Forward to popup chat feed
  notifyVoicePopup('assistant', 'Jarvis (Browser)', reply);

  return { success: true, message: reply };
}

// Auto-resume background Jarvis voice listener on browser startup / worker wakeup
(async () => {
  try {
    const { jarvisBackgroundActive, jarvisContinuousListen, targetLanguage, defaultLanguage } = await chrome.storage.local.get(['jarvisBackgroundActive', 'jarvisContinuousListen', 'targetLanguage', 'defaultLanguage']).catch(() => ({}));
    if (jarvisBackgroundActive || jarvisContinuousListen !== false) {
      await ensureOffscreenDocument();
      await new Promise(r => setTimeout(r, 400));
      await chrome.runtime.sendMessage({
        action: 'START_BACKGROUND_JARVIS',
        lang: defaultLanguage || targetLanguage || 'English'
      });
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      console.log('[Universal AI Explainer] 🎙️ Resumed background Jarvis voice mode');
    }
  } catch (err) {
    console.warn('[Universal AI Explainer] Failed to resume background Jarvis:', err);
  }
})();


// Known developer and code-hosting domains
const CODE_DOMAINS = [
  'github.com',
  'gist.github.com',
  'gitlab.com',
  'stackoverflow.com',
  'stackexchange.com',
  'codepen.io',
  'codesandbox.io',
  'replit.com',
  'npmjs.com',
  'pypi.org',
  'leetcode.com',
  'developer.mozilla.org',
  'w3schools.com'
];

// Common programming language keywords regex
const CODE_KEYWORDS_REGEX =
  /\b(function|const|let|var|class|def|import|export|from|return|interface|type|extends|implements|async|await|try|catch|finally|throw|new|public|private|protected|static|void|int|float|double|bool|boolean|string|struct|fn|lambda|package|namespace|elif|nullptr|nil|sizeof|typeof)\b/g;

/**
 * Detect whether selected content is code or normal prose text.
 */
function detectContentType(text, pageUrl = '') {
  const reasons = [];
  let score = 0;

  if (!text || text.trim().length === 0) {
    return { type: 'text', reasons: ['Empty or whitespace text'], score: 0 };
  }

  const lines = text.split(/\r?\n/);
  const trimmed = text.trim();

  // 1. Check domain context
  try {
    if (pageUrl) {
      const hostname = new URL(pageUrl).hostname.toLowerCase();
      const isCodeDomain = CODE_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
      if (isCodeDomain) {
        score += 1.5;
        reasons.push(`Selected on developer domain (${hostname})`);
      }
    }
  } catch { }

  // 2. Syntax symbols & density
  const symbolMatches = trimmed.match(/[{}[\]();=><+\-*\/&|!~^%:?#@]/g) || [];
  const symbolRatio = symbolMatches.length / trimmed.length;

  if (symbolRatio > 0.12) {
    score += 3;
    reasons.push(`High symbol density (${Math.round(symbolRatio * 100)}%)`);
  } else if (symbolRatio > 0.06) {
    score += 1.5;
    reasons.push(`Moderate symbol density (${Math.round(symbolRatio * 100)}%)`);
  }

  // Brackets
  const brackets = (trimmed.match(/[{}\[\]()]/g) || []).length;
  if (brackets >= 2) {
    score += 1.5;
    reasons.push(`Found structural brackets/parentheses (${brackets})`);
  }

  // Semicolons
  const semicolons = (trimmed.match(/;/g) || []).length;
  if (semicolons >= 1) {
    score += 1.5;
    reasons.push(`Contains semicolons (${semicolons})`);
  }

  // 3. Programming keywords check
  const keywordMatches = trimmed.match(CODE_KEYWORDS_REGEX) || [];
  if (keywordMatches.length >= 2) {
    score += 3;
    reasons.push(`Multiple programming keywords: ${[...new Set(keywordMatches)].slice(0, 4).join(', ')}`);
  } else if (keywordMatches.length === 1) {
    score += 1.5;
    reasons.push(`Programming keyword found: ${keywordMatches[0]}`);
  }

  // 4. Code syntax patterns
  if (/(?:=>|->|===|!==|\bconsole\.\w+|\b\w+\s*\([^)]*\)\s*[{;]|<\/?[\w-]+(?:\s+[^>]*)?>)/.test(trimmed)) {
    score += 2.5;
    reasons.push('Matches code syntax patterns (function calls, operators, or tags)');
  }

  // 5. Indentation
  if (lines.length > 1) {
    const indentedLines = lines.filter(line => /^( {2,}|\t)\S/.test(line));
    if (indentedLines.length >= 1) {
      score += 2;
      reasons.push(`Indented lines detected (${indentedLines.length}/${lines.length})`);
    }
  }

  // 6. Prose indicators
  const proseWords = trimmed.match(/\b(the|is|are|was|were|and|or|in|on|at|to|for|with|about|because|which|that|this|these|those)\b/gi) || [];
  const proseRatio = proseWords.length / (trimmed.split(/\s+/).length || 1);

  if (proseRatio > 0.18 && symbolRatio < 0.05 && keywordMatches.length === 0) {
    score -= 3;
    reasons.push(`Natural language structure (prose word ratio: ${Math.round(proseRatio * 100)}%)`);
  }

  const type = score >= 2 ? 'code' : 'text';
  return { type, reasons, score };
}

/**
 * Safely send messages to content script, injecting it dynamically if not already active.
 */
async function sendToTab(tabId, message) {
  if (!tabId) return null;
  try {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab?.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      return null;
    }
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      await new Promise(r => setTimeout(r, 80));
      return await chrome.tabs.sendMessage(tabId, message).catch(() => null);
    } catch (injectErr) {
      return null;
    }
  }
}

/**
 * Detect which Ollama models are installed locally
 */
async function getAvailableOllamaModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => m.name);
  } catch {
    return [];
  }
}

/**
 * Pick the best available Ollama model from installed list
 */
async function pickOllamaModel(preferred) {
  if (preferred) return preferred;
  const models = await getAvailableOllamaModels();
  if (!models.length) return DEFAULT_OLLAMA_MODEL;
  // Preference order for explanation quality
  const order = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'gemma2', 'qwen2.5', 'phi3', 'gemma', 'phi'];
  for (const pref of order) {
    const found = models.find(m => m.toLowerCase().startsWith(pref));
    if (found) return found;
  }
  return models[0];
}

/**
 * Mentor persona pedagogy & tone customization
 * Personas: 'maya' (default), 'rao' (academic), 'priya' (senior architect), 'eli5' (kindergarten)
 */
function getPersonaGuidance(persona = 'maya', indianAccentNuance = true, isNonEnglish = false) {
  switch (persona) {
    case 'rao':
      return [
        'Teaching Persona: Professor Rao (Formal Academic Researcher & Scholar).',
        'Tone: Formal, scholarly, mathematically rigorous, and analytically thorough.',
        'Pedagogy: Ground explanations in first principles, structural logic, and foundational literature. Avoid slang or overly casual language.',
        'Focus on why systems behave the way they do at a fundamental theoretical level.'
      ].join(' ');

    case 'priya':
      return [
        'Teaching Persona: Code Ninja Priya (FAANG Senior Staff Software Architect).',
        'Tone: Pragmatic, direct, high-signal, and production-oriented. Zero fluff.',
        'Pedagogy: Emphasize production readiness, Big-O complexity, system bottlenecks, scalability, failure modes, and enterprise engineering best practices.',
        'Give actionable, senior-engineer grade insight.'
      ].join(' ');

    case 'eli5':
      return [
        'Teaching Persona: ELI5 Buddy (Playground & Kindergarten Explainer).',
        'Tone: Cheerful, friendly, super-enthusiastic, and crystal-clear.',
        'Pedagogy: Explain concepts as if the reader is a 5-year-old using playground games, toy blocks, cartoon analogies, and everyday objects.',
        'Completely eliminate dense jargon; if a complex word is needed, explain it with a playful metaphor.'
      ].join(' ');

    case 'maya':
    default:
      if (indianAccentNuance) {
        return isNonEnglish
          ? 'Teaching Persona: Maya (Warm, Encouraging Mentor). Tone: Warm, friendly, supportive, clear. Use simple, intuitive everyday analogies.'
          : [
            'Teaching Persona: Maya (Friendly Indian English Mentor).',
            'Tone: Warm, encouraging, conversational, and patient.',
            'Pedagogy: Use intuitive, relatable everyday Indian analogies (e.g. comparing queues to train ticket lines or Mumbai locals, async tasks to ordering cutting chai, caching to keeping favourite books on your desk, APIs to restaurant waiters).',
            'Make complex concepts joyful, human, and effortless to understand.'
          ].join(' ');
      }
      return 'Teaching Persona: Maya (Warm, Encouraging Mentor). Tone: Warm, encouraging, clear. Use simple, intuitive everyday analogies.';
  }
}

/**
 * Build explanation prompt messages for Ollama (/api/chat)
 */
function buildOllamaExplanationMessages({ selectedText, contentType, explainStyle, targetLanguage, indianAccentNuance, mentorPersona = 'maya' }) {
  let styleGuidance = '';
  switch ((explainStyle || 'simple').toLowerCase()) {
    case 'technical': styleGuidance = 'Target Audience: Technical developer. Focus on architecture, mechanics, and data structures.'; break;
    case 'detailed': styleGuidance = 'Target Audience: In-depth learner. Give a comprehensive, clear explanation with practical examples.'; break;
    default: styleGuidance = 'Target Audience: Beginner. Explain like I am five (ELI5). Use simple language and intuitive analogies.'; break;
  }

  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');
  const culturalNuance = getPersonaGuidance(mentorPersona, indianAccentNuance, isNonEnglish);

  const systemPrompt = [
    'You are an expert AI tutor. Respond ONLY with a valid JSON object matching this structure:',
    '{"explanation": "...", "key_points": ["...", "..."], "follow_ups": ["Short question 1?", "Short question 2?", "Short question 3?"], "jargon": [{"term": "ComplexTerm", "definition": "1-line plain definition"}]}',
    'Do not use markdown code fences, do not add any extra text outside the JSON.',
    styleGuidance,
    culturalNuance,
    isNonEnglish
      ? `CRITICAL REQUIREMENT: Output language MUST be ${targetLanguage}. You MUST write the entire explanation and ALL key takeaways completely in fluent, natural ${targetLanguage}. Do NOT write in English.`
      : 'Output Language: English.'
  ].filter(Boolean).join('\n');

  const isCode = contentType === 'code';
  const userContent = isNonEnglish
    ? `Explain the following ${isCode ? 'code snippet' : 'concept'} in ${targetLanguage}:\n"""\n${selectedText.trim()}\n"""\n\nRemember: write your entire explanation and all key points in ${targetLanguage}.`
    : `Explain the following ${isCode ? 'code snippet' : 'concept'}:\n"""\n${selectedText.trim()}\n"""`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];
}

/**
 * Call local Ollama API for explanations (no API key required)
 */
async function fetchOllamaExplanation({ selectedText, contentType, explainStyle, targetLanguage, indianAccentNuance, ollamaModel, mentorPersona = 'maya' }) {
  const model = await pickOllamaModel(ollamaModel);
  const messages = buildOllamaExplanationMessages({ selectedText, contentType, explainStyle, targetLanguage, indianAccentNuance, mentorPersona });

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.5, repeat_penalty: 1.15, num_predict: 1024 }
      }),
      signal: AbortSignal.timeout(60000) // 60s timeout for local models
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama request timed out (60s). Local model is still loading into memory or running slowly.');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama error (403): Browser extension access blocked by CORS. Please quit Ollama from your taskbar system tray and restart it.');
    }
    throw new Error(`Ollama error (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  return parseJsonFromText(rawText);
}

/**
 * Call local Ollama API for translations (no API key required)
 */
async function fetchOllamaTranslation({ explanation, keyPoints = [], targetLanguage, ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const messages = [
    {
      role: 'system',
      content: `You are an expert translator. Translate the provided explanation and key takeaways into ${targetLanguage}. Return ONLY a valid JSON object with keys "explanation" (string) and "key_points" (array of strings). Do NOT repeat words or characters.`
    },
    {
      role: 'user',
      content: `Translate the following into ${targetLanguage}:\n\nExplanation:\n${explanation}\n\nKey Points:\n${(keyPoints || []).map(k => `- ${k}`).join('\n')}`
    }
  ];

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.4, repeat_penalty: 1.15, num_predict: 1024 }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama translation timed out (60s).');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama CORS 403 error. Please restart Ollama.');
    }
    throw new Error(`Ollama translation error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  return parseJsonFromText(rawText);
}

/**
 * Call local Ollama API for free-form text translation (no API key required)
 */
async function fetchOllamaTextTranslation({ text, targetLanguage, ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const messages = [
    {
      role: 'system',
      content: `You are an expert translator. Translate the given text into ${targetLanguage} accurately and naturally. Return ONLY a valid JSON object with the key "translated_text".`
    },
    {
      role: 'user',
      content: `Translate to ${targetLanguage}:\n\n${text}`
    }
  ];

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.4, repeat_penalty: 1.15, num_predict: 1024 }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama translation timed out (60s).');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama CORS 403 error. Please restart Ollama.');
    }
    throw new Error(`Ollama text translation error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  const parsed = parseJsonFromText(rawText);
  return { translated_text: parsed.translated_text || parsed.explanation || rawText.trim() };
}

/**
 * Call local Ollama /api/chat for multi-turn conversational follow-ups
 */
async function fetchOllamaChat({ history = [], userMessage, explainStyle, targetLanguage, indianAccentNuance, ollamaModel, mentorPersona = 'maya' }) {
  const model = await pickOllamaModel(ollamaModel);

  let styleGuidance = '';
  switch ((explainStyle || 'simple').toLowerCase()) {
    case 'technical': styleGuidance = 'Target Audience: Technical developer. Focus on mechanics, data structures, and edge cases.'; break;
    case 'detailed': styleGuidance = 'Target Audience: In-depth learner. Clear, comprehensive answers with practical examples.'; break;
    default: styleGuidance = 'Target Audience: Beginner. Use simple analogies and intuitive concepts.'; break;
  }

  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');
  const culturalNuance = getPersonaGuidance(mentorPersona, indianAccentNuance, isNonEnglish);

  const personaNameMap = {
    'maya': 'Maya, a friendly AI mentor',
    'rao': 'Professor Rao, an academic scholar and researcher',
    'priya': 'Priya, a FAANG Senior Staff Software Architect',
    'eli5': 'ELI5 Buddy, a playful and enthusiastic explainer for beginners'
  };
  const mentorIdentity = personaNameMap[mentorPersona] || 'Maya, a friendly AI mentor';

  const langInstr = isNonEnglish
    ? `CRITICAL REQUIREMENT: Output language MUST be ${targetLanguage}. You MUST write the explanation and key points entirely in ${targetLanguage}. Do NOT write in English.`
    : '';

  const systemPrompt = [
    `You are ${mentorIdentity}. Respond ONLY with a valid JSON object: {"explanation": "...", "key_points": ["...", "..."]}. No markdown code fences, no extra text.`,
    styleGuidance,
    culturalNuance,
    langInstr
  ].filter(Boolean).join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: typeof h.text === 'string' ? h.text : JSON.stringify(h.text)
    })),
    {
      role: 'user',
      content: isNonEnglish
        ? `${userMessage}\n\n(Remember: Respond in ${targetLanguage})`
        : userMessage
    }
  ];

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.5, repeat_penalty: 1.15, num_predict: 1024 }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama request timed out (60s).');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama CORS 403 error. Please restart Ollama.');
    }
    throw new Error(`Ollama chat error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  return parseJsonFromText(rawText);
}

/**
 * Check if Ollama is running and has at least one model
 */
async function isOllamaAvailable() {
  const models = await getAvailableOllamaModels();
  return models.length > 0;
}

/**
 * Retryable fetch with exponential backoff for 503/429 errors
 */
async function fetchWithRetry(fetchFn, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn(attempt);
    } catch (err) {
      lastError = err;
      const is503 = err.message && (err.message.includes('503') || err.message.includes('overload') || err.message.includes('high demand'));
      const is429 = err.message && err.message.includes('429');
      if ((is503 || is429) && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`[Universal AI Explainer] API overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

/**
 * Parse structured JSON returned by Gemini
 */
function parseJsonFromText(rawText) {
  if (!rawText) return { explanation: '', key_points: [], follow_ups: [], jargon: [] };
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const sanitizeJargon = (items) => {
    if (!Array.isArray(items)) return [];
    return items
      .filter(it => it && (it.term || it.word))
      .map(it => ({
        term: String(it.term || it.word || '').trim(),
        definition: String(it.definition || it.meaning || '').trim()
      }))
      .filter(it => it.term && it.definition)
      .slice(0, 4);
  };

  try {
    const parsed = JSON.parse(cleaned);
    return {
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : String(parsed.explanation || ''),
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points.map(String) : [],
      follow_ups: Array.isArray(parsed.follow_ups) ? parsed.follow_ups.map(String).slice(0, 3) : [],
      jargon: sanitizeJargon(parsed.jargon)
    };
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          explanation: typeof parsed.explanation === 'string' ? parsed.explanation : String(parsed.explanation || ''),
          key_points: Array.isArray(parsed.key_points) ? parsed.key_points.map(String) : [],
          follow_ups: Array.isArray(parsed.follow_ups) ? parsed.follow_ups.map(String).slice(0, 3) : [],
          jargon: sanitizeJargon(parsed.jargon)
        };
      } catch { }
    }
    return {
      explanation: rawText,
      key_points: [],
      follow_ups: [],
      jargon: []
    };
  }
}

/**
 * Parse structured Quiz JSON returned by Ollama or Gemini
 */
function parseQuizFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch { }
    }
  }

  if (!parsed || !Array.isArray(parsed.questions)) {
    if (Array.isArray(parsed)) {
      parsed = { title: 'Knowledge Quiz', questions: parsed };
    } else {
      return null;
    }
  }

  const validQuestions = [];
  for (const q of parsed.questions) {
    if (!q || !q.question) continue;
    let options = Array.isArray(q.options) ? q.options.map(String) : [];
    if (options.length < 2) continue;
    while (options.length < 4) {
      options.push(`Option ${String.fromCharCode(65 + options.length)}`);
    }
    if (options.length > 4) {
      options = options.slice(0, 4);
    }
    let correctIdx = parseInt(q.correctIndex ?? q.correct_index ?? 0, 10);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
      correctIdx = 0;
    }
    const explanation = typeof q.explanation === 'string' && q.explanation.trim()
      ? q.explanation.trim()
      : 'Correct choice! Well done.';
    validQuestions.push({
      question: String(q.question).trim(),
      options,
      correctIndex: correctIdx,
      explanation
    });
    if (validQuestions.length === 3) break;
  }

  if (validQuestions.length === 0) return null;

  return {
    title: parsed.title || '🎮 Test My Knowledge',
    questions: validQuestions
  };
}

/**
 * Call local Ollama API to generate an interactive 3-question MCQ quiz
 */
async function fetchOllamaQuiz({ text, targetLanguage = 'English', ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are Maya, an encouraging AI mentor creating a fun 3-question interactive quiz.',
    'Generate an interactive Multiple Choice Quiz (MCQs) based on the user provided text/concept.',
    isNonEnglish ? `CRITICAL REQUIREMENT: Output questions, options, and explanations completely in ${targetLanguage}.` : '',
    'Return ONLY a valid JSON object matching this schema:',
    '{',
    '  "title": "🎮 Test My Knowledge",',
    '  "questions": [',
    '    {',
    '      "question": "Question text testing a key concept?",',
    '      "options": ["Option A", "Option B", "Option C", "Option D"],',
    '      "correctIndex": 0,',
    '      "explanation": "Friendly, encouraging explanation of why this answer is correct."',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- Exactly 3 questions.',
    '- Each question must have exactly 4 options.',
    '- correctIndex must be an integer (0, 1, 2, or 3) pointing to the correct option.',
    '- Keep explanations educational, friendly, and under 2 sentences.',
    '- Output pure JSON. No markdown fences, no preface.'
  ].filter(Boolean).join('\n');

  const userPrompt = `Create a 3-question quiz from this text:\n\n"""\n${text.slice(0, 3000)}\n"""`;

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: { temperature: 0.4, repeat_penalty: 1.15, num_predict: 1200 }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama quiz generation timed out (60s).');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama CORS 403 error. Please restart Ollama.');
    }
    throw new Error(`Ollama quiz error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  const quiz = parseQuizFromText(rawText);
  if (!quiz) {
    throw new Error('Could not parse valid quiz questions from Ollama response.');
  }
  return quiz;
}

/**
 * Direct Google Gemini API call to generate an interactive 3-question MCQ quiz
 */
async function fetchDirectGeminiQuiz({ text, apiKey, targetLanguage = 'English' }) {
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are Maya, an encouraging AI mentor creating a fun 3-question interactive quiz.',
    'Generate an interactive Multiple Choice Quiz (MCQs) based on the user provided text/concept.',
    isNonEnglish ? `CRITICAL REQUIREMENT: Output questions, options, and explanations completely in ${targetLanguage}.` : '',
    'Return ONLY a valid JSON object matching this schema:',
    '{',
    '  "title": "🎮 Test My Knowledge",',
    '  "questions": [',
    '    {',
    '      "question": "Question text testing a key concept?",',
    '      "options": ["Option A", "Option B", "Option C", "Option D"],',
    '      "correctIndex": 0,',
    '      "explanation": "Friendly, encouraging explanation of why this answer is correct."',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- Exactly 3 questions.',
    '- Each question must have exactly 4 options.',
    '- correctIndex must be an integer (0, 1, 2, or 3).',
    '- Keep explanations educational and friendly.',
    '- Output pure JSON. No markdown code fences.'
  ].filter(Boolean).join('\n');

  const userPrompt = `Create a 3-question quiz from this text:\n\n"""\n${text.slice(0, 3500)}\n"""`;

  return await fetchWithRetry(async () => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMessage = errBody?.error?.message || response.statusText;
      if (response.status === 400 && errMessage.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API Key. Please check the key in extension settings.');
      }
      throw new Error(`Gemini API error (${response.status}): ${errMessage}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const candidateText = candidate?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('No quiz generated by Gemini.');
    const quiz = parseQuizFromText(candidateText);
    if (!quiz) throw new Error('Could not parse quiz format from Gemini.');
    return quiz;
  });
}

/**
 * Parse structured Bias Analysis & Fact Check JSON (Multi-dimensional 2.0)
 */
function parseBiasAnalysisFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch { }
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  // 1. Trust & Credibility Score (0-100)
  let score = parseInt(parsed.trustScore ?? parsed.trust_score ?? parsed.credibilityScore ?? parsed.credibility_score ?? 65, 10);
  if (isNaN(score)) score = 65;
  score = Math.max(0, Math.min(100, score));

  // 2. Bias Level ('low', 'medium', 'high')
  let biasLevel = (parsed.biasLevel || parsed.bias_level || '').toLowerCase();
  if (!['low', 'medium', 'high'].includes(biasLevel)) {
    if (score < 50) biasLevel = 'high';
    else if (score < 75) biasLevel = 'medium';
    else biasLevel = 'low';
  }

  // 3. Stance / Angle Classification
  const stanceType = String(parsed.stanceType || parsed.stance_type || (score >= 75 ? 'Neutral / Informational' : score >= 50 ? 'Promotional / Mixed' : 'Sensationalist / Opinionated'));

  // 4. Multi-dimensional Sub-metrics
  const rawMetrics = parsed.metrics || {};
  let evidenceScore = parseInt(rawMetrics.evidenceScore ?? rawMetrics.evidence_score ?? Math.max(5, score - 8), 10);
  let objectivityScore = parseInt(rawMetrics.objectivityScore ?? rawMetrics.objectivity_score ?? score, 10);
  let sensationalismScore = parseInt(rawMetrics.sensationalismScore ?? rawMetrics.sensationalism_score ?? Math.max(5, 100 - score), 10);

  evidenceScore = Math.max(0, Math.min(100, isNaN(evidenceScore) ? 50 : evidenceScore));
  objectivityScore = Math.max(0, Math.min(100, isNaN(objectivityScore) ? 50 : objectivityScore));
  sensationalismScore = Math.max(0, Math.min(100, isNaN(sensationalismScore) ? 50 : sensationalismScore));

  const biasRating = String(parsed.biasRating || parsed.bias_rating || (score >= 75 ? 'High Credibility' : score >= 50 ? 'Moderate Hype / Caution' : 'High Bias / Sensationalist'));
  const summary = String(parsed.summary || 'Content analysis completed.');

  const exaggeratedClaims = Array.isArray(parsed.exaggeratedClaims || parsed.exaggerated_claims)
    ? (parsed.exaggeratedClaims || parsed.exaggerated_claims).map(String).filter(Boolean)
    : [];

  const missingContext = Array.isArray(parsed.missingContext || parsed.missing_context)
    ? (parsed.missingContext || parsed.missing_context).map(String).filter(Boolean)
    : [];

  // Strip redundant "Author motive:" or "Motive:" prefix
  let potentialAgenda = String(parsed.potentialAgenda || parsed.potential_agenda || 'Informational or commercial interest.');
  potentialAgenda = potentialAgenda.replace(/^(author\s*motive|motive|agenda)\s*:\s*/i, '').trim();

  const neutralRewrite = String(parsed.neutralRewrite || parsed.neutral_rewrite || summary);

  const flaggedPhrases = Array.isArray(parsed.flaggedPhrases || parsed.flagged_phrases)
    ? (parsed.flaggedPhrases || parsed.flagged_phrases).map(String).map(s => s.trim()).filter(s => s.length >= 3 && s.length <= 80)
    : [];

  const factCheckTips = Array.isArray(parsed.factCheckTips || parsed.fact_check_tips)
    ? (parsed.factCheckTips || parsed.fact_check_tips).map(String).filter(Boolean)
    : [];

  return {
    trustScore: score,
    credibilityScore: score, // backward compatibility
    biasLevel,
    biasRating,
    stanceType,
    metrics: {
      evidenceScore,
      objectivityScore,
      sensationalismScore
    },
    summary,
    exaggeratedClaims: exaggeratedClaims.length ? exaggeratedClaims : ['No major exaggerated claims identified.'],
    missingContext: missingContext.length ? missingContext : ['Standard context provided in article.'],
    potentialAgenda: potentialAgenda || 'No conspicuous hidden motive detected.',
    neutralRewrite: neutralRewrite || summary,
    flaggedPhrases: flaggedPhrases.length ? flaggedPhrases : (exaggeratedClaims.slice(0, 3)),
    factCheckTips: factCheckTips.length ? factCheckTips : ['Verify primary sources and independent documentation.']
  };
}

/**
 * Call local Ollama API to analyze bias, hype & factual reliability
 */
async function fetchOllamaBiasAnalysis({ text, targetLanguage = 'English', ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are an expert fact-checker, media literacy analyst, and neutral consumer watchdog.',
    'Carefully audit the provided article or text for factual credibility, marketing hype, subjective bias, missing context, and commercial motives.',
    isNonEnglish ? `CRITICAL REQUIREMENT: Output all human-readable descriptions in ${targetLanguage}.` : '',
    'Return ONLY a valid JSON object matching this exact schema:',
    '{',
    '  "trustScore": 75,',
    '  "biasLevel": "medium",',
    '  "biasRating": "Moderate Hype / Caution",',
    '  "stanceType": "Commercial Promotion / Editorial Opinion",',
    '  "metrics": {',
    '    "evidenceScore": 60,',
    '    "objectivityScore": 65,',
    '    "sensationalismScore": 40',
    '  },',
    '  "summary": "1-2 sentence executive assessment of article credibility and tone.",',
    '  "exaggeratedClaims": ["Exact or summarized exaggerated claim 1", "Overstated claim 2"],',
    '  "missingContext": ["Key omitted statistic or counterpoint 1", "Omitted nuance 2"],',
    '  "potentialAgenda": "Concise motive description without saying \'Author motive:\' prefix.",',
    '  "neutralRewrite": "A 2-3 sentence neutral, purely objective, hype-free rewrite of the essential facts.",',
    '  "flaggedPhrases": ["short phrase 1 from text", "dramatic phrase 2 from text"],',
    '  "factCheckTips": ["Concrete verification step 1", "Verification step 2"]',
    '}',
    'Rules:',
    '- trustScore must be an integer 0-100 (where 0-45 = Low/Misleading, 46-74 = Moderate Hype/Biased, 75-100 = Objective/Credible).',
    '- biasLevel must be exactly one of: "low", "medium", or "high".',
    '- metrics scores (evidenceScore, objectivityScore, sensationalismScore) must be integers 0-100.',
    '- flaggedPhrases should be 2 to 5 short exact or near-exact phrases (3-8 words each) from the text that exhibit hype or bias.',
    '- neutralRewrite must present the facts calmly and objectively.',
    '- Return pure JSON. No markdown fences, no preface text.'
  ].filter(Boolean).join('\n');

  const userPrompt = `Audit this content for bias, marketing hype, and factual credibility:\n\n"""\n${text.slice(0, 3500)}\n"""`;

  let response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: { temperature: 0.2, repeat_penalty: 1.15, num_predict: 1400 }
      }),
      signal: AbortSignal.timeout(60000)
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.message?.includes('timed out')) {
      throw new Error('Ollama bias analysis timed out (60s).');
    }
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_BASE_URL}. Is Ollama running?`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    if (response.status === 403) {
      throw new Error('Ollama CORS 403 error. Please restart Ollama.');
    }
    throw new Error(`Ollama bias analysis error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  const result = parseBiasAnalysisFromText(rawText);
  if (!result) {
    throw new Error('Could not parse bias analysis from Ollama response.');
  }
  return result;
}

/**
 * Direct Google Gemini API call to analyze bias, hype & factual reliability
 */
async function fetchDirectGeminiBiasAnalysis({ text, apiKey, targetLanguage = 'English' }) {
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are an expert fact-checker, media literacy analyst, and neutral consumer watchdog.',
    'Carefully audit the provided article or text for factual credibility, marketing hype, subjective bias, missing context, and commercial motives.',
    isNonEnglish ? `CRITICAL REQUIREMENT: Output all human-readable descriptions in ${targetLanguage}.` : '',
    'Return ONLY a valid JSON object matching this exact schema:',
    '{',
    '  "trustScore": 75,',
    '  "biasLevel": "medium",',
    '  "biasRating": "Moderate Hype / Caution",',
    '  "stanceType": "Commercial Promotion / Editorial Opinion",',
    '  "metrics": {',
    '    "evidenceScore": 60,',
    '    "objectivityScore": 65,',
    '    "sensationalismScore": 40',
    '  },',
    '  "summary": "1-2 sentence executive assessment of article credibility and tone.",',
    '  "exaggeratedClaims": ["Exact or summarized exaggerated claim 1", "Overstated claim 2"],',
    '  "missingContext": ["Key omitted statistic or counterpoint 1", "Omitted nuance 2"],',
    '  "potentialAgenda": "Concise motive description without saying \'Author motive:\' prefix.",',
    '  "neutralRewrite": "A 2-3 sentence neutral, purely objective, hype-free rewrite of the essential facts.",',
    '  "flaggedPhrases": ["short phrase 1 from text", "dramatic phrase 2 from text"],',
    '  "factCheckTips": ["Concrete verification step 1", "Verification step 2"]',
    '}',
    'Rules:',
    '- trustScore must be an integer 0-100 (where 0-45 = Low/Misleading, 46-74 = Moderate Hype/Biased, 75-100 = Objective/Credible).',
    '- biasLevel must be exactly one of: "low", "medium", or "high".',
    '- metrics scores (evidenceScore, objectivityScore, sensationalismScore) must be integers 0-100.',
    '- flaggedPhrases should be 2 to 5 short exact or near-exact phrases (3-8 words each) from the text that exhibit hype or bias.',
    '- neutralRewrite must present the facts calmly and objectively.',
    '- Return pure JSON. No markdown code fences.'
  ].filter(Boolean).join('\n');

  const userPrompt = `Audit this content for bias, marketing hype, and factual credibility:\n\n"""\n${text.slice(0, 4000)}\n"""`;

  return await fetchWithRetry(async () => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1400,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMessage = errBody?.error?.message || response.statusText;
      if (response.status === 400 && errMessage.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API Key. Please check the key in extension settings.');
      }
      throw new Error(`Gemini API error (${response.status}): ${errMessage}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const candidateText = candidate?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('No analysis generated by Gemini.');
    const result = parseBiasAnalysisFromText(candidateText);
    if (!result) throw new Error('Could not parse bias analysis format from Gemini.');
    return result;
  });
}




/**
 * Direct Google Gemini API call for standalone extension operation
 */
async function fetchDirectGeminiExplanation({ selectedText, contentType, explainStyle, pageUrl, apiKey, targetLanguage, indianAccentNuance, mentorPersona = 'maya' }) {
  let styleGuidance = '';
  switch ((explainStyle || 'simple').toLowerCase()) {
    case 'technical':
      styleGuidance = 'Target Audience: Technical developer. Focus on architecture, mechanics, data structures, edge cases, and performance.';
      break;
    case 'detailed':
      styleGuidance = 'Target Audience: In-depth learner. Give a comprehensive but clear explanation with practical examples.';
      break;
    case 'simple':
    default:
      styleGuidance = 'Target Audience: Beginner. Explain like I am five (ELI5). Use simple language, intuitive analogies, and avoid unnecessary jargon.';
      break;
  }

  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');
  const culturalNuance = getPersonaGuidance(mentorPersona, indianAccentNuance, isNonEnglish);

  let languageInstruction = '';
  if (isNonEnglish) {
    languageInstruction = [
      `CRITICAL REQUIREMENT - OUTPUT LANGUAGE: ${targetLanguage}`,
      `You MUST write the entire explanation and every single key takeaway ENTIRELY in ${targetLanguage}.`,
      `Do NOT write in English. Everything in the JSON values must be natural, fluent ${targetLanguage}.`
    ].join('\n');
  }

  const systemPrompt = [
    'You are an expert AI assistant that explains complex text and code clearly.',
    styleGuidance,
    culturalNuance,
    languageInstruction,
    'Always return ONLY a valid JSON object matching this structure:',
    '{',
    `  "explanation": "Explanation written completely in ${isNonEnglish ? targetLanguage : 'English'}.",`,
    `  "key_points": ["First point in ${isNonEnglish ? targetLanguage : 'English'}", "Second point in ${isNonEnglish ? targetLanguage : 'English'}"],`,
    `  "follow_ups": ["Short follow-up question 1?", "Short follow-up question 2?", "Short follow-up question 3?"],`,
    `  "jargon": [{"term": "ComplexTerm", "definition": "One-line plain definition"}]`,
    '}',
    'Do not use markdown code fences or backticks around the JSON.',
    'Do not add any text before or after the JSON object.'
  ].filter(Boolean).join('\n');

  const isCode = contentType === 'code';
  let userPrompt = '';
  if (isCode) {
    userPrompt = [
      `Explain the following code snippet. Style: ${(explainStyle || 'simple').toUpperCase()}.`,
      isNonEnglish ? `MANDATORY: You MUST write your explanation and all key points entirely in ${targetLanguage}.` : '',
      '- Break down what it does step by step.',
      '- Explain important parts in simple, clear language.',
      '- Give a simple example or analogy when useful.',
      '- Provide 2 to 4 key takeaways in the "key_points" array.',
      pageUrl ? `Context (Source Page): ${pageUrl}` : '',
      'Code:',
      '```',
      selectedText.trim(),
      '```'
    ].filter(Boolean).join('\n\n');
  } else {
    userPrompt = [
      `Explain the following concept or text. Style: ${(explainStyle || 'simple').toUpperCase()}.`,
      isNonEnglish ? `MANDATORY: You MUST write your explanation and all key points entirely in ${targetLanguage}.` : '',
      '- Simplify technical or difficult domain terms.',
      '- Keep the explanation accurate and easy to understand.',
      '- Provide 2 to 4 key takeaways in the "key_points" array.',
      pageUrl ? `Context (Source Page): ${pageUrl}` : '',
      'Text:',
      '"""',
      selectedText.trim(),
      '"""'
    ].filter(Boolean).join('\n\n');
  }

  return await fetchWithRetry(async () => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = errorBody;
      try { message = JSON.parse(errorBody)?.error?.message || errorBody; } catch { }
      throw new Error(`Gemini API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseJsonFromText(rawContent);
  });
}

/**
 * Direct Gemini call to translate explanation + key points on the fly
 */
async function fetchDirectGeminiTranslation({ explanation, keyPoints = [], targetLanguage, apiKey }) {
  const systemPrompt = [
    'You are an expert multilingual translator and educational assistant.',
    `Translate the provided explanation and key takeaways into ${targetLanguage}.`,
    'Preserve clarity, tone, and any important code/technical keywords as appropriate.',
    'Always return ONLY a valid JSON object matching this structure:',
    '{',
    `  "explanation": "Translated explanation in ${targetLanguage}.",`,
    '  "key_points": ["Translated point 1", "Translated point 2"]',
    '}',
    'Do not use markdown code fences or backticks around the JSON.',
    'Do not add any text before or after the JSON object.'
  ].join('\n');

  const userPrompt = [
    `Target Language: ${targetLanguage}`,
    'Content to translate:',
    JSON.stringify({
      explanation,
      key_points: keyPoints
    }, null, 2)
  ].join('\n\n');

  return await fetchWithRetry(async (attempt) => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = errorBody;
      try { message = JSON.parse(errorBody)?.error?.message || errorBody; } catch { }
      throw new Error(`Translation API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseJsonFromText(rawContent);
  });
}

/**
 * Direct Gemini call to translate arbitrary text
 */
async function fetchDirectGeminiTextTranslation({ text, targetLanguage, apiKey }) {
  const systemPrompt = [
    'You are an expert translator.',
    `Translate the given text into ${targetLanguage} accurately and naturally.`,
    'Always return ONLY a valid JSON object:',
    '{',
    `  "translated_text": "Translated text in ${targetLanguage}"`,
    '}',
    'Do not wrap in markdown fences. Do not output anything outside JSON.'
  ].join('\n');

  return await fetchWithRetry(async (attempt) => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `Translate this text into ${targetLanguage}:\n\n${text}` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = errorBody;
      try { message = JSON.parse(errorBody)?.error?.message || errorBody; } catch { }
      throw new Error(`Translation error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseJsonFromText(rawContent);
    return { translated_text: parsed.translated_text || parsed.explanation || rawContent };
  });
}

/**
 * Call the local backend server
 */
async function fetchBackendExplanation({ selectedText, contentType, explainStyle, pageUrl, backendUrl, apiKey, targetLanguage, indianAccentNuance }) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  const response = await fetch(backendUrl || DEFAULT_BACKEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      selected_text: selectedText,
      content_type: contentType,
      explain_style: explainStyle,
      page_url: pageUrl
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Backend server returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    explanation: data.explanation || '',
    key_points: Array.isArray(data.key_points) ? data.key_points : []
  };
}

/**
 * Save completed explanation to local storage history
 */
async function saveToHistory(item) {
  try {
    const { history = [] } = await chrome.storage.local.get('history');
    const updated = [
      {
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        ...item
      },
      ...history.slice(0, 19)
    ];
    await chrome.storage.local.set({ history: updated });
  } catch (err) {
    console.warn('[Universal AI Explainer] Failed to save history:', err);
  }
}

/**
 * Main explanation handler
 */
async function processExplanation({ tabId, selectedText, pageUrl }) {
  if (!selectedText || !tabId) return;

  const detection = detectContentType(selectedText, pageUrl);

  const selectionData = {
    text: selectedText,
    type: detection.type,
    url: pageUrl,
    tabId,
    reasons: detection.reasons,
    detectedAt: Date.now()
  };

  try {
    await chrome.storage.local.set({ lastSelection: selectionData });
  } catch (storageErr) {
    console.error('[Universal AI Explainer] Storage error:', storageErr);
  }

  // Read settings
  const settings = await chrome.storage.local.get([
    'apiKey',
    'geminiApiKey',
    'explainStyle',
    'overlayTheme',
    'overlayBgStyle',
    'backendUrl',
    'targetLanguage',
    'defaultLanguage',
    'voiceAccent',
    'indianAnalogies',
    'aiSource',      // 'ollama' | 'gemini' | 'auto'
    'ollamaModel',   // e.g. 'llama3.2'
    'mentorPersona', // 'maya' | 'rao' | 'priya' | 'eli5'
    'avatarSkin'     // 'classic' | 'cyberpunk' | 'monochrome' | 'pixel'
  ]).catch(() => ({}));

  const apiKey = settings.geminiApiKey || settings.apiKey || '';
  const overlayTheme = settings.overlayTheme || 'dark';
  const overlayBgStyle = settings.overlayBgStyle || 'glow';
  const explainStyle = settings.explainStyle || 'simple';
  const backendUrl = settings.backendUrl || DEFAULT_BACKEND_URL;
  const targetLanguage = settings.defaultLanguage || settings.targetLanguage || 'English';
  const voiceAccent = settings.voiceAccent || 'en-IN';
  const indianAccentNuance = settings.indianAnalogies !== false;
  const aiSource = settings.aiSource || 'auto'; // default: try Ollama first, fall back to Gemini
  const ollamaModel = settings.ollamaModel || '';
  const mentorPersona = settings.mentorPersona || 'maya';
  const avatarSkin = settings.avatarSkin || 'classic';

  // Show in-page loading card
  await sendToTab(tabId, {
    action: 'EXPLAIN_START',
    text: selectedText,
    type: detection.type,
    theme: overlayTheme,
    bgStyle: overlayBgStyle,
    explainStyle,
    targetLanguage,
    voiceAccent,
    indianAccentNuance,
    pageUrl,
    aiSource,
    ollamaModel,
    mentorPersona,
    avatarSkin
  });

  try {
    let result = null;

    // ── AI Source Priority ────────────────────────────────────────────────
    // auto: try Ollama (free local) → Gemini API → backend server
    // ollama: Ollama only
    // gemini: Gemini API only

    const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
    const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

    let providerName = 'AI';
    if (tryOllama) {
      try {
        result = await fetchOllamaExplanation({
          selectedText,
          contentType: detection.type,
          explainStyle,
          targetLanguage,
          indianAccentNuance,
          ollamaModel,
          mentorPersona
        });
        providerName = 'Ollama';
        console.log('[Universal AI Explainer] ✅ Used Ollama (local AI)');
      } catch (ollamaErr) {
        console.warn('[Universal AI Explainer] Ollama unavailable:', ollamaErr.message);
        if (aiSource === 'ollama') {
          if (ollamaErr.message.includes('403')) {
            throw new Error('Ollama is running, but browser extension access was blocked (CORS 403). Please quit Ollama from the Windows taskbar system tray and restart it.');
          }
          if (ollamaErr.message.includes('Failed to connect') || ollamaErr.message.includes('Failed to fetch')) {
            throw new Error('Ollama is not running. Please launch Ollama from your Start menu and make sure a model is downloaded (run: ollama pull llama3.2).');
          }
          throw new Error(ollamaErr.message || 'Ollama error. Please start Ollama and make sure a model is downloaded.');
        }
        // fall through to next source
      }
    }

    if (!result && tryGemini && apiKey) {
      try {
        result = await fetchDirectGeminiExplanation({
          selectedText,
          contentType: detection.type,
          explainStyle,
          pageUrl,
          apiKey,
          targetLanguage,
          indianAccentNuance,
          mentorPersona
        });
        providerName = 'Gemini';
        console.log('[Universal AI Explainer] ✅ Used Gemini API');
      } catch (geminiErr) {
        console.warn('[Universal AI Explainer] Gemini API failed:', geminiErr.message);
        if (!result && aiSource === 'gemini') throw geminiErr;
      }
    }

    if (!result) {
      // Last resort: try local backend server
      try {
        result = await fetchBackendExplanation({
          selectedText,
          contentType: detection.type,
          explainStyle,
          pageUrl,
          backendUrl,
          apiKey,
          targetLanguage,
          indianAccentNuance
        });
        providerName = 'Backend';
        console.log('[Universal AI Explainer] ✅ Used backend server');
      } catch (backendErr) {
        throw new Error(
          !apiKey && aiSource !== 'ollama'
            ? 'No AI source available. Install Ollama (free) or add a Gemini API key in Settings.'
            : backendErr.message
        );
      }
    }

    if (!result) {
      throw new Error('Unable to retrieve explanation. Please make sure Ollama is running or configure a Gemini API key.');
    }

    // Save to history
    await saveToHistory({
      text: selectedText,
      explanation: result.explanation,
      key_points: result.key_points,
      type: detection.type,
      url: pageUrl,
      style: explainStyle,
      language: targetLanguage,
      provider: providerName
    });

    // Send result to content script overlay
    await sendToTab(tabId, {
      action: 'EXPLAIN_SUCCESS',
      explanation: result.explanation,
      key_points: result.key_points,
      follow_ups: result.follow_ups || [],
      jargon: result.jargon || [],
      type: detection.type,
      theme: overlayTheme,
      bgStyle: overlayBgStyle,
      targetLanguage,
      voiceAccent,
      provider: providerName,
      mentorPersona,
      avatarSkin
    });

  } catch (err) {
    console.error('[Universal AI Explainer] Processing Error:', err);

    let errorMessage = err.message || 'Failed to generate explanation.';
    if (err.name === 'TypeError' && err.message.includes('fetch') && !apiKey) {
      errorMessage = 'Unable to connect to backend server and no Gemini API Key is saved. Click the extension icon to add your Gemini API Key.';
    }

    await sendToTab(tabId, {
      action: 'EXPLAIN_ERROR',
      error: errorMessage
    });
  }
}

// 1. Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'jarvis-cmd' && tab?.id) {
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) {
      await sendToTab(tab.id, { action: 'SHOW_EMPTY_SELECTION_NOTICE' });
      return;
    }
    const result = await executeJarvisCommandDirect(selectedText);
    if (!result) {
      // If Python server is offline, fallback to web search in browser
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(selectedText)}` });
    }
    return;
  }

  if (info.menuItemId === 'tldr-page' && tab?.id) {
    await sendToTab(tab.id, {
      action: 'OPEN_PAGE_TLDR',
      text: (info.selectionText || '').trim(),
      url: info.pageUrl || tab?.url || ''
    });
    return;
  }

  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    const selectedText = (info.selectionText || '').trim();
    const pageUrl = info.pageUrl || tab?.url || '';

    if (!selectedText) {
      await sendToTab(tab.id, { action: 'SHOW_EMPTY_SELECTION_NOTICE' });
      return;
    }

    await processExplanation({
      tabId: tab.id,
      selectedText,
      pageUrl
    });
  }
});

// 2. Keyboard shortcut handler (Alt+E)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'explain-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const response = await sendToTab(tab.id, { action: 'GET_SELECTION' });
      const selectedText = (response?.text || '').trim();
      const pageUrl = response?.url || tab.url || '';

      if (!selectedText) {
        await sendToTab(tab.id, { action: 'SHOW_EMPTY_SELECTION_NOTICE' });
        return;
      }

      await processExplanation({
        tabId: tab.id,
        selectedText,
        pageUrl
      });
    } catch (err) {
      console.warn('[Universal AI Explainer] Command execution failed:', err);
    }
  }
});

/**
 * Rewrite explanation in specified tone (ELI5, Desi, Balanced, Deep Dive)
 */
async function fetchOllamaToneRewrite({ text, tone, targetLanguage, ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  let toneGuidance = '';
  switch (tone) {
    case 'eli5':
      toneGuidance = 'Tone: ELI5 (Explain Like I am 5). Use very simple, friendly words, playful metaphors (candies, toys, playgrounds), and ZERO technical jargon.';
      break;
    case 'desi':
      toneGuidance = 'Tone: Desi Chai-Pe-Charcha. Warm, witty, and relatable with everyday Indian life analogies (chai stall, Mumbai local trains, cricket match, samosa, colony gossip). Blend natural conversational warmth.';
      break;
    case 'deep_dive':
      toneGuidance = 'Tone: Deep Dive / Expert. Comprehensive technical breakdown. Detail inner mechanics, architecture, formal definitions, computational/scientific trade-offs, and edge cases.';
      break;
    case 'balanced':
    default:
      toneGuidance = 'Tone: Balanced & Clear. High-clarity educational explanation with intuitive conceptual examples.';
      break;
  }

  const systemPrompt = [
    'You are Maya, an expert AI mentor.',
    'Rewrite the provided explanation and key takeaways into the requested tone.',
    toneGuidance,
    isNonEnglish ? `Output language MUST be ${targetLanguage}.` : 'Output language: English.',
    'Respond ONLY with a valid JSON object matching this schema:',
    '{',
    '  "explanation": "Rewritten explanation in the specified tone.",',
    '  "key_points": ["Key takeaway 1", "Key takeaway 2"],',
    '  "follow_ups": ["Smart follow-up question 1?", "Smart follow-up question 2?"],',
    '  "jargon": [{"term": "ImportantTerm", "definition": "1-line plain definition"}]',
    '}',
    'No markdown fences, no text outside JSON.'
  ].join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Rewrite this explanation in the "${tone}" style:\n"""\n${text}\n"""` }
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.4, repeat_penalty: 1.15, num_predict: 1024 }
    }),
    signal: AbortSignal.timeout(45000)
  });

  if (!response.ok) throw new Error(`Ollama rewrite error: ${response.status}`);
  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  return parseJsonFromText(rawText);
}

async function fetchDirectGeminiToneRewrite({ text, tone, apiKey, targetLanguage }) {
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  let toneGuidance = '';
  switch (tone) {
    case 'eli5':
      toneGuidance = 'Tone: ELI5 (Explain Like I am 5). Use very simple, friendly words, playful metaphors (candies, toys, playgrounds), and ZERO technical jargon.';
      break;
    case 'desi':
      toneGuidance = 'Tone: Desi Chai-Pe-Charcha. Warm, witty, and relatable with everyday Indian life analogies (chai stall, Mumbai local trains, cricket match, samosa, colony gossip). Blend natural conversational warmth.';
      break;
    case 'deep_dive':
      toneGuidance = 'Tone: Deep Dive / Expert. Comprehensive technical breakdown. Detail inner mechanics, architecture, formal definitions, computational/scientific trade-offs, and edge cases.';
      break;
    case 'balanced':
    default:
      toneGuidance = 'Tone: Balanced & Clear. High-clarity educational explanation with intuitive conceptual examples.';
      break;
  }

  const systemPrompt = [
    'You are Maya, an expert AI mentor.',
    'Rewrite the provided explanation and key takeaways into the requested tone.',
    toneGuidance,
    isNonEnglish ? `Output language MUST be ${targetLanguage}.` : 'Output language: English.',
    'Respond ONLY with a valid JSON object matching this schema:',
    '{',
    '  "explanation": "Rewritten explanation in the specified tone.",',
    '  "key_points": ["Key takeaway 1", "Key takeaway 2"],',
    '  "follow_ups": ["Smart follow-up question 1?", "Smart follow-up question 2?"],',
    '  "jargon": [{"term": "ImportantTerm", "definition": "1-line plain definition"}]',
    '}',
    'No markdown fences, no text outside JSON.'
  ].join('\n');

  return await fetchWithRetry(async () => {
    const model = DEFAULT_GEMINI_MODEL;
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `Rewrite this explanation in the "${tone}" tone:\n"""\n${text}\n"""` }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) throw new Error(`Gemini rewrite error: ${response.status}`);
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return parseJsonFromText(rawText);
  });
}

/**
 * Parse structured 30-Second Page TL;DR JSON
 */
function parsePageTldrFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch { }
    }
  }

  if (!parsed) return null;
  return {
    tldr: String(parsed.tldr || parsed.summary || 'Summary generated.'),
    quick_read: String(parsed.quick_read || parsed.explanation || ''),
    key_stats: Array.isArray(parsed.key_stats) ? parsed.key_stats.map(String) : (Array.isArray(parsed.key_points) ? parsed.key_points.map(String) : []),
    who_should_read: String(parsed.who_should_read || 'Anyone interested in this topic'),
    read_time_saved: String(parsed.read_time_saved || '5 mins saved')
  };
}

/**
 * 30-Second Page TL;DR & Executive Briefing
 */
async function fetchOllamaPageTldr({ text, url, targetLanguage, ollamaModel }) {
  const model = await pickOllamaModel(ollamaModel);
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are Maya, an executive intelligence analyst.',
    'Analyze the provided webpage/article and produce an ultra-crisp 30-second executive briefing.',
    isNonEnglish ? `Output language MUST be ${targetLanguage}.` : 'Output language: English.',
    'Return ONLY a valid JSON object matching this exact schema:',
    '{',
    '  "tldr": "One punchy sentence summarizing the core takeaway or finding.",',
    '  "quick_read": "2 concise paragraphs capturing essential context, arguments, and implications.",',
    '  "key_stats": ["Important fact, number, or milestone 1", "Key fact 2", "Key fact 3"],',
    '  "who_should_read": "Who benefits most from this article and why (1 sentence)",',
    '  "read_time_saved": "e.g. 7 mins saved"',
    '}',
    'No markdown fences, return pure JSON.'
  ].join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Summarize this webpage content:\nContext URL: ${url || 'N/A'}\n\n"""\n${text.slice(0, 4500)}\n"""` }
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.3, repeat_penalty: 1.15, num_predict: 1024 }
    }),
    signal: AbortSignal.timeout(45000)
  });

  if (!response.ok) throw new Error(`Ollama TL;DR error: ${response.status}`);
  const data = await response.json();
  const rawText = data.message?.content || data.response || '';
  return parsePageTldrFromText(rawText);
}

async function fetchDirectGeminiPageTldr({ text, url, apiKey, targetLanguage }) {
  const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');

  const systemPrompt = [
    'You are Maya, an executive intelligence analyst.',
    'Analyze the provided webpage/article and produce an ultra-crisp 30-second executive briefing.',
    isNonEnglish ? `Output language MUST be ${targetLanguage}.` : 'Output language: English.',
    'Return ONLY a valid JSON object matching this exact schema:',
    '{',
    '  "tldr": "One punchy sentence summarizing the core takeaway or finding.",',
    '  "quick_read": "2 concise paragraphs capturing essential context, arguments, and implications.",',
    '  "key_stats": ["Important fact, number, or milestone 1", "Key fact 2", "Key fact 3"],',
    '  "who_should_read": "Who benefits most from this article and why (1 sentence)",',
    '  "read_time_saved": "e.g. 7 mins saved"',
    '}',
    'No markdown fences, return pure JSON.'
  ].join('\n');

  return await fetchWithRetry(async () => {
    const model = DEFAULT_GEMINI_MODEL;
    const apiUrl = `${GEMINI_API_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: `Summarize this webpage content:\nContext URL: ${url || 'N/A'}\n\n"""\n${text.slice(0, 4500)}\n"""` }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) throw new Error(`Gemini TL;DR error: ${response.status}`);
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return parsePageTldrFromText(rawText);
  });
}

// 3. Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ping
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG' });
    return false;
  }

  // ── Voice: Start (popup → background → offscreen) ──────────────────────────
  if (message.action === 'START_VOICE') {
    (async () => {
      try {
        await ensureOffscreenDocument();
        await chrome.runtime.sendMessage({
          action: 'START_OFFSCREEN_VOICE',
          lang: message.lang,
          target: message.target
        });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── Voice: Stop ────────────────────────────────────────────────────────────
  if (message.action === 'STOP_VOICE') {
    (async () => {
      try {
        await chrome.runtime.sendMessage({
          action: 'STOP_OFFSCREEN_VOICE',
          target: message.target
        });
        sendResponse({ success: true });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  // ── Jarvis: 3D VRoid Avatar Tab Injection Helpers ─────────────────────────
  async function injectAvatarToActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) return;
      const viewUrl = chrome.runtime.getURL('avatar-view.html');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: (url) => { window.__JARVIS_AVATAR_VIEW_URL = url; },
        args: [viewUrl]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        files: ['avatar-main.js']
      });
    } catch (e) {
      console.warn('[Jarvis Avatar] Injection failed (expected on browser internal pages):', e);
    }
  }

  async function removeAvatarFromActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { type: 'JARVIS_AVATAR_HIDE' }).catch(() => {});
    } catch (e) {}
  }

  // ── Jarvis: Background Voice Controls ─────────────────────────────────────
  if (message.action === 'START_BACKGROUND_JARVIS') {
    (async () => {
      try {
        await ensureOffscreenDocument();
        const { micPermissionGranted } = await chrome.storage.local.get('micPermissionGranted').catch(() => ({}));
        if (!micPermissionGranted) {
          chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') });
        }
        await chrome.storage.local.set({
          jarvisBackgroundActive: true,
          jarvisContinuousListen: true
        });
        await new Promise(r => setTimeout(r, 200));
        await chrome.runtime.sendMessage({
          action: 'START_BACKGROUND_JARVIS',
          lang: message.lang || 'English'
        });
        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        injectAvatarToActiveTab();
        sendResponse({ success: true });
      } catch (err) {
        console.warn('[Universal AI Explainer] START_BACKGROUND_JARVIS error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'STOP_BACKGROUND_JARVIS') {
    (async () => {
      try {
        await chrome.storage.local.set({
          jarvisBackgroundActive: false,
          jarvisContinuousListen: false
        });
        await chrome.runtime.sendMessage({
          action: 'STOP_BACKGROUND_JARVIS'
        });
        chrome.action.setBadgeText({ text: '' });
        removeAvatarFromActiveTab();
        sendResponse({ success: true });
      } catch (err) {
        console.warn('[Universal AI Explainer] STOP_BACKGROUND_JARVIS error:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ── Side Panel: Open persistent companion panel ───────────────────────────
  if (message.action === 'OPEN_SIDE_PANEL') {
    (async () => {
      try {
        let windowId = message.windowId;
        if (!windowId) {
          const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          windowId = currentTab?.windowId;
        }
        if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
          await chrome.sidePanel.open({ windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Side panel not supported in this Chrome version' });
        }
      } catch (err) {
        console.warn('[Universal AI Explainer] Failed to open side panel:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Trigger in-page explanation from floating button or popup
  if (message.action === 'TRIGGER_EXPLAIN') {
    (async () => {
      let tabId = message.tabId || sender.tab?.id;
      if (!tabId) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = tab?.id;
        } catch { }
      }

      if (tabId && message.text) {
        await processExplanation({
          tabId,
          selectedText: message.text,
          pageUrl: message.pageUrl || sender.tab?.url || ''
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Missing tabId or text' });
      }
    })();
    return true;
  }

  // Direct explanation inside the popup
  if (message.action === 'EXPLAIN_TEXT_DIRECT') {
    (async () => {
      try {
        const detection = detectContentType(message.text, message.pageUrl || '');
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'explainStyle',
          'backendUrl',
          'targetLanguage',
          'defaultLanguage',
          'voiceAccent',
          'indianAnalogies',
          'aiSource',
          'ollamaModel',
          'mentorPersona'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const explainStyle = message.style || settings.explainStyle || 'simple';
        const backendUrl = settings.backendUrl || DEFAULT_BACKEND_URL;
        const targetLanguage = message.targetLanguage || settings.defaultLanguage || settings.targetLanguage || 'English';
        const indianAccentNuance = message.indianAccentNuance !== undefined ? message.indianAccentNuance : (settings.indianAnalogies !== false);
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const mentorPersona = settings.mentorPersona || 'maya';

        let result = null;
        let providerName = 'AI';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        if (tryOllama) {
          try {
            result = await fetchOllamaExplanation({
              selectedText: message.text,
              contentType: detection.type,
              explainStyle,
              targetLanguage,
              indianAccentNuance,
              ollamaModel,
              mentorPersona
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Direct popup used Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Direct Ollama unavailable:', ollamaErr.message);
            if (aiSource === 'ollama') {
              if (ollamaErr.message.includes('403')) {
                throw new Error('Ollama is running, but browser extension access was blocked (CORS 403). Please quit Ollama from the Windows taskbar system tray and restart it.');
              }
              if (ollamaErr.message.includes('Failed to connect') || ollamaErr.message.includes('Failed to fetch')) {
                throw new Error('Ollama is not running. Please start Ollama from your Start menu and ensure a model is installed (run: ollama pull llama3.2).');
              }
              throw new Error(ollamaErr.message || 'Ollama error. Please make sure Ollama is running.');
            }
          }
        }

        // Fallback direct Gemini API
        if (!result && tryGemini && apiKey) {
          try {
            result = await fetchDirectGeminiExplanation({
              selectedText: message.text,
              contentType: detection.type,
              explainStyle,
              pageUrl: message.pageUrl || '',
              apiKey,
              targetLanguage,
              indianAccentNuance,
              mentorPersona
            });
            providerName = 'Gemini';
          } catch (geminiErr) {
            console.warn('[Universal AI Explainer] Gemini API failed:', geminiErr.message);
            if (!result && aiSource === 'gemini') throw geminiErr;
          }
        }

        // Try local backend server
        if (!result) {
          try {
            result = await fetchBackendExplanation({
              selectedText: message.text,
              contentType: detection.type,
              explainStyle,
              pageUrl: message.pageUrl || '',
              backendUrl,
              apiKey,
              targetLanguage,
              indianAccentNuance
            });
            providerName = 'Backend';
          } catch { }
        }

        if (!result) {
          throw new Error(apiKey ? 'Failed to fetch explanation from Google Gemini API or Ollama.' : 'Ollama is not running and no Google Gemini API key is configured.');
        }

        await saveToHistory({
          text: message.text,
          explanation: result.explanation,
          key_points: result.key_points,
          type: detection.type,
          url: message.pageUrl || '',
          style: explainStyle,
          language: targetLanguage,
          provider: providerName
        });

        sendResponse({
          success: true,
          explanation: result.explanation,
          key_points: result.key_points,
          follow_ups: result.follow_ups || [],
          jargon: result.jargon || [],
          type: detection.type,
          targetLanguage,
          provider: providerName,
          mentorPersona
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || 'Error processing explanation'
        });
      }
    })();
    return true;
  }

  // Multi-turn follow-up question (chat continuation)
  if (message.action === 'FOLLOWUP_QUESTION') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'explainStyle',
          'targetLanguage',
          'defaultLanguage',
          'indianAnalogies',
          'aiSource',
          'ollamaModel',
          'mentorPersona'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const explainStyle = settings.explainStyle || 'simple';
        const targetLanguage = message.targetLanguage || settings.defaultLanguage || settings.targetLanguage || 'English';
        const indianAccentNuance = settings.indianAnalogies !== false;
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const mentorPersona = settings.mentorPersona || 'maya';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let result = null;
        let providerName = 'AI';

        if (tryOllama) {
          try {
            result = await fetchOllamaChat({
              history: message.history || [],
              userMessage: message.text,
              explainStyle,
              targetLanguage,
              indianAccentNuance,
              ollamaModel,
              mentorPersona
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Followup used Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Followup Ollama error:', ollamaErr.message);
            if (aiSource === 'ollama') throw ollamaErr;
          }
        }

        if (!result && tryGemini && apiKey) {
          // Build multi-turn contents array from history + new user message
          const history = Array.isArray(message.history) ? message.history : [];
          const contents = [];

          for (const turn of history) {
            const role = turn.role === 'model' ? 'model' : 'user';
            contents.push({ role, parts: [{ text: turn.text }] });
          }

          contents.push({ role: 'user', parts: [{ text: message.text }] });

          let styleGuidance = '';
          switch ((explainStyle).toLowerCase()) {
            case 'technical': styleGuidance = 'Target Audience: Technical developer. Be precise, technical, and thorough.'; break;
            case 'detailed': styleGuidance = 'Target Audience: In-depth learner. Give comprehensive but clear answers.'; break;
            default: styleGuidance = 'Target Audience: Beginner. Use simple language, analogies, and practical examples.'; break;
          }

          const isNonEnglish = Boolean(targetLanguage && targetLanguage.toLowerCase() !== 'english');
          const culturalNuance = getPersonaGuidance(mentorPersona, indianAccentNuance, isNonEnglish);

          let languageInstruction = isNonEnglish
            ? `CRITICAL REQUIREMENT: Output language MUST be ${targetLanguage}. You MUST answer entirely in ${targetLanguage}. Do NOT write in English.`
            : '';

          const systemPrompt = [
            'You are an expert AI assistant helping explain concepts and answer follow-up questions.',
            styleGuidance,
            culturalNuance,
            languageInstruction,
            'The user may ask follow-up questions about your previous explanations — answer naturally, maintaining context.',
            'Always return ONLY a valid JSON object:',
            `{ "explanation": "Your answer written in ${isNonEnglish ? targetLanguage : 'English'}.", "key_points": ["Point 1 in ${isNonEnglish ? targetLanguage : 'English'}", "Point 2 in ${isNonEnglish ? targetLanguage : 'English'}"] }`,
            'Do not wrap in markdown code fences. Do not add text outside the JSON.'
          ].filter(Boolean).join('\n');

          const url = `${GEMINI_API_URL}/${DEFAULT_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json'
              }
            })
          });

          if (!response.ok) {
            const errBody = await response.text();
            let msg = errBody;
            try { msg = JSON.parse(errBody)?.error?.message || errBody; } catch { }
            throw new Error(`Gemini API error (${response.status}): ${msg}`);
          }

          const data = await response.json();
          const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          result = parseJsonFromText(rawContent);
          providerName = 'Gemini';
        }

        if (!result) {
          throw new Error(apiKey ? 'Unable to generate follow-up answer.' : 'Ollama is not responding and no Google Gemini API key is configured.');
        }

        sendResponse({
          success: true,
          explanation: result.explanation,
          key_points: result.key_points,
          follow_ups: result.follow_ups || [],
          jargon: result.jargon || [],
          targetLanguage,
          provider: providerName
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || 'Error processing follow-up question'
        });
      }
    })();
    return true;
  }

  // On-the-fly explanation translation (translates explanation + key points)
  if (message.action === 'TRANSLATE_EXPLANATION') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get(['apiKey', 'geminiApiKey', 'aiSource', 'ollamaModel']).catch(() => ({}));
        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.targetLanguage || 'Hindi';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let result = null;
        let providerName = 'AI';

        // Try Ollama first if selected
        if (tryOllama) {
          try {
            result = await fetchOllamaTranslation({
              explanation: message.explanation,
              keyPoints: message.key_points || [],
              targetLanguage,
              ollamaModel
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Explanation translation used Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Ollama translation failed:', ollamaErr.message);
            if (aiSource === 'ollama') throw ollamaErr;
          }
        }

        // Fallback to Gemini if needed
        if (!result && tryGemini && apiKey) {
          try {
            result = await fetchDirectGeminiTranslation({
              explanation: message.explanation,
              keyPoints: message.key_points || [],
              targetLanguage,
              apiKey
            });
            providerName = 'Gemini';
          } catch (geminiErr) {
            console.warn('[Universal AI Explainer] Gemini translation failed:', geminiErr.message);
            if (aiSource === 'gemini') throw geminiErr;
          }
        }

        if (!result) {
          throw new Error(
            aiSource === 'ollama'
              ? 'Ollama translation failed. Please make sure Ollama is running.'
              : !apiKey
                ? 'No AI source available for translation. Install Ollama (free) or add a Gemini API key in Settings.'
                : 'Translation failed from all AI sources.'
          );
        }

        sendResponse({
          success: true,
          explanation: result.explanation,
          key_points: result.key_points,
          targetLanguage,
          provider: providerName
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || 'Translation failed'
        });
      }
    })();
    return true;
  }

  // Free-form text translation
  if (message.action === 'TRANSLATE_TEXT') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get(['apiKey', 'geminiApiKey', 'aiSource', 'ollamaModel']).catch(() => ({}));
        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.targetLanguage || 'Hindi';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let result = null;
        let providerName = 'AI';

        // Try Ollama first if selected
        if (tryOllama) {
          try {
            result = await fetchOllamaTextTranslation({
              text: message.text,
              targetLanguage,
              ollamaModel
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Text translation used Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Ollama text translation failed:', ollamaErr.message);
            if (aiSource === 'ollama') throw ollamaErr;
          }
        }

        // Fallback to Gemini if needed
        if (!result && tryGemini && apiKey) {
          try {
            result = await fetchDirectGeminiTextTranslation({
              text: message.text,
              targetLanguage,
              apiKey
            });
            providerName = 'Gemini';
          } catch (geminiErr) {
            console.warn('[Universal AI Explainer] Gemini text translation failed:', geminiErr.message);
            if (aiSource === 'gemini') throw geminiErr;
          }
        }

        if (!result) {
          throw new Error(
            aiSource === 'ollama'
              ? 'Ollama translation failed. Please make sure Ollama is running.'
              : !apiKey
                ? 'No AI source available for translation. Install Ollama (free) or add a Gemini API key in Settings.'
                : 'Translation failed from all AI sources.'
          );
        }

        sendResponse({
          success: true,
          translatedText: result.translated_text,
          targetLanguage,
          provider: providerName
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message || 'Translation failed'
        });
      }
    })();
    return true;
  }

  // ─── Gamified Learning / Quiz Mode ──────────────────────────────────────────
  if (message.action === 'GENERATE_QUIZ') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'aiSource',
          'ollamaModel',
          'defaultLanguage',
          'targetLanguage'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.language || settings.defaultLanguage || settings.targetLanguage || 'English';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let quiz = null;
        let providerName = 'AI';

        // 1. Try local Ollama if auto/ollama
        if (tryOllama) {
          try {
            quiz = await fetchOllamaQuiz({
              text: message.text || '',
              targetLanguage,
              ollamaModel
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Quiz generated via Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Ollama quiz failed:', ollamaErr.message);
            if (aiSource === 'ollama') throw ollamaErr;
          }
        }

        // 2. Fallback to Gemini
        if (!quiz && tryGemini && apiKey) {
          try {
            quiz = await fetchDirectGeminiQuiz({
              text: message.text || '',
              apiKey,
              targetLanguage
            });
            providerName = 'Gemini';
            console.log('[Universal AI Explainer] ✅ Quiz generated via Gemini');
          } catch (geminiErr) {
            console.warn('[Universal AI Explainer] Gemini quiz failed:', geminiErr.message);
            if (aiSource === 'gemini') throw geminiErr;
          }
        }

        if (!quiz) {
          throw new Error(
            aiSource === 'ollama'
              ? 'Ollama is not running or failed to generate quiz. Make sure Ollama is active.'
              : !apiKey
                ? 'No AI available to generate quiz. Run Ollama locally (free) or enter a Google Gemini API Key in Settings.'
                : 'Failed to generate quiz from both Ollama and Gemini.'
          );
        }

        sendResponse({
          success: true,
          quiz,
          provider: providerName
        });
      } catch (err) {
        console.error('[Universal AI Explainer] Quiz generation error:', err);
        sendResponse({
          success: false,
          error: err.message || 'Error generating quiz questions.'
        });
      }
    })();
    return true;
  }

  // ─── Bias Meter & Fact Checker ──────────────────────────────────────────
  if (message.action === 'ANALYZE_BIAS') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'aiSource',
          'ollamaModel',
          'defaultLanguage',
          'targetLanguage'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.language || settings.defaultLanguage || settings.targetLanguage || 'English';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let analysis = null;
        let providerName = 'AI';

        // 1. Try local Ollama if auto/ollama
        if (tryOllama) {
          try {
            analysis = await fetchOllamaBiasAnalysis({
              text: message.text || '',
              targetLanguage,
              ollamaModel
            });
            providerName = 'Ollama';
            console.log('[Universal AI Explainer] ✅ Bias analysis generated via Ollama');
          } catch (ollamaErr) {
            console.warn('[Universal AI Explainer] Ollama bias analysis failed:', ollamaErr.message);
            if (aiSource === 'ollama') throw ollamaErr;
          }
        }

        // 2. Fallback to Gemini
        if (!analysis && tryGemini && apiKey) {
          try {
            analysis = await fetchDirectGeminiBiasAnalysis({
              text: message.text || '',
              apiKey,
              targetLanguage
            });
            providerName = 'Gemini';
            console.log('[Universal AI Explainer] ✅ Bias analysis generated via Gemini');
          } catch (geminiErr) {
            console.warn('[Universal AI Explainer] Gemini bias analysis failed:', geminiErr.message);
            if (aiSource === 'gemini') throw geminiErr;
          }
        }

        if (!analysis) {
          throw new Error(
            aiSource === 'ollama'
              ? 'Ollama is not running or failed to audit bias. Make sure Ollama is active.'
              : !apiKey
                ? 'No AI available to audit bias. Run Ollama locally (free) or enter a Google Gemini API Key in Settings.'
                : 'Failed to analyze bias from both Ollama and Gemini.'
          );
        }

        sendResponse({
          success: true,
          analysis,
          provider: providerName
        });
      } catch (err) {
        console.error('[Universal AI Explainer] Bias analysis error:', err);
        sendResponse({
          success: false,
          error: err.message || 'Error auditing article bias and credibility.'
        });
      }
    })();
    return true;
  }

  // ─── Tone & Complexity Rewriter ─────────────────────────────────────────
  if (message.action === 'REWRITE_TONE') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'aiSource',
          'ollamaModel',
          'defaultLanguage',
          'targetLanguage'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.language || settings.defaultLanguage || settings.targetLanguage || 'English';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let result = null;
        let provider = 'AI';
        if (tryOllama) {
          try {
            result = await fetchOllamaToneRewrite({
              text: message.text || '',
              tone: message.tone || 'balanced',
              targetLanguage,
              ollamaModel
            });
            provider = 'Ollama';
          } catch (e) {
            console.warn('Ollama tone rewrite failed:', e.message);
            if (aiSource === 'ollama') throw e;
          }
        }

        if (!result && tryGemini && apiKey) {
          try {
            result = await fetchDirectGeminiToneRewrite({
              text: message.text || '',
              tone: message.tone || 'balanced',
              apiKey,
              targetLanguage
            });
            provider = 'Gemini';
          } catch (e) {
            console.warn('Gemini tone rewrite failed:', e.message);
            if (aiSource === 'gemini') throw e;
          }
        }

        if (!result) throw new Error('Could not rewrite explanation in the requested tone.');
        sendResponse({ success: true, result, provider });
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'Failed to rewrite tone.' });
      }
    })();
    return true;
  }

  // ─── 30-Second Page TL;DR ────────────────────────────────────────────────
  if (message.action === 'SUMMARIZE_PAGE_TLDR') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          'apiKey',
          'geminiApiKey',
          'aiSource',
          'ollamaModel',
          'defaultLanguage',
          'targetLanguage'
        ]).catch(() => ({}));

        const apiKey = settings.geminiApiKey || settings.apiKey || '';
        const aiSource = settings.aiSource || 'auto';
        const ollamaModel = settings.ollamaModel || '';
        const targetLanguage = message.language || settings.defaultLanguage || settings.targetLanguage || 'English';

        const tryOllama = aiSource === 'ollama' || aiSource === 'auto';
        const tryGemini = aiSource === 'gemini' || aiSource === 'auto';

        let summary = null;
        let provider = 'AI';
        if (tryOllama) {
          try {
            summary = await fetchOllamaPageTldr({
              text: message.text || '',
              url: message.url || '',
              targetLanguage,
              ollamaModel
            });
            provider = 'Ollama';
          } catch (e) {
            console.warn('Ollama Page TL;DR failed:', e.message);
            if (aiSource === 'ollama') throw e;
          }
        }

        if (!summary && tryGemini && apiKey) {
          try {
            summary = await fetchDirectGeminiPageTldr({
              text: message.text || '',
              url: message.url || '',
              apiKey,
              targetLanguage
            });
            provider = 'Gemini';
          } catch (e) {
            console.warn('Gemini Page TL;DR failed:', e.message);
            if (aiSource === 'gemini') throw e;
          }
        }

        if (!summary) throw new Error('Could not generate 30-second Page TL;DR briefing.');
        sendResponse({ success: true, summary, provider });
      } catch (err) {
        sendResponse({ success: false, error: err.message || 'Failed to summarize page.' });
      }
    })();
    return true;
  }

  // ─── Jarvis Python Assistant Execution & Status ──────────────────────────
  if (message.action === 'EXECUTE_JARVIS_COMMAND') {
    (async () => {
      try {
        const cmd = (message.command || '').trim();
        if (!cmd) {
          sendResponse({ success: false, error: 'Command is required' });
          return;
        }
        const resp = await fetch(`${JARVIS_BASE_URL}/api/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: cmd,
            speak_reply: message.speakReply !== false,
            speak_response: message.speakResponse || false
          }),
          signal: AbortSignal.timeout(12000)
        });
        if (resp.ok) {
          const data = await resp.json();
          const replyMsg = data.message || data.response || '';
          if (replyMsg) {
            const estDuration = Math.max(1600, Math.min(8500, replyMsg.split(' ').length * 340));
            chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
              if (activeTab?.id) {
                chrome.tabs.sendMessage(activeTab.id, { type: 'JARVIS_SPEAKING_START', duration: estDuration, text: replyMsg }).catch(() => {});
                setTimeout(() => {
                  chrome.tabs.sendMessage(activeTab.id, { type: 'JARVIS_SPEAKING_END' }).catch(() => {});
                }, estDuration);
              }
            }).catch(() => {});
          }
          sendResponse({ success: true, ...data });
        } else {
          sendResponse({ success: false, error: `Jarvis returned HTTP ${resp.status}`, offline: false });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message, offline: true });
      }
    })();
    return true;
  }

  if (message.action === 'CHECK_JARVIS_STATUS') {
    (async () => {
      try {
        const resp = await fetch(`${JARVIS_BASE_URL}/api/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(2500)
        });
        if (resp.ok) {
          const data = await resp.json();
          sendResponse({ success: true, online: true, data });
        } else {
          sendResponse({ success: false, online: false });
        }
      } catch {
        sendResponse({ success: false, online: false });
      }
    })();
    return true;
  }

  return false;
});

// ── Keep Floating Avatar on active tab when Background Mode is ON ────────────
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const { jarvisBackgroundActive } = await chrome.storage.local.get('jarvisBackgroundActive');
    if (jarvisBackgroundActive && activeInfo?.tabId) {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) return;
      const viewUrl = chrome.runtime.getURL('avatar-view.html');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: (url) => { window.__JARVIS_AVATAR_VIEW_URL = url; },
        args: [viewUrl]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        files: ['avatar-main.js']
      });
    }
  } catch (_) {}
});

