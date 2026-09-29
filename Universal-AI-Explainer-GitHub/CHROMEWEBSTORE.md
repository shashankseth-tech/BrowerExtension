# Universal AI Explainer - Chrome Web Store Listing

**Last Updated:** September 18, 2026  
**Extension Version:** 1.4.0  
**Manifest Version:** 3

---

## 1. Store Listing Metadata

### Extension Name
Universal AI Explainer

### Short Description (Max 132 characters)
Instant AI explanations with Maya avatar, Jarvis Python assistant, Live Talk voice, Side Panel, custom personas, & 30s Page TL;DR!

### Detailed Description
Universal AI Explainer is an intelligent browser companion that brings instantaneous AI explanations directly onto any webpage, in a persistent Chrome Side Panel, and through the all-new Jarvis Python Desktop Automation Bridge. Featuring hands-free "Maya Live Talk" voice-to-voice conversation, custom mentor personas, customizable avatar skins, a friendly animated AI mentor, natural Indian English voice narration, a 30-second executive Page TL;DR generator, instant auto-explain on highlight, an on-the-fly translator for over 20 languages, tone rewriter (ELI5 to Deep Dive), interactive jargon tooltips, and 1-click multi-format export, Universal AI Explainer turns difficult code, dense research papers, and domain jargon into memorable insights.

#### ✨ Key Features
- **🤖 Jarvis Python Automation Assistant**: Desktop & web voice-enabled AI assistant running on a local FastAPI bridge (`127.0.0.1:8000`). Launch Windows desktop apps (Notepad, Calculator, VS Code, Task Manager, PowerShell, Settings, Explorer), control system functions (Lock Workstation), search Google/YouTube, or converse with smart local Ollama AI answers.
- **🎙️ Hands-Free "Maya Live Talk" (Voice-to-Voice Conversation)**: Real-time hands-free conversational partner mode (like ChatGPT Voice or Gemini Live). Speak freely &rarr; AI listens via offscreen speech recognition &rarr; answers back with natural voice & live vibrating soundwaves &rarr; automatically listens for your response.
- **🪟 Chrome Side Panel Companion (`chrome.sidePanel`)**: Move Maya into Chrome's native persistent Side Panel docked alongside your tabs as you browse and read documentation, papers, or code without popup windows closing.
- **🎭 Custom Mentor Personas & Avatar Skins**:
  - **Personas**: Maya (Warm Indian English Mentor), Professor Rao (Formal Academic Scholar), Code Ninja Priya (FAANG Senior Staff Architect), ELI5 Buddy (Fun Playground Guide).
  - **Avatar Skins**: Classic Indigo, Cyberpunk Neon, Minimalist Monochrome, Retro 8-Bit Pixel.
- **⚡ Instant Auto-Explain on Highlight**: Highlight any text on any webpage and receive an automated explanation in 400ms without clicking any buttons (configurable via Settings).
- **Interactive Animated AI Mentor Avatar**: An expressive vector avatar companion with animated breathing, blinking eyes, thinking glow, and synchronized mouth movement during voice narration.
- **⚡ 30-Second Page TL;DR & Executive Briefing**: Instant executive synthesis of entire articles or documentation with punchy takeaways, key statistics, time saved badges, and audio narration. Accessible from right-click context menu, floating toolbar, or extension popup.
- **🎚️ Complexity & Tone Rewriter**: Dynamically rewrite explanations on-the-fly into 4 distinct styles: **ELI5** (playful beginner analogies), **Desi Analogy** (warm chai & train everyday metaphors), **Balanced** (clean clarity), or **Deep Dive** (architectural mechanics & trade-offs).
- **💡 Smart Follow-Up Chips**: AI generates contextual questions after every explanation. Click any chip to expand an interactive deep-dive accordion without leaving the page.
- **📖 Interactive Jargon Buster**: Technical terms are automatically highlighted with dotted underlines. Hover over or tap any term to view an instant 1-line plain English popover definition.
- **📤 1-Click Multi-Format Export**: Export explanations instantly to your clipboard formatted for **Markdown**, **Anki Flashcards** (Q&A), **Social/Tweet Threads**, or **Notion Callouts**.
- **Natural Indian English Accent Voice (TTS)**: High-quality Indian English speech synthesis with custom cadence and pitch tuning, plus a persistent keep-alive heartbeat eliminating Chromium speech stalling.
- **On-The-Fly Multilingual Translator**: Translate any explanation or selected text in one click into Hindi (हिन्दी), Bengali (বাংলা), Telugu (తెలుగు), Tamil (தமிழ்), Marathi (मराठी), Gujarati (ગુજરાતી), Spanish, French, German, and 20+ languages. Spoken voice adjusts automatically to match the chosen language!
- **Dual AI Engine (Ollama + Google Gemini)**: Run 100% locally and privately for free with Ollama (Llama 3.2), or connect to Google's fast Gemini 3.6 Flash with automatic fallback.
- **In-Page Shadow DOM Overlay**: Clean, 60fps draggable floating cards rendered via Shadow DOM so page styling never interferes.
- **In-Popup Chat & Dedicated Translator Tool**: Chat naturally, test snippets, grab selections, or generate page briefings directly in the popup toolbar.

---

## 2. Permissions Justification

| Permission / Host | Why It Is Required |
|---|---|
| `sidePanel` | Provides persistent companion assistance docked alongside active browser tabs. |
| `contextMenus` | Creates "Explain with AI", "⚡ 30-Second Page TL;DR", and "🤖 Ask Jarvis AI" in the right-click menu. |
| `activeTab` | Reads highlighted text and displays the explanation card on the active tab upon user action. |
| `tabs` | Safely retrieves tab URL and verifies injection target across browser commands and context menus. |
| `storage` | Saves user preferences (style, theme, voice accent, default language, API key, and recent history) locally on device via `chrome.storage.local`. |
| `scripting` | Dynamically executes the content script to display the Shadow DOM explanation card when triggered via context menu or keyboard shortcut. |
| `tts` | Fallback browser speech synthesis support for narrating explanations. |
| `offscreen` | Provides secure microphone access for real-time speech recognition input in the popup. |
| `http://127.0.0.1:8000/*` & `http://localhost:8000/*` | Direct local connection to the Jarvis Python Automation Bridge for launching desktop tools and local OS commands. |
| `http://localhost:11434/*` & `http://127.0.0.1:11434/*` | Direct local connection to Ollama for free, 100% private on-device AI inference. |
| `http://localhost:3000/*` & `http://127.0.0.1:3000/*` | Connects to the local Express backend server if the user chooses to run the self-hosted API proxy. |
| `https://generativelanguage.googleapis.com/*` | Connects directly to the Google Gemini API when using standalone mode with a personal API key. |

---

## 3. Privacy & Data Use Disclosure

- **User Data Collection**: None. The extension does not collect, track, or sell any personal identifying information or browsing history.
- **Data Transmission**: Selected text snippets are sent exclusively to the user-selected AI endpoint (local on-device Ollama, local Jarvis Python server, or official Google Gemini API) to generate explanations or execute user-requested automation.
- **Local Storage**: API keys, voice preferences, and explanation history remain stored strictly on the user's local machine via `chrome.storage.local` and are never shared or synced with third parties.

---

## 4. Version History

### Version 1.4.0 (Current)
- Added **🤖 Jarvis Python Automation Assistant**:
  - Integrated dedicated Tab 6 in popup and side panel with animated reactive orb, quick action chips, and command feed.
  - Python FastAPI bridge (`assistant_server.py`) on port 8000 with thread-safe queue-based TTS and local mic recognition.
  - Desktop app launches for Notepad, Calculator, VS Code, Task Manager, PowerShell, Paint, Settings, and File Explorer.
  - System commands including Workstation Lock and diagnostics.
  - Smart local Ollama AI answer fallback for conversational queries.
  - "🤖 Ask Jarvis AI" right-click context menu integration.
  - Host permissions updated for `http://127.0.0.1:8000/*` and `http://localhost:8000/*`.
  - Added `requirements.txt` and enhanced `start_python_assistant.bat` with auto-dependency installer.

### Version 1.3.0
- Added **🎙️ Hands-Free "Maya Live Talk"**: Real-time voice-to-voice conversational loop with live radar aura, talking avatar orb, vibrating audio waves, and auto-listen continuity.
- Added **🪟 Chrome Side Panel Companion (`chrome.sidePanel`)**: Persistent side panel docked alongside active tabs across navigation without popup dismissal.
- Added **🎭 Custom Mentor Personas**:
  - Maya (Warm, Encouraging Indian English Mentor).
  - Professor Rao (Formal, Rigorous Academic Scholar).
  - Code Ninja Priya (FAANG Senior Staff Architect).
  - ELI5 Buddy (Fun, Playground Kindergarten Guide).
- Added **🎨 Custom Avatar Skins**: Classic Indigo, Cyberpunk Neon, Minimalist Monochrome, and Retro 8-Bit Pixel with synchronized in-page Shadow DOM styling.
- Added **⚡ Instant Auto-Explain on Highlight**: Automated 400ms debounced explanation trigger upon text selection without clicking any buttons.

### Version 1.2.0
- Added **⚡ 30-Second Page TL;DR & Executive Briefing** with key metrics, time saved badge, and audio briefing.
- Added **🎚️ Complexity & Tone Rewriter** (ELI5, Desi Analogies, Balanced, Deep Dive).
- Added **💡 Smart Follow-Up Chips** with expandable in-card deep-dive accordion answers.
- Added **📖 Interactive Jargon Buster** with floating definition tooltips.
- Added **📤 1-Click Multi-Format Export** supporting Markdown, Anki Flashcards, Twitter/X Threads, and Notion Callout blocks.
- Added quick Page TL;DR button in popup chat interface and floating toolbar.
- Added `tldr-page` right-click context menu.

### Version 1.1.0
- Added interactive animated AI Mentor Avatar ("Maya") in both in-page overlay card and popup interface with reactive states (idle, blinking, thinking aura, talking mouth animation).
- Added Indian English voice accent (`en-IN`) speech synthesis with Chromium keep-alive heartbeat preventing 15-second audio freeze.
- Added on-the-fly multilingual translation toolbar on explanation cards and a dedicated Translator tab supporting 20+ languages (Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Spanish, French, etc.).
- Added "Indian Mentor & Relatable Analogies" setting for culturally intuitive learning.
- Added buttery-smooth 60fps card dragging via `requestAnimationFrame`.
- Added `tabs` permission to manifest for reliable tab detection.

### Version 1.0.1
- Migrated AI engine to Google Gemini (`gemini-3.6-flash`).
- Added `Alt+E` keyboard shortcut with `commands` API integration.
- Added direct Google Gemini API fallback for seamless standalone extension operation (no local server required).
- Added 3-tab popup interface: Quick Explainer, History list with one-click copy, and Settings.
- Added optional floating quick-action button on text selection.
- Enhanced Markdown parser for code blocks, inline code, bold, and bullet points.
- Added encapsulated Dark & Light themes for in-page Shadow DOM card.

---

## 5. Pre-Submission Review Checklist

- [x] `manifest_version` is 3.
- [x] All icon files (`icon-16.png`, `icon-48.png`, `icon-128.png`) exist with matching dimensions.
- [x] No `eval()` or remote script injection; strict CSP compliant.
- [x] Storage access is asynchronous (`async`/`await`).
- [x] Content script uses Shadow DOM encapsulation to prevent page style contamination.
- [x] Single source of truth for store copy, permissions justifications, and privacy disclosures.
- [x] Localhost permissions for ports 8000, 11434, and 3000 explicitly justified.
