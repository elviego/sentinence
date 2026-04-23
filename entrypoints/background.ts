import { classifyAll } from "../src/classifier";
import type {
  CachedAnalysis,
  ClassifiedSentence,
  ExtensionMessage,
} from "../src/types";

export default defineBackground(() => {
  // Open side panel when toolbar icon is clicked
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});

  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (message.type === "ANALYZE_PAGE") {
        handleAnalysis(message, sender).catch((err) => {
          broadcastToSidePanel({
            type: "ANALYSIS_ERROR",
            error: String(err?.message ?? err),
          });
        });
        sendResponse({ ok: true });
        return true;
      }

      if (message.type === "GET_CLASSIFICATIONS") {
        getCached(message.url).then((cached) => {
          if (cached) {
            sendResponse({
              type: "CLASSIFICATIONS_READY",
              url: cached.url,
              title: cached.title,
              sentences: cached.sentences,
            });
          } else {
            sendResponse(null);
          }
        });
        return true;
      }

      return false;
    }
  );
});

async function handleAnalysis(
  message: { type: "ANALYZE_PAGE"; url: string; title: string; sentences: string[] },
  _sender: chrome.runtime.MessageSender
) {
  const { url, title, sentences } = message;

  const cached = await getCached(url);
  if (cached) {
    broadcastToSidePanel({
      type: "CLASSIFICATIONS_READY",
      url,
      title,
      sentences: cached.sentences,
    });
    return;
  }

  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) {
    broadcastToSidePanel({
      type: "ANALYSIS_ERROR",
      error: "No API key set. Please open the Sentinence popup and enter your Anthropic API key.",
    });
    return;
  }

  const classified = await classifyAll(
    sentences,
    apiKey,
    (processed, total) => {
      broadcastToSidePanel({ type: "ANALYSIS_PROGRESS", processed, total });
    }
  );

  await saveCache(url, title, classified);

  broadcastToSidePanel({
    type: "CLASSIFICATIONS_READY",
    url,
    title,
    sentences: classified,
  });
}

async function getCached(url: string): Promise<CachedAnalysis | null> {
  const key = cacheKey(url);
  const result = await chrome.storage.local.get(key);
  return (result[key] as CachedAnalysis) ?? null;
}

async function saveCache(
  url: string,
  title: string,
  sentences: ClassifiedSentence[]
) {
  const key = cacheKey(url);
  const entry: CachedAnalysis = { url, title, sentences, analyzedAt: Date.now() };
  await chrome.storage.local.set({ [key]: entry });
}

function cacheKey(url: string) {
  // Normalize URL: strip fragment and trailing slash
  try {
    const u = new URL(url);
    u.hash = "";
    return `cache:${u.toString().replace(/\/$/, "")}`;
  } catch {
    return `cache:${url}`;
  }
}

function broadcastToSidePanel(message: ExtensionMessage) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open yet — that's fine
  });
}
