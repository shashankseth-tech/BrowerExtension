# Universal AI Explainer - Backend Server

A lightweight Node.js/Express service that processes text and code snippets with Google Gemini AI.

## Setup & Installation

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your Google Gemini API Key to `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   GEMINI_MODEL=gemini-3.6-flash
   ```

4. Start the server:
   ```bash
   npm start
   ```
   Or in development auto-reload mode:
   ```bash
   npm run dev
   ```

The server runs on `http://localhost:3000`.

---

## API Endpoints

### 1. `GET /health`
Verifies server status and API key configuration.

**Response:**
```json
{
  "status": "ok",
  "service": "Universal AI Explainer API",
  "model": "gemini-3.6-flash",
  "hasApiKey": true
}
```

### 2. `POST /api/verify-key`
Tests and verifies a Gemini API key.

### 3. `POST /api/explain`
Explains selected code or prose text.

**Request Headers:**
* `Content-Type: application/json`
* `x-api-key: <optional_key>` (Optional if `GEMINI_API_KEY` is set in `.env`)

**Request Body:**
```json
{
  "selected_text": "const sum = (a, b) => a + b;",
  "content_type": "code",
  "explain_style": "simple",
  "page_url": "https://developer.mozilla.org"
}
```

**Success Response (200 OK):**
```json
{
  "explanation": "This is an arrow function named sum that takes two parameters (a and b) and returns their sum.",
  "key_points": [
    "Arrow function provides concise syntax in modern JavaScript",
    "Implicitly returns the evaluation of a + b",
    "Expects two numbers as inputs"
  ]
}
```
