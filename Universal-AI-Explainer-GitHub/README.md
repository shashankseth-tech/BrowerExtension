# Universal AI Explainer 🧠⚡

A powerful, modern Chrome Browser Extension (Manifest V3) that provides instant, contextual AI explanations for highlighted text and code snippets across any webpage, alongside **Jarvis: Python Desktop & Web Automation Commander**.

Powered by Google's **Gemini AI** (`gemini-3.6-flash`), local **Ollama** (`llama3.2`), and an integrated **Python FastAPI Automation Bridge**.

---

## ✨ Key Features

- **🤖 Jarvis Python Automation Assistant**: Desktop & web voice-enabled AI assistant running on FastAPI (`127.0.0.1:8000`). Launch Windows desktop apps (Notepad, Calculator, VS Code, Task Manager, PowerShell, Settings, Explorer), control system functions (Lock Workstation), search Google/YouTube, or converse with smart local Ollama AI answers.
- **🎙️ Hands-Free "Maya Live Talk"**: Real-time voice-to-voice conversational partner mode. Speak freely &rarr; AI processes &rarr; speaks back with live audio waves &rarr; automatically listens for your response hands-free.
- **🪟 Chrome Side Panel Companion (`chrome.sidePanel`)**: Move the assistant into Chrome's native persistent Side Panel docked alongside your tabs as you browse and read documentation.
- **🎭 Custom Mentor Personas & Avatar Skins**:
  - **Personas**: Maya (Warm Indian English Mentor), Professor Rao (Formal Academic Scholar), Code Ninja Priya (FAANG Senior Staff Architect), ELI5 Buddy (Fun Playground Guide).
  - **Avatar Skins**: Classic Indigo, Cyberpunk Neon, Minimalist Monochrome, Retro 8-Bit Pixel.
- **⚡ Instant Auto-Explain on Highlight**: Optional zero-click explanation triggered 400ms after highlighting text on any webpage.
- **🤖 Smart Auto-Form Filler & Answerer**: Automatically detects questions and form inputs on any webpage, asks for confirmation with a Yes/No banner, and auto-fills answers compatible with modern React, Angular, and Vue forms.
- **⚡ Instant In-Page Explanations**: Highlight text or code anywhere on the web, right-click and select **"Explain with AI"**, press <kbd>Alt</kbd> + <kbd>E</kbd>, or click the floating quick-action pill.
- **⚡ 30-Second Page TL;DR**: Instant executive briefing of entire articles with key takeaways, data points, and reading time saved.
- **🎚️ Complexity & Tone Rewriter**: Rewrite any explanation on-the-fly to **ELI5** (kindergarten simplicity), **Desi Analogy** (relatable chai & train everyday metaphors), **Balanced** (clean clarity), or **Deep Dive** (technical trade-offs).
- **💡 Smart Follow-Up Chips**: Dynamically suggested questions with an expandable in-card accordion answer drawer.
- **📖 Interactive Jargon Buster**: Difficult jargon is underlined with instant 1-line plain definitions on hover.
- **📤 1-Click Multi-Format Export**: Copy explanations formatted as **Markdown**, **Anki Flashcards**, **Social/Tweet Threads**, or **Notion Callouts**.
- **🤖 Animated AI Mentor Avatar**: Expressive companion with breathing, thinking aura, customizable skins, and lip-synced audio narration.
- **🇮🇳 Natural Indian English Voice (TTS)**: Authentic voice synthesis with Chromium keep-alive heartbeat.
- **🌐 20+ Language Translator**: Instant translation into Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Spanish, French, and more.
- **🔌 Dual AI Engine (Ollama + Google Gemini)**: Run 100% locally and privately for free with Ollama, or connect directly to Google's fast Gemini 3.6 Flash.
- **🛡️ Encapsulated Shadow DOM Card**: Sleek, 60fps draggable overlay cards that never clash with webpage styles.

---

## 🚀 Quick Start Guide

### 1. Load Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select this directory (`Brower Extension`).

### 2. Start Jarvis Python Assistant Bridge (For Voice & Desktop Apps)

1. Double-click `start_python_assistant.bat` in the project root.
2. The launcher automatically verifies Python dependencies (`fastapi`, `uvicorn`, `pydantic`, `edge-tts`, `pyttsx3`, `SpeechRecognition`, `requests`) and launches the bridge on `http://127.0.0.1:8000`.
3. Open the **Jarvis** tab in the extension popup or side panel.
   - **🌸 Sweet Female Voice**: Experience lifelike Neural AI female narration or instant offline SAPI5 voices. Switch anytime with *"ladki ki awaz lagao"* or via the voice selector buttons.
   - **📂 Launch Apps**: *"open whatsapp"*, *"open spotify"*, *"open camera"*, *"open notepad"*, *"open calculator"*, *"open snipping tool"*, *"open word"*, *"open excel"*, *"open powerpoint"*, *"open vscode"*, etc.
   - **❌ Close Apps**: Close open windows with natural commands like *"close notepad"*, *"notepad band karo"*, *"close calculator"*, *"camera band karo"*, *"close spotify"*, etc.
   - **🎵 Play YouTube Songs**: *"youtube pe kesariya play karo"*, *"arijit singh ke gane chalao"*.

### 3. Configure AI Engine (Local Ollama or Google Gemini)

- **Option A: Free Local Ollama (Recommended)**:
  1. Install [Ollama](https://ollama.com/) on your PC and run `ollama run llama3.2`.
  2. If needed, run `restart_ollama.bat` to configure CORS.
  3. The extension automatically detects and connects to Ollama!

- **Option B: Google Gemini API Key**:
  1. Get a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Click the **Universal AI Explainer** icon in Chrome &rarr; **Settings** tab.
  3. Paste your Gemini API Key and click **Save Settings**.

---

## ⌨️ Shortcuts & Usage

| Action | How to Trigger |
|---|---|
| **Ask Jarvis AI** | Highlight text &rarr; Right Click &rarr; **"🤖 Ask Jarvis AI"** |
| **Jarvis Voice Commander** | Open **Jarvis** tab &rarr; Click 🎙️ Mic or Type command &rarr; Press Enter |
| **Explain Selection** | Highlight text &rarr; Right Click &rarr; **"Explain with AI"** |
| **Keyboard Shortcut** | Highlight text &rarr; Press <kbd>Alt</kbd> + <kbd>E</kbd> |
| **Instant Auto-Explain** | Highlight text (auto-triggers in 400ms when enabled in Settings) |
| **Maya Live Talk** | Popup / Side Panel &rarr; Click **🎙️ Live Talk** for continuous hands-free voice-to-voice |
| **Chrome Side Panel** | Popup Header &rarr; Click **🪟 Dock Side Panel** for persistent companion |
| **Floating Action Pill** | Highlight text &rarr; Click **Explain**, **TL;DR**, or **Bias** |
| **30-Second Page TL;DR** | Right Click &rarr; **"⚡ 30-Second Page TL;DR"** or click ⚡ in popup |
| **Mentor & Skin Switcher** | Extension Settings &rarr; Select Mentor Persona & Avatar Skin |
| **Tone Rewriter** | On explanation card &rarr; Click **ELI5**, **Desi**, **Balanced**, or **Deep Dive** |
| **Jargon Buster** | On explanation card &rarr; Hover over dotted underlined technical terms |
| **Export Formats** | On explanation card &rarr; Click **Export** &rarr; Markdown / Anki / Tweet / Notion |
| **Audio Voice Narration** | Click the **Listen** button or Voice soundwave bar |
| **Dismiss Card** | Press <kbd>Esc</kbd> or click anywhere outside the card |
| **Move Card** | Click and drag the card's header bar |

---

## 📁 Project Structure

```
.
├── manifest.json            # Manifest V3 configuration, sidePanel, host_permissions & scripts
├── background.js            # Service worker, context menus, persona router & Jarvis bridge
├── content.js               # In-page Shadow DOM card injector, skins & auto-explain trigger
├── popup.html               # Extension popup & side panel UI (Chat, Jarvis, Translate, Settings)
├── popup.js                 # Live Talk engine, Jarvis controller, tab router & voice pipeline
├── popup.css                # Dark-mode UI stylesheet, Jarvis orb, radar waves & skins
├── assistant_server.py      # Python FastAPI bridge for Windows OS & desktop app automation
├── start_python_assistant.bat # Auto-launcher with dependency verification for Python bridge
├── requirements.txt         # Python package dependencies for Jarvis assistant
├── restart_ollama.bat       # Configures CORS and restarts Ollama
├── offscreen.html/js        # Offscreen document for SpeechRecognition microphone access
├── mic-permission.html/js   # Dedicated microphone permission prompt page
├── icons/                   # 16x16, 48x48, and 128x128 extension icons
└── server/                  # Optional Node.js / Express backend service
    ├── server.js            # Express API server with rate limiting & Gemini proxy
    ├── package.json         # Backend dependencies
    └── README.md            # Backend instructions & endpoint docs
```

---

## 🔒 Privacy & Permissions

- **`sidePanel`**: Provides persistent companion assistance docked alongside active browser tabs.
- **`contextMenus`**: Adds "Explain with AI", "⚡ 30-Second Page TL;DR", and "🤖 Ask Jarvis AI" to the right-click menu.
- **`activeTab` & `scripting`**: Injects the overlay card and reads selected text only when you trigger an explanation.
- **`storage`**: Securely saves your preferences, history, and API key locally on your device via `chrome.storage.local`.
- **`commands`**: Enables the <kbd>Alt</kbd> + <kbd>E</kbd> keyboard shortcut.
- **`offscreen`**: Hosts Web Speech Recognition offscreen for hands-free live voice conversation.
- **`http://127.0.0.1:8000/*` & `http://localhost:8000/*`**: Connects to the local Jarvis Python Automation Bridge.
- **`http://localhost:11434/*` & `http://127.0.0.1:11434/*`**: Connects to local Ollama for private, on-device AI.
- **`https://generativelanguage.googleapis.com/*`**: Direct connection to Google Gemini API for standalone mode.
