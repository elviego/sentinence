import { useEffect, useState } from "react";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [masked, setMasked] = useState(true);

  useEffect(() => {
    chrome.storage.local.get("apiKey", ({ apiKey: stored }) => {
      if (stored) setApiKey(stored);
    });
  }, []);

  async function handleSave() {
    await chrome.storage.local.set({ apiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAnalyse() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_ANALYSIS" });
      window.close();
    }
  }

  const hasKey = apiKey.trim().length > 0;

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <span className="font-semibold text-gray-800">Sentinence</span>
      </div>

      <p className="text-xs text-gray-500">
        Classifies every sentence in an article as Claim, Evidence,
        Counter-argument, or Opinion using AI.
      </p>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Anthropic API Key
        </label>
        <div className="relative">
          <input
            type={masked ? "password" : "text"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setMasked((m) => !m)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600"
          >
            {masked ? "show" : "hide"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Stored locally. Never sent anywhere except Anthropic.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasKey}
          className="flex-1 bg-gray-100 text-gray-700 text-xs py-1.5 rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {saved ? "✓ Saved" : "Save key"}
        </button>
        <button
          onClick={handleAnalyse}
          disabled={!hasKey}
          className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium"
        >
          Analyse page →
        </button>
      </div>

      <div className="text-[10px] text-gray-400 border-t pt-2">
        Cost: ~$0.003 per article • Model: Claude Haiku 4.5
      </div>
    </div>
  );
}
