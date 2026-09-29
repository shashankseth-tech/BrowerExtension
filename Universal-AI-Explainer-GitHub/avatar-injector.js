// avatar-injector.js — Content Script (Isolated World)
// Runs on active webpages to inject the floating 3D VRoid character companion
// whenever Jarvis Background Voice Mode is enabled.
(function () {
  'use strict';

  if (window.__jarvisAvatarContentScriptLoaded) return;
  window.__jarvisAvatarContentScriptLoaded = true;

  const CONTAINER_ID = 'jarvis-vroid-floating-companion';
  let isMinimized = false;
  let speechTimeout = null;

  function getCompanionContainer() {
    return document.getElementById(CONTAINER_ID);
  }

  function createFloatingCompanion() {
    if (getCompanionContainer()) {
      getCompanionContainer().style.display = 'flex';
      return;
    }

    // Floating card container
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 220px !important;
      height: 330px !important;
      z-index: 2147483647 !important;
      background: radial-gradient(circle at 50% 15%, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.98) 100%) !important;
      border: 1.5px solid rgba(56, 189, 248, 0.5) !important;
      border-radius: 20px !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 28px rgba(56, 189, 248, 0.3) !important;
      backdrop-filter: blur(14px) !important;
      overflow: hidden !important;
      cursor: grab !important;
      user-select: none !important;
      display: flex !important;
      flex-direction: column !important;
      transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease, height 0.25s ease !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    `;

    // Header bar for drag & minimize/close
    const header = document.createElement('div');
    header.id = 'jarvis-companion-header';
    header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 8px 12px !important;
      background: rgba(15, 23, 42, 0.88) !important;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25) !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      letter-spacing: 0.06em !important;
      color: #38bdf8 !important;
      text-transform: uppercase !important;
      cursor: grab !important;
    `;
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;pointer-events:none;">
        <span id="jarvis-companion-live-dot" style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
        <span>JARVIS 3D LIVE</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button id="jarvis-avatar-min-btn" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;line-height:1;" title="Minimize">─</button>
        <button id="jarvis-avatar-close-btn" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;line-height:1;" title="Close">✕</button>
      </div>
    `;
    container.appendChild(header);

    // Speech bubble overlay
    const speechBubble = document.createElement('div');
    speechBubble.id = 'jarvis-companion-speech-bubble';
    speechBubble.style.cssText = `
      position: absolute !important;
      top: 38px !important;
      left: 8px !important;
      right: 8px !important;
      padding: 6px 10px !important;
      background: rgba(2, 6, 23, 0.94) !important;
      border: 1px solid rgba(56, 189, 248, 0.45) !important;
      border-radius: 10px !important;
      color: #e2e8f0 !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateY(-4px) !important;
      transition: opacity 0.25s ease, transform 0.25s ease !important;
      z-index: 20 !important;
      text-align: center !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5) !important;
    `;
    speechBubble.textContent = 'Jarvis Active';
    container.appendChild(speechBubble);

    // Iframe container wrapper
    const frameWrapper = document.createElement('div');
    frameWrapper.id = 'jarvis-companion-frame-wrapper';
    frameWrapper.style.cssText = `
      flex: 1 !important;
      width: 100% !important;
      position: relative !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;

    const iframe = document.createElement('iframe');
    iframe.id = 'jarvis-companion-iframe';
    let viewUrl = '';
    try {
      const baseView = chrome.runtime.getURL('avatar-view.html');
      const modelUrl = chrome.runtime.getURL('AvatarSample_A.vrm');
      viewUrl = `${baseView}?model=${encodeURIComponent(modelUrl)}`;
    } catch (_) {
      viewUrl = 'avatar-view.html';
    }
    iframe.src = viewUrl;
    iframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      background: transparent !important;
      display: block !important;
    `;
    frameWrapper.appendChild(iframe);
    container.appendChild(frameWrapper);

    // Append to document
    document.body.appendChild(container);

    // ── Draggable Functionality ──
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let containerStartX = 0;
    let containerStartY = 0;

    header.addEventListener('mousedown', function (e) {
      if (e.target.id === 'jarvis-avatar-close-btn' || e.target.id === 'jarvis-avatar-min-btn') return;
      isDragging = true;
      header.style.cursor = 'grabbing';
      container.style.cursor = 'grabbing';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = container.getBoundingClientRect();
      containerStartX = rect.left;
      containerStartY = rect.top;
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const newX = Math.max(10, Math.min(window.innerWidth - 230, containerStartX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 340, containerStartY + deltaY));
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
      container.style.right = 'auto';
      container.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'grab';
        container.style.cursor = 'grab';
      }
    });

    // ── Minimize Button ──
    const minBtn = container.querySelector('#jarvis-avatar-min-btn');
    minBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      isMinimized = !isMinimized;
      if (isMinimized) {
        container.style.height = '42px';
        frameWrapper.style.display = 'none';
        speechBubble.style.display = 'none';
        minBtn.textContent = '□';
      } else {
        container.style.height = '330px';
        frameWrapper.style.display = 'flex';
        speechBubble.style.display = 'block';
        minBtn.textContent = '─';
      }
    });

    // ── Close Button ──
    const closeBtn = container.querySelector('#jarvis-avatar-close-btn');
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeFloatingCompanion();
    });
  }

  function removeFloatingCompanion() {
    const el = getCompanionContainer();
    if (el) el.remove();
  }

  function triggerSpeaking(durationMs = 3000, text = '') {
    const container = getCompanionContainer();
    if (!container) return;

    // Glowing cyan/emerald pulse on border
    container.style.borderColor = '#10b981';
    container.style.boxShadow = '0 16px 44px rgba(0, 0, 0, 0.75), 0 0 32px rgba(16, 185, 129, 0.45)';

    // Show speech bubble if text provided
    const bubble = document.getElementById('jarvis-companion-speech-bubble');
    if (bubble && text) {
      bubble.textContent = text.length > 90 ? text.substring(0, 87) + '...' : text;
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
    }

    // Post SPEAK_START to iframe
    const iframe = document.getElementById('jarvis-companion-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'SPEAK_START', duration: durationMs }, '*');
    }

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      if (container) {
        container.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        container.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 28px rgba(56, 189, 248, 0.3)';
      }
      if (bubble) {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(-4px)';
      }
    }, durationMs + 200);
  }

  function stopSpeaking() {
    const container = getCompanionContainer();
    if (container) {
      container.style.borderColor = 'rgba(56, 189, 248, 0.5)';
      container.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 28px rgba(56, 189, 248, 0.3)';
    }
    const bubble = document.getElementById('jarvis-companion-speech-bubble');
    if (bubble) {
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(-4px)';
    }
    const iframe = document.getElementById('jarvis-companion-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'SPEAK_END' }, '*');
    }
  }

  // Check storage on page load
  try {
    chrome.storage.local.get(['jarvisBackgroundActive'], function (result) {
      if (result && result.jarvisBackgroundActive) {
        createFloatingCompanion();
      }
    });
  } catch (_) {}

  // Listen for storage changes (e.g. user toggles background mode in popup)
  try {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      if (namespace === 'local' && changes.jarvisBackgroundActive) {
        if (changes.jarvisBackgroundActive.newValue) {
          createFloatingCompanion();
        } else {
          removeFloatingCompanion();
        }
      }
    });
  } catch (_) {}

  // Listen for direct messages from background service worker
  try {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || !message.type) return;

      switch (message.type) {
        case 'JARVIS_SPEAKING_START':
          triggerSpeaking(message.duration || 3000, message.text || '');
          sendResponse({ received: true });
          break;

        case 'JARVIS_SPEAKING_END':
          stopSpeaking();
          sendResponse({ received: true });
          break;

        case 'JARVIS_AVATAR_SHOW':
          createFloatingCompanion();
          sendResponse({ received: true });
          break;

        case 'JARVIS_AVATAR_HIDE':
        case 'STOP_BACKGROUND_JARVIS':
          removeFloatingCompanion();
          sendResponse({ received: true });
          break;

        default:
          break;
      }
      return true;
    });
  } catch (_) {}
})();
