"use strict";

const DEFAULTS = {
  keywords: ["youtube", "bilder", "videos", "todo", "prompt"],
  commentTemplates: [
    "Super Beitrag! Danke fürs Teilen. 🙌",
    "Richtig spannend – da hol ich mir Inspiration.",
    "Starker Input! Probier ich gleich mal aus.",
    "Nice, das passt gerade perfekt zu dem, woran ich arbeite.",
    "Mega, danke für den Prompt/Workflow – notiere ich mir."
  ],
  sidebarVisible: true,
  notifyOnMatch: true
};

// Beim Install Defaults setzen, ohne bestehende Werte zu überschreiben
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const patch = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (existing[k] === undefined) patch[k] = v;
  }
  if (Object.keys(patch).length) await chrome.storage.sync.set(patch);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "notify") {
    try {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: msg.title || "Skool Helper",
        message: msg.message || "",
        priority: 1
      });
    } catch (e) {
      // Notifications silent fail, kein Drama
    }
  }

  if (msg.type === "open-options") {
    chrome.runtime.openOptionsPage();
  }

  return false;
});
