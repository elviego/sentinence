# Sentinence — AI Argument Mapper

> **Read smarter.** Sentinence classifies every sentence in an article as a **Claim**, **Evidence**, **Counter-argument**, **Opinion**, or **Other** — giving you an instant map of what an article actually argues vs. what it merely asserts.

---

## What it does

Most articles mix together established facts, value judgements, unsupported assertions, and rhetorical filler. It's hard to see the logical skeleton at a glance. Sentinence uses Claude AI to label every sentence by its rhetorical role and surfaces them in a colour-coded side panel as you read.

| Category | Colour | Meaning |
|---|---|---|
| **Claim** | 🔵 Blue | A statement asserted as true that requires support |
| **Evidence** | 🟢 Green | Data, quotes, studies, or facts used to back a claim |
| **Counter-argument** | 🟠 Orange | A position the author acknowledges that opposes their own |
| **Opinion** | 🟣 Purple | A subjective view, belief, or value judgement |
| **Other** | ⚫ Gray | Transitions, background, definitions, structural text |

---

## Screenshots

### 1. Popup — API key & quick launch

```
┌─────────────────────────────────┐
│  🧠 Sentinence                  │
│                                 │
│  AI-powered argument mapper     │
│  for articles.                  │
│                                 │
│  Anthropic API Key              │
│  ┌───────────────────────────┐  │
│  │ sk-ant-••••••••••••  show │  │
│  └───────────────────────────┘  │
│  Stored locally. Never sent     │
│  anywhere except Anthropic.     │
│                                 │
│  [  Save key  ] [ Analyse page →] │
│                                 │
│  Cost: ~$0.003/article          │
│  Model: Claude Haiku 4.5        │
└─────────────────────────────────┘
```

> **To add real screenshots:** Install the extension, take a screenshot of the popup and save it to `docs/screenshots/popup.png`, then replace this block with `![Popup](docs/screenshots/popup.png)`.

---

### 2. Side panel — Argument map (All categories)

```
┌──────────────────────────────────────┐
│ 🧠 Sentinence          Re-analyse   │
│ The Hidden Cost of Remote Work       │
├──────────────────────────────────────┤
│ [All 42] [Claim 11] [Evidence 14]    │
│ [Counter 4] [Opinion 9] [Other 4]    │
├──────────────────────────────────────┤
│ ▌ CLAIM  Remote work reduces        │
│          productivity by an average  │
│          of 18%, according to a new  │
│          Stanford study.             │
├──────────────────────────────────────┤
│ ▌ EVIDENCE  The study tracked 16,000 │
│             workers over nine months │
│             at a Chinese travel      │
│             agency.                  │
├──────────────────────────────────────┤
│ ▌ OPINION  This finding should       │
│            prompt a serious          │
│            reconsideration of...     │
├──────────────────────────────────────┤
│ ▌ COUNTER  Critics argue that the    │
│            study only reflects...    │
└──────────────────────────────────────┘
```

> Replace with `![Side panel - all](docs/screenshots/sidepanel-all.png)` once captured.

---

### 3. Side panel — Filtered to Claims only

```
┌──────────────────────────────────────┐
│ 🧠 Sentinence          Re-analyse   │
│ The Hidden Cost of Remote Work       │
├──────────────────────────────────────┤
│ [All 42] [Claim 11] ← active        │
├──────────────────────────────────────┤
│ ▌ CLAIM  Remote work reduces        │
│          productivity by 18%.        │
├──────────────────────────────────────┤
│ ▌ CLAIM  The effect is larger for    │
│          complex, collaborative...   │
├──────────────────────────────────────┤
│ ▌ CLAIM  Hybrid arrangements may...  │
└──────────────────────────────────────┘
```

> Replace with `![Side panel - claims](docs/screenshots/sidepanel-claims.png)` once captured.

---

### 4. Inline highlights on the article

After analysis, each sentence in the article gets a colour-coded underline matching its category (blue for Claim, green for Evidence, etc.). Clicking a sentence in the side panel scrolls the article to it.

> Replace with `![Inline highlights](docs/screenshots/inline-highlights.png)` once captured.

---

## Installation

### Prerequisites

- Google Chrome 114 or later (side panel API required)
- An [Anthropic API key](https://console.anthropic.com/)
- Node.js 18+ and npm (to build from source)

### Build from source

```bash
git clone https://github.com/elviego/sentinence.git
cd sentinence
npm install
npm run build
```

The extension output is written to `.output/chrome-mv3/`.

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3/` folder

The 🧠 Sentinence icon will appear in your Chrome toolbar.

---

## Configuration

### Step 1 — Enter your Anthropic API key

1. Click the 🧠 toolbar icon to open the popup
2. Paste your Anthropic API key into the **Anthropic API Key** field
   - Get a key at [console.anthropic.com](https://console.anthropic.com/)
   - The key starts with `sk-ant-`
3. Click **Save key**

> Your API key is stored in `chrome.storage.local` — it never leaves your browser except in requests to `api.anthropic.com`.

### Step 2 — Analyse an article

**Method A — via popup:**
1. Navigate to any news article or blog post
2. Click the 🧠 toolbar icon
3. Click **Analyse page →** — the side panel opens automatically and analysis begins

**Method B — via side panel button:**
1. Open the side panel by clicking the toolbar icon (if the side panel is already open, it will be visible immediately)
2. Click **Analyse page** in the panel header

### Step 3 — Explore the results

- **Filter by category** using the chip buttons at the top of the panel: `All`, `Claim`, `Evidence`, `Counter-argument`, `Opinion`, `Other`
- **Jump to a sentence** in the article by clicking it in the side panel — the page scrolls to it and the sentence is highlighted
- **Re-analyse** the same article (e.g. after the article was updated) by clicking **Re-analyse** — this clears the cache and runs a fresh API call

---

## How it works

```
Article page
    │
    │  content script extracts text
    │  via @mozilla/readability
    ▼
Background service worker
    │
    ├─ checks chrome.storage.local cache
    │  (keyed by URL — free on revisit)
    │
    ├─ calls Anthropic API in batches of 40 sentences
    │  model: claude-haiku-4-5-20251001
    │  output: structured JSON via tool use
    │
    └─ broadcasts results to side panel
           │
           ▼
    Side panel renders colour-coded list
    Content script injects underlines into DOM
```

### Sentence classification prompt

Each batch of up to 40 sentences is sent to Claude with the instruction:

> *"You are an argument analyst. For each numbered sentence, identify its rhetorical role in the article. Categories: Claim, Evidence, Counter-argument, Opinion, Other."*

Results are returned as structured JSON, guaranteeing reliable parsing without post-processing heuristics.

### Caching

Analysed pages are cached in `chrome.storage.local` keyed by their normalised URL (fragment stripped, trailing slash removed). Re-opening the side panel on a previously analysed page loads instantly with zero API cost.

---

## Cost

| Scenario | Cost |
|---|---|
| Typical article (50 sentences) | ~$0.003 |
| Long-form piece (150 sentences) | ~$0.009 |
| Revisiting a cached article | **Free** |
| 1,000 articles per month | ~$3.00 |

Pricing based on Claude Haiku 4.5: $1/M input tokens, $5/M output tokens.

---

## Project structure

```
sentinence/
├── entrypoints/
│   ├── background.ts            # MV3 service worker — API calls, caching, routing
│   ├── content/index.ts         # Page injection — extraction + DOM highlights
│   ├── popup/                   # Toolbar popup — API key + quick launch
│   └── sidepanel/               # Side panel — argument map UI
├── src/
│   ├── types.ts                 # Shared TypeScript types + colour constants
│   ├── classifier.ts            # Claude API integration (structured output)
│   ├── articleExtractor.ts      # Readability.js + sentence splitter
│   └── components/              # React UI components
│       ├── ArgumentList.tsx
│       ├── ArgumentNode.tsx
│       ├── CategoryFilter.tsx
│       └── ProgressBar.tsx
├── public/icon.svg
├── wxt.config.ts                # WXT extension config + manifest
└── tailwind.config.js
```

---

## Tech stack

| Layer | Library |
|---|---|
| Extension framework | [WXT](https://wxt.dev) (Manifest V3) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v3 |
| Article parsing | [@mozilla/readability](https://github.com/mozilla/readability) |
| AI | Claude Haiku 4.5 via [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-javascript) |
| Storage | `chrome.storage.local` (on-device, private) |
| Build | Vite 7 |

---

## Development

```bash
# Start dev server with hot reload
npm run dev

# Production build
npm run build

# Type-check only
npx tsc --noEmit
```

In dev mode, WXT watches for file changes and automatically rebuilds. Reload the extension at `chrome://extensions` after each rebuild (or use the WXT HMR for popup/side panel changes).

---

## Privacy

- Your API key is stored **only** in `chrome.storage.local` on your device
- Article text is sent to `api.anthropic.com` for classification — the same data you are already reading in your browser
- No data is sent to any other server
- No analytics, no telemetry, no account required

---

## Limitations

- Works best on article-style pages (news, blogs, essays). Pages without a clear article body (dashboards, social feeds, SPAs) may not extract correctly
- Very short pages (fewer than 3 sentences extracted) will show an error
- The extension requires a user-supplied Anthropic API key — it does not include bundled credits
- Chrome 114+ required for the Side Panel API

---

## License

MIT
