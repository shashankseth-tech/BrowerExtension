// avatar-main.js — Webpage Floating 3D Companion (MAIN World)
// Runs on the active webpage when JARVIS Background Mode is active.
(function () {
  'use strict';

  if (window.__jarvisAvatarRunning) {
    return;
  }
  window.__jarvisAvatarRunning = true;

  const CONTAINER_ID = 'jarvis-vroid-floating-container';

  // Remove any stale container
  const old = document.getElementById(CONTAINER_ID);
  if (old) old.remove();

  // Create floating container
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = `
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    width: 200px !important;
    height: 310px !important;
    z-index: 2147483647 !important;
    background: radial-gradient(circle at 50% 15%, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%) !important;
    border: 1.5px solid rgba(56, 189, 248, 0.5) !important;
    border-radius: 20px !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 28px rgba(56, 189, 248, 0.3) !important;
    backdrop-filter: blur(14px) !important;
    overflow: hidden !important;
    cursor: grab !important;
    user-select: none !important;
    display: flex !important;
    flex-direction: column !important;
    transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  `;

  // Top header bar for drag & controls
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 8px 12px !important;
    background: rgba(15, 23, 42, 0.85) !important;
    border-bottom: 1px solid rgba(56, 189, 248, 0.25) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.06em !important;
    color: #38bdf8 !important;
    text-transform: uppercase !important;
  `;
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
      <span>JARVIS 3D</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <button id="jarvis-avatar-min-btn" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;padding:0 3px;line-height:1;" title="Minimize">─</button>
      <button id="jarvis-avatar-close-btn" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;padding:0 3px;line-height:1;" title="Close">✕</button>
    </div>
  `;
  container.appendChild(header);

  // Speech bubble overlay
  const speechBubble = document.createElement('div');
  speechBubble.id = 'jarvis-avatar-speech-bubble';
  speechBubble.style.cssText = `
    position: absolute !important;
    top: 38px !important;
    left: 8px !important;
    right: 8px !important;
    padding: 6px 10px !important;
    background: rgba(2, 6, 23, 0.92) !important;
    border: 1px solid rgba(56, 189, 248, 0.4) !important;
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
  iframe.id = 'jarvis-vroid-floating-frame';
  let viewUrl = window.__JARVIS_AVATAR_VIEW_URL || '';
  if (!viewUrl && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    try { viewUrl = chrome.runtime.getURL('avatar-view.html'); } catch(_) {}
  }
  if (!viewUrl) {
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

  // Append container to page
  document.body.appendChild(container);

  // Draggable functionality
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let containerStartX = 0;
  let containerStartY = 0;

  header.addEventListener('mousedown', function (e) {
    if (e.target.id === 'jarvis-avatar-close-btn' || e.target.id === 'jarvis-avatar-min-btn') return;
    isDragging = true;
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
    container.style.left = `${Math.max(10, Math.min(window.innerWidth - 210, containerStartX + deltaX))}px`;
    container.style.top = `${Math.max(10, Math.min(window.innerHeight - 320, containerStartY + deltaY))}px`;
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
    }
  });

  // Minimize button toggle
  let isMinimized = false;
  const minBtn = container.querySelector('#jarvis-avatar-min-btn');
  minBtn.addEventListener('click', function () {
    isMinimized = !isMinimized;
    if (isMinimized) {
      container.style.height = '36px';
      frameWrapper.style.display = 'none';
      minBtn.textContent = '□';
    } else {
      container.style.height = '310px';
      frameWrapper.style.display = 'flex';
      minBtn.textContent = '─';
    }
  });

  // Close button
  const closeBtn = container.querySelector('#jarvis-avatar-close-btn');
  closeBtn.addEventListener('click', function () {
    window.__jarvisAvatarDestroy();
  });

  // Handle events from bridge
  function handleEvent(e) {
    const detail = e.detail || {};
    switch (detail.action) {
      case 'speak_start':
        container.style.borderColor = '#10b981';
        container.style.boxShadow = '0 16px 40px rgba(0,0,0,0.65), 0 0 32px rgba(16, 185, 129, 0.4)';
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SPEAK_START', duration: detail.duration || 3000 }, '*');
        }
        speechBubble.textContent = 'Jarvis Speaking...';
        speechBubble.style.opacity = '1';
        speechBubble.style.transform = 'translateY(0)';
        break;

      case 'speak_end':
        container.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        container.style.boxShadow = '0 16px 40px rgba(0,0,0,0.65), 0 0 28px rgba(56, 189, 248, 0.3)';
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SPEAK_END' }, '*');
        }
        speechBubble.style.opacity = '0';
        speechBubble.style.transform = 'translateY(-4px)';
        break;

      case 'expression':
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'EXPRESSION', name: detail.expression, weight: detail.weight }, '*');
        }
        break;

      case 'destroy':
        window.__jarvisAvatarDestroy();
        break;
    }
  }

  document.addEventListener('__jarvis_avatar_event', handleEvent);

  // Global destruction / cleanup function
  window.__jarvisAvatarDestroy = function () {
    document.removeEventListener('__jarvis_avatar_event', handleEvent);
    container.remove();
    window.__jarvisAvatarRunning = false;
  };
})();
