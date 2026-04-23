import { useEffect, useState } from "react";
import type { ClassifiedSentence, ExtensionMessage, SentenceCategory } from "../../src/types";
import ArgumentList from "../../src/components/ArgumentList";
import CategoryFilter from "../../src/components/CategoryFilter";
import ProgressBar from "../../src/components/ProgressBar";

type Status = "idle" | "loading" | "ready" | "error" | "needs-key";

interface AnalysisState {
  url: string;
  title: string;
  sentences: ClassifiedSentence[];
}

function ApiKeySetup({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    setSaving(true);
    await chrome.storage.local.set({ apiKey: trimmed });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="mx-3 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔑</span>
        <p className="font-semibold text-amber-900 text-sm">API key required</p>
      </div>
      <p className="text-xs text-amber-800 mb-3">
        Sentinence uses the Anthropic API to classify sentences. Enter your key
        below — it is stored locally and only sent to{" "}
        <span className="font-mono">api.anthropic.com</span>.
      </p>

      <label className="block text-xs font-medium text-amber-900 mb-1">
        Anthropic API Key
      </label>
      <div className="relative mb-1">
        <input
          type={masked ? "password" : "text"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="sk-ant-..."
          autoFocus
          className="w-full border border-amber-300 bg-white rounded px-2.5 py-1.5 text-xs pr-12 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={() => setMasked((m) => !m)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-600 hover:text-amber-800"
        >
          {masked ? "show" : "hide"}
        </button>
      </div>
      <p className="text-[10px] text-amber-700 mb-3">
        Get a key at{" "}
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-amber-900"
        >
          console.anthropic.com
        </a>
      </p>

      <button
        onClick={handleSave}
        disabled={!apiKey.trim() || saving}
        className="w-full bg-amber-600 text-white text-xs py-1.5 rounded hover:bg-amber-700 disabled:opacity-40 transition-colors font-medium"
      >
        {saving ? "Saving…" : "Save & analyse"}
      </button>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<SentenceCategory | "All">("All");

  // On mount: check if current tab already has a cached analysis
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) {
        chrome.runtime.sendMessage(
          { type: "GET_CLASSIFICATIONS", url: tab.url },
          (resp) => {
            if (chrome.runtime.lastError) return;
            if (resp?.type === "CLASSIFICATIONS_READY") {
              setAnalysis({
                url: resp.url,
                title: resp.title,
                sentences: resp.sentences,
              });
              setStatus("ready");
            }
          }
        );
      }
    });
  }, []);

  // Listen for live updates from background service worker
  useEffect(() => {
    const handler = (message: ExtensionMessage) => {
      if (message.type === "ANALYSIS_PROGRESS") {
        setStatus("loading");
        setProgress({ processed: message.processed, total: message.total });
      }
      if (message.type === "CLASSIFICATIONS_READY") {
        setAnalysis({
          url: message.url,
          title: message.title,
          sentences: message.sentences,
        });
        setStatus("ready");
        setFilter("All");
      }
      if (message.type === "ANALYSIS_ERROR") {
        const isNoKey = message.error.toLowerCase().includes("no api key");
        setError(message.error);
        setStatus(isNoKey ? "needs-key" : "error");
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  function handleAnalyse() {
    setStatus("loading");
    setProgress({ processed: 0, total: 0 });
    setError("");
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_ANALYSIS" });
      }
    });
  }

  function handleReanalyse() {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (tab?.url) {
        try {
          const u = new URL(tab.url);
          u.hash = "";
          const key = `cache:${u.toString().replace(/\/$/, "")}`;
          await chrome.storage.local.remove(key);
        } catch {}
      }
      setAnalysis(null);
      handleAnalyse();
    });
  }

  function handleSentenceClick(sentence: ClassifiedSentence) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sentenceId: number) => {
          const el = document.querySelector(
            `[data-sentinence-id="${sentenceId}"]`
          );
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        },
        args: [sentence.id],
      });
    });
  }

  const counts = (() => {
    const base: Record<SentenceCategory | "All", number> = {
      All: analysis?.sentences.length ?? 0,
      Claim: 0,
      Evidence: 0,
      "Counter-argument": 0,
      Opinion: 0,
      Other: 0,
    };
    analysis?.sentences.forEach((s) => {
      base[s.category] = (base[s.category] ?? 0) + 1;
    });
    return base;
  })();

  return (
    <div className="flex flex-col h-screen text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🧠</span>
          <span className="font-semibold text-gray-800 text-sm">Sentinence</span>
        </div>
        {status === "ready" ? (
          <button
            onClick={handleReanalyse}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Re-analyse
          </button>
        ) : status !== "loading" && status !== "needs-key" ? (
          <button
            onClick={handleAnalyse}
            className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Analyse page
          </button>
        ) : null}
      </div>

      {/* Article title */}
      {analysis?.title && status === "ready" && (
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 shrink-0">
          <p className="text-xs text-gray-500 truncate" title={analysis.title}>
            {analysis.title}
          </p>
        </div>
      )}

      {/* Loading state */}
      {status === "loading" && (
        <ProgressBar processed={progress.processed} total={progress.total} />
      )}

      {/* No API key — inline setup */}
      {status === "needs-key" && (
        <ApiKeySetup onSaved={handleAnalyse} />
      )}

      {/* Generic error state */}
      {status === "error" && (
        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <p className="font-semibold mb-1">Analysis failed</p>
          <p>{error}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Idle state */}
      {status === "idle" && (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-400 px-4 text-center">
          <span className="text-4xl mb-3">📰</span>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Navigate to an article
          </p>
          <p className="text-xs">
            Then click <strong>Analyse page</strong> to map its argument
            structure.
          </p>
        </div>
      )}

      {/* Results */}
      {status === "ready" && analysis && (
        <>
          <CategoryFilter
            active={filter}
            counts={counts}
            onChange={setFilter}
          />
          <ArgumentList
            sentences={analysis.sentences}
            filter={filter}
            onSentenceClick={handleSentenceClick}
          />
        </>
      )}
    </div>
  );
}
