import { extractArticle } from "../../src/articleExtractor";
import type { ClassifiedSentence, ExtensionMessage } from "../../src/types";
import { CATEGORY_COLORS } from "../../src/types";

export default defineContentScript({
  matches: ["https://*/*", "http://*/*"],
  main() {
    // Listen for messages from background / side panel
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse) => {
        if (message.type === "TRIGGER_ANALYSIS") {
          triggerAnalysis();
          sendResponse({ ok: true });
        }
        if (message.type === "CLASSIFICATIONS_READY") {
          applyHighlights(message.sentences);
        }
        return false;
      }
    );
  },
});

function triggerAnalysis() {
  const extracted = extractArticle(document);
  if (!extracted || extracted.sentences.length === 0) {
    chrome.runtime.sendMessage({
      type: "ANALYSIS_ERROR",
      error:
        "Could not extract article content from this page. Try navigating to the article's main URL.",
    });
    return;
  }

  chrome.runtime.sendMessage({
    type: "ANALYZE_PAGE",
    url: location.href,
    title: extracted.title,
    sentences: extracted.sentences,
  });
}

function applyHighlights(sentences: ClassifiedSentence[]) {
  // Remove previous highlights
  document
    .querySelectorAll("[data-sentinence-id]")
    .forEach((el) => el.replaceWith(...el.childNodes));

  const bodyText = document.body;
  sentences.forEach((s) => {
    if (!s.text || s.text.length < 5) return;
    const color = CATEGORY_COLORS[s.category];
    highlightTextInNode(bodyText, s.text, s.id, color);
  });
}

function highlightTextInNode(
  root: Node,
  searchText: string,
  sentenceId: number,
  color: string
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (["script", "style", "noscript", "textarea"].includes(tag))
        return NodeFilter.FILTER_REJECT;
      if (parent.dataset?.sentinenceId) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Use first 60 chars of sentence as search key to avoid false positives
  const searchKey = searchText.slice(0, 60).trim();
  if (searchKey.length < 20) return;

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  for (const textNode of textNodes) {
    const idx = textNode.textContent?.indexOf(searchKey) ?? -1;
    if (idx === -1) continue;

    const range = document.createRange();
    range.setStart(textNode, idx);
    range.setEnd(textNode, Math.min(idx + searchText.length, textNode.length));

    const mark = document.createElement("mark");
    mark.dataset.sentinenceId = String(sentenceId);
    mark.style.cssText = `
      background: transparent;
      border-bottom: 2px solid ${color};
      padding-bottom: 1px;
      cursor: default;
    `;
    mark.title = `Sentinence: ${getSentenceCategory(sentenceId)}`;

    try {
      range.surroundContents(mark);
    } catch {
      // Range crosses element boundaries — skip this sentence
    }
    break; // Only highlight first occurrence
  }
}

// Retrieve category label from already-inserted mark elements or fall back
function getSentenceCategory(id: number): string {
  // This is purely for the tooltip title; category info is encoded in color
  return `Sentence #${id}`;
}
