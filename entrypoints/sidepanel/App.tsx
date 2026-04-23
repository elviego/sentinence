import { useEffect, useState } from "react";
import type { ClassifiedSentence, ExtensionMessage, SentenceCategory } from "../../src/types";
import ArgumentList from "../../src/components/ArgumentList";
import CategoryFilter from "../../src/components/CategoryFilter";
import ProgressBar from "../../src/components/ProgressBar";

type Status = "idle" | "loading" | "ready" | "error";

interface AnalysisState {
  url: string;
  title: string;
  sentences: ClassifiedSentence[];
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
        setError(message.error);
        setStatus("error");
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
    // Clear cache for current URL, then re-analyse
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
        ) : status !== "loading" ? (
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

      {/* Error state */}
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

      {/* Filter chips */}
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
